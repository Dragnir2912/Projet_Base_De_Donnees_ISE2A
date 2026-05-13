from datetime import datetime
from ..extensions import db


class AnnotationMedecin(db.Model):
    __tablename__ = "annotations_medecin"

    id = db.Column(db.Integer, primary_key=True)
    medecin_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id"), nullable=False
    )
    mesure_id = db.Column(
        db.Integer, db.ForeignKey("mesures.id", ondelete="CASCADE"), nullable=False
    )
    commentaire = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    medecin = db.relationship("Utilisateur", foreign_keys=[medecin_id])
    mesure = db.relationship("Mesure", back_populates="annotations")

    __table_args__ = (db.UniqueConstraint("medecin_id", "mesure_id"),)

    def __repr__(self) -> str:
        return f"<AnnotationMedecin medecin={self.medecin_id} mesure={self.mesure_id}>"
