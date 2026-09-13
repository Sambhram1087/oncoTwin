"""
Radiomics-style feature extraction from NIfTI MRI volumes.

Extracts four categories of features:
  1. Intensity statistics (mean, std, skewness, kurtosis, percentiles)
  2. Shape features (volume, surface area estimate, sphericity, elongation)
  3. Texture features (entropy, energy, uniformity from histogram)
  4. Gradient features (mean gradient magnitude, gradient entropy)

If nibabel is not installed or the file is not a valid NIfTI volume,
falls back to synthetic features derived from the file hash for demo
purposes (same behavior as the original MockSegmentationModel).
"""
from __future__ import annotations

import hashlib
import logging
import os
import random
from typing import Any

import numpy as np

logger = logging.getLogger("oncotwin.ml")

# Try importing nibabel for NIfTI support; optional dependency.
try:
    import nibabel as nib

    HAS_NIBABEL = True
except ImportError:
    HAS_NIBABEL = False
    logger.info("nibabel not installed — NIfTI parsing disabled, using synthetic features")

# ── Feature names (fixed order for model compatibility) ──────────────
INTENSITY_FEATURES = [
    "intensity_mean",
    "intensity_std",
    "intensity_skewness",
    "intensity_kurtosis",
    "intensity_p10",
    "intensity_p25",
    "intensity_p50",
    "intensity_p75",
    "intensity_p90",
    "intensity_range",
]

SHAPE_FEATURES = [
    "volume_voxels",
    "volume_mm3",
    "surface_area_mm2",
    "sphericity",
    "elongation",
    "flatness",
    "compactness",
]

TEXTURE_FEATURES = [
    "histogram_entropy",
    "histogram_energy",
    "histogram_uniformity",
    "histogram_kurtosis",
]

GRADIENT_FEATURES = [
    "gradient_mean",
    "gradient_std",
    "gradient_entropy",
]

ALL_FEATURE_NAMES = INTENSITY_FEATURES + SHAPE_FEATURES + TEXTURE_FEATURES + GRADIENT_FEATURES


def _safe_skewness(data: np.ndarray) -> float:
    """Compute skewness without scipy dependency."""
    n = len(data)
    if n < 3:
        return 0.0
    mean = np.mean(data)
    std = np.std(data, ddof=1)
    if std == 0:
        return 0.0
    return float(np.mean(((data - mean) / std) ** 3) * (n * n) / ((n - 1) * (n - 2)))


def _safe_kurtosis(data: np.ndarray) -> float:
    """Compute excess kurtosis without scipy dependency."""
    n = len(data)
    if n < 4:
        return 0.0
    mean = np.mean(data)
    std = np.std(data, ddof=1)
    if std == 0:
        return 0.0
    m4 = np.mean((data - mean) ** 4)
    return float(m4 / (std ** 4) - 3.0)


def extract_intensity_features(volume: np.ndarray) -> dict[str, float]:
    """Extract intensity distribution statistics from a 3D volume."""
    flat = volume.flatten().astype(np.float64)
    # Remove background zeros for more meaningful stats
    nonzero = flat[flat > 0]
    if len(nonzero) < 10:
        nonzero = flat  # fallback if mostly zero

    return {
        "intensity_mean": float(np.mean(nonzero)),
        "intensity_std": float(np.std(nonzero)),
        "intensity_skewness": _safe_skewness(nonzero),
        "intensity_kurtosis": _safe_kurtosis(nonzero),
        "intensity_p10": float(np.percentile(nonzero, 10)),
        "intensity_p25": float(np.percentile(nonzero, 25)),
        "intensity_p50": float(np.percentile(nonzero, 50)),
        "intensity_p75": float(np.percentile(nonzero, 75)),
        "intensity_p90": float(np.percentile(nonzero, 90)),
        "intensity_range": float(np.ptp(nonzero)),
    }


def extract_shape_features(
    volume: np.ndarray, voxel_dims: tuple[float, float, float] = (1.0, 1.0, 1.0)
) -> dict[str, float]:
    """Extract shape-based features using Otsu-like thresholding."""
    flat = volume.flatten().astype(np.float64)
    nonzero = flat[flat > 0]
    if len(nonzero) < 10:
        # Return zeros for empty volumes
        return {k: 0.0 for k in SHAPE_FEATURES}

    # Simple threshold: mean + 0.5 * std of non-zero voxels
    threshold = np.mean(nonzero) + 0.5 * np.std(nonzero)
    mask = volume > threshold

    volume_voxels = int(np.sum(mask))
    if volume_voxels == 0:
        return {k: 0.0 for k in SHAPE_FEATURES}

    voxel_volume = float(np.prod(voxel_dims))
    volume_mm3 = volume_voxels * voxel_volume

    # Surface area estimation via counting boundary voxels
    # A boundary voxel has at least one non-masked 6-connected neighbor
    padded = np.pad(mask.astype(np.uint8), 1, mode="constant")
    boundary_count = 0
    for axis in range(3):
        shifted_pos = np.roll(padded, 1, axis=axis)
        shifted_neg = np.roll(padded, -1, axis=axis)
        boundary_count += int(np.sum(mask & (shifted_pos[1:-1, 1:-1, 1:-1] == 0)))
        boundary_count += int(np.sum(mask & (shifted_neg[1:-1, 1:-1, 1:-1] == 0)))

    avg_face_area = (voxel_dims[0] * voxel_dims[1] + voxel_dims[1] * voxel_dims[2] + voxel_dims[0] * voxel_dims[2]) / 3.0
    surface_area_mm2 = boundary_count * avg_face_area

    # Sphericity = (pi^(1/3) * (6*V)^(2/3)) / A
    if surface_area_mm2 > 0:
        sphericity = (np.pi ** (1 / 3) * (6 * volume_mm3) ** (2 / 3)) / surface_area_mm2
        sphericity = min(sphericity, 1.0)  # cap at 1
    else:
        sphericity = 0.0

    # Elongation and flatness from bounding box
    coords = np.array(np.where(mask))
    bb_dims = coords.max(axis=1) - coords.min(axis=1) + 1
    bb_sorted = sorted(bb_dims * np.array(voxel_dims), reverse=True)
    elongation = bb_sorted[1] / bb_sorted[0] if bb_sorted[0] > 0 else 0.0
    flatness = bb_sorted[2] / bb_sorted[0] if bb_sorted[0] > 0 else 0.0

    # Compactness = V / (bb_vol)
    bb_vol = float(np.prod(bb_sorted))
    compactness = volume_mm3 / bb_vol if bb_vol > 0 else 0.0

    return {
        "volume_voxels": float(volume_voxels),
        "volume_mm3": round(volume_mm3, 2),
        "surface_area_mm2": round(surface_area_mm2, 2),
        "sphericity": round(float(sphericity), 4),
        "elongation": round(float(elongation), 4),
        "flatness": round(float(flatness), 4),
        "compactness": round(float(compactness), 4),
    }


def extract_texture_features(volume: np.ndarray) -> dict[str, float]:
    """Extract first-order texture features from intensity histogram."""
    flat = volume.flatten().astype(np.float64)
    nonzero = flat[flat > 0]
    if len(nonzero) < 10:
        return {k: 0.0 for k in TEXTURE_FEATURES}

    # Compute histogram
    bins = min(256, max(16, int(np.sqrt(len(nonzero)))))
    hist, _ = np.histogram(nonzero, bins=bins, density=True)
    hist = hist / (hist.sum() + 1e-10)  # normalize

    # Entropy
    hist_nz = hist[hist > 0]
    entropy = -float(np.sum(hist_nz * np.log2(hist_nz)))

    # Energy (sum of squared probabilities)
    energy = float(np.sum(hist ** 2))

    # Uniformity (max probability)
    uniformity = float(np.max(hist))

    # Histogram kurtosis
    bin_centers = np.arange(bins, dtype=np.float64)
    mean_bin = np.sum(bin_centers * hist)
    var_bin = np.sum(((bin_centers - mean_bin) ** 2) * hist)
    if var_bin > 0:
        kurt = float(np.sum(((bin_centers - mean_bin) ** 4) * hist) / (var_bin ** 2) - 3.0)
    else:
        kurt = 0.0

    return {
        "histogram_entropy": round(entropy, 4),
        "histogram_energy": round(energy, 6),
        "histogram_uniformity": round(uniformity, 6),
        "histogram_kurtosis": round(kurt, 4),
    }


def extract_gradient_features(volume: np.ndarray) -> dict[str, float]:
    """Extract gradient magnitude statistics from the 3D volume."""
    if volume.ndim < 3 or np.prod(volume.shape) < 27:
        return {k: 0.0 for k in GRADIENT_FEATURES}

    # Compute gradient magnitude using finite differences
    grads = np.gradient(volume.astype(np.float64))
    grad_mag = np.sqrt(sum(g ** 2 for g in grads))

    flat_grad = grad_mag.flatten()
    nonzero = flat_grad[flat_grad > 0]
    if len(nonzero) < 10:
        return {k: 0.0 for k in GRADIENT_FEATURES}

    # Gradient entropy
    bins = min(128, max(16, int(np.sqrt(len(nonzero)))))
    hist, _ = np.histogram(nonzero, bins=bins, density=True)
    hist = hist / (hist.sum() + 1e-10)
    hist_nz = hist[hist > 0]
    grad_entropy = -float(np.sum(hist_nz * np.log2(hist_nz)))

    return {
        "gradient_mean": round(float(np.mean(nonzero)), 4),
        "gradient_std": round(float(np.std(nonzero)), 4),
        "gradient_entropy": round(grad_entropy, 4),
    }


def load_nifti_volume(file_path: str) -> tuple[np.ndarray, tuple[float, float, float]]:
    """Load a NIfTI file and return (volume_data, voxel_dimensions).

    Returns (None, None) if loading fails.
    """
    if not HAS_NIBABEL:
        return None, None  # type: ignore[return-value]

    try:
        img = nib.load(file_path)
        data = np.asarray(img.dataobj, dtype=np.float32)
        header = img.header
        # Get voxel dimensions from the header
        voxel_dims = tuple(float(d) for d in header.get_zooms()[:3])
        if len(voxel_dims) < 3:
            voxel_dims = (1.0, 1.0, 1.0)
        return data, voxel_dims  # type: ignore[return-value]
    except Exception as e:
        logger.warning(f"Failed to load NIfTI file {file_path}: {e}")
        return None, None  # type: ignore[return-value]


def extract_all_features(file_path: str) -> dict[str, float]:
    """Extract all radiomics features from a file.

    Tries to load as NIfTI first. Falls back to synthetic features
    derived from the file hash for non-NIfTI or corrupt files.
    """
    volume = None
    voxel_dims = (1.0, 1.0, 1.0)

    # Attempt NIfTI loading
    if HAS_NIBABEL and os.path.exists(file_path):
        vol, vd = load_nifti_volume(file_path)
        if vol is not None:
            volume = vol
            voxel_dims = vd
            logger.info(f"Loaded NIfTI volume: shape={volume.shape}, voxel_dims={voxel_dims}")

    if volume is not None:
        features = {}
        features.update(extract_intensity_features(volume))
        features.update(extract_shape_features(volume, voxel_dims))
        features.update(extract_texture_features(volume))
        features.update(extract_gradient_features(volume))
        return features
    else:
        # Synthetic fallback
        return _generate_synthetic_features(file_path)


def _generate_synthetic_features(file_path: str) -> dict[str, float]:
    """Generate deterministic synthetic features from file hash."""
    digest = hashlib.sha256(file_path.encode()).hexdigest()
    rng = random.Random(int(digest[:8], 16))

    features = {}
    for name in ALL_FEATURE_NAMES:
        if "volume" in name:
            features[name] = round(rng.uniform(5000, 65000), 2)
        elif "area" in name:
            features[name] = round(rng.uniform(200, 5000), 2)
        elif "sphericity" in name or "elongation" in name or "flatness" in name or "compactness" in name:
            features[name] = round(rng.uniform(0.1, 0.95), 4)
        elif "entropy" in name:
            features[name] = round(rng.uniform(3.0, 8.0), 4)
        elif "energy" in name or "uniformity" in name:
            features[name] = round(rng.uniform(0.001, 0.1), 6)
        elif "kurtosis" in name or "skewness" in name:
            features[name] = round(rng.uniform(-2.0, 5.0), 4)
        else:
            features[name] = round(rng.uniform(0.0, 1000.0), 4)

    return features


def features_to_vector(features: dict[str, float]) -> np.ndarray:
    """Convert feature dict to a fixed-order numpy vector for model input."""
    return np.array([features.get(name, 0.0) for name in ALL_FEATURE_NAMES], dtype=np.float64)
