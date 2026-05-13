import os
import uuid
from datetime import datetime
import google.generativeai as genai
from ..extensions import db
from ..models.conversation_ia import ConversationIA
from ..models.session_ia import SessionIA
from ..models.mesure import Mesure
from ..models.type_mesure import TypeMesure
from ..models.alerte import Alerte
from ..services.vitascore_service import calculer_vitascore

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

_SYSTEM_PROMPT = """Tu es Sotera, un assistant de santé bienveillant et professionnel.
Tu aides les patients à comprendre leurs données de santé.
Tu ne poses JAMAIS de diagnostic médical.
Tu encourages toujours à consulter un médecin pour toute décision médicale.
Tu t'exprimes en français, avec clarté et empathie.

Données de santé du patient :
{context_mesures}"""


def _construire_contexte_correlations(patient_id: int) -> str:
    """Construit la section corrélations pour le contexte Gemini."""
    try:
        from .correlations_service import detecter_correlations
        import json
        corrs = detecter_correlations(patient_id)
        if not corrs:
            return ""
        lignes = ["\nCorrélations détectées chez ce patient (mentionner naturellement si pertinent) :"]
        for c in corrs[:3]:  # max 3 pour ne pas surcharger le contexte
            lignes.append(
                f"- {c['mesure_a']} ↔ {c['mesure_b']} : {c['interpretation']} "
                f"(r={c['coefficient']}, force {c['force']})"
            )
        return "\n".join(lignes)
    except Exception:
        return ""


def _construire_contexte(patient_id: int) -> str:
    vitascore = calculer_vitascore(patient_id)
    lignes = [f"VitaScore : {vitascore['score']}/100\n"]

    alertes_non_vues = Alerte.query.filter_by(
        patient_id=patient_id, vue=False
    ).count()
    if alertes_non_vues:
        lignes.append(f"Alertes non vues : {alertes_non_vues}\n")

    types = TypeMesure.query.order_by(TypeMesure.ordre_affichage).all()
    for t in types:
        mesures = (
            Mesure.query
            .filter_by(patient_id=patient_id, type_mesure_id=t.id)
            .order_by(Mesure.date_mesure.desc())
            .limit(5)
            .all()
        )
        if mesures:
            vals = ", ".join(f"{m.valeur} {t.unite} ({m.date_mesure.strftime('%d/%m')})" for m in mesures)
            lignes.append(f"{t.nom} : {vals}")

    return "\n".join(lignes)


def _generer_titre(premier_message: str) -> str:
    """Génère un titre court (≤5 mots) via Gemini à partir du premier message."""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"En 5 mots maximum, résume ce sujet de santé (réponds uniquement le titre, sans ponctuation) : {premier_message}"
        response = model.generate_content(prompt)
        titre = response.text.strip().rstrip(".")
        return titre[:100] if titre else "Conversation santé"
    except Exception:
        return "Conversation santé"


def _get_or_create_session(patient_id: int, session_id: str) -> SessionIA:
    """Récupère ou crée la ligne SessionIA pour ce session_id."""
    session = SessionIA.query.filter_by(session_id=session_id).first()
    if not session:
        session = SessionIA(patient_id=patient_id, session_id=session_id)
        db.session.add(session)
    return session


def chat_stream(patient_id: int, message_utilisateur: str, session_id: str = None):
    """
    Générateur SSE : yield ('chunk', texte) pendant le streaming,
    puis ('done', {session_id, titre}) après sauvegarde en BDD.
    """
    is_new = not session_id
    if not session_id:
        session_id = str(uuid.uuid4())

    contexte = _construire_contexte(patient_id)
    correlations_ctx = _construire_contexte_correlations(patient_id)
    system = _SYSTEM_PROMPT.format(context_mesures=contexte + correlations_ctx)

    historique_db = (
        ConversationIA.query
        .filter_by(patient_id=patient_id, session_id=session_id, supprime=False)
        .order_by(ConversationIA.ordre_dans_session.asc())
        .all()
    )
    history = [{"role": h.role, "parts": [h.message]} for h in historique_db]

    model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system)
    gemini_chat = model.start_chat(history=history)

    response = gemini_chat.send_message(message_utilisateur, stream=True)

    full_text = ""
    for chunk in response:
        if chunk.text:
            full_text += chunk.text
            yield ("chunk", chunk.text)

    # Persister après streaming complet
    ordre = len(historique_db)
    for role, contenu in [("user", message_utilisateur), ("assistant", full_text)]:
        conv = ConversationIA(
            patient_id=patient_id,
            session_id=session_id,
            ordre_dans_session=ordre,
            role=role,
            message=contenu,
            contexte_inclus=contexte if role == "user" else None,
            model_utilise="gemini-2.5-flash",
        )
        db.session.add(conv)
        ordre += 1

    session_obj = _get_or_create_session(patient_id, session_id)
    if is_new or not session_obj.titre:
        session_obj.titre = _generer_titre(message_utilisateur)

    db.session.commit()
    yield ("done", {"session_id": session_id, "titre": session_obj.titre})


def chat(patient_id: int, message_utilisateur: str, session_id: str = None) -> dict:
    is_new_session = not session_id
    if not session_id:
        session_id = str(uuid.uuid4())

    contexte = _construire_contexte(patient_id)
    correlations_ctx = _construire_contexte_correlations(patient_id)
    system = _SYSTEM_PROMPT.format(context_mesures=contexte + correlations_ctx)

    # Historique de la session (hors messages supprimés)
    historique_db = (
        ConversationIA.query
        .filter_by(patient_id=patient_id, session_id=session_id, supprime=False)
        .order_by(ConversationIA.ordre_dans_session.asc())
        .all()
    )

    history = []
    for h in historique_db:
        history.append({"role": h.role, "parts": [h.message]})

    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=system,
    )
    chat_session = model.start_chat(history=history)

    response = chat_session.send_message(message_utilisateur)
    reponse_texte = response.text

    ordre = len(historique_db)

    # Persister la paire user/assistant
    for role, contenu in [("user", message_utilisateur), ("assistant", reponse_texte)]:
        conv = ConversationIA(
            patient_id=patient_id,
            session_id=session_id,
            ordre_dans_session=ordre,
            role=role,
            message=contenu,
            contexte_inclus=contexte if role == "user" else None,
            model_utilise="gemini-2.5-flash",
        )
        db.session.add(conv)
        ordre += 1

    # Créer/récupérer la session et générer le titre au premier message
    session_obj = _get_or_create_session(patient_id, session_id)
    if is_new_session or not session_obj.titre:
        session_obj.titre = _generer_titre(message_utilisateur)

    db.session.commit()

    return {
        "session_id": session_id,
        "reponse": reponse_texte,
        "titre": session_obj.titre,
    }


def lister_sessions(patient_id: int) -> list[dict]:
    from sqlalchemy import func

    # Sessions non supprimées (au moins un message non supprimé)
    rows = (
        db.session.query(
            ConversationIA.session_id,
            func.min(ConversationIA.date_message).label("debut"),
            func.max(ConversationIA.date_message).label("fin"),
            func.count(ConversationIA.id).label("nb_messages"),
        )
        .filter_by(patient_id=patient_id, supprime=False)
        .group_by(ConversationIA.session_id)
        .order_by(func.max(ConversationIA.date_message).desc())
        .all()
    )

    # Récupérer les titres depuis sessions_ia
    session_ids = [str(r.session_id) for r in rows]
    sessions_meta = {
        str(s.session_id): s.titre
        for s in SessionIA.query.filter(
            SessionIA.session_id.in_([r.session_id for r in rows])
        ).all()
    }

    return [
        {
            "session_id": str(r.session_id),
            "titre": sessions_meta.get(str(r.session_id)) or "Conversation",
            "debut": r.debut,
            "fin": r.fin,
            "nb_messages": r.nb_messages,
        }
        for r in rows
    ]


def mettre_a_jour_titre(patient_id: int, session_id: str, nouveau_titre: str) -> bool:
    """Met à jour le titre d'une session. Retourne False si la session n'appartient pas au patient."""
    session = SessionIA.query.filter_by(session_id=session_id, patient_id=patient_id).first()
    if not session:
        return False
    session.titre = nouveau_titre[:100]
    session.updated_at = datetime.utcnow()
    db.session.commit()
    return True


def supprimer_session(patient_id: int, session_id: str) -> bool:
    """Soft delete de tous les messages d'une session. Retourne False si non autorisé."""
    messages = ConversationIA.query.filter_by(
        patient_id=patient_id, session_id=session_id
    ).all()
    if not messages:
        return False
    for msg in messages:
        msg.supprime = True
    db.session.commit()
    return True
