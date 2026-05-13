from datetime import datetime
from ..extensions import db
from ..models.mesure import Mesure
from ..models.mesure_composante import MesureComposante
from ..models.type_mesure import TypeMesure
from ..models.alerte import Alerte
from ..models.utilisateur import Utilisateur


# ─── IMC ──────────────────────────────────────────────────────────

def _get_type_by_nom(nom: str) -> TypeMesure | None:
    return TypeMesure.query.filter_by(nom=nom).first()


def _calculer_imc(poids_kg: float, taille_cm: float) -> float:
    taille_m = taille_cm / 100
    return round(poids_kg / (taille_m ** 2), 1)


def _creer_ou_maj_imc(patient: Utilisateur, mesure_poids: Mesure) -> None:
    """Crée ou met à jour la mesure IMC liée à une mesure de Poids."""
    if not patient.taille_cm:
        return

    type_imc = _get_type_by_nom("IMC")
    if not type_imc:
        return

    imc_val = _calculer_imc(mesure_poids.valeur, patient.taille_cm)

    # Chercher un IMC déjà lié à ce poids
    imc_lie = Mesure.query.filter_by(source_mesure_id=mesure_poids.id).first()

    if imc_lie:
        imc_lie.valeur = imc_val
        imc_lie.date_mesure = mesure_poids.date_mesure
        # Supprimer les anciennes alertes liées à cet IMC pour les recalculer
        Alerte.query.filter_by(mesure_id=imc_lie.id).delete()
        _verifier_seuils(imc_lie, type_imc)
    else:
        imc_lie = Mesure(
            patient_id=patient.id,
            type_mesure_id=type_imc.id,
            valeur=imc_val,
            date_mesure=mesure_poids.date_mesure,
            source="saisie",
            source_mesure_id=mesure_poids.id,
        )
        db.session.add(imc_lie)
        db.session.flush()
        _verifier_seuils(imc_lie, type_imc)


def _supprimer_imc_lie(mesure_poids_id: int) -> None:
    """Supprime l'IMC dérivé d'une mesure de Poids."""
    imc_lie = Mesure.query.filter_by(source_mesure_id=mesure_poids_id).first()
    if imc_lie:
        Alerte.query.filter_by(mesure_id=imc_lie.id).delete()
        db.session.delete(imc_lie)


# ─── CRUD mesures ─────────────────────────────────────────────────

def creer_mesure(patient_id: int, data: dict) -> Mesure:
    type_mesure = TypeMesure.query.get(data["type_mesure_id"])
    if not type_mesure:
        raise ValueError("Type de mesure introuvable.")

    mesure = Mesure(
        patient_id=patient_id,
        type_mesure_id=data["type_mesure_id"],
        valeur=data["valeur"],
        date_mesure=data["date_mesure"],
        contexte=data.get("contexte"),
        note=data.get("note"),
        source="saisie",
    )
    db.session.add(mesure)
    db.session.flush()

    for comp in data.get("composantes", []):
        mc = MesureComposante(
            mesure_id=mesure.id,
            composante=comp["composante"],
            valeur=comp["valeur"],
        )
        db.session.add(mc)

    _verifier_seuils(mesure, type_mesure)

    # Calcul automatique IMC si c'est une mesure de Poids
    if type_mesure.nom == "Poids":
        patient = Utilisateur.query.get(patient_id)
        _creer_ou_maj_imc(patient, mesure)

    db.session.commit()
    return mesure


def _verifier_seuils(mesure: Mesure, type_mesure: TypeMesure) -> None:
    valeur = mesure.valeur

    if (type_mesure.seuil_danger_haut is not None and valeur > type_mesure.seuil_danger_haut) or \
       (type_mesure.seuil_danger_bas is not None and valeur < type_mesure.seuil_danger_bas):
        niveau = "danger"
        msg = f"DANGER : {type_mesure.nom} = {valeur} {type_mesure.unite} dépasse le seuil critique !"
    elif (type_mesure.seuil_max_normal is not None and valeur > type_mesure.seuil_max_normal) or \
         (type_mesure.seuil_min_normal is not None and valeur < type_mesure.seuil_min_normal):
        niveau = "attention"
        msg = f"Attention : {type_mesure.nom} = {valeur} {type_mesure.unite} est en dehors de la zone normale"
    else:
        return

    alerte = Alerte(
        patient_id=mesure.patient_id,
        mesure_id=mesure.id,
        type_alerte="seuil",
        niveau=niveau,
        message=msg,
    )
    db.session.add(alerte)


def lister_mesures(patient_id: int, type_id: int = None, limit: int = 50) -> list[Mesure]:
    query = Mesure.query.filter_by(patient_id=patient_id)
    if type_id:
        query = query.filter_by(type_mesure_id=type_id)
    return query.order_by(Mesure.date_mesure.desc()).limit(limit).all()


def historique_mesure(patient_id: int, type_id: int, limit: int = 90) -> list[Mesure]:
    return (
        Mesure.query
        .filter_by(patient_id=patient_id, type_mesure_id=type_id)
        .order_by(Mesure.date_mesure.asc())
        .limit(limit)
        .all()
    )


def get_mesure(mesure_id: int, patient_id: int) -> Mesure:
    mesure = Mesure.query.filter_by(id=mesure_id, patient_id=patient_id).first()
    if not mesure:
        raise ValueError("Mesure introuvable.")
    return mesure


def modifier_mesure(mesure_id: int, patient_id: int, data: dict) -> Mesure:
    mesure = Mesure.query.filter_by(id=mesure_id, patient_id=patient_id).first()
    if not mesure:
        raise ValueError("Mesure introuvable.")

    if "valeur" in data:
        mesure.valeur = data["valeur"]
    if "date_mesure" in data:
        mesure.date_mesure = data["date_mesure"]
    if "contexte" in data:
        mesure.contexte = data["contexte"] or None
    if "note" in data:
        mesure.note = data["note"] or None

    # Recalcul IMC si c'est une mesure de Poids
    if mesure.type_mesure.nom == "Poids":
        patient = Utilisateur.query.get(patient_id)
        _creer_ou_maj_imc(patient, mesure)

    db.session.commit()
    return mesure


def supprimer_mesure(mesure_id: int, patient_id: int) -> None:
    mesure = Mesure.query.filter_by(id=mesure_id, patient_id=patient_id).first()
    if not mesure:
        raise ValueError("Mesure introuvable.")

    # Si c'est un Poids, supprimer aussi l'IMC dérivé
    if mesure.type_mesure.nom == "Poids":
        _supprimer_imc_lie(mesure_id)

    Alerte.query.filter_by(mesure_id=mesure_id).delete()
    db.session.delete(mesure)
    db.session.commit()


def get_types_mesure() -> list[TypeMesure]:
    return TypeMesure.query.order_by(TypeMesure.ordre_affichage).all()
