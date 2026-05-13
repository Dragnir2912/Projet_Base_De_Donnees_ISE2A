from datetime import date, datetime
from ..extensions import db
from ..models.utilisateur import Utilisateur
from ..models.relation import RelationMedecinPatient
from ..models.demande_relation import DemandeRelation


# ─── Helpers ──────────────────────────────────────────────────────

def _fmt_user(u: Utilisateur, nb_patients: int = 0) -> dict:
    return {
        "id": u.id,
        "nom": u.nom,
        "prenom": u.prenom,
        "email": u.email,
        "specialite": u.specialite or "Médecin généraliste",
        "disponible": nb_patients < 50,
    }


def _fmt_patient(u: Utilisateur) -> dict:
    age = None
    if u.date_naissance:
        today = date.today()
        age = today.year - u.date_naissance.year - (
            (today.month, today.day) < (u.date_naissance.month, u.date_naissance.day)
        )
    return {
        "id": u.id,
        "nom": u.nom,
        "prenom": u.prenom,
        "email": u.email,
        "age": age,
    }


# ─── Côté PATIENT ─────────────────────────────────────────────────

def get_mon_medecin(patient_id: int) -> dict | None:
    """Retourne le médecin actif du patient, ou None."""
    relation = (
        RelationMedecinPatient.query
        .filter_by(patient_id=patient_id, active=True)
        .first()
    )
    if not relation:
        return None
    m = relation.medecin
    return {
        **_fmt_user(m),
        "date_debut": relation.date_debut.isoformat(),
        "relation_id": relation.id,
    }


def chercher_medecins(search: str = "") -> list[dict]:
    """Recherche des médecins par nom/prénom/spécialité."""
    q = Utilisateur.query.filter_by(role="medecin", actif=True)
    if search:
        like = f"%{search}%"
        q = q.filter(
            db.or_(
                Utilisateur.nom.ilike(like),
                Utilisateur.prenom.ilike(like),
                Utilisateur.specialite.ilike(like),
            )
        )
    medecins = q.limit(20).all()
    result = []
    for m in medecins:
        nb = RelationMedecinPatient.query.filter_by(medecin_id=m.id, active=True).count()
        result.append(_fmt_user(m, nb))
    return result


def envoyer_demande(patient_id: int, medecin_id: int, message: str = "") -> DemandeRelation:
    """Patient envoie une demande de suivi à un médecin."""
    medecin = Utilisateur.query.filter_by(id=medecin_id, role="medecin").first()
    if not medecin:
        raise ValueError("Médecin introuvable.")

    # Vérifie s'il y a déjà une demande en attente ou une relation active
    existing_demande = DemandeRelation.query.filter_by(
        patient_id=patient_id, medecin_id=medecin_id, statut="en_attente"
    ).first()
    if existing_demande:
        raise ValueError("Une demande est déjà en attente pour ce médecin.")

    existing_relation = RelationMedecinPatient.query.filter_by(
        patient_id=patient_id, medecin_id=medecin_id, active=True
    ).first()
    if existing_relation:
        raise ValueError("Ce médecin vous suit déjà.")

    # Si une demande refusée existe, on la remet en attente
    demande = DemandeRelation.query.filter_by(
        patient_id=patient_id, medecin_id=medecin_id
    ).first()
    if demande:
        demande.statut = "en_attente"
        demande.message = message
        demande.updated_at = datetime.utcnow()
    else:
        demande = DemandeRelation(
            patient_id=patient_id,
            medecin_id=medecin_id,
            message=message,
        )
        db.session.add(demande)

    db.session.commit()
    return demande


def get_demande_patient(patient_id: int, medecin_id: int) -> str | None:
    """Retourne le statut de la demande patient→médecin, ou None."""
    d = DemandeRelation.query.filter_by(patient_id=patient_id, medecin_id=medecin_id).first()
    return d.statut if d else None


def terminer_suivi(patient_id: int, relation_id: int) -> None:
    """Patient met fin à son suivi avec son médecin."""
    relation = RelationMedecinPatient.query.filter_by(
        id=relation_id, patient_id=patient_id, active=True
    ).first()
    if not relation:
        raise ValueError("Relation introuvable ou déjà terminée.")
    relation.active = False
    relation.date_fin = date.today()
    db.session.commit()


# ─── Côté MÉDECIN ─────────────────────────────────────────────────

def get_demandes_medecin(medecin_id: int) -> list[dict]:
    """Retourne les demandes en attente reçues par le médecin."""
    demandes = (
        DemandeRelation.query
        .filter_by(medecin_id=medecin_id, statut="en_attente")
        .order_by(DemandeRelation.created_at.desc())
        .all()
    )
    result = []
    for d in demandes:
        p = d.patient
        result.append({
            "id": d.id,
            "patient": _fmt_patient(p),
            "message": d.message,
            "created_at": d.created_at.isoformat(),
        })
    return result


def repondre_demande(medecin_id: int, demande_id: int, accepter: bool) -> None:
    """Médecin accepte ou refuse une demande."""
    demande = DemandeRelation.query.filter_by(
        id=demande_id, medecin_id=medecin_id, statut="en_attente"
    ).first()
    if not demande:
        raise ValueError("Demande introuvable ou déjà traitée.")

    if accepter:
        demande.statut = "acceptee"
        # Créer la relation médecin-patient
        existing = RelationMedecinPatient.query.filter_by(
            medecin_id=medecin_id, patient_id=demande.patient_id
        ).first()
        if existing:
            existing.active = True
            existing.date_debut = date.today()
            existing.date_fin = None
        else:
            relation = RelationMedecinPatient(
                medecin_id=medecin_id,
                patient_id=demande.patient_id,
                date_debut=date.today(),
            )
            db.session.add(relation)
    else:
        demande.statut = "refusee"

    demande.updated_at = datetime.utcnow()
    db.session.commit()


def chercher_patients(search: str = "") -> list[dict]:
    """Médecin recherche des patients par nom/email."""
    q = Utilisateur.query.filter_by(role="patient", actif=True)
    if search:
        like = f"%{search}%"
        q = q.filter(
            db.or_(
                Utilisateur.nom.ilike(like),
                Utilisateur.prenom.ilike(like),
                Utilisateur.email.ilike(like),
            )
        )
    patients = q.limit(20).all()
    return [_fmt_patient(p) for p in patients]
