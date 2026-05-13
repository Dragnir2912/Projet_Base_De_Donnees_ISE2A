import numpy as np
from scipy.stats import pearsonr
from datetime import datetime, timedelta
from ..models.mesure import Mesure
from ..models.type_mesure import TypeMesure

MIN_POINTS = 5
JOURS_ANALYSE = 30

# Interprétations prédéfinies des paires connues
_INTERPRETATIONS = {
    ("Poids",              "Tension artérielle"):   {"positive": "Quand votre poids augmente, votre tension tend à augmenter aussi."},
    ("Poids",              "Tension systolique"):   {"positive": "Quand votre poids augmente, votre tension tend à augmenter aussi."},
    ("Glycémie",           "Poids"):                {"positive": "Vos pics de glycémie coïncident avec des prises de poids."},
    ("Fréquence cardiaque","Tension artérielle"):   {"positive": "Votre rythme cardiaque et votre tension évoluent ensemble."},
    ("Fréquence cardiaque","Tension systolique"):   {"positive": "Votre rythme cardiaque et votre tension évoluent ensemble."},
    ("SpO2",               "Fréquence cardiaque"):  {"negative": "Quand votre SpO2 baisse, votre fréquence cardiaque tend à s'accélérer."},
    ("IMC",                "Tension artérielle"):   {"positive": "Un IMC plus élevé est associé à une pression artérielle plus haute."},
    ("IMC",                "Tension systolique"):   {"positive": "Un IMC plus élevé est associé à une pression artérielle plus haute."},
}


def _interp(nom_a: str, nom_b: str, r: float) -> str:
    direction = "positive" if r > 0 else "negative"
    cle = (nom_a, nom_b) if (nom_a, nom_b) in _INTERPRETATIONS else (nom_b, nom_a)
    if cle in _INTERPRETATIONS and direction in _INTERPRETATIONS[cle]:
        return _INTERPRETATIONS[cle][direction]
    sens = "positive" if r > 0 else "inverse"
    return f"Corrélation {sens} détectée entre {nom_a} et {nom_b}."


def _par_jour(mesures: list) -> dict:
    """Moyenne journalière des mesures."""
    jours: dict = {}
    for m in mesures:
        d = m.date_mesure.date()
        jours.setdefault(d, []).append(m.valeur)
    return {d: sum(v) / len(v) for d, v in jours.items()}


def _aligner(mesures_a: list, mesures_b: list):
    """Retourne deux listes alignées sur les jours communs + les points (x,y) bruts."""
    da = _par_jour(mesures_a)
    db = _par_jour(mesures_b)
    dates = sorted(set(da) & set(db))
    vals_a = [da[d] for d in dates]
    vals_b = [db[d] for d in dates]
    return vals_a, vals_b


def detecter_correlations(patient_id: int) -> list[dict]:
    """
    Calcule les corrélations (Pearson) entre toutes les paires de types de mesures
    sur les JOURS_ANALYSE derniers jours.
    Retourne uniquement les corrélations significatives : |r| > 0.5 et p < 0.05.
    """
    limite = datetime.utcnow() - timedelta(days=JOURS_ANALYSE)
    types  = TypeMesure.query.order_by(TypeMesure.ordre_affichage).all()

    mesures_par_type: dict[int, list] = {}
    for t in types:
        m = (
            Mesure.query
            .filter(
                Mesure.patient_id == patient_id,
                Mesure.type_mesure_id == t.id,
                Mesure.date_mesure >= limite,
            )
            .order_by(Mesure.date_mesure.asc())
            .all()
        )
        if len(m) >= MIN_POINTS:
            mesures_par_type[t.id] = (t, m)

    correlations = []
    type_ids = list(mesures_par_type.keys())

    for i in range(len(type_ids)):
        for j in range(i + 1, len(type_ids)):
            tid_a, tid_b = type_ids[i], type_ids[j]
            type_a, mes_a = mesures_par_type[tid_a]
            type_b, mes_b = mesures_par_type[tid_b]

            vals_a, vals_b = _aligner(mes_a, mes_b)
            if len(vals_a) < MIN_POINTS:
                continue

            try:
                r, p = pearsonr(vals_a, vals_b)
            except Exception:
                continue

            if abs(r) <= 0.5 or p >= 0.05:
                continue

            # Points bruts pour le scatter plot (max 60)
            points = [{"x": round(float(a), 3), "y": round(float(b), 3)}
                      for a, b in zip(vals_a, vals_b)][:60]

            correlations.append({
                "mesure_a":      type_a.nom,
                "mesure_b":      type_b.nom,
                "unite_a":       type_a.unite,
                "unite_b":       type_b.unite,
                "coefficient":   round(float(r), 3),
                "force":         "forte" if abs(r) > 0.8 else "modérée",
                "direction":     "positive" if r > 0 else "négative",
                "interpretation": _interp(type_a.nom, type_b.nom, r),
                "points":        points,
                "nb_points":     len(vals_a),
            })

    return sorted(correlations, key=lambda x: abs(x["coefficient"]), reverse=True)
