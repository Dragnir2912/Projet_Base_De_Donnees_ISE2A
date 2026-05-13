import uuid
from datetime import datetime
from sqlalchemy import or_, and_, func
from ..extensions import db
from ..models.message import Message
from ..models.utilisateur import Utilisateur
from ..models.relation import RelationMedecinPatient


def envoyer_message(expediteur_id: int, data: dict) -> Message:
    expediteur = Utilisateur.query.get(expediteur_id)
    destinataire = Utilisateur.query.get(data["destinataire_id"])
    if not destinataire:
        raise ValueError("Destinataire introuvable.")

    # Vérification de la relation médecin-patient
    _verifier_relation(expediteur, destinataire)

    conv_id = data.get("conversation_id") or _trouver_ou_creer_conversation(
        expediteur_id, data["destinataire_id"]
    )

    msg = Message(
        conversation_id=conv_id,
        expediteur_id=expediteur_id,
        destinataire_id=data["destinataire_id"],
        contenu=data["contenu"],
    )
    db.session.add(msg)
    db.session.commit()
    return msg


def _verifier_relation(exp: Utilisateur, dest: Utilisateur) -> None:
    paires = [
        ("patient", "medecin", exp.id, dest.id),
        ("medecin", "patient", dest.id, exp.id),
    ]
    for role_exp, role_dest, patient_id, medecin_id in paires:
        if exp.role == role_exp and dest.role == role_dest:
            existe = RelationMedecinPatient.query.filter_by(
                medecin_id=medecin_id, patient_id=patient_id, active=True
            ).first()
            if not existe:
                raise ValueError("Échange impossible : aucune relation médicale active.")


def _trouver_ou_creer_conversation(id1: int, id2: int):
    msg = (
        Message.query
        .filter(
            or_(
                and_(Message.expediteur_id == id1, Message.destinataire_id == id2),
                and_(Message.expediteur_id == id2, Message.destinataire_id == id1),
            )
        )
        .order_by(Message.envoye_le.desc())
        .first()
    )
    return msg.conversation_id if msg else uuid.uuid4()


def lister_conversations(user_id: int) -> list[dict]:
    sous_requete = (
        db.session.query(
            Message.conversation_id,
            func.max(Message.envoye_le).label("dernier"),
        )
        .filter(
            or_(Message.expediteur_id == user_id, Message.destinataire_id == user_id)
        )
        .group_by(Message.conversation_id)
        .subquery()
    )

    messages = (
        db.session.query(Message)
        .join(
            sous_requete,
            (Message.conversation_id == sous_requete.c.conversation_id)
            & (Message.envoye_le == sous_requete.c.dernier),
        )
        .all()
    )

    conversations = []
    for msg in messages:
        interlocuteur_id = (
            msg.destinataire_id if msg.expediteur_id == user_id else msg.expediteur_id
        )
        interlocuteur = Utilisateur.query.get(interlocuteur_id)
        non_lus = Message.query.filter_by(
            conversation_id=msg.conversation_id,
            destinataire_id=user_id,
            lu=False,
        ).count()
        conversations.append({
            "conversation_id": msg.conversation_id,
            "interlocuteur_id": interlocuteur_id,
            "interlocuteur_nom": f"{interlocuteur.prenom} {interlocuteur.nom}" if interlocuteur else "?",
            "interlocuteur_role": interlocuteur.role if interlocuteur else "?",
            "dernier_message": msg.contenu[:80],
            "dernier_message_le": msg.envoye_le,
            "non_lus": non_lus,
        })
    return sorted(conversations, key=lambda c: c["dernier_message_le"], reverse=True)


def lister_messages(conversation_id: str, user_id: int) -> list[Message]:
    messages = (
        Message.query
        .filter_by(conversation_id=conversation_id)
        .filter(
            or_(Message.expediteur_id == user_id, Message.destinataire_id == user_id)
        )
        .order_by(Message.envoye_le.asc())
        .all()
    )
    # Marquer comme lus
    for msg in messages:
        if msg.destinataire_id == user_id and not msg.lu:
            msg.lu = True
            msg.lu_le = datetime.utcnow()
    db.session.commit()
    return messages
