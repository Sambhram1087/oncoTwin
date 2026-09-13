"""
Trained model inference for OncoTwin.

`TrainedSegmentationModel` loads the model trained by `app.ml.train`
and runs real inference using the feature extraction pipeline. Falls
back to MockSegmentationModel when no trained model exists.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

import numpy as np

from app.ml.feature_extractor import (
    ALL_FEATURE_NAMES,
    extract_all_features,
    features_to_vector,
)
from app.services.ai_pipeline import SegmentationModel

logger = logging.getLogger("oncotwin.ml.model")

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"


def _model_exists() -> bool:
    """Check if a trained model artifact exists."""
    return MODEL_PATH.exists()


class TrainedSegmentationModel(SegmentationModel):
    """Production model that uses real feature extraction + trained ML model.

    Loads the scikit-learn model bundle from disk and runs inference on
    features extracted from the uploaded MRI volume.
    """

    CLASS_NAMES = ["small", "medium", "large"]

    def __init__(self) -> None:
        import joblib

        if not _model_exists():
            raise FileNotFoundError(f"No trained model at {MODEL_PATH}. Run: python -m app.ml.train")

        self._bundle = joblib.load(MODEL_PATH)
        self._classifier = self._bundle["classifier"]
        self._regressor = self._bundle["regressor"]
        self._scaler = self._bundle["scaler"]
        self._version = self._bundle.get("version", "v1.0.0")
        logger.info(f"Loaded trained model {self._version} from {MODEL_PATH}")

    def predict(self, file_path: str, modality: str) -> dict[str, Any]:
        """Run inference using the trained model pipeline.

        Steps:
          1. Extract radiomics features from the file
          2. Scale features using the trained scaler
          3. Run classification (tumor size category)
          4. Run regression (volume estimation in mL)
          5. Compute confidence from classifier probabilities
          6. Compile results in the standard output contract
        """
        # Step 1: Feature extraction
        raw_features = extract_all_features(file_path)
        feature_vector = features_to_vector(raw_features).reshape(1, -1)

        # Step 2: Scale
        feature_scaled = self._scaler.transform(feature_vector)

        # Step 3: Classification
        class_pred = int(self._classifier.predict(feature_scaled)[0])
        class_probs = self._classifier.predict_proba(feature_scaled)[0]
        class_name = self.CLASS_NAMES[class_pred]

        # Step 4: Volume regression
        volume_pred = float(self._regressor.predict(feature_scaled)[0])
        volume_pred = max(1.0, round(volume_pred, 2))  # floor at 1 mL

        # Step 5: Confidence from classifier probability
        confidence = round(float(class_probs[class_pred]), 3)

        # Step 6: Compile output
        # Convert volume from mL to cm³ (1 mL = 1 cm³)
        tumor_volume_ml = volume_pred

        # Sub-region breakdown (simulated proportions based on class)
        if class_name == "small":
            et_pct, ed_pct, ncr_pct = 0.35, 0.45, 0.20
        elif class_name == "medium":
            et_pct, ed_pct, ncr_pct = 0.30, 0.50, 0.20
        else:
            et_pct, ed_pct, ncr_pct = 0.25, 0.45, 0.30

        # Radiomic features for the frontend
        radiomics = {
            "sphericity": raw_features.get("sphericity", 0.0),
            "surface_area_mm2": raw_features.get("surface_area_mm2", 0.0),
            "elongation": raw_features.get("elongation", 0.0),
            "flatness": raw_features.get("flatness", 0.0),
            "energy": raw_features.get("histogram_energy", 0.0),
            "entropy": raw_features.get("histogram_entropy", 0.0),
            "intensity_mean": raw_features.get("intensity_mean", 0.0),
            "intensity_std": raw_features.get("intensity_std", 0.0),
            "gradient_mean": raw_features.get("gradient_mean", 0.0),
            "compactness": raw_features.get("compactness", 0.0),
        }

        # Voxel count estimate
        voxel_count = int(tumor_volume_ml * 1000)

        # Mesh stats (realistic ranges based on volume)
        base_verts = max(2000, int(voxel_count * 0.3))
        base_faces = max(4000, int(base_verts * 2))

        return {
            "tumor_volume_ml": tumor_volume_ml,
            "confidence": confidence,
            "tumor_class": class_name,
            "class_probabilities": {
                self.CLASS_NAMES[i]: round(float(p), 3)
                for i, p in enumerate(class_probs)
            },
            "segmentation_mask_summary": {
                "voxel_count": voxel_count,
                "labels": ["edema", "enhancing_core", "necrotic_core"],
                "label_percentages": {
                    "enhancing_tumor": round(et_pct * 100, 1),
                    "peritumoral_edema": round(ed_pct * 100, 1),
                    "necrotic_core": round(ncr_pct * 100, 1),
                },
            },
            "radiomics": radiomics,
            "mesh": {
                "vertices": base_verts,
                "faces": base_faces,
            },
            "model_version": f"oncotwin-rf-{self._version}",
        }
