"""add encounter end timestamp"""

from alembic import op
import sqlalchemy as sa

revision = "0002_encounter_end_timestamp"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("encounters", sa.Column("media_end_timestamp_ms", sa.BigInteger(), nullable=True))


def downgrade():
    op.drop_column("encounters", "media_end_timestamp_ms")
