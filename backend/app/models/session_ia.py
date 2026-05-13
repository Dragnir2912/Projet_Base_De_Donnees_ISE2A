import uuid
from datetime import datetime
from ..extensions import db


class SessionIA(db.Model):
    __tablename__ = "sessions_ia"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False
    )
    session_id = db.Column(db.UUID(as_uuid=True), nullable=False, unique=True, default=uuid.uuid4)
    titre = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = db.relationship("Utilisateur", backref=db.backref("sessions_ia", lazy="dynamic"))

    def __repr__(self) -> str:
        return f"<SessionIA session={self.session_id} titre={self.titre!r}>"
