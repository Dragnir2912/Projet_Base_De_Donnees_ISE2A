from datetime import datetime
from ..extensions import db


class Mesure(db.Model):
    __tablename__ = "mesures"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False
    )
    type_mesure_id = db.Column(
        db.Integer, db.ForeignKey("types_mesure.id"), nullable=False
    )
    valeur = db.Column(db.Float, nullable=False)
    date_mesure = db.Column(db.DateTime, nullable=False)
    contexte = db.Column(db.String(50), nullable=True)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    source = db.Column(db.String(20), default="saisie")
    # Pour les mesures dérivées (ex. IMC calculé à partir d'un Poids)
    source_mesure_id = db.Column(
        db.Integer, db.ForeignKey("mesures.id", ondelete="CASCADE"), nullable=True
    )

    patient = db.relationship("Utilisateur", back_populates="mesures")
    type_mesure = db.relationship("TypeMesure", back_populates="mesures")
    composantes = db.relationship(
        "MesureComposante", back_populates="mesure", lazy="dynamic", cascade="all, delete-orphan"
    )
    alertes = db.relationship("Alerte", back_populates="mesure", lazy="dynamic")
    annotations = db.relationship(
        "AnnotationMedecin", back_populates="mesure", lazy="dynamic"
    )

    def __repr__(self) -> str:
        return f"<Mesure {self.type_mesure_id}={self.valeur} patient={self.patient_id}>"
