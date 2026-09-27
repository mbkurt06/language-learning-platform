"""initial platform schema"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("external_subject", sa.String(255), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "learning_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_language", sa.String(16), nullable=False),
        sa.Column("target_language", sa.String(16), nullable=False),
        sa.Column("level", sa.String(16)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "learning_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("learning_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("canonical_form", sa.Text(), nullable=False),
        sa.Column("canonical_key", sa.String(512), nullable=False),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("language_specific_type", sa.String(128)),
        sa.Column("status", sa.String(32), nullable=False, server_default="learning"),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("profile_id", "canonical_key", name="uq_learning_item_profile_key"),
    )
    op.create_table(
        "learning_item_translations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("learning_item_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("learning_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("language", sa.String(16), nullable=False),
        sa.Column("meaning", sa.Text(), nullable=False),
        sa.UniqueConstraint("learning_item_id", "language", name="uq_learning_translation_language"),
    )
    op.create_table(
        "content_sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("provider", sa.String(64), nullable=False),
        sa.Column("source_type", sa.String(64), nullable=False),
        sa.Column("external_id", sa.String(512), nullable=False),
        sa.Column("url", sa.Text()),
        sa.Column("title", sa.Text()),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.UniqueConstraint("provider", "external_id", name="uq_source_provider_external"),
    )
    op.create_table(
        "encounters",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("learning_item_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("learning_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("content_sources.id", ondelete="SET NULL")),
        sa.Column("surface_form", sa.Text(), nullable=False),
        sa.Column("sentence", sa.Text(), nullable=False),
        sa.Column("media_timestamp_ms", sa.BigInteger()),
        sa.Column("context_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("encountered_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade():
    op.drop_table("encounters")
    op.drop_table("content_sources")
    op.drop_table("learning_item_translations")
    op.drop_table("learning_items")
    op.drop_table("learning_profiles")
    op.drop_table("users")
