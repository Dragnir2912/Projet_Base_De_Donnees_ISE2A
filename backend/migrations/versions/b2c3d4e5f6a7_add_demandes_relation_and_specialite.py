"""add demandes_relation table and specialite column to utilisateurs

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-12 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Colonne specialite sur utilisateurs
    op.add_column(
        'utilisateurs',
        sa.Column('specialite', sa.String(100), nullable=True),
    )

    # Table demandes_relation
    op.create_table(
        'demandes_relation',
        sa.Column('id',         sa.Integer(),   nullable=False),
        sa.Column('patient_id', sa.Integer(),   nullable=False),
        sa.Column('medecin_id', sa.Integer(),   nullable=False),
        sa.Column('statut',     sa.String(20),  nullable=False, server_default='en_attente'),
        sa.Column('message',    sa.Text(),      nullable=True),
        sa.Column('created_at', sa.DateTime(),  nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(),  nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['patient_id'], ['utilisateurs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['medecin_id'], ['utilisateurs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('patient_id', 'medecin_id', name='uk_demande_patient_medecin'),
        sa.CheckConstraint("statut IN ('en_attente', 'acceptee', 'refusee')", name='ck_statut_demande'),
    )
    op.create_index('idx_demandes_medecin_statut', 'demandes_relation', ['medecin_id', 'statut'])
    op.create_index('idx_demandes_patient',        'demandes_relation', ['patient_id'])


def downgrade():
    op.drop_index('idx_demandes_patient',        table_name='demandes_relation')
    op.drop_index('idx_demandes_medecin_statut', table_name='demandes_relation')
    op.drop_table('demandes_relation')
    op.drop_column('utilisateurs', 'specialite')
