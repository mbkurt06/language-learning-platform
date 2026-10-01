"""add separate persistent local sentence analysis store"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005_local_analysis_store"
down_revision = "0004_ai_content_index"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "local_sentence_analyses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("provider", sa.String(64), nullable=False),
        sa.Column("external_id", sa.String(512), nullable=False),
        sa.Column("source_language", sa.String(16), nullable=False),
        sa.Column("target_language", sa.String(16), nullable=False),
        sa.Column("text_hash", sa.String(64), nullable=False),
        sa.Column("source_text", sa.Text(), nullable=False),
        sa.Column("source_kind", sa.String(64), nullable=False, server_default="german-engine"),
        sa.Column("analysis_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint(
            "provider",
            "external_id",
            "source_language",
            "target_language",
            "text_hash",
            name="uq_local_sentence_analysis_identity",
        ),
    )
    op.create_index("ix_local_sentence_analyses_provider", "local_sentence_analyses", ["provider"])
    op.create_index("ix_local_sentence_analyses_external_id", "local_sentence_analyses", ["external_id"])
    op.create_index("ix_local_sentence_analyses_source_language", "local_sentence_analyses", ["source_language"])
    op.create_index("ix_local_sentence_analyses_target_language", "local_sentence_analyses", ["target_language"])
    op.create_index("ix_local_sentence_analyses_text_hash", "local_sentence_analyses", ["text_hash"])
    op.create_index("ix_local_sentence_analyses_source_kind", "local_sentence_analyses", ["source_kind"])


def downgrade():
    op.drop_table("local_sentence_analyses")
