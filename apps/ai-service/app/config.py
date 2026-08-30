"""Application configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Photo Platform AI Service"
    app_version: str = "0.1.0"
    face_engine: str = "auto"  # auto | insightface | opencv
    insightface_model: str = "buffalo_sc"
    match_threshold: float = 0.6
    min_face_size: int = 40
    min_quality_score: float = 0.35


settings = Settings()
