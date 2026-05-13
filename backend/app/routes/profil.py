from flask import Blueprint, request
from marshmallow import ValidationError
from ..schemas import UtilisateurSchema, PreferenceSchema, PreferencesUpdateSchema
from ..schemas.utilisateur_schema import ProfilUpdateSchema
from ..services import profil_service
from ..utils.decorators import login_required
from ..utils.helpers import success_response, error_response, get_current_user

bp = Blueprint("profil", __name__)
_user_schema = UtilisateurSchema()
_pref_schemas = PreferenceSchema(many=True)


@bp.get("/")
@login_required
def get_profil():
    user = get_current_user()
    return success_response(_user_schema.dump(user))


@bp.patch("/")
@login_required
def update_profil():
    user = get_current_user()
    try:
        data = ProfilUpdateSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error_response(str(e.messages), "VALIDATION_ERROR")
    updated = profil_service.update_profil(user.id, data)
    return success_response(_user_schema.dump(updated))


@bp.get("/preferences")
@login_required
def get_preferences():
    user = get_current_user()
    prefs = profil_service.get_preferences(user.id)
    result = {p.cle: p.valeur for p in prefs}
    return success_response(result)


@bp.patch("/preferences")
@login_required
def update_preferences():
    user = get_current_user()
    try:
        data = PreferencesUpdateSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error_response(str(e.messages), "VALIDATION_ERROR")
    profil_service.update_preferences(user.id, data["preferences"])
    prefs = profil_service.get_preferences(user.id)
    return success_response({p.cle: p.valeur for p in prefs})


@bp.get("/vitascore")
@login_required
def vitascore():
    user = get_current_user()
    from ..services.vitascore_service import calculer_vitascore
    return success_response(calculer_vitascore(user.id))


@bp.get("/consultations")
@login_required
def mes_consultations():
    """Consultations reçues par le patient (rédigées ou validées)."""
    user = get_current_user()
    from ..models.consultation import Consultation
    consultations = (
        Consultation.query
        .filter(
            Consultation.patient_id == user.id,
            Consultation.statut.in_(["redige", "valide"]),
        )
        .order_by(Consultation.date_consultation.desc())
        .all()
    )
    data = [
        {
            "id":                c.id,
            "date_consultation": c.date_consultation,
            "diagnostic":        c.diagnostic,
            "recommandations":   c.recommandations,
            "statut":            c.statut,
            "medecin":           f"Dr {c.medecin.prenom} {c.medecin.nom}",
            "created_at":        c.created_at,
        }
        for c in consultations
    ]
    return success_response(data)
