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
import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger("oncotwin.ai_pipeline")


class SegmentationModel(ABC):
    @abstractmethod
    def predict(self, file_path: str, modality: str) -> dict[str, Any]:
        """Run inference on an MRI volume and return a result dict with the contract."""
        raise NotImplementedError


class MockSegmentationModel(SegmentationModel):
    """Deterministic-per-file demo model."""

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
            "model_version": "mock-v1 (fallback)",
        }


def get_active_model() -> SegmentationModel:
    """Factory - try to load trained model, fallback to mock."""
    try:
        from app.ml.model import TrainedSegmentationModel
        return TrainedSegmentationModel()
    except Exception as e:
        logger.warning(f"Failed to load trained model, falling back to mock: {e}")
        return MockSegmentationModel()


def simulate_growth(current_volume_ml: float, days_target: int) -> dict[str, Any]:
    """Gompertzian longitudinal growth projection.
    
    Generates a multi-point trajectory from day 0 to days_target.
    Returns:
        {
            "trajectory": [
                {"day": int, "projected_volume_ml": float, "upper_bound": float, "lower_bound": float},
                ...
            ]
        }
    """
    # Gompertz model parameters (typical for brain tumors)
    V0 = current_volume_ml
    if V0 <= 0:
        V0 = 1.0  # Avoid zero volume
        
    alpha = 0.05  # Initial specific growth rate
    beta = 0.01   # Deceleration factor

    trajectory = []
    
    # We want to return points for 0, 30, 60, 90... up to days_target, plus the exact days_target
    points_to_eval = set([0, days_target])
    for d in [30, 60, 90, 120, 180, 365]:
        if d <= days_target:
            points_to_eval.add(d)
            
    sorted_days = sorted(list(points_to_eval))
    
    for t in sorted_days:
        months = t / 30.0
        # Gompertz: V(t) = V0 * exp( (alpha/beta) * (1 - exp(-beta * t)) )
        # Here we use months as the time unit 't' for typical growth rates
        projected = V0 * (2.71828 ** ((alpha/beta) * (1 - (2.71828 ** (-beta * months)))))
        
        # Confidence interval widens over time (uncertainty)
        uncertainty = 0.05 * months  # 5% uncertainty per month
        upper_bound = projected * (1 + uncertainty)
        lower_bound = projected * (1 - uncertainty)
        
        trajectory.append({
            "day": t,
            "projected_volume_ml": round(projected, 2),
            "upper_bound": round(upper_bound, 2),
            "lower_bound": round(lower_bound, 2)
        })

    return {
        "trajectory": trajectory
    }
