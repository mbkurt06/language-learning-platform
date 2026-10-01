from __future__ import annotations
from typing import Any
from uuid import UUID
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    source_language: str = Field(min_length=2, max_length=16)
    target_language: str = Field(min_length=2, max_length=16)
    text: str = Field(min_length=1)


class AnalyzeResponse(BaseModel):
    analysis: dict[str, Any]


class TokenBatchRequest(BaseModel):
    source_language: str = Field(min_length=2, max_length=16)
    texts: list[str] = Field(min_length=1, max_length=500)


class AnalyzeAndMatchRequest(AnalyzeRequest):
    profile_id: UUID


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
    media_end_timestamp_ms: int | None = None
    context: dict[str, Any] = Field(default_factory=dict)


class UserCreate(BaseModel):
    external_subject: str = Field(min_length=1, max_length=255)


class LearningProfileCreate(BaseModel):
    user_id: UUID
    source_language: str = Field(min_length=2, max_length=16)
    target_language: str = Field(min_length=2, max_length=16)
    level: str | None = None


class LearningProfileEnsure(BaseModel):
    external_subject: str = Field(min_length=1, max_length=255)
    source_language: str = Field(min_length=2, max_length=16)
    target_language: str = Field(min_length=2, max_length=16)
    level: str | None = None


class ExampleCue(BaseModel):
    start_ms: int
    end_ms: int
    text: str


class ExampleCorpusIndexRequest(BaseModel):
    provider: str = "youtube"
    external_id: str
    title: str | None = None
    url: str | None = None
    language: str = "de"
    target_lemmas: list[str] = Field(default_factory=list)
    index_all: bool = False
    cues: list[ExampleCue] = Field(min_length=1)


class ContentSegmentInput(BaseModel):
    index: int
    text: str = Field(min_length=1)
    start_ms: int | None = None
    end_ms: int | None = None


class ContentIndexRequest(BaseModel):
    provider: str = Field(min_length=1, max_length=64)
    source_type: str = Field(min_length=1, max_length=64)
    external_id: str = Field(min_length=1, max_length=512)
    url: str | None = None
    title: str | None = None
    source_language: str = Field(default="de", min_length=2, max_length=16)
    target_language: str = Field(default="tr", min_length=2, max_length=16)
    segments: list[ContentSegmentInput] = Field(min_length=1, max_length=5000)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ContentIndexResponse(BaseModel):
    cached: bool
    content_id: UUID
    content_hash: str
    analyzer_provider: str | None = None
    analyzer_model: str | None = None
    analysis_schema_version: str
    reused_segments: int = 0
    ai_analyzed_segments: int = 0
    local_segments: int = 0
    segments: list[dict[str, Any]]
