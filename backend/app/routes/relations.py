from flask import Blueprint, request
from sqlalchemy.exc import SQLAlchemyError
from ..services import relations_service
from ..utils.decorators import patient_required, medecin_required, login_required
from ..utils.helpers import success_response, error_response, get_current_user

bp = Blueprint("relations", __name__)


# ─── PATIENT ──────────────────────────────────────────────────────

@bp.get("/mon-medecin")
@patient_required
def mon_medecin():
    user = get_current_user()
    medecin = relations_service.get_mon_medecin(user.id)
    return success_response(medecin)


@bp.get("/mes-demandes")
@patient_required
def mes_demandes():
    user = get_current_user()
    demandes = relations_service.get_demandes_patient(user.id)
    return success_response(demandes)


@bp.get("/medecins-disponibles")
@patient_required
def medecins_disponibles():
    search = request.args.get("search", "").strip()
    medecins = relations_service.chercher_medecins(search)
    return success_response(medecins)


@bp.post("/demande")
@patient_required
def envoyer_demande():
    user = get_current_user()
    body = request.get_json() or {}
    medecin_id = body.get("medecin_id")
    message = (body.get("message") or "").strip()

    if not medecin_id:
        return error_response("medecin_id requis.", "MISSING_FIELD")

    try:
        demande = relations_service.envoyer_demande(user.id, medecin_id, message)
    except ValueError as e:
        return error_response(str(e), "REQUEST_ERROR")

    return success_response({"id": demande.id, "statut": demande.statut}, status=201)


@bp.delete("/<int:relation_id>")
@patient_required
def terminer_suivi(relation_id: int):
    user = get_current_user()
    try:
        relations_service.terminer_suivi(user.id, relation_id)
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)
    return success_response({"message": "Suivi terminé."})


# ─── MÉDECIN ──────────────────────────────────────────────────────

@bp.get("/demandes")
@medecin_required
def liste_demandes():
    user = get_current_user()
    demandes = relations_service.get_demandes_medecin(user.id)
    return success_response(demandes)


@bp.patch("/demandes/<int:demande_id>")
@medecin_required
def repondre_demande(demande_id: int):
    user = get_current_user()
    body = request.get_json() or {}
    action = body.get("action")

    if action not in ("accepter", "refuser"):
        return error_response("action doit être 'accepter' ou 'refuser'.", "INVALID_ACTION")

    try:
        relations_service.repondre_demande(user.id, demande_id, accepter=(action == "accepter"))
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)

    return success_response({"demande_id": demande_id, "action": action})


@bp.post("/invitation")
@medecin_required
def inviter_patient():
    user = get_current_user()
    body = request.get_json() or {}
    patient_id = body.get("patient_id")
    if not patient_id:
        return error_response("patient_id requis.", "MISSING_FIELD")
    try:
        demande = relations_service.inviter_patient(user.id, patient_id)
    except ValueError as e:
        return error_response(str(e), "REQUEST_ERROR")
    except SQLAlchemyError as e:
        return error_response("Erreur base de données. La colonne 'initiateur' existe-t-elle ? Exécutez la migration.", "DB_ERROR", 500)
    return success_response({"id": demande.id}, status=201)


@bp.get("/mes-invitations")
@patient_required
def mes_invitations():
    user = get_current_user()
    invitations = relations_service.get_invitations_patient(user.id)
    return success_response(invitations)


@bp.patch("/invitations/<int:invitation_id>")
@patient_required
def repondre_invitation(invitation_id: int):
    user = get_current_user()
    body = request.get_json() or {}
    action = body.get("action")
    if action not in ("accepter", "refuser"):
        return error_response("action doit être 'accepter' ou 'refuser'.", "INVALID_ACTION")
    try:
        relations_service.repondre_invitation_medecin(user.id, invitation_id, accepter=(action == "accepter"))
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)
    return success_response({"invitation_id": invitation_id, "action": action})


@bp.get("/patients")
@medecin_required
def chercher_patients():
    user = get_current_user()
    search = request.args.get("search", "").strip()
    patients = relations_service.chercher_patients(user.id, search)
    return success_response(patients)
