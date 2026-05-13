from datetime import datetime
from ..extensions import db


class Utilisateur(db.Model):
    __tablename__ = "utilisateurs"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    mot_de_passe_hash = db.Column(db.String(256), nullable=False)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="patient")
    date_naissance = db.Column(db.Date, nullable=True)
    taille_cm = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    derniere_connexion = db.Column(db.DateTime, nullable=True)
    actif = db.Column(db.Boolean, nullable=False, default=True)
    specialite = db.Column(db.String(100), nullable=True)

    # Relations
    mesures = db.relationship("Mesure", back_populates="patient", lazy="dynamic")
    alertes = db.relationship("Alerte", back_populates="patient", lazy="dynamic")
    preferences = db.relationship(
        "PreferenceUtilisateur", back_populates="utilisateur", lazy="dynamic"
    )
    conversations_ia = db.relationship(
        "ConversationIA", back_populates="patient", lazy="dynamic"
    )

    # Relations médecin-patient
    relations_medecin = db.relationship(
        "RelationMedecinPatient",
        foreign_keys="RelationMedecinPatient.medecin_id",
        back_populates="medecin",
        lazy="dynamic",
    )
    relations_patient = db.relationship(
        "RelationMedecinPatient",
        foreign_keys="RelationMedecinPatient.patient_id",
        back_populates="patient",
        lazy="dynamic",
    )

    def __repr__(self) -> str:
        return f"<Utilisateur {self.email} ({self.role})>"
