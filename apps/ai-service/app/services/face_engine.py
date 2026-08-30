"""Face detection and embedding engine with InsightFace + OpenCV fallback."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import cv2
import numpy as np

from app.config import settings
from app.models.schemas import BoundingBox
from app.services.quality import assess_face_quality

logger = logging.getLogger(__name__)


@dataclass
class EngineFace:
    bounding_box: BoundingBox
    confidence: float
    quality_score: float
    landmarks: dict[str, float] | None
    embedding: np.ndarray | None


class FaceEngine:
    def __init__(self) -> None:
        self.engine_name = "opencv"
        self.model_version = "opencv-haar-v1"
        self._insightface_app: Any | None = None
        self._opencv_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml",
        )
        self._init_engine()

    def _init_engine(self) -> None:
        preferred = settings.face_engine.lower()
        if preferred in {"auto", "insightface"}:
            try:
                from insightface.app import FaceAnalysis

                app = FaceAnalysis(
                    name=settings.insightface_model,
                    providers=["CPUExecutionProvider"],
                )
                app.prepare(ctx_id=-1, det_size=(640, 640))
                self._insightface_app = app
                self.engine_name = "insightface"
                self.model_version = settings.insightface_model
                logger.info("Initialized InsightFace engine: %s", settings.insightface_model)
                return
            except Exception as error:  # noqa: BLE001
                logger.warning("InsightFace unavailable, falling back to OpenCV: %s", error)

        self.engine_name = "opencv"
        self.model_version = "opencv-haar-v1"
        logger.info("Initialized OpenCV face engine")

    def detect(self, image_bgr: np.ndarray) -> list[EngineFace]:
        if self._insightface_app is not None:
            return self._detect_insightface(image_bgr)
        return self._detect_opencv(image_bgr)

    def embed(self, image_bgr: np.ndarray, bounding_box: BoundingBox | None = None) -> np.ndarray:
        if self._insightface_app is not None:
            return self._embed_insightface(image_bgr, bounding_box)
        return self._embed_opencv(image_bgr, bounding_box)

    def _detect_insightface(self, image_bgr: np.ndarray) -> list[EngineFace]:
        faces = self._insightface_app.get(image_bgr)
        results: list[EngineFace] = []

        for face in faces:
            x1, y1, x2, y2 = face.bbox.astype(float)
            bbox = BoundingBox(x=float(x1), y=float(y1), width=float(x2 - x1), height=float(y2 - y1))
            quality, _, _ = assess_face_quality(
                image_bgr,
                bbox,
                settings.min_face_size,
                settings.min_quality_score,
            )
            landmarks = None
            if hasattr(face, "kps") and face.kps is not None:
                landmarks = {
                    f"p{i}": float(v)
                    for i, v in enumerate(face.kps.reshape(-1).tolist())
                }

            embedding = None
            if hasattr(face, "embedding") and face.embedding is not None:
                embedding = np.asarray(face.embedding, dtype=np.float32)

            results.append(
                EngineFace(
                    bounding_box=bbox,
                    confidence=float(face.det_score),
                    quality_score=quality,
                    landmarks=landmarks,
                    embedding=embedding,
                ),
            )

        return results

    def _detect_opencv(self, image_bgr: np.ndarray) -> list[EngineFace]:
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        detections = self._opencv_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(settings.min_face_size, settings.min_face_size),
        )

        results: list[EngineFace] = []
        for x, y, w, h in detections:
            bbox = BoundingBox(x=float(x), y=float(y), width=float(w), height=float(h))
            quality, _, _ = assess_face_quality(
                image_bgr,
                bbox,
                settings.min_face_size,
                settings.min_quality_score,
            )
            confidence = min(0.95, 0.55 + quality * 0.4)
            results.append(
                EngineFace(
                    bounding_box=bbox,
                    confidence=confidence,
                    quality_score=quality,
                    landmarks=None,
                    embedding=None,
                ),
            )

        return results

    def _embed_insightface(self, image_bgr: np.ndarray, bounding_box: BoundingBox | None) -> np.ndarray:
        faces = self._insightface_app.get(image_bgr)
        if not faces:
            raise ValueError("No face detected for embedding")

        if bounding_box is None:
            face = max(faces, key=lambda item: float(item.det_score))
            return np.asarray(face.embedding, dtype=np.float32)

        target = bounding_box
        best = None
        best_iou = 0.0
        for face in faces:
            x1, y1, x2, y2 = face.bbox.astype(float)
            iou = _bbox_iou(target, BoundingBox(x=x1, y=y1, width=x2 - x1, height=y2 - y1))
            if iou > best_iou:
                best_iou = iou
                best = face

        if best is None or best_iou < 0.1:
            raise ValueError("No matching face found for bounding box")

        return np.asarray(best.embedding, dtype=np.float32)

    def _embed_opencv(self, image_bgr: np.ndarray, bounding_box: BoundingBox | None) -> np.ndarray:
        height, width = image_bgr.shape[:2]
        if bounding_box:
            x = max(0, int(bounding_box.x))
            y = max(0, int(bounding_box.y))
            w = max(1, int(bounding_box.width))
            h = max(1, int(bounding_box.height))
            crop = image_bgr[y : min(height, y + h), x : min(width, x + w)]
        else:
            faces = self._detect_opencv(image_bgr)
            if not faces:
                raise ValueError("No face detected for embedding")
            bbox = faces[0].bounding_box
            x, y, w, h = int(bbox.x), int(bbox.y), int(bbox.width), int(bbox.height)
            crop = image_bgr[y : y + h, x : x + w]

        resized = cv2.resize(crop, (128, 128), interpolation=cv2.INTER_AREA)
        vector = resized.astype(np.float32).reshape(-1)
        vector = vector / (np.linalg.norm(vector) + 1e-8)
        # Pad/truncate to 512 dims for consistent matching
        if vector.size < 512:
            vector = np.pad(vector, (0, 512 - vector.size))
        else:
            vector = vector[:512]
        return vector / (np.linalg.norm(vector) + 1e-8)


_engine: FaceEngine | None = None


def get_face_engine() -> FaceEngine:
    global _engine
    if _engine is None:
        _engine = FaceEngine()
    return _engine


def _bbox_iou(a: BoundingBox, b: BoundingBox) -> float:
    ax2, ay2 = a.x + a.width, a.y + a.height
    bx2, by2 = b.x + b.width, b.y + b.height
    inter_x1 = max(a.x, b.x)
    inter_y1 = max(a.y, b.y)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)
    inter_w = max(0.0, inter_x2 - inter_x1)
    inter_h = max(0.0, inter_y2 - inter_y1)
    inter = inter_w * inter_h
    if inter <= 0:
        return 0.0
    union = (a.width * a.height) + (b.width * b.height) - inter
    return inter / union if union > 0 else 0.0
