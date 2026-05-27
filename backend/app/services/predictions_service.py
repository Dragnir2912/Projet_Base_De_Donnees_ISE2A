import numpy as np
from scipy import stats
from scipy.optimize import minimize
from datetime import datetime
import warnings

from ..models.mesure import Mesure
from ..models.type_mesure import TypeMesure

MIN_POINTS = 10


# ── Décomposition STL simplifiée ───────────────────────────────────────────────

def _linear_trend(x_ts: np.ndarray, y: np.ndarray):
    """Régression linéaire. Retourne (slope, intercept, r_value)."""
    slope, intercept, r_value, _, _ = stats.linregress(x_ts, y)
    return float(slope), float(intercept), float(r_value)


def _seasonal_component(x_ts: np.ndarray, detrended: np.ndarray, period: int = 7):
    """
    Saisonnalité hebdomadaire estimée par la moyenne des résidus de tendance
    groupés par jour de la semaine (modulo period en jours).
    Retourne (seasonal, day_idx) ou (zeros, None) si pas assez de données.
    """
    n = len(detrended)
    if n < 2 * period:
        return np.zeros(n), None

    day_idx = np.array([(int(ts // 86400)) % period for ts in x_ts])
    seasonal = np.zeros(n)
    for d in range(period):
        mask = day_idx == d
        if mask.sum() > 0:
            seasonal[mask] = detrended[mask].mean()
    # Centrer pour que la saisonnalité soit de moyenne nulle
    seasonal -= seasonal.mean()
    return seasonal, day_idx


# ── ARMA(1,1) estimation par algorithme des innovations ───────────────────────

def _innovations_sse(params, residuals: np.ndarray) -> float:
    """
    Calcule la SSE du processus ARMA(1,1) par l'algorithme des innovations.
    ε̂_t = φ·ε_{t-1} + θ·η_{t-1}   ;   η_t = ε_t - ε̂_t
    """
    phi, theta = float(params[0]), float(params[1])
    if abs(phi) >= 1.0 or abs(theta) >= 1.0:
        return 1e12
    n = len(residuals)
    eta = np.zeros(n)
    for t in range(1, n):
        eps_hat = phi * residuals[t - 1] + theta * eta[t - 1]
        eta[t] = residuals[t] - eps_hat
    return float(np.sum(eta[1:] ** 2))


def _fit_arma11(residuals: np.ndarray):
    """
    Estime φ et θ du processus ARMA(1,1) par minimisation de la SSE
    avec multi-démarrage (Nelder-Mead).
    Retourne (phi, theta, sigma²).
    """
    # Estimation initiale de φ via l'autocorrélation lag-1
    if len(residuals) > 2:
        r = np.corrcoef(residuals[:-1], residuals[1:])
        phi0 = float(np.clip(r[0, 1], -0.8, 0.8))
    else:
        phi0 = 0.0

    best_sse = np.inf
    best_params = np.array([phi0, 0.0])

    starts = [
        (phi0,  0.0),
        (phi0,  0.3),
        (phi0, -0.3),
        (0.5,   0.0),
        (-0.5,  0.0),
        (0.3,   0.3),
        (-0.3, -0.3),
        (0.0,   0.0),
    ]

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        for p0, t0 in starts:
            try:
                res = minimize(
                    _innovations_sse, [p0, t0], args=(residuals,),
                    method='Nelder-Mead',
                    options={'maxiter': 1500, 'xatol': 1e-6, 'fatol': 1e-9},
                )
                if res.fun < best_sse:
                    best_sse = res.fun
                    best_params = res.x
            except Exception:
                pass

    phi = float(np.clip(best_params[0], -0.95, 0.95))
    theta = float(np.clip(best_params[1], -0.95, 0.95))
    sigma2 = best_sse / max(len(residuals) - 2, 1)
    return phi, theta, float(sigma2)


def _predict_arma11(phi: float, theta: float, residuals: np.ndarray, h: int):
    """
    Prévision h-pas d'un ARMA(1,1) par propagation des innovations.
    - h=1 : ε̂_{T+1} = φ·ε_T + θ·η_T
    - h>1 : terme MA disparaît → ε̂_{T+h} = φ^h · ε_T
    Retourne un tableau de h prédictions.
    """
    n = len(residuals)
    eta = np.zeros(n)
    for t in range(1, n):
        eps_hat = phi * residuals[t - 1] + theta * eta[t - 1]
        eta[t] = residuals[t] - eps_hat

    preds = []
    for step in range(1, h + 1):
        if step == 1:
            p = phi * residuals[-1] + theta * eta[-1]
        else:
            p = (phi ** step) * residuals[-1]
        preds.append(float(p))
    return preds


# ── Point d'entrée public ──────────────────────────────────────────────────────

def predire_tendance(patient_id: int, type_id: int, jours_futur: int = 7) -> dict:
    """
    Prédiction par décomposition STL + modélisation ARMA(1,1) des résidus.

    Pipeline :
      1. Régression linéaire (tendance)
      2. Saisonnalité hebdomadaire (si ≥ 14 mesures)
      3. Résidu  = y - tendance - saisonnalité
      4. ARMA(1,1) sur le résidu  (optimisation par algorithme des innovations)
      5. Reconstruction : prédiction = tendance_future + saisonnalité_future + résidu_prédit
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
            "suffisant":   False,
            "nb_mesures":  len(mesures),
            "requis":      MIN_POINTS,
            "type_nom":    type_mesure.nom,
            "type_unite":  type_mesure.unite,
        }

    x_ts = np.array([m.date_mesure.timestamp() for m in mesures], dtype=float)
    y    = np.array([float(m.valeur) for m in mesures])

    # ── 1. Tendance linéaire ──────────────────────────────────────────────────
    slope, intercept, r_value = _linear_trend(x_ts, y)
    trend = slope * x_ts + intercept
    detrended = y - trend

    # ── 2. Saisonnalité hebdomadaire ──────────────────────────────────────────
    seasonal, day_idx = _seasonal_component(x_ts, detrended, period=7)
    residuals = detrended - seasonal

    # ── 3. ARMA(1,1) sur les résidus ─────────────────────────────────────────
    phi, theta, sigma2 = _fit_arma11(residuals)
    sigma = float(np.sqrt(max(sigma2, 0.0)))

    # Intervalle de confiance :  σ · 1.96 · √(1 + φ² + φ⁴ + … + φ^{2(h-1)})
    def _ci(h: int) -> float:
        variance_factor = sum(phi ** (2 * k) for k in range(h))
        return round(sigma * 1.96 * float(np.sqrt(max(variance_factor, 1.0))), 2)

    # ── 4. Reconstruction des prévisions ─────────────────────────────────────
    last_ts = x_ts[-1]
    arma_preds = _predict_arma11(phi, theta, residuals, jours_futur)

    # Tableau des valeurs saisonnières par jour de semaine (pour réutilisation)
    season_by_day: dict[int, float] = {}
    if day_idx is not None:
        seasonal_mean = float(seasonal.mean())
        for d in range(7):
            mask = day_idx == d
            if mask.sum() > 0:
                season_by_day[d] = float(detrended[mask].mean()) - seasonal_mean

    predictions = []
    for i, arma_val in enumerate(arma_preds, start=1):
        future_ts = last_ts + i * 86400.0
        future_dt = datetime.fromtimestamp(future_ts)

        trend_future = slope * future_ts + intercept
        season_future = season_by_day.get(int(future_ts // 86400) % 7, 0.0)
        pred_y = trend_future + season_future + arma_val

        predictions.append({
            "date":                  future_dt.strftime("%Y-%m-%dT%H:%M:%S"),
            "label":                 f"J+{i}",
            "valeur_predite":        round(pred_y, 2),
            "intervalle_confiance":  _ci(i),
        })

    # ── 5. Métriques & alertes ────────────────────────────────────────────────
    r2 = r_value ** 2
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

    return {
        "suffisant":          True,
        "type_id":            type_id,
        "type_nom":           type_mesure.nom,
        "type_unite":         type_mesure.unite,
        "nb_mesures":         len(mesures),
        "pente":              round(slope, 6),
        "r_squared":          round(r2, 3),
        "phi_ar":             round(phi, 4),
        "theta_ma":           round(theta, 4),
        "tendance":           "hausse" if slope > 1e-8 else "baisse" if slope < -1e-8 else "stable",
        "fiabilite":          "haute" if r2 > 0.7 else "moyenne" if r2 > 0.4 else "faible",
        "predictions":        predictions,
        "alerte_predictive":  alerte_predictive,
        "seuil_min_normal":   type_mesure.seuil_min_normal,
        "seuil_max_normal":   type_mesure.seuil_max_normal,
        "seuil_danger_bas":   type_mesure.seuil_danger_bas,
        "seuil_danger_haut":  type_mesure.seuil_danger_haut,
    }
