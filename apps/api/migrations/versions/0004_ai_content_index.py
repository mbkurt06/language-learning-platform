"""add persistent AI content index"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004_ai_content_index"
down_revision = "0003_example_corpus"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "indexed_contents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("provider", sa.String(64), nullable=False),
        sa.Column("source_type", sa.String(64), nullable=False),
        sa.Column("external_id", sa.String(512), nullable=False),
        sa.Column("url", sa.Text()),
        sa.Column("title", sa.Text()),
        sa.Column("source_language", sa.String(16), nullable=False),
        sa.Column("target_language", sa.String(16), nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("analysis_schema_version", sa.String(32), nullable=False, server_default="v1"),
        sa.Column("analyzer_provider", sa.String(64)),
        sa.Column("analyzer_model", sa.String(128)),
        sa.Column("status", sa.String(32), nullable=False, server_default="ready"),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("analyzed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint(
            "provider",
            "external_id",
            "source_language",
            "target_language",
            "content_hash",
            "analysis_schema_version",
            name="uq_indexed_content_identity",
        ),
    )
    op.create_index("ix_indexed_contents_provider", "indexed_contents", ["provider"])
    op.create_index("ix_indexed_contents_source_type", "indexed_contents", ["source_type"])
    op.create_index("ix_indexed_contents_external_id", "indexed_contents", ["external_id"])
    op.create_index("ix_indexed_contents_source_language", "indexed_contents", ["source_language"])
    op.create_index("ix_indexed_contents_target_language", "indexed_contents", ["target_language"])
    op.create_index("ix_indexed_contents_content_hash", "indexed_contents", ["content_hash"])
    op.create_index("ix_indexed_contents_status", "indexed_contents", ["status"])

    op.create_table(
        "indexed_segments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("content_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("indexed_contents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sequence_index", sa.Integer(), nullable=False),
        sa.Column("start_ms", sa.BigInteger()),
        sa.Column("end_ms", sa.BigInteger()),
        sa.Column("source_text", sa.Text(), nullable=False),
        sa.Column("translation_text", sa.Text()),
        sa.Column("analysis_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.UniqueConstraint("content_id", "sequence_index", name="uq_indexed_segment_sequence"),
    )
    op.create_index("ix_indexed_segments_content_id", "indexed_segments", ["content_id"])
    op.create_index("ix_indexed_segments_sequence_index", "indexed_segments", ["sequence_index"])

    op.create_table(
        "indexed_units",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("segment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("indexed_segments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(32), nullable=False),
        sa.Column("canonical_form", sa.Text(), nullable=False),
        sa.Column("canonical_key", sa.String(512), nullable=False),
        sa.Column("surface_form", sa.Text(), nullable=False),
        sa.Column("language_specific_type", sa.String(128)),
        sa.Column("contextual_meaning", sa.Text()),
        sa.Column("token_indices_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    op.create_index("ix_indexed_units_segment_id", "indexed_units", ["segment_id"])
    op.create_index("ix_indexed_units_kind", "indexed_units", ["kind"])
    op.create_index("ix_indexed_units_canonical_key", "indexed_units", ["canonical_key"])


def downgrade():
    op.drop_table("indexed_units")
    op.drop_table("indexed_segments")
    op.drop_table("indexed_contents")
