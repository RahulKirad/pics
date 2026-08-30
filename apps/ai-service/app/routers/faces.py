"""Face recognition API routes."""

from __future__ import annotations

import json

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import settings
from app.models.schemas import (
    DetectedFace,
    FaceDetectionResponse,
    FaceEmbeddingResponse,
    FaceMatchRequest,
    FaceMatchResponse,
    QualityCheckResponse,
)
from app.services.face_engine import get_face_engine
from app.services.matcher import match_embeddings
from app.services.quality import assess_face_quality
from app.utils.image import decode_image_base64, read_image_from_upload

router = APIRouter(prefix="/api/v1/faces", tags=["faces"])


@router.post("/detect", response_model=FaceDetectionResponse)
async def detect_faces(image: UploadFile = File(...)) -> FaceDetectionResponse:
    image_bgr = await read_image_from_upload(image)
    engine = get_face_engine()
    faces = engine.detect(image_bgr)

    return FaceDetectionResponse(
        faces=[
            DetectedFace(
                bounding_box=face.bounding_box,
                confidence=face.confidence,
                quality_score=face.quality_score,
                landmarks=face.landmarks,
            )
            for face in faces
        ],
        count=len(faces),
        model_version=engine.model_version,
    )


@router.post("/embedding", response_model=FaceEmbeddingResponse)
async def generate_embedding(
    image: UploadFile = File(...),
    bounding_box: str | None = Form(default=None),
) -> FaceEmbeddingResponse:
    image_bgr = await read_image_from_upload(image)
    engine = get_face_engine()

    bbox = None
    if bounding_box:
        try:
            from app.models.schemas import BoundingBox

            bbox = BoundingBox.model_validate(json.loads(bounding_box))
        except Exception as error:  # noqa: BLE001
            raise HTTPException(status_code=400, detail="Invalid bounding_box JSON") from error

    try:
        vector = engine.embed(image_bgr, bbox)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return FaceEmbeddingResponse(
        embedding=vector.astype(float).tolist(),
        model_version=engine.model_version,
        dimensions=int(vector.size),
    )


@router.post("/match", response_model=FaceMatchResponse)
async def match_faces(payload: FaceMatchRequest) -> FaceMatchResponse:
    threshold = payload.threshold if payload.threshold > 0 else settings.match_threshold
    matches = match_embeddings(
        payload.query_embedding,
        payload.candidates,
        threshold,
        payload.top_k,
    )
    return FaceMatchResponse(matches=matches, threshold=threshold)


@router.post("/quality-check", response_model=QualityCheckResponse)
async def quality_check(
    image: UploadFile = File(...),
    bounding_box: str | None = Form(default=None),
) -> QualityCheckResponse:
    image_bgr = await read_image_from_upload(image)

    bbox = None
    if bounding_box:
        try:
            from app.models.schemas import BoundingBox

            bbox = BoundingBox.model_validate(json.loads(bounding_box))
        except Exception as error:  # noqa: BLE001
            raise HTTPException(status_code=400, detail="Invalid bounding_box JSON") from error

    score, metrics, reason = assess_face_quality(
        image_bgr,
        bbox,
        settings.min_face_size,
        settings.min_quality_score,
    )

    return QualityCheckResponse(
        passed=reason is None,
        score=round(score, 4),
        reason=reason,
        metrics=metrics,
    )


@router.post("/detect-base64", response_model=FaceDetectionResponse)
async def detect_faces_base64(payload: dict) -> FaceDetectionResponse:
    image_base64 = payload.get("imageBase64")
    if not image_base64 or not isinstance(image_base64, str):
        raise HTTPException(status_code=400, detail="imageBase64 is required")

    image_bgr = decode_image_base64(image_base64)
    engine = get_face_engine()
    faces = engine.detect(image_bgr)

    return FaceDetectionResponse(
        faces=[
            DetectedFace(
                bounding_box=face.bounding_box,
                confidence=face.confidence,
                quality_score=face.quality_score,
                landmarks=face.landmarks,
            )
            for face in faces
        ],
        count=len(faces),
        model_version=engine.model_version,
    )
