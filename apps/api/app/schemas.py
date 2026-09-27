from __future__ import annotations
from typing import Any
from uuid import UUID
from pydantic import BaseModel, Field


class AnalyzeAndMatchRequest(BaseModel):
    profile_id: UUID
    source_language: str = Field(min_length=2, max_length=16)
    target_language: str = Field(min_length=2, max_length=16)
    text: str = Field(min_length=1)


class AnalyzeAndMatchResponse(BaseModel):
    analysis: dict[str, Any]
    learning_matches: list[dict[str, Any]]


class LearningItemCreate(BaseModel):
    profile_id: UUID
    canonical_form: str
    canonical_key: str
    category: str
    language_specific_type: str | None = None
    status: str = "learning"
    meaning: str | None = None
    meaning_language: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class EncounterCreate(BaseModel):
    learning_item_id: UUID
    surface_form: str
    sentence: str
    provider: str
    source_type: str
    external_id: str
    url: str | None = None
    title: str | None = None
    media_timestamp_ms: int | None = None
    context: dict[str, Any] = Field(default_factory=dict)


class UserCreate(BaseModel):
    external_subject: str = Field(min_length=1, max_length=255)


class LearningProfileCreate(BaseModel):
    user_id: UUID
    source_language: str = Field(min_length=2, max_length=16)
    target_language: str = Field(min_length=2, max_length=16)
    level: str | None = None
