"""
ML model training script for OncoTwin tumor analysis.

Trains a Random Forest ensemble on radiomics feature vectors to predict:
  1. Tumor volume category (small / medium / large)
  2. Confidence-calibrated regression for volume estimation
  3. Radiomic feature importance ranking

Usage:
    python -m app.ml.train              # Train with synthetic data
    python -m app.ml.train --samples 500  # Custom sample count

The trained model is saved to app/ml/artifacts/model.joblib alongside
training metrics (JSON) and feature importance plot data.
"""
from __future__ import annotations

import json
import logging
import os
import sys
import time
from pathlib import Path

import numpy as np

# Ensure the project root is on the path when run as __main__
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    mean_absolute_error,
    r2_score,
)
from sklearn.preprocessing import StandardScaler
import joblib

from app.ml.feature_extractor import ALL_FEATURE_NAMES

logger = logging.getLogger("oncotwin.ml.train")
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"


def _generate_training_data(
    n_samples: int = 300, seed: int = 42
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Generate realistic synthetic training data.

    Creates feature vectors that mimic real radiomics distributions
    for three tumor volume categories:
      - small  (< 15 mL)
      - medium (15-40 mL)
      - large  (> 40 mL)

    Returns (X, y_class, y_volume) where:
      X: (n_samples, n_features) feature matrix
      y_class: (n_samples,) integer class labels (0=small, 1=medium, 2=large)
      y_volume: (n_samples,) continuous volume in mL
    """
    rng = np.random.RandomState(seed)
    n_features = len(ALL_FEATURE_NAMES)

    X_all = []
    y_class_all = []
    y_volume_all = []

    # Class proportions: 30% small, 45% medium, 25% large
    n_small = int(n_samples * 0.30)
    n_medium = int(n_samples * 0.45)
    n_large = n_samples - n_small - n_medium

    for class_label, n_cls, vol_range, intensity_shift, shape_shift in [
        (0, n_small, (2.0, 14.0), 0.0, 0.0),
        (1, n_medium, (15.0, 39.0), 0.3, 0.2),
        (2, n_large, (40.0, 85.0), 0.6, 0.5),
    ]:
        for _ in range(n_cls):
            volume_ml = rng.uniform(*vol_range)
            feat = np.zeros(n_features)

            # Intensity features (indices 0-9)
            feat[0] = rng.normal(500 + intensity_shift * 200, 80)   # mean
            feat[1] = rng.normal(120 + intensity_shift * 50, 30)    # std
            feat[2] = rng.normal(0.5 + intensity_shift * 0.3, 0.3)  # skewness
            feat[3] = rng.normal(2.5 + intensity_shift * 0.5, 0.8)  # kurtosis
            feat[4] = rng.normal(200 + intensity_shift * 80, 50)    # p10
            feat[5] = rng.normal(350 + intensity_shift * 100, 60)   # p25
            feat[6] = rng.normal(480 + intensity_shift * 150, 70)   # p50
            feat[7] = rng.normal(620 + intensity_shift * 200, 80)   # p75
            feat[8] = rng.normal(780 + intensity_shift * 250, 90)   # p90
            feat[9] = rng.normal(800 + intensity_shift * 300, 100)  # range

            # Shape features (indices 10-16)
            feat[10] = volume_ml * 1000 + rng.normal(0, 200)        # volume_voxels
            feat[11] = volume_ml * 1000 + rng.normal(0, 150)        # volume_mm3
            feat[12] = rng.normal(1500 + shape_shift * 2000, 500)   # surface_area
            feat[13] = rng.normal(0.7 - shape_shift * 0.15, 0.1)    # sphericity
            feat[14] = rng.normal(0.6 + shape_shift * 0.1, 0.1)     # elongation
            feat[15] = rng.normal(0.5 + shape_shift * 0.05, 0.1)    # flatness
            feat[16] = rng.normal(0.4 - shape_shift * 0.1, 0.08)    # compactness

            # Texture features (indices 17-20)
            feat[17] = rng.normal(5.5 + intensity_shift * 0.5, 0.5)  # entropy
            feat[18] = rng.normal(0.02 - intensity_shift * 0.005, 0.005)  # energy
            feat[19] = rng.normal(0.04 - intensity_shift * 0.01, 0.01)   # uniformity
            feat[20] = rng.normal(1.5 + intensity_shift * 0.5, 0.5)      # hist_kurt

            # Gradient features (indices 21-23)
            feat[21] = rng.normal(30 + intensity_shift * 15, 8)    # grad_mean
            feat[22] = rng.normal(25 + intensity_shift * 10, 6)    # grad_std
            feat[23] = rng.normal(5.0 + intensity_shift * 0.5, 0.4)  # grad_entropy

            X_all.append(feat)
            y_class_all.append(class_label)
            y_volume_all.append(volume_ml)

    X = np.array(X_all)
    y_class = np.array(y_class_all)
    y_volume = np.array(y_volume_all)

    # Shuffle
    indices = rng.permutation(len(X))
    return X[indices], y_class[indices], y_volume[indices]


def train_model(n_samples: int = 300, seed: int = 42) -> dict:
    """Train and save the OncoTwin ML model.

    Returns a dict with training metrics.
    """
    start_time = time.time()
    logger.info("=" * 60)
    logger.info("OncoTwin ML Model Training")
    logger.info("=" * 60)

    # ── Generate data ──────────────────────────────────────────────
    logger.info(f"Generating {n_samples} synthetic training samples...")
    X, y_class, y_volume = _generate_training_data(n_samples, seed)
    logger.info(f"Feature matrix shape: {X.shape}")
    logger.info(f"Class distribution: small={np.sum(y_class==0)}, "
                f"medium={np.sum(y_class==1)}, large={np.sum(y_class==2)}")

    # ── Train/test split ───────────────────────────────────────────
    X_train, X_test, yc_train, yc_test, yv_train, yv_test = train_test_split(
        X, y_class, y_volume, test_size=0.2, random_state=seed, stratify=y_class
    )
    logger.info(f"Train: {len(X_train)} | Test: {len(X_test)}")

    # ── Feature scaling ────────────────────────────────────────────
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── Train classifier (tumor size category) ─────────────────────
    logger.info("Training Random Forest Classifier...")
    classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=seed,
        n_jobs=-1,
        class_weight="balanced",
    )
    classifier.fit(X_train_scaled, yc_train)
    yc_pred = classifier.predict(X_test_scaled)
    clf_accuracy = accuracy_score(yc_test, yc_pred)
    clf_report = classification_report(yc_test, yc_pred, target_names=["small", "medium", "large"], output_dict=True)
    logger.info(f"Classifier accuracy: {clf_accuracy:.4f}")

    # ── Train regressor (volume estimation) ────────────────────────
    logger.info("Training Random Forest Regressor...")
    regressor = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=seed,
        n_jobs=-1,
    )
    regressor.fit(X_train_scaled, yv_train)
    yv_pred = regressor.predict(X_test_scaled)
    reg_mae = mean_absolute_error(yv_test, yv_pred)
    reg_r2 = r2_score(yv_test, yv_pred)
    logger.info(f"Regressor MAE: {reg_mae:.3f} mL | R²: {reg_r2:.4f}")

    # ── Feature importance ─────────────────────────────────────────
    importances = classifier.feature_importances_
    feature_importance = sorted(
        zip(ALL_FEATURE_NAMES, importances.tolist()),
        key=lambda x: x[1],
        reverse=True,
    )
    logger.info("\nTop 10 feature importances:")
    for name, imp in feature_importance[:10]:
        bar = "█" * int(imp * 100)
        logger.info(f"  {name:25s} {imp:.4f} {bar}")

    # ── Save model artifacts ───────────────────────────────────────
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    model_bundle = {
        "classifier": classifier,
        "regressor": regressor,
        "scaler": scaler,
        "feature_names": ALL_FEATURE_NAMES,
        "class_names": ["small", "medium", "large"],
        "version": "v1.0.0",
    }
    model_path = ARTIFACTS_DIR / "model.joblib"
    joblib.dump(model_bundle, model_path)
    logger.info(f"\nModel saved to {model_path}")

    training_time = round(time.time() - start_time, 2)

    # ── Save metrics ───────────────────────────────────────────────
    metrics = {
        "version": "v1.0.0",
        "training_samples": n_samples,
        "train_size": len(X_train),
        "test_size": len(X_test),
        "classifier": {
            "accuracy": round(clf_accuracy, 4),
            "report": clf_report,
        },
        "regressor": {
            "mae_ml": round(reg_mae, 3),
            "r2_score": round(reg_r2, 4),
        },
        "feature_importance": [
            {"feature": name, "importance": round(imp, 4)}
            for name, imp in feature_importance
        ],
        "training_time_seconds": training_time,
    }

    metrics_path = ARTIFACTS_DIR / "training_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Metrics saved to {metrics_path}")

    logger.info(f"\n{'=' * 60}")
    logger.info(f"Training complete in {training_time}s")
    logger.info(f"  Classifier accuracy: {clf_accuracy:.1%}")
    logger.info(f"  Regressor MAE:       {reg_mae:.2f} mL")
    logger.info(f"  Regressor R²:        {reg_r2:.4f}")
    logger.info(f"{'=' * 60}")

    return metrics


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train OncoTwin ML model")
    parser.add_argument("--samples", type=int, default=300, help="Number of training samples")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    train_model(n_samples=args.samples, seed=args.seed)
