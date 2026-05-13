from flask import Blueprint
from ..services import dashboard_service
from ..utils.decorators import patient_required
from ..utils.helpers import success_response, get_current_user

bp = Blueprint("dashboard", __name__)


@bp.get("/tendances")
@patient_required
def tendances():
    user = get_current_user()
    data = dashboard_service.get_tendances(user.id)
    return success_response(data)


@bp.get("/taches")
@patient_required
def taches():
    user = get_current_user()
    data = dashboard_service.get_taches(user.id)
    return success_response(data)
