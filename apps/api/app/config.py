from __future__ import annotations

import json
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "postgresql+psycopg://platform:platform@localhost:5432/language_learning"
    language_engine_urls: str = '{"de":"http://german-engine:8765"}'
    cors_origins: str = "http://localhost:3001,http://localhost:5173"
    cors_origin_regex: str = r"^https://(www\.)?youtube\.com$|^https://([^.]+\.)?zdf\.de$|^https://([^.]+\.)?ardmediathek\.de$|^chrome-extension://.*$"
    environment: str = "local"
    ai_analyzer_url: str = "http://ai-analyzer:8780"
    ai_analysis_schema_version: str = "v1"
    ai_batch_segments: int = 20
    ai_batch_concurrency: int = 2
    google_cloud_project: str = ""
    google_cloud_service_account_json: str = ""

    def engine_urls(self) -> dict[str, str]:
        value = json.loads(self.language_engine_urls)
        if not isinstance(value, dict):
            raise ValueError("LANGUAGE_ENGINE_URLS must be a JSON object")
        return {str(k): str(v).rstrip("/") for k, v in value.items()}

    def allowed_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
