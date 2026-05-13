from ..extensions import db
from ..models.alerte import Alerte


def lister_alertes(patient_id: int, non_vues_seulement: bool = False) -> list[Alerte]:
    query = Alerte.query.filter_by(patient_id=patient_id)
    if non_vues_seulement:
        query = query.filter_by(vue=False)
    return query.order_by(Alerte.created_at.desc()).all()


def marquer_vue(alerte_id: int, patient_id: int) -> Alerte:
    alerte = Alerte.query.filter_by(id=alerte_id, patient_id=patient_id).first()
    if not alerte:
        raise ValueError("Alerte introuvable.")
    alerte.vue = True
    db.session.commit()
    return alerte


def compter_non_vues(patient_id: int) -> int:
    return Alerte.query.filter_by(patient_id=patient_id, vue=False).count()


def marquer_toutes_vues(patient_id: int) -> int:
    count = Alerte.query.filter_by(patient_id=patient_id, vue=False).update({"vue": True})
    db.session.commit()
    return count
