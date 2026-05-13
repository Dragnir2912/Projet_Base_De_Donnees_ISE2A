from ..models.mesure import Mesure
from ..models.type_mesure import TypeMesure
from ..extensions import db
from sqlalchemy import func


def calculer_vitascore(patient_id: int) -> dict:
    """
    Calcule le VitaScore (0-100) basé sur la dernière mesure de chaque type.
    Score pondéré : 100 = tout dans la zone normale, pénalité par anomalie.
    """
    types = TypeMesure.query.filter(TypeMesure.ponderation_vitascore > 0).all()
    if not types:
        return {"score": None, "detail": []}

    # Dernière mesure par type pour ce patient
    sous_requete = (
        db.session.query(
            Mesure.type_mesure_id,
            func.max(Mesure.date_mesure).label("max_date"),
        )
        .filter(Mesure.patient_id == patient_id)
        .group_by(Mesure.type_mesure_id)
        .subquery()
    )

    dernieres = (
        db.session.query(Mesure)
        .join(
            sous_requete,
            (Mesure.type_mesure_id == sous_requete.c.type_mesure_id)
            & (Mesure.date_mesure == sous_requete.c.max_date),
        )
        .filter(Mesure.patient_id == patient_id)
        .all()
    )

    mesures_par_type = {m.type_mesure_id: m for m in dernieres}

    score_total = 0.0
    poids_total = 0.0
    detail = []

    for t in types:
        poids_total += t.ponderation_vitascore
        mesure = mesures_par_type.get(t.id)
        if not mesure:
            continue

        statut = _statut_seuil(mesure.valeur, t)
        contribution = _score_contribution(statut, t.ponderation_vitascore)
        score_total += contribution

        detail.append({
            "type_id": t.id,
            "nom": t.nom,
            "valeur": mesure.valeur,
            "unite": t.unite,
            "statut": statut,
            "contribution": round(contribution, 2),
        })

    if poids_total == 0:
        return {"score": None, "detail": detail}

    score = round((score_total / poids_total) * 100, 1)
    return {"score": min(score, 100), "detail": detail}


def _statut_seuil(valeur: float, t: TypeMesure) -> str:
    if (t.seuil_danger_haut is not None and valeur > t.seuil_danger_haut) or \
       (t.seuil_danger_bas is not None and valeur < t.seuil_danger_bas):
        return "danger"
    if (t.seuil_max_normal is not None and valeur > t.seuil_max_normal) or \
       (t.seuil_min_normal is not None and valeur < t.seuil_min_normal):
        return "attention"
    return "normal"


def _score_contribution(statut: str, poids: float) -> float:
    if statut == "normal":
        return poids
    if statut == "attention":
        return poids * 0.5
    return poids * 0.1
