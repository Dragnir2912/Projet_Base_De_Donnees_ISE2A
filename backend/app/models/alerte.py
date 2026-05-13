from datetime import datetime
from ..extensions import db


class Alerte(db.Model):
    __tablename__ = "alertes"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False
    )
    mesure_id = db.Column(
        db.Integer, db.ForeignKey("mesures.id", ondelete="SET NULL"), nullable=True
    )
    type_alerte = db.Column(db.String(30), nullable=False)
    niveau = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    vue = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    patient = db.relationship("Utilisateur", back_populates="alertes")
    mesure = db.relationship("Mesure", back_populates="alertes")

    def __repr__(self) -> str:
        return f"<Alerte {self.niveau} patient={self.patient_id}>"
