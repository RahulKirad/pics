"""Face quality assessment utilities."""

from __future__ import annotations

import cv2
import numpy as np

from app.models.schemas import BoundingBox


def compute_blur_score(gray: np.ndarray) -> float:
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    variance = laplacian.var()
    return float(min(variance / 500.0, 1.0))


def compute_brightness_score(gray: np.ndarray) -> float:
    mean = float(np.mean(gray))
    # Ideal brightness around 128
    distance = abs(mean - 128.0) / 128.0
    return float(max(0.0, 1.0 - distance))


def assess_face_quality(
    image_bgr: np.ndarray,
    bounding_box: BoundingBox | None,
    min_face_size: int,
    min_quality_score: float,
) -> tuple[float, dict[str, float], str | None]:
    height, width = image_bgr.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    if bounding_box:
        x = max(0, int(bounding_box.x))
        y = max(0, int(bounding_box.y))
        w = max(1, int(bounding_box.width))
        h = max(1, int(bounding_box.height))
        x2 = min(width, x + w)
        y2 = min(height, y + h)
        face_gray = gray[y:y2, x:x2]
        face_size = min(w, h)
    else:
        face_gray = gray
        face_size = min(width, height)

    blur_score = compute_blur_score(face_gray)
    brightness_score = compute_brightness_score(face_gray)
    size_score = float(min(face_size / max(min_face_size * 2, 1), 1.0))
    overall = (blur_score * 0.5) + (brightness_score * 0.25) + (size_score * 0.25)

    metrics = {
        "blur": round(blur_score, 4),
        "brightness": round(brightness_score, 4),
        "size": round(size_score, 4),
        "face_size_px": float(face_size),
    }

    reason = None
    if face_size < min_face_size:
        reason = f"Face too small ({face_size}px < {min_face_size}px)"
    elif blur_score < 0.2:
        reason = "Image is too blurry"
    elif brightness_score < 0.2:
        reason = "Poor lighting"
    elif overall < min_quality_score:
        reason = "Overall quality below threshold"

    passed = reason is None and overall >= min_quality_score
    return overall, metrics, reason if not passed else None
