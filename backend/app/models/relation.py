from datetime import date
from ..extensions import db


class RelationMedecinPatient(db.Model):
    __tablename__ = "relations_medecin_patient"

    id = db.Column(db.Integer, primary_key=True)
    medecin_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False
    )
    patient_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False
    )
    date_debut = db.Column(db.Date, nullable=False, default=date.today)
    date_fin = db.Column(db.Date, nullable=True)
    active = db.Column(db.Boolean, nullable=False, default=True)

    medecin = db.relationship(
        "Utilisateur", foreign_keys=[medecin_id], back_populates="relations_medecin"
    )
    patient = db.relationship(
        "Utilisateur", foreign_keys=[patient_id], back_populates="relations_patient"
    )

    __table_args__ = (db.UniqueConstraint("medecin_id", "patient_id"),)

    def __repr__(self) -> str:
        return f"<Relation medecin={self.medecin_id} patient={self.patient_id}>"
