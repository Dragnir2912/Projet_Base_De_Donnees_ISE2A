from datetime import datetime
import uuid
from ..extensions import db


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.UUID(as_uuid=True), nullable=False, default=uuid.uuid4)
    expediteur_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id"), nullable=False
    )
    destinataire_id = db.Column(
        db.Integer, db.ForeignKey("utilisateurs.id"), nullable=False
    )
    contenu = db.Column(db.Text, nullable=False)
    envoye_le = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    lu = db.Column(db.Boolean, nullable=False, default=False)
    lu_le = db.Column(db.DateTime, nullable=True)
    supprime_par_expediteur = db.Column(db.Boolean, nullable=False, default=False)
    supprime_par_destinataire = db.Column(db.Boolean, nullable=False, default=False)

    expediteur = db.relationship("Utilisateur", foreign_keys=[expediteur_id])
    destinataire = db.relationship("Utilisateur", foreign_keys=[destinataire_id])

    def __repr__(self) -> str:
        return f"<Message {self.id} conv={self.conversation_id}>"
