"""add sessions_ia table and supprime column to conversations_ia

Revision ID: a1b2c3d4e5f6
Revises: 271af67e5d33
Create Date: 2026-05-12 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '271af67e5d33'
branch_labels = None
depends_on = None


def upgrade():
    # Colonne supprime dans conversations_ia
    op.add_column(
        'conversations_ia',
        sa.Column('supprime', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )

    # Nouvelle table sessions_ia
    op.create_table(
        'sessions_ia',
        sa.Column('id',         sa.Integer(),     nullable=False),
        sa.Column('patient_id', sa.Integer(),     nullable=False),
        sa.Column('session_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('titre',      sa.String(100),   nullable=True),
        sa.Column('created_at', sa.DateTime(),    nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(),    nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['patient_id'], ['utilisateurs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id'),
    )
    op.create_index('idx_sessions_ia_patient', 'sessions_ia', ['patient_id', 'updated_at'])


def downgrade():
    op.drop_index('idx_sessions_ia_patient', table_name='sessions_ia')
    op.drop_table('sessions_ia')
    op.drop_column('conversations_ia', 'supprime')
