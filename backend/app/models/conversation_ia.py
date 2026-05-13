from datetime import datetime
import uuid
from ..extensions import db


class ConversationIA(db.Model):
    __tablename__ = "conversations_ia"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False
    )
    session_id = db.Column(db.UUID(as_uuid=True), nullable=False, default=uuid.uuid4)
    ordre_dans_session = db.Column(db.Integer, nullable=False)
    role = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    date_message = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    contexte_inclus = db.Column(db.Text, nullable=True)
    model_utilise = db.Column(db.String(50), nullable=True)
    tokens_estimes = db.Column(db.Integer, nullable=True)
    anonymise = db.Column(db.Boolean, nullable=False, default=False)
    supprime = db.Column(db.Boolean, nullable=False, default=False)

    patient = db.relationship("Utilisateur", back_populates="conversations_ia")

    __table_args__ = (db.UniqueConstraint("session_id", "ordre_dans_session"),)

    def __repr__(self) -> str:
        return f"<ConversationIA session={self.session_id} ordre={self.ordre_dans_session}>"
