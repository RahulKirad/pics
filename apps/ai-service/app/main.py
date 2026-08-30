"""AI Photo Platform — Face Recognition Service."""

from fastapi import FastAPI

from app.config import settings
from app.models.schemas import HealthResponse
from app.routers.faces import router as faces_router
from app.services.face_engine import get_face_engine

app = FastAPI(
    title=settings.app_name,
    description="Internal face detection, embedding, and matching service",
    version=settings.app_version,
    docs_url=None,
    redoc_url=None,
)


@app.on_event("startup")
async def startup() -> None:
    get_face_engine()


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    engine = get_face_engine()
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        engine=engine.engine_name,
    )


app.include_router(faces_router)
