from flask import Blueprint, request
from ..schemas import AlerteSchema
from ..services import alerte_service
from ..utils.decorators import patient_required
from ..utils.helpers import success_response, error_response, get_current_user

bp = Blueprint("alertes", __name__)
_schemas = AlerteSchema(many=True)
_schema = AlerteSchema()


@bp.get("/")
@patient_required
def liste_alertes():
    user = get_current_user()
    non_vues = request.args.get("non_vues", "false").lower() == "true"
    alertes = alerte_service.lister_alertes(user.id, non_vues)
    return success_response(_schemas.dump(alertes))


@bp.patch("/<int:alerte_id>/vue")
@patient_required
def marquer_vue(alerte_id: int):
    user = get_current_user()
    try:
        alerte = alerte_service.marquer_vue(alerte_id, user.id)
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)
    return success_response(_schema.dump(alerte))


@bp.patch("/tout-voir")
@patient_required
def tout_voir():
    user = get_current_user()
    count = alerte_service.marquer_toutes_vues(user.id)
    return success_response({"marquees": count})


@bp.get("/compteur")
@patient_required
def compteur():
    user = get_current_user()
    return success_response({"non_vues": alerte_service.compter_non_vues(user.id)})
