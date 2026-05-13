import json
from flask import Blueprint, request, Response, stream_with_context
from ..services import gemini_service
from ..schemas import ConversationIASchema
from ..models.conversation_ia import ConversationIA
from ..utils.decorators import patient_required
from ..utils.helpers import success_response, error_response, get_current_user

bp = Blueprint("ia", __name__)
_schemas = ConversationIASchema(many=True)


@bp.post("/chat")
@patient_required
def chat():
    user = get_current_user()
    body = request.get_json() or {}
    message = body.get("message", "").strip()
    if not message:
        return error_response("Le message ne peut pas être vide.", "EMPTY_MESSAGE")

    session_id = body.get("session_id")
    uid = user.id  # capturer avant la réponse streaming (contexte request)

    def generate():
        try:
            for event_type, data in gemini_service.chat_stream(uid, message, session_id):
                if event_type == "chunk":
                    yield f"data: {json.dumps({'text': data}, ensure_ascii=False)}\n\n"
                elif event_type == "done":
                    yield f"data: {json.dumps({'done': True, **data}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@bp.get("/sessions")
@patient_required
def sessions():
    user = get_current_user()
    data = gemini_service.lister_sessions(user.id)
    return success_response(data)


@bp.get("/sessions/<session_id>")
@patient_required
def get_session(session_id: str):
    user = get_current_user()
    messages = (
        ConversationIA.query
        .filter_by(patient_id=user.id, session_id=session_id, supprime=False)
        .order_by(ConversationIA.ordre_dans_session.asc())
        .all()
    )
    return success_response(_schemas.dump(messages))


@bp.patch("/sessions/<session_id>/titre")
@patient_required
def update_titre(session_id: str):
    user = get_current_user()
    body = request.get_json() or {}
    titre = (body.get("titre") or "").strip()
    if not titre:
        return error_response("Le titre ne peut pas être vide.", "EMPTY_TITRE")
    if len(titre) > 100:
        return error_response("Le titre ne doit pas dépasser 100 caractères.", "TITRE_TOO_LONG")

    ok = gemini_service.mettre_a_jour_titre(user.id, session_id, titre)
    if not ok:
        return error_response("Session introuvable.", "SESSION_NOT_FOUND", 404)
    return success_response({"session_id": session_id, "titre": titre})


@bp.delete("/sessions/<session_id>")
@patient_required
def delete_session(session_id: str):
    user = get_current_user()
    ok = gemini_service.supprimer_session(user.id, session_id)
    if not ok:
        return error_response("Session introuvable.", "SESSION_NOT_FOUND", 404)
    return success_response({"session_id": session_id, "supprime": True})
