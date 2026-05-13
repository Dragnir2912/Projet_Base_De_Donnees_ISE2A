from datetime import date, datetime
from ..extensions import db
from ..models.utilisateur import Utilisateur
from ..models.relation import RelationMedecinPatient
from ..models.consultation import Consultation
from ..models.annotation import AnnotationMedecin
from ..models.mesure import Mesure
from ..models.type_mesure import TypeMesure
from ..models.alerte import Alerte
from .vitascore_service import calculer_vitascore


# ─── Utilitaires ──────────────────────────────────────────

def _age(date_naissance) -> int | None:
    if not date_naissance:
        return None
    today = date.today()
    return today.year - date_naissance.year - (
        (today.month, today.day) < (date_naissance.month, date_naissance.day)
    )

URGENCE_ORDRE = {'danger': 0, 'attention': 1, 'normal': 2}


# ─── Patients ─────────────────────────────────────────────

def lister_patients(medecin_id: int) -> list[dict]:
    relations = RelationMedecinPatient.query.filter_by(
        medecin_id=medecin_id, active=True
    ).all()

    patients = []
    for rel in relations:
        p = rel.patient
        vs = calculer_vitascore(p.id)

        nb_danger    = Alerte.query.filter_by(patient_id=p.id, vue=False, niveau='danger').count()
        nb_attention = Alerte.query.filter_by(patient_id=p.id, vue=False, niveau='attention').count()

        statut = 'danger' if nb_danger else ('attention' if nb_attention else 'normal')

        # Dernière mesure (hors IMC calculé automatiquement)
        type_imc = TypeMesure.query.filter_by(nom='IMC').first()
        q = Mesure.query.filter_by(patient_id=p.id)
        if type_imc:
            q = q.filter(Mesure.type_mesure_id != type_imc.id)
        derniere = q.order_by(Mesure.date_mesure.desc()).first()

        patients.append({
            "id":                p.id,
            "nom":               p.nom,
            "prenom":            p.prenom,
            "email":             p.email,
            "date_naissance":    p.date_naissance,
            "age":               _age(p.date_naissance),
            "vitascore":         vs["score"],
            "alertes_non_vues":  nb_danger + nb_attention,
            "alertes_danger":    nb_danger,
            "alertes_attention": nb_attention,
            "statut_urgence":    statut,
            "relation_depuis":   rel.date_debut,
            "derniere_mesure":   {
                "date":   derniere.date_mesure,
                "type":   derniere.type_mesure.nom,
                "valeur": derniere.valeur,
                "unite":  derniere.type_mesure.unite,
            } if derniere else None,
        })

    # Trier : danger → attention → normal, puis alertes décroissantes
    patients.sort(key=lambda x: (
        URGENCE_ORDRE[x['statut_urgence']],
        -x['alertes_non_vues'],
    ))
    return patients


def get_alertes_critiques(medecin_id: int, niveau: str = None, inclure_vues: bool = False) -> list[dict]:
    """
    Toutes les alertes chez les patients du médecin.
    niveau : 'danger' | 'attention' | None (toutes)
    inclure_vues : False = seulement non vues (défaut)
    """
    patient_ids = [
        r.patient_id
        for r in RelationMedecinPatient.query.filter_by(medecin_id=medecin_id, active=True).all()
    ]
    if not patient_ids:
        return []

    q = Alerte.query.filter(Alerte.patient_id.in_(patient_ids))
    if not inclure_vues:
        q = q.filter(Alerte.vue == False)
    if niveau:
        q = q.filter(Alerte.niveau == niveau)

    alertes = q.order_by(Alerte.created_at.desc()).limit(200).all()

    # Trier : danger avant attention, puis par date décroissante
    ordre = {'danger': 0, 'attention': 1}
    alertes.sort(key=lambda a: (ordre.get(a.niveau, 2), -a.created_at.timestamp()))

    return [
        {
            "id":          a.id,
            "patient_id":  a.patient_id,
            "patient_nom": f"{a.patient.prenom} {a.patient.nom}",
            "message":     a.message,
            "niveau":      a.niveau,
            "vue":         a.vue,
            "created_at":  a.created_at,
            "type_alerte": a.type_alerte,
            "mesure_id":   a.mesure_id,
        }
        for a in alertes
    ]


def marquer_vue_alerte(medecin_id: int, alerte_id: int) -> bool:
    """Le médecin marque une alerte patient comme vue. Retourne False si non autorisé."""
    patient_ids = [
        r.patient_id
        for r in RelationMedecinPatient.query.filter_by(medecin_id=medecin_id, active=True).all()
    ]
    a = Alerte.query.filter(
        Alerte.id == alerte_id,
        Alerte.patient_id.in_(patient_ids),
    ).first()
    if not a:
        return False
    a.vue = True
    db.session.commit()
    return True


# ─── Fiche patient — mesures & historique ─────────────────

def get_mesures_patient(medecin_id: int, patient_id: int) -> list[dict]:
    """Dernière valeur par type de mesure pour un patient (vue fiche médecin)."""
    _verifier_acces(medecin_id, patient_id)

    types = TypeMesure.query.order_by(TypeMesure.ordre_affichage).all()

    result = []
    for t in types:

        derniere = (
            Mesure.query
            .filter_by(patient_id=patient_id, type_mesure_id=t.id)
            .order_by(Mesure.date_mesure.desc())
            .first()
        )
        if not derniere:
            continue

        v = derniere.valeur
        if ((t.seuil_danger_haut is not None and v > t.seuil_danger_haut) or
            (t.seuil_danger_bas  is not None and v < t.seuil_danger_bas)):
            statut = "danger"
        elif ((t.seuil_max_normal is not None and v > t.seuil_max_normal) or
              (t.seuil_min_normal is not None and v < t.seuil_min_normal)):
            statut = "attention"
        else:
            statut = "normal"

        result.append({
            "type_id":           t.id,
            "type_nom":          t.nom,
            "type_unite":        t.unite,
            "description":       t.description,
            "seuil_min_normal":  t.seuil_min_normal,
            "seuil_max_normal":  t.seuil_max_normal,
            "seuil_danger_bas":  t.seuil_danger_bas,
            "seuil_danger_haut": t.seuil_danger_haut,
            "derniere_valeur":   derniere.valeur,
            "derniere_date":     derniere.date_mesure,
            "statut":            statut,
        })

    return result


def get_historique_patient(medecin_id: int, patient_id: int, type_id: int) -> list[dict]:
    """Historique complet d'un type de mesure pour un patient, avec annotations du médecin."""
    _verifier_acces(medecin_id, patient_id)

    mesures = (
        Mesure.query
        .filter_by(patient_id=patient_id, type_mesure_id=type_id)
        .order_by(Mesure.date_mesure.asc())
        .limit(90)
        .all()
    )

    mesure_ids = [m.id for m in mesures]
    annotations_map = {
        ann.mesure_id: {"id": ann.id, "commentaire": ann.commentaire}
        for ann in AnnotationMedecin.query.filter(
            AnnotationMedecin.mesure_id.in_(mesure_ids),
            AnnotationMedecin.medecin_id == medecin_id,
        ).all()
    }

    return [
        {
            "id":          m.id,
            "valeur":      m.valeur,
            "date_mesure": m.date_mesure,
            "contexte":    m.contexte,
            "note":        m.note,
            "annotation":  annotations_map.get(m.id),
        }
        for m in mesures
    ]


# ─── Résumé patient ────────────────────────────────────────

def resume_patient(medecin_id: int, patient_id: int) -> dict:
    _verifier_acces(medecin_id, patient_id)

    patient = Utilisateur.query.get(patient_id)
    if not patient:
        raise ValueError("Patient introuvable.")

    vs = calculer_vitascore(patient_id)

    alertes_non_vues = Alerte.query.filter_by(patient_id=patient_id, vue=False).count()
    alertes_danger   = Alerte.query.filter_by(patient_id=patient_id, vue=False, niveau='danger').count()

    consultations = (
        Consultation.query
        .filter_by(medecin_id=medecin_id, patient_id=patient_id)
        .order_by(Consultation.date_consultation.desc())
        .limit(10)
        .all()
    )

    # Dernière mesure par type — IMC inclus pour le médecin
    types = TypeMesure.query.order_by(TypeMesure.ordre_affichage).all()
    dernieres_mesures = []
    for t in types:
        m = (
            Mesure.query
            .filter_by(patient_id=patient_id, type_mesure_id=t.id)
            .order_by(Mesure.date_mesure.desc())
            .first()
        )
        if m:
            dernieres_mesures.append({
                "id":          m.id,
                "type_id":     t.id,
                "type":        t.nom,
                "unite":       t.unite,
                "valeur":      m.valeur,
                "date_mesure": m.date_mesure,
            })

    return {
        "patient": {
            "id":             patient.id,
            "nom":            patient.nom,
            "prenom":         patient.prenom,
            "email":          patient.email,
            "date_naissance": patient.date_naissance,
            "age":            _age(patient.date_naissance),
            "taille_cm":      patient.taille_cm,
        },
        "vitascore":          vs,
        "alertes_non_vues":   alertes_non_vues,
        "alertes_danger":     alertes_danger,
        "dernieres_mesures":  dernieres_mesures,
        "consultations_recentes": [
            {
                "id":              c.id,
                "date":            c.date_consultation,
                "date_consultation": c.date_consultation,
                "statut":          c.statut,
                "diagnostic":      c.diagnostic,
                "recommandations": c.recommandations,
            }
            for c in consultations
        ],
    }


# ─── Consultations ─────────────────────────────────────────

def lister_consultations_patient(medecin_id: int, patient_id: int) -> list[dict]:
    """Toutes les consultations du médecin pour un patient donné."""
    _verifier_acces(medecin_id, patient_id)
    consultations = (
        Consultation.query
        .filter_by(medecin_id=medecin_id, patient_id=patient_id)
        .order_by(Consultation.date_consultation.desc())
        .all()
    )
    return [_fmt_consultation(c) for c in consultations]


def _fmt_consultation(c: Consultation) -> dict:
    return {
        "id":                c.id,
        "date_consultation": c.date_consultation,
        "diagnostic":        c.diagnostic,
        "recommandations":   c.recommandations,
        "statut":            c.statut,
        "created_at":        c.created_at,
        "medecin_nom":       f"Dr {c.medecin.prenom} {c.medecin.nom}",
    }


def creer_consultation(medecin_id: int, data: dict) -> Consultation:
    _verifier_acces(medecin_id, data["patient_id"])
    c = Consultation(
        medecin_id=medecin_id,
        patient_id=data["patient_id"],
        date_consultation=data["date_consultation"],
        diagnostic=data.get("diagnostic"),
        recommandations=data.get("recommandations"),
        statut=data.get("statut", "redige"),
    )
    db.session.add(c)
    db.session.commit()
    return c


def modifier_consultation(medecin_id: int, consultation_id: int, data: dict) -> Consultation:
    c = Consultation.query.filter_by(id=consultation_id, medecin_id=medecin_id).first()
    if not c:
        raise ValueError("Consultation introuvable ou accès refusé.")
    if "date_consultation" in data:
        c.date_consultation = data["date_consultation"]
    if "diagnostic" in data:
        c.diagnostic = data["diagnostic"] or None
    if "recommandations" in data:
        c.recommandations = data["recommandations"] or None
    if "statut" in data:
        c.statut = data["statut"]
    db.session.commit()
    return c


def supprimer_consultation(medecin_id: int, consultation_id: int) -> None:
    c = Consultation.query.filter_by(id=consultation_id, medecin_id=medecin_id).first()
    if not c:
        raise ValueError("Consultation introuvable ou accès refusé.")
    db.session.delete(c)
    db.session.commit()


# ─── Annotations ───────────────────────────────────────────

def creer_annotation(medecin_id: int, data: dict) -> AnnotationMedecin:
    mesure = Mesure.query.get(data["mesure_id"])
    if not mesure:
        raise ValueError("Mesure introuvable.")
    _verifier_acces(medecin_id, mesure.patient_id)

    existante = AnnotationMedecin.query.filter_by(
        medecin_id=medecin_id, mesure_id=data["mesure_id"]
    ).first()
    if existante:
        existante.commentaire = data["commentaire"]
        db.session.commit()
        return existante

    ann = AnnotationMedecin(
        medecin_id=medecin_id,
        mesure_id=data["mesure_id"],
        commentaire=data["commentaire"],
    )
    db.session.add(ann)
    db.session.commit()
    return ann


def modifier_annotation(medecin_id: int, annotation_id: int, commentaire: str) -> AnnotationMedecin:
    ann = AnnotationMedecin.query.filter_by(id=annotation_id, medecin_id=medecin_id).first()
    if not ann:
        raise ValueError("Annotation introuvable ou accès refusé.")
    ann.commentaire = commentaire
    db.session.commit()
    return ann


def supprimer_annotation(medecin_id: int, annotation_id: int) -> None:
    ann = AnnotationMedecin.query.filter_by(id=annotation_id, medecin_id=medecin_id).first()
    if not ann:
        raise ValueError("Annotation introuvable ou accès refusé.")
    db.session.delete(ann)
    db.session.commit()


def lister_annotations_patient(medecin_id: int, patient_id: int) -> list[dict]:
    """Toutes les annotations du médecin pour un patient donné."""
    _verifier_acces(medecin_id, patient_id)
    anns = (
        AnnotationMedecin.query
        .filter_by(medecin_id=medecin_id)
        .join(Mesure, AnnotationMedecin.mesure_id == Mesure.id)
        .filter(Mesure.patient_id == patient_id)
        .order_by(AnnotationMedecin.created_at.desc())
        .all()
    )
    return [
        {
            "id":           a.id,
            "mesure_id":    a.mesure_id,
            "commentaire":  a.commentaire,
            "created_at":   a.created_at,
            "type_mesure":  a.mesure.type_mesure.nom,
            "valeur":       a.mesure.valeur,
            "unite":        a.mesure.type_mesure.unite,
            "date_mesure":  a.mesure.date_mesure,
        }
        for a in anns
    ]


def ajouter_patient(medecin_id: int, patient_id: int) -> RelationMedecinPatient:
    patient = Utilisateur.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        raise ValueError("Patient introuvable.")
    existant = RelationMedecinPatient.query.filter_by(
        medecin_id=medecin_id, patient_id=patient_id
    ).first()
    if existant:
        if not existant.active:
            existant.active = True
            existant.date_fin = None
            db.session.commit()
        return existant
    rel = RelationMedecinPatient(
        medecin_id=medecin_id,
        patient_id=patient_id,
        date_debut=date.today(),
    )
    db.session.add(rel)
    db.session.commit()
    return rel


def _verifier_acces(medecin_id: int, patient_id: int) -> None:
    rel = RelationMedecinPatient.query.filter_by(
        medecin_id=medecin_id, patient_id=patient_id, active=True
    ).first()
    if not rel:
        raise PermissionError("Accès refusé : ce patient n'est pas dans votre liste.")
