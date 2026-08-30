"""Pydantic schemas for face recognition API."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    version: str
    engine: str


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class DetectedFace(BaseModel):
    bounding_box: BoundingBox
    confidence: float
    quality_score: float | None = None
    landmarks: dict[str, float] | None = None


class FaceDetectionResponse(BaseModel):
    faces: list[DetectedFace]
    count: int
    model_version: str


class FaceEmbeddingRequest(BaseModel):
    bounding_box: BoundingBox | None = None


class FaceEmbeddingResponse(BaseModel):
    embedding: list[float]
    model_version: str
    dimensions: int


class FaceMatchCandidate(BaseModel):
    id: str
    embedding: list[float]


class FaceMatchRequest(BaseModel):
    query_embedding: list[float] = Field(min_length=1)
    candidates: list[FaceMatchCandidate] = Field(default_factory=list)
    threshold: float = 0.6
    top_k: int = 20


class FaceMatchResult(BaseModel):
    id: str
    similarity: float


class FaceMatchResponse(BaseModel):
    matches: list[FaceMatchResult]
    threshold: float


class QualityCheckResponse(BaseModel):
    passed: bool
    score: float
    reason: str | None = None
    metrics: dict[str, float] = Field(default_factory=dict)
