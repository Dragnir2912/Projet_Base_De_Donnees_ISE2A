from datetime import datetime, timedelta
from ..extensions import db
from ..models.mesure import Mesure
from ..models.type_mesure import TypeMesure
from ..models.alerte import Alerte
from ..services.vitascore_service import calculer_vitascore


def _statut(valeur: float, t: TypeMesure) -> str:
    if (t.seuil_danger_haut is not None and valeur > t.seuil_danger_haut) or \
       (t.seuil_danger_bas  is not None and valeur < t.seuil_danger_bas):
        return "danger"
    if (t.seuil_max_normal  is not None and valeur > t.seuil_max_normal) or \
       (t.seuil_min_normal  is not None and valeur < t.seuil_min_normal):
        return "attention"
    return "normal"


def _commentaire(nom: str, tendance: str, var_pct: float, statut: str, jours: int) -> str | None:
    abs_var = abs(round(var_pct, 1))

    if jours > 3:
        return (
            f"📋 Vous n'avez pas enregistré de {nom.lower()} depuis {jours} jour{'s' if jours > 1 else ''}. "
            f"Une mesure régulière améliore la précision de votre VitaScore."
        )

    if statut == "danger":
        return f"🚨 Valeur critique détectée pour {nom}. Contactez votre médecin immédiatement."

    if tendance == "stable":
        if statut == "normal":
            return f"✅ Votre {nom.lower()} est stable depuis 2 semaines. Continuez ainsi !"
        return f"⚠️ Votre {nom.lower()} est stable mais hors zone normale. Consultez votre médecin."

    if tendance == "hausse":
        if nom in ("Poids", "IMC"):
            return (
                f"📈 Votre {nom.lower()} a augmenté de {abs_var}% ce mois-ci. "
                f"Tendance à surveiller. Consultez votre médecin si cela continue."
            )
        if statut in ("attention", "danger"):
            return (
                f"⚠️ Votre {nom.lower()} montre une tendance à la hausse (+{abs_var}% en 2 semaines). "
                f"Consultez votre médecin."
            )
        return f"📈 Votre {nom.lower()} a augmenté de {abs_var}% ces 2 dernières semaines."

    if tendance == "baisse":
        if nom in ("Poids", "IMC"):
            return f"📉 Votre {nom.lower()} a baissé de {abs_var}% — bonne tendance si elle est progressive."
        if statut in ("attention", "danger"):
            return f"⚠️ Votre {nom.lower()} est en baisse (-{abs_var}%). Vérifiez avec votre médecin."
        return f"📉 Votre {nom.lower()} a diminué de {abs_var}% en 2 semaines."

    return None


def get_tendances(patient_id: int) -> list[dict]:
    now = datetime.utcnow()
    sept_j = now - timedelta(days=7)
    quatorze_j = now - timedelta(days=14)

    types = TypeMesure.query.order_by(TypeMesure.ordre_affichage).all()
    tendances = []

    for t in types:
        if t.nom == "IMC":
            continue  # dérivé automatique — pas de tendance séparée

        derniere = (
            Mesure.query
            .filter_by(patient_id=patient_id, type_mesure_id=t.id)
            .order_by(Mesure.date_mesure.desc())
            .first()
        )
        if not derniere:
            continue

        jours = (now - derniere.date_mesure).days

        recentes = (
            Mesure.query
            .filter(Mesure.patient_id == patient_id,
                    Mesure.type_mesure_id == t.id,
                    Mesure.date_mesure >= sept_j)
            .all()
        )
        precedentes = (
            Mesure.query
            .filter(Mesure.patient_id == patient_id,
                    Mesure.type_mesure_id == t.id,
                    Mesure.date_mesure >= quatorze_j,
                    Mesure.date_mesure < sept_j)
            .all()
        )

        statut = _statut(derniere.valeur, t)
        tendance = "stable"
        var_pct = 0.0

        if recentes and precedentes:
            moy_rec  = sum(m.valeur for m in recentes)  / len(recentes)
            moy_prec = sum(m.valeur for m in precedentes) / len(precedentes)
            if moy_prec:
                var_pct = ((moy_rec - moy_prec) / moy_prec) * 100
            if abs(var_pct) < 3:
                tendance = "stable"
            elif var_pct > 0:
                tendance = "hausse"
            else:
                tendance = "baisse"

        commentaire = _commentaire(t.nom, tendance, var_pct, statut, jours)
        if not commentaire:
            continue

        tendances.append({
            "type_id":             t.id,
            "type_nom":            t.nom,
            "type_unite":          t.unite,
            "derniere_valeur":     derniere.valeur,
            "tendance":            tendance,
            "variation_pct":       round(var_pct, 1),
            "jours_depuis":        jours,
            "statut":              statut,
            "commentaire":         commentaire,
        })

    return tendances[:5]  # max 5 cards


def get_taches(patient_id: int) -> list[dict]:
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    types = {t.nom: t for t in TypeMesure.query.all()}
    taches = []

    def last(type_nom):
        t = types.get(type_nom)
        if not t:
            return None
        return (
            Mesure.query
            .filter_by(patient_id=patient_id, type_mesure_id=t.id)
            .order_by(Mesure.date_mesure.desc())
            .first()
        )

    # Glycémie à jeun aujourd'hui
    t_glyc = types.get("Glycémie")
    if t_glyc:
        mesure_jeun = Mesure.query.filter(
            Mesure.patient_id == patient_id,
            Mesure.type_mesure_id == t_glyc.id,
            Mesure.date_mesure >= today,
            Mesure.contexte == "a_jeun",
        ).first()
        if not mesure_jeun:
            taches.append({
                "id": "glycemie_jeun",
                "label": "Mesurer votre glycémie à jeun",
                "type_id": t_glyc.id,
            })

    # Tension si > 2 jours
    for nom_tension in ("Tension artérielle", "Tension systolique"):
        m = last(nom_tension)
        if m and (now - m.date_mesure).days >= 2:
            t_t = types[nom_tension]
            taches.append({
                "id": "tension",
                "label": "Prendre votre tension artérielle",
                "type_id": t_t.id,
            })
            break
        elif not m and nom_tension in types:
            taches.append({
                "id": "tension",
                "label": "Prendre votre tension artérielle",
                "type_id": types[nom_tension].id,
            })
            break

    # Tâches fixes
    taches.append({"id": "hydratation", "label": "Boire 1,5 L d'eau",          "type_id": None})
    taches.append({"id": "activite",    "label": "30 min d'activité physique",  "type_id": None})

    return taches
