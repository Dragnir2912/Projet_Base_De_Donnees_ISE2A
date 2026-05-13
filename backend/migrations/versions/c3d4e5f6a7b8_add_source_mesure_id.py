"""add source_mesure_id to mesures for derived measurements (IMC from Poids)

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-12 24:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'mesures',
        sa.Column(
            'source_mesure_id',
            sa.Integer(),
            sa.ForeignKey('mesures.id', ondelete='CASCADE'),
            nullable=True,
        ),
    )
    op.create_index('idx_mesures_source', 'mesures', ['source_mesure_id'])


def downgrade():
    op.drop_index('idx_mesures_source', table_name='mesures')
    op.drop_column('mesures', 'source_mesure_id')
