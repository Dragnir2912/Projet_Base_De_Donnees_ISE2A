from datetime import datetime
from ..extensions import db


class Consultation(db.Model):
    __tablename__ = "consultations"

    id = db.Column(db.Integer, primary_key=True)
    medecin_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id"), nullable=False
    )
    patient_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id"), nullable=False
    )
    date_consultation = db.Column(db.DateTime, nullable=False)
    diagnostic = db.Column(db.Text, nullable=True)
    recommandations = db.Column(db.Text, nullable=True)
    statut = db.Column(db.String(30), nullable=False, default="redige")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    medecin = db.relationship("Utilisateur", foreign_keys=[medecin_id])
    patient = db.relationship("Utilisateur", foreign_keys=[patient_id])

    def __repr__(self) -> str:
        return f"<Consultation medecin={self.medecin_id} patient={self.patient_id}>"
