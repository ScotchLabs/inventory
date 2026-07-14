"""Add asset metadata columns and category relationship tables

Revision ID: a1b2c3d4e5f6
Revises: 2b5d8f50097e
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '2b5d8f50097e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('assets', sa.Column('last_updated', sa.DateTime(), nullable=True))
    op.add_column('assets', sa.Column('last_updated_by', sa.Integer(), nullable=True))
    op.add_column('assets', sa.Column('notes', sa.Text(), nullable=True))

    op.create_table(
        'asset_categories',
        sa.Column('asset_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id']),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.PrimaryKeyConstraint('asset_id', 'category_id'),
    )

    op.create_table(
        'asset_sub_categories',
        sa.Column('asset_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id']),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.PrimaryKeyConstraint('asset_id', 'category_id'),
    )

    op.create_foreign_key(
        None,
        'assets',
        'users',
        ['last_updated_by'],
        ['id'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(None, 'assets', type_='foreignkey')
    op.drop_column('assets', 'notes')
    op.drop_column('assets', 'last_updated_by')
    op.drop_column('assets', 'last_updated')
    op.drop_table('asset_sub_categories')
    op.drop_table('asset_categories')
