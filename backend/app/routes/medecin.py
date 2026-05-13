from flask import Blueprint, request, send_file, make_response
from marshmallow import ValidationError
from ..schemas import ConsultationSchema, ConsultationCreateSchema, AnnotationSchema, AnnotationCreateSchema
from ..services import medecin_service
from ..utils.decorators import medecin_required
from ..utils.helpers import success_response, error_response, get_current_user

bp = Blueprint("medecin", __name__)
_consult_schema = ConsultationSchema()
_annot_schema = AnnotationSchema()


@bp.get("/patients")
@medecin_required
def liste_patients():
    user = get_current_user()
    patients = medecin_service.lister_patients(user.id)
    return success_response(patients)


@bp.get("/alertes-critiques")
@medecin_required
def alertes_critiques():
    user = get_current_user()
    niveau       = request.args.get("niveau")           # danger | attention | None
    inclure_vues = request.args.get("inclure_vues", "false").lower() == "true"
    alertes = medecin_service.get_alertes_critiques(user.id, niveau, inclure_vues)
    return success_response(alertes)


@bp.patch("/alertes/<int:alerte_id>/vue")
@medecin_required
def marquer_vue_alerte(alerte_id: int):
    user = get_current_user()
    ok = medecin_service.marquer_vue_alerte(user.id, alerte_id)
    if not ok:
        return error_response("Alerte introuvable ou accès refusé.", "NOT_FOUND", 404)
    return success_response({"id": alerte_id, "vue": True})


@bp.get("/patients/<int:patient_id>/mesures")
@medecin_required
def mesures_patient(patient_id: int):
    user = get_current_user()
    try:
        data = medecin_service.get_mesures_patient(user.id, patient_id)
    except PermissionError as e:
        return error_response(str(e), "ACCESS_ERROR", 403)
    return success_response(data)


@bp.get("/patients/<int:patient_id>/historique/<int:type_id>")
@medecin_required
def historique_patient(patient_id: int, type_id: int):
    user = get_current_user()
    try:
        data = medecin_service.get_historique_patient(user.id, patient_id, type_id)
    except PermissionError as e:
        return error_response(str(e), "ACCESS_ERROR", 403)
    return success_response(data)


@bp.get("/patients/<int:patient_id>/resume")
@medecin_required
def resume_patient(patient_id: int):
    user = get_current_user()
    try:
        resume = medecin_service.resume_patient(user.id, patient_id)
    except (ValueError, PermissionError) as e:
        return error_response(str(e), "ACCESS_ERROR", 403)
    return success_response(resume)


@bp.post("/patients/<int:patient_id>")
@medecin_required
def ajouter_patient(patient_id: int):
    user = get_current_user()
    try:
        medecin_service.ajouter_patient(user.id, patient_id)
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)
    return success_response({"message": "Patient ajouté."})


@bp.get("/patients/<int:patient_id>/consultations")
@medecin_required
def lister_consultations_patient(patient_id: int):
    user = get_current_user()
    try:
        data = medecin_service.lister_consultations_patient(user.id, patient_id)
    except PermissionError as e:
        return error_response(str(e), "ACCESS_ERROR", 403)
    return success_response(data)


@bp.post("/consultations")
@medecin_required
def creer_consultation():
    user = get_current_user()
    try:
        data = ConsultationCreateSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error_response(str(e.messages), "VALIDATION_ERROR")

    try:
        c = medecin_service.creer_consultation(user.id, data)
    except (ValueError, PermissionError) as e:
        return error_response(str(e), "ERROR", 403)

    d = _consult_schema.dump(c)
    d["medecin_nom"] = f"{c.medecin.prenom} {c.medecin.nom}"
    return success_response(d, status=201)


@bp.get("/patients/<int:patient_id>/annotations")
@medecin_required
def lister_annotations_patient(patient_id: int):
    user = get_current_user()
    try:
        data = medecin_service.lister_annotations_patient(user.id, patient_id)
    except PermissionError as e:
        return error_response(str(e), "ACCESS_ERROR", 403)
    return success_response(data)


@bp.patch("/consultations/<int:consultation_id>")
@medecin_required
def modifier_consultation(consultation_id: int):
    user = get_current_user()
    body = request.get_json() or {}
    if "date_consultation" in body and body["date_consultation"]:
        from datetime import datetime
        try:
            body["date_consultation"] = datetime.fromisoformat(
                body["date_consultation"].replace("Z", "")
            )
        except ValueError:
            return error_response("Format de date invalide.", "INVALID_DATE")
    try:
        c = medecin_service.modifier_consultation(user.id, consultation_id, body)
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)
    d = _consult_schema.dump(c)
    d["medecin_nom"] = f"{c.medecin.prenom} {c.medecin.nom}"
    return success_response(d)


@bp.delete("/consultations/<int:consultation_id>")
@medecin_required
def supprimer_consultation(consultation_id: int):
    user = get_current_user()
    try:
        medecin_service.supprimer_consultation(user.id, consultation_id)
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)
    return success_response({"id": consultation_id, "supprime": True})


@bp.get("/patients/<int:patient_id>/rapport-pdf")
@medecin_required
def rapport_pdf(patient_id: int):
    """Génère et retourne le rapport PDF d'un patient."""
    import io
    import traceback
    from ..services import rapport_service
    from ..models.alerte import Alerte
    from flask import current_app

    user = get_current_user()

    try:
        resume   = medecin_service.resume_patient(user.id, patient_id)
        mesures  = medecin_service.get_mesures_patient(user.id, patient_id)
        consults = medecin_service.lister_consultations_patient(user.id, patient_id)
        annots   = medecin_service.lister_annotations_patient(user.id, patient_id)

        alertes_rows = (
            Alerte.query
            .filter_by(patient_id=patient_id)
            .order_by(Alerte.created_at.desc())
            .limit(10).all()
        )
        alertes = [
            {"message": a.message, "niveau": a.niveau,
             "created_at": a.created_at, "vue": a.vue}
            for a in alertes_rows
        ]

        patient_data = {
            "patient":           resume["patient"],
            "vitascore":         resume["vitascore"],
            "dernieres_mesures": mesures,
            "alertes":           alertes,
            "consultations":     consults,
            "annotations":       annots,
        }

        pdf_bytes = rapport_service.generer_rapport(user, patient_data)

    except PermissionError as e:
        return error_response(str(e), "ACCESS_ERROR", 403)
    except Exception as e:
        # Log l'erreur complète côté serveur pour debug
        current_app.logger.error("Erreur génération PDF:\n" + traceback.format_exc())
        return error_response(str(e), "PDF_ERROR", 500)

    nom      = f"{resume['patient'].get('prenom', '')}_{resume['patient'].get('nom', '')}"
    filename = f"rapport_sotera_{nom}.pdf"

    # make_response avec les bytes bruts — évite les conflits CORS de send_file
    response = make_response(pdf_bytes)
    response.headers["Content-Type"]        = "application/pdf"
    response.headers["Content-Length"]      = str(len(pdf_bytes))
    response.headers["Content-Disposition"] = f"inline; filename=\"{filename}\""
    return response


@bp.post("/annotations")
@medecin_required
def creer_annotation():
    user = get_current_user()
    try:
        data = AnnotationCreateSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error_response(str(e.messages), "VALIDATION_ERROR")

    try:
        ann = medecin_service.creer_annotation(user.id, data)
    except (ValueError, PermissionError) as e:
        return error_response(str(e), "ERROR", 403)

    d = _annot_schema.dump(ann)
    d["medecin_nom"] = f"{ann.medecin.prenom} {ann.medecin.nom}"
    return success_response(d, status=201)


@bp.patch("/annotations/<int:annotation_id>")
@medecin_required
def modifier_annotation(annotation_id: int):
    user = get_current_user()
    body = request.get_json() or {}
    commentaire = (body.get("commentaire") or "").strip()
    if not commentaire:
        return error_response("Le commentaire ne peut pas être vide.", "EMPTY")
    try:
        ann = medecin_service.modifier_annotation(user.id, annotation_id, commentaire)
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)
    d = _annot_schema.dump(ann)
    return success_response(d)


@bp.delete("/annotations/<int:annotation_id>")
@medecin_required
def supprimer_annotation(annotation_id: int):
    user = get_current_user()
    try:
        medecin_service.supprimer_annotation(user.id, annotation_id)
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)
    return success_response({"id": annotation_id, "supprime": True})
