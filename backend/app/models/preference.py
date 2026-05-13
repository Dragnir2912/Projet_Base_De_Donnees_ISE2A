from datetime import datetime
from ..extensions import db


class PreferenceUtilisateur(db.Model):
    __tablename__ = "preferences_utilisateur"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False
    )
    cle = db.Column(db.String(100), nullable=False)
    valeur = db.Column(db.Text, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    utilisateur = db.relationship("Utilisateur", back_populates="preferences")

    __table_args__ = (db.UniqueConstraint("user_id", "cle"),)

    def __repr__(self) -> str:
        return f"<Preference {self.cle}={self.valeur} user={self.user_id}>"
