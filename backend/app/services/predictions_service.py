import numpy as np
from scipy import stats
from datetime import datetime, timedelta
from ..models.mesure import Mesure
from ..models.type_mesure import TypeMesure

MIN_POINTS = 10


def predire_tendance(patient_id: int, type_id: int, jours_futur: int = 7) -> dict:
    """
    Régression linéaire sur l'historique du patient pour un type de mesure.
    Retourne les prédictions J+1 à J+jours_futur avec intervalle de confiance.
    Nécessite MIN_POINTS mesures minimum.
    """
    type_mesure = TypeMesure.query.get(type_id)
    if not type_mesure:
        return {"erreur": "Type de mesure introuvable."}

    mesures = (
        Mesure.query
        .filter_by(patient_id=patient_id, type_mesure_id=type_id)
        .order_by(Mesure.date_mesure.asc())
        .all()
    )

    if len(mesures) < MIN_POINTS:
        return {
            "suffisant": False,
            "nb_mesures": len(mesures),
            "requis": MIN_POINTS,
            "type_nom": type_mesure.nom,
            "type_unite": type_mesure.unite,
        }

    x = np.array([m.date_mesure.timestamp() for m in mesures])
    y = np.array([m.valeur for m in mesures])

    slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)

    # Prédictions J+1 à J+jours_futur
    predictions = []
    last_x = x[-1]
    for i in range(1, jours_futur + 1):
        future_x = last_x + (i * 86400)
        pred_y    = slope * future_x + intercept
        future_dt = datetime.fromtimestamp(future_x)
        predictions.append({
            "date":                future_dt.strftime("%Y-%m-%dT%H:%M:%S"),
            "label":               future_dt.strftime("J+%d").replace("J+0", "J+") if i == 1 else f"J+{i}",
            "valeur_predite":      round(float(pred_y), 2),
            "intervalle_confiance": round(float(std_err * 1.96), 2),
        })

    # Alerte prédictive sur la valeur J+jours_futur
    derniere_pred = predictions[-1]["valeur_predite"]
    alerte_predictive = None
    if type_mesure.seuil_danger_haut is not None and derniere_pred > type_mesure.seuil_danger_haut:
        alerte_predictive = "danger"
    elif type_mesure.seuil_max_normal is not None and derniere_pred > type_mesure.seuil_max_normal:
        alerte_predictive = "attention"
    elif type_mesure.seuil_danger_bas is not None and derniere_pred < type_mesure.seuil_danger_bas:
        alerte_predictive = "danger"
    elif type_mesure.seuil_min_normal is not None and derniere_pred < type_mesure.seuil_min_normal:
        alerte_predictive = "attention"

    r2 = float(r_value ** 2)

    return {
        "suffisant":          True,
        "type_id":            type_id,
        "type_nom":           type_mesure.nom,
        "type_unite":         type_mesure.unite,
        "nb_mesures":         len(mesures),
        "pente":              round(float(slope), 6),
        "r_squared":          round(r2, 3),
        "tendance":           "hausse" if slope > 1e-8 else "baisse" if slope < -1e-8 else "stable",
        "fiabilite":          "haute" if r2 > 0.7 else "moyenne" if r2 > 0.4 else "faible",
        "predictions":        predictions,
        "alerte_predictive":  alerte_predictive,
        "seuil_min_normal":   type_mesure.seuil_min_normal,
        "seuil_max_normal":   type_mesure.seuil_max_normal,
        "seuil_danger_bas":   type_mesure.seuil_danger_bas,
        "seuil_danger_haut":  type_mesure.seuil_danger_haut,
    }
