from flask import Blueprint, request
from marshmallow import ValidationError
from ..schemas import MessageSchema, MessageCreateSchema, ConversationSchema
from ..services import message_service
from ..utils.decorators import login_required
from ..utils.helpers import success_response, error_response, get_current_user

bp = Blueprint("messages", __name__)
_msg_schema = MessageSchema()
_msg_schemas = MessageSchema(many=True)
_conv_schemas = ConversationSchema(many=True)


def _enrichir_msg(msg) -> dict:
    d = _msg_schema.dump(msg)
    d["expediteur_nom"] = f"{msg.expediteur.prenom} {msg.expediteur.nom}" if msg.expediteur else "?"
    d["destinataire_nom"] = f"{msg.destinataire.prenom} {msg.destinataire.nom}" if msg.destinataire else "?"
    return d


@bp.get("/conversations")
@login_required
def liste_conversations():
    user = get_current_user()
    convs = message_service.lister_conversations(user.id)
    return success_response(_conv_schemas.dump(convs))


@bp.get("/<conversation_id>")
@login_required
def get_messages(conversation_id: str):
    user = get_current_user()
    messages = message_service.lister_messages(conversation_id, user.id)
    return success_response([_enrichir_msg(m) for m in messages])


@bp.post("/")
@login_required
def envoyer():
    user = get_current_user()
    try:
        data = MessageCreateSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error_response(str(e.messages), "VALIDATION_ERROR")

    try:
        msg = message_service.envoyer_message(user.id, data)
    except (ValueError, PermissionError) as e:
        return error_response(str(e), "MESSAGE_ERROR")

    return success_response(_enrichir_msg(msg), status=201)
