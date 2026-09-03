"""Fix asset_categories id sequence

Revision ID: fix_asset_categories_id_seq
Revises: e32df0302c47
Create Date: 2026-08-30 20:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "fix_asset_categories_id_seq"
down_revision: Union[str, Sequence[str], None] = "e32df0302c47"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE SEQUENCE asset_categories_id_seq")
    op.execute(
        "ALTER TABLE asset_categories ALTER COLUMN id SET DEFAULT nextval('asset_categories_id_seq')"
    )
    op.execute("ALTER SEQUENCE asset_categories_id_seq OWNED BY asset_categories.id")
    op.execute(
        "SELECT setval('asset_categories_id_seq', COALESCE((SELECT MAX(id) FROM asset_categories), 0) + 1)"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE asset_categories ALTER COLUMN id DROP DEFAULT")
    op.execute("DROP SEQUENCE asset_categories_id_seq")
