from datetime import datetime
from ..extensions import db


class DemandeRelation(db.Model):
    __tablename__ = "demandes_relation"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False
    )
    medecin_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False
    )
    # 'patient' | 'medecin'
    initiateur = db.Column(db.String(10), nullable=False, server_default="patient")
    # 'en_attente' | 'acceptee' | 'refusee'
    statut = db.Column(db.String(20), nullable=False, default="en_attente")
    message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = db.relationship("Utilisateur", foreign_keys=[patient_id], backref=db.backref("demandes_envoyees", lazy="dynamic"))
    medecin = db.relationship("Utilisateur", foreign_keys=[medecin_id], backref=db.backref("demandes_recues", lazy="dynamic"))

    __table_args__ = (
        db.CheckConstraint("statut IN ('en_attente', 'acceptee', 'refusee')", name="ck_statut_demande"),
        db.UniqueConstraint("patient_id", "medecin_id", name="uk_demande_patient_medecin"),
    )

    def __repr__(self) -> str:
        return f"<DemandeRelation patient={self.patient_id} medecin={self.medecin_id} statut={self.statut}>"
