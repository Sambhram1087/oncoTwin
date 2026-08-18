"""
Modular AI inference pipeline.

`SegmentationModel` defines the contract every model implementation must
satisfy. `MockSegmentationModel` is a fully working, deterministic-ish demo
implementation that requires no GPU / no downloaded weights, so the whole
platform is runnable on a free tier today.

To go live with real inference:
1. Implement a new class (e.g. `MonaiSegmentationModel`) that satisfies the
   same `SegmentationModel` interface (same method signature, same return
   shape).
2. Swap the `get_active_model()` factory below to return your new class.
No other file in the codebase (routes, frontend, schemas) needs to change,
because they all depend on this interface's output contract, not on how
the numbers were produced.
"""
from __future__ import annotations

import hashlib
import random
from abc import ABC, abstractmethod
from typing import Any


class SegmentationModel(ABC):
    @abstractmethod
    def predict(self, file_path: str, modality: str) -> dict[str, Any]:
        """Run inference on an MRI volume and return a result dict with the
        contract:
        {
          "tumor_volume_ml": float,
          "confidence": float,          # 0-1
          "segmentation_mask_summary": {"voxel_count": int, "labels": [...]},
          "radiomics": {feature_name: float, ...},
          "mesh": {"vertices": int, "faces": int},  # for the 3D viewer
        }
        """
        raise NotImplementedError


class MockSegmentationModel(SegmentationModel):
    """Deterministic-per-file demo model.

    Uses a hash of the uploaded file's path + size to derive stable but
    varied "results" so re-processing the same file always looks the same
    (useful for demos and tests), while different files produce different
    numbers.
    """

    RADIOMIC_FEATURES = [
        "sphericity",
        "surface_area_mm2",
        "elongation",
        "flatness",
        "energy",
        "entropy",
    ]

    def _seed_from(self, file_path: str) -> random.Random:
        digest = hashlib.sha256(file_path.encode()).hexdigest()
        return random.Random(int(digest[:8], 16))

    def predict(self, file_path: str, modality: str) -> dict[str, Any]:
        rng = self._seed_from(file_path)

        tumor_volume_ml = round(rng.uniform(5.0, 65.0), 2)
        confidence = round(rng.uniform(0.78, 0.97), 3)

        radiomics = {
            feature: round(rng.uniform(0.1, 0.95), 4)
            for feature in self.RADIOMIC_FEATURES
        }

        return {
            "tumor_volume_ml": tumor_volume_ml,
            "confidence": confidence,
            "segmentation_mask_summary": {
                "voxel_count": int(tumor_volume_ml * 1000),
                "labels": ["edema", "enhancing_core", "necrotic_core"],
            },
            "radiomics": radiomics,
            "mesh": {
                "vertices": rng.randint(2000, 8000),
                "faces": rng.randint(4000, 16000),
            },
            "model_version": "mock-v1 (MONAI placeholder)",
        }


def get_active_model() -> SegmentationModel:
    """Factory - swap the returned class to change the active model."""
    return MockSegmentationModel()


def simulate_growth(
    current_volume_ml: float, days: int, growth_rate_per_month: float = 0.06
) -> dict[str, float]:
    """Placeholder longitudinal growth projection.

    Simple compounding growth model as a stand-in for a real predictive
    model. Swap this function's body for a real model call later; the
    signature (days in -> {"projected_volume_ml": ..., "confidence": ...})
    is what the frontend slider depends on.
    """
    months = days / 30.0
    projected = current_volume_ml * ((1 + growth_rate_per_month) ** months)
    confidence = max(0.4, 0.9 - 0.15 * months)
    return {
        "days": days,
        "projected_volume_ml": round(projected, 2),
        "confidence": round(confidence, 3),
    }
