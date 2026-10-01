from __future__ import annotations

import uuid
from datetime import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_subject: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LearningProfile(Base):
    __tablename__ = "learning_profiles"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    source_language: Mapped[str] = mapped_column(String(16), index=True)
    target_language: Mapped[str] = mapped_column(String(16))
    level: Mapped[str | None] = mapped_column(String(16), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LearningItem(Base):
    __tablename__ = "learning_items"
    __table_args__ = (UniqueConstraint("profile_id", "canonical_key", name="uq_learning_item_profile_key"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("learning_profiles.id", ondelete="CASCADE"), index=True)
    canonical_form: Mapped[str] = mapped_column(Text)
    canonical_key: Mapped[str] = mapped_column(String(512))
    category: Mapped[str] = mapped_column(String(64))
    language_specific_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="learning", index=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    translations: Mapped[list["LearningItemTranslation"]] = relationship(cascade="all, delete-orphan")


class LearningItemTranslation(Base):
    __tablename__ = "learning_item_translations"
    __table_args__ = (UniqueConstraint("learning_item_id", "language", name="uq_learning_translation_language"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learning_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("learning_items.id", ondelete="CASCADE"), index=True)
    language: Mapped[str] = mapped_column(String(16))
    meaning: Mapped[str] = mapped_column(Text)


class ContentSource(Base):
    __tablename__ = "content_sources"
    __table_args__ = (UniqueConstraint("provider", "external_id", name="uq_source_provider_external"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(64), index=True)
    source_type: Mapped[str] = mapped_column(String(64), index=True)
    external_id: Mapped[str] = mapped_column(String(512))
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)


class Encounter(Base):
    __tablename__ = "encounters"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learning_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("learning_items.id", ondelete="CASCADE"), index=True)
    source_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("content_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    surface_form: Mapped[str] = mapped_column(Text)
    sentence: Mapped[str] = mapped_column(Text)
    media_timestamp_ms: Mapped[int | None] = mapped_column(nullable=True)
    media_end_timestamp_ms: Mapped[int | None] = mapped_column(nullable=True)
    context_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    encountered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ExampleSource(Base):
    __tablename__ = "example_sources"
    __table_args__ = (UniqueConstraint("provider", "external_id", name="uq_example_source_provider_external"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(64), index=True)
    external_id: Mapped[str] = mapped_column(String(512))
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str] = mapped_column(String(16), index=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)


class ExampleSentence(Base):
    __tablename__ = "example_sentences"
    __table_args__ = (
        UniqueConstraint("source_id", "start_ms", "end_ms", name="uq_example_sentence_source_range"),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("example_sources.id", ondelete="CASCADE"), index=True
    )
    sentence: Mapped[str] = mapped_column(Text)
    start_ms: Mapped[int] = mapped_column(BigInteger)
    end_ms: Mapped[int] = mapped_column(BigInteger)
    quality: Mapped[str] = mapped_column(String(32), default="transcript")
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)


class ExampleLexemeMatch(Base):
    __tablename__ = "example_lexeme_matches"
    __table_args__ = (
        UniqueConstraint("example_sentence_id", "lemma", name="uq_example_lexeme_sentence_lemma"),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    example_sentence_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("example_sentences.id", ondelete="CASCADE"), index=True
    )
    lemma: Mapped[str] = mapped_column(String(255), index=True)
    surface_form: Mapped[str] = mapped_column(Text)


class IndexedContent(Base):
    __tablename__ = "indexed_contents"
    __table_args__ = (
        UniqueConstraint(
            "provider",
            "external_id",
            "source_language",
            "target_language",
            "content_hash",
            "analysis_schema_version",
            name="uq_indexed_content_identity",
        ),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(64), index=True)
    source_type: Mapped[str] = mapped_column(String(64), index=True)
    external_id: Mapped[str] = mapped_column(String(512), index=True)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_language: Mapped[str] = mapped_column(String(16), index=True)
    target_language: Mapped[str] = mapped_column(String(16), index=True)
    content_hash: Mapped[str] = mapped_column(String(64), index=True)
    analysis_schema_version: Mapped[str] = mapped_column(String(32), default="v1")
    analyzer_provider: Mapped[str | None] = mapped_column(String(64), nullable=True)
    analyzer_model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="ready", index=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    segments: Mapped[list["IndexedSegment"]] = relationship(
        cascade="all, delete-orphan", order_by="IndexedSegment.sequence_index"
    )


class IndexedSegment(Base):
    __tablename__ = "indexed_segments"
    __table_args__ = (
        UniqueConstraint("content_id", "sequence_index", name="uq_indexed_segment_sequence"),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("indexed_contents.id", ondelete="CASCADE"), index=True
    )
    sequence_index: Mapped[int] = mapped_column(index=True)
    start_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    end_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    source_text: Mapped[str] = mapped_column(Text)
    translation_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    analysis_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    units: Mapped[list["IndexedUnit"]] = relationship(cascade="all, delete-orphan")


class IndexedUnit(Base):
    __tablename__ = "indexed_units"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("indexed_segments.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(32), index=True)
    canonical_form: Mapped[str] = mapped_column(Text)
    canonical_key: Mapped[str] = mapped_column(String(512), index=True)
    surface_form: Mapped[str] = mapped_column(Text)
    language_specific_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    contextual_meaning: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_indices_json: Mapped[list] = mapped_column(JSONB, default=list)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
