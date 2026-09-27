"""add reusable example corpus"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_example_corpus"
down_revision = "0002_encounter_end_timestamp"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "example_sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("provider", sa.String(64), nullable=False),
        sa.Column("external_id", sa.String(512), nullable=False),
        sa.Column("title", sa.Text()),
        sa.Column("url", sa.Text()),
        sa.Column("language", sa.String(16), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.UniqueConstraint("provider", "external_id", name="uq_example_source_provider_external"),
    )
    op.create_index("ix_example_sources_provider", "example_sources", ["provider"])
    op.create_index("ix_example_sources_language", "example_sources", ["language"])

    op.create_table(
        "example_sentences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("example_sources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sentence", sa.Text(), nullable=False),
        sa.Column("start_ms", sa.BigInteger(), nullable=False),
        sa.Column("end_ms", sa.BigInteger(), nullable=False),
        sa.Column("quality", sa.String(32), nullable=False, server_default="transcript"),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.UniqueConstraint("source_id", "start_ms", "end_ms", name="uq_example_sentence_source_range"),
    )
    op.create_index("ix_example_sentences_source_id", "example_sentences", ["source_id"])

    op.create_table(
        "example_lexeme_matches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("example_sentence_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("example_sentences.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lemma", sa.String(255), nullable=False),
        sa.Column("surface_form", sa.Text(), nullable=False),
        sa.UniqueConstraint("example_sentence_id", "lemma", name="uq_example_lexeme_sentence_lemma"),
    )
    op.create_index("ix_example_lexeme_matches_example_sentence_id", "example_lexeme_matches", ["example_sentence_id"])
    op.create_index("ix_example_lexeme_matches_lemma", "example_lexeme_matches", ["lemma"])


def downgrade():
    op.drop_table("example_lexeme_matches")
    op.drop_table("example_sentences")
    op.drop_table("example_sources")
