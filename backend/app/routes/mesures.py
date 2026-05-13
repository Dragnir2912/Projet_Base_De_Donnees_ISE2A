from flask import Blueprint, request
from marshmallow import ValidationError
from ..schemas import MesureSchema, MesureCreateSchema, TypeMesureSchema
from ..services import mesure_service
from ..utils.decorators import patient_required
from ..utils.helpers import success_response, error_response, get_current_user

bp = Blueprint("mesures", __name__)
_schema = MesureSchema()
_schemas = MesureSchema(many=True)
_type_schema = TypeMesureSchema()
_type_schemas = TypeMesureSchema(many=True)


def _enrichir(mesure) -> dict:
    from ..models.annotation import AnnotationMedecin
    d = _schema.dump(mesure)
    d["nom_type"] = mesure.type_mesure.nom
    d["unite"]    = mesure.type_mesure.unite
    d["composantes"] = [
        {"composante": c.composante, "valeur": c.valeur}
        for c in mesure.composantes
    ]
    # Statut selon seuils OMS
    t, v = mesure.type_mesure, mesure.valeur
    if ((t.seuil_danger_haut is not None and v > t.seuil_danger_haut) or
        (t.seuil_danger_bas  is not None and v < t.seuil_danger_bas)):
        d["statut"] = "danger"
    elif ((t.seuil_max_normal is not None and v > t.seuil_max_normal) or
          (t.seuil_min_normal is not None and v < t.seuil_min_normal)):
        d["statut"] = "attention"
    else:
        d["statut"] = "normal"
    # Annotation du médecin visible par le patient
    ann = AnnotationMedecin.query.filter_by(mesure_id=mesure.id).first()
    d["annotation_medecin"] = {
        "commentaire": ann.commentaire,
        "medecin":     f"Dr {ann.medecin.prenom} {ann.medecin.nom}",
    } if ann else None
    return d


@bp.get("/")
@patient_required
def liste_mesures():
    user = get_current_user()
    type_id = request.args.get("type_id", type=int)
    mesures = mesure_service.lister_mesures(user.id, type_id)
    return success_response([_enrichir(m) for m in mesures])


@bp.post("/")
@patient_required
def creer_mesure():
    user = get_current_user()
    try:
        data = MesureCreateSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error_response(str(e.messages), "VALIDATION_ERROR")

    try:
        mesure = mesure_service.creer_mesure(user.id, data)
    except ValueError as e:
        return error_response(str(e), "MESURE_ERROR")

    return success_response(_enrichir(mesure), status=201)


@bp.get("/<int:mesure_id>")
@patient_required
def get_mesure(mesure_id: int):
    user = get_current_user()
    try:
        mesure = mesure_service.get_mesure(mesure_id, user.id)
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)
    return success_response(_enrichir(mesure))


@bp.get("/types")
@patient_required
def get_types():
    types = mesure_service.get_types_mesure()
    return success_response(_type_schemas.dump(types))


@bp.get("/types/<int:type_id>")
@patient_required
def get_type(type_id: int):
    from ..models.type_mesure import TypeMesure
    t = TypeMesure.query.get(type_id)
    if not t:
        return error_response("Type de mesure introuvable.", "NOT_FOUND", 404)
    return success_response(_type_schema.dump(t))


@bp.get("/historique/<int:type_id>")
@patient_required
def historique(type_id: int):
    user = get_current_user()
    limit = request.args.get("limit", 90, type=int)
    mesures = mesure_service.historique_mesure(user.id, type_id, limit)
    return success_response([_enrichir(m) for m in mesures])


@bp.get("/predictions/<int:type_id>")
@patient_required
def predictions(type_id: int):
    from ..services import predictions_service
    user = get_current_user()
    jours = request.args.get("jours", 7, type=int)
    result = predictions_service.predire_tendance(user.id, type_id, jours)
    return success_response(result)


@bp.get("/calendrier")
@patient_required
def calendrier():
    """Agrégation journalière des mesures pour un mois donné."""
    import calendar as cal
    from datetime import datetime as dt

    user = get_current_user()
    mois = request.args.get("mois", "")

    try:
        if mois:
            annee, m = (int(x) for x in mois.split("-"))
        else:
            now = dt.utcnow()
            annee, m = now.year, now.month
        if not (1 <= m <= 12):
            raise ValueError
    except ValueError:
        return error_response("Format invalide — utilisez YYYY-MM.", "INVALID_FORMAT")

    _, nb_jours = cal.monthrange(annee, m)
    debut = dt(annee, m, 1)
    fin   = dt(annee, m, nb_jours, 23, 59, 59)

    from ..models.mesure import Mesure
    from ..models.type_mesure import TypeMesure

    mesures = (
        Mesure.query
        .filter(
            Mesure.patient_id == user.id,
            Mesure.date_mesure >= debut,
            Mesure.date_mesure <= fin,
        )
        .all()
    )

    par_jour: dict = {}
    for mesure in mesures:
        jour = mesure.date_mesure.strftime("%Y-%m-%d")
        if jour not in par_jour:
            par_jour[jour] = {"count": 0, "types": set()}
        par_jour[jour]["count"] += 1
        par_jour[jour]["types"].add(mesure.type_mesure.nom)

    jours_data = {
        j: {"count": d["count"], "types": sorted(d["types"])}
        for j, d in par_jour.items()
    }

    # Série de jours actifs consécutifs (streak)
    streak = 0
    today  = dt.utcnow().date()
    for i in range(nb_jours):
        day = dt(annee, m, nb_jours - i).date()
        if day > today:
            continue
        key = day.strftime("%Y-%m-%d")
        if key in jours_data:
            streak += 1
        else:
            break

    return success_response({
        "mois":     f"{annee:04d}-{m:02d}",
        "nb_jours": nb_jours,
        "premier_jour_semaine": cal.monthrange(annee, m)[0],  # 0=lundi … 6=dimanche
        "jours":    jours_data,
        "streak":   streak,
        "actifs":   len(jours_data),
    })


@bp.get("/correlations")
@patient_required
def correlations():
    from ..services import correlations_service
    user = get_current_user()
    result = correlations_service.detecter_correlations(user.id)
    return success_response(result)


@bp.put("/<int:mesure_id>")
@patient_required
def modifier_mesure(mesure_id: int):
    user = get_current_user()
    body = request.get_json() or {}

    # Convertir date si fournie
    if "date_mesure" in body and body["date_mesure"]:
        from datetime import datetime
        try:
            body["date_mesure"] = datetime.fromisoformat(body["date_mesure"].replace("Z", ""))
        except ValueError:
            return error_response("Format de date invalide.", "INVALID_DATE")

    if "valeur" in body:
        try:
            body["valeur"] = float(body["valeur"])
        except (TypeError, ValueError):
            return error_response("Valeur numérique invalide.", "INVALID_VALUE")

    try:
        mesure = mesure_service.modifier_mesure(mesure_id, user.id, body)
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)

    return success_response(_enrichir(mesure))


@bp.delete("/<int:mesure_id>")
@patient_required
def supprimer_mesure(mesure_id: int):
    user = get_current_user()
    try:
        mesure_service.supprimer_mesure(mesure_id, user.id)
    except ValueError as e:
        return error_response(str(e), "NOT_FOUND", 404)
    return success_response({"id": mesure_id, "supprime": True})
