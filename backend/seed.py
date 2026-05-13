"""
Script de seed pour initialiser les types de mesures dans la base.

Usage (depuis le dossier backend, venv activé) :
    python seed.py

Idempotent : peut être relancé sans erreur.
"""

from app import create_app
from app.extensions import db
from app.models.type_mesure import TypeMesure

TYPES_MESURE = [
    {
        "nom":                   "Glycémie",
        "unite":                 "g/L",
        "seuil_min_normal":      0.70,
        "seuil_max_normal":      1.10,
        "seuil_danger_bas":      0.50,
        "seuil_danger_haut":     3.00,
        "ponderation_vitascore": 0.90,
        "description":           "Taux de glucose dans le sang. Mesure idéalement à jeun. Valeur normale entre 0,70 et 1,10 g/L.",
        "ordre_affichage":       1,
    },
    {
        "nom":                   "Tension artérielle",
        "unite":                 "mmHg",
        "seuil_min_normal":      90.0,
        "seuil_max_normal":      140.0,
        "seuil_danger_bas":      70.0,
        "seuil_danger_haut":     180.0,
        "ponderation_vitascore": 0.90,
        "description":           "Pression artérielle systolique (valeur haute). Valeur normale : 90–140 mmHg. La diastolique peut être saisie en composante.",
        "ordre_affichage":       2,
    },
    {
        "nom":                   "Fréquence cardiaque",
        "unite":                 "bpm",
        "seuil_min_normal":      50.0,
        "seuil_max_normal":      100.0,
        "seuil_danger_bas":      35.0,
        "seuil_danger_haut":     150.0,
        "ponderation_vitascore": 0.80,
        "description":           "Nombre de battements cardiaques par minute, au repos. Valeur normale : 60–100 bpm.",
        "ordre_affichage":       3,
    },
    {
        "nom":                   "SpO2",
        "unite":                 "%",
        "seuil_min_normal":      95.0,
        "seuil_max_normal":      100.0,
        "seuil_danger_bas":      88.0,
        "seuil_danger_haut":     None,
        "ponderation_vitascore": 1.00,
        "description":           "Saturation en oxygène du sang mesurée par oxymètre de pouls. Valeur normale ≥ 95 %.",
        "ordre_affichage":       4,
    },
    {
        "nom":                   "Température",
        "unite":                 "°C",
        "seuil_min_normal":      36.1,
        "seuil_max_normal":      37.8,
        "seuil_danger_bas":      35.0,
        "seuil_danger_haut":     40.0,
        "ponderation_vitascore": 0.60,
        "description":           "Température corporelle. Valeur normale : 36,1–37,8 °C. Fièvre au-delà de 38 °C.",
        "ordre_affichage":       5,
    },
    {
        "nom":                   "Poids",
        "unite":                 "kg",
        "seuil_min_normal":      None,
        "seuil_max_normal":      None,
        "seuil_danger_bas":      None,
        "seuil_danger_haut":     None,
        "ponderation_vitascore": 0.50,
        "description":           "Poids corporel en kilogrammes. Suivi de l'évolution dans le temps.",
        "ordre_affichage":       6,
    },
    {
        "nom":                   "IMC",
        "unite":                 "kg/m²",
        "seuil_min_normal":      18.5,
        "seuil_max_normal":      25.0,
        "seuil_danger_bas":      14.0,
        "seuil_danger_haut":     40.0,
        "ponderation_vitascore": 0.70,
        "description":           "Indice de Masse Corporelle = poids (kg) / taille² (m²). Normal : 18,5–25.",
        "ordre_affichage":       7,
    },
    {
        "nom":                   "Cholestérol",
        "unite":                 "g/L",
        "seuil_min_normal":      None,
        "seuil_max_normal":      2.00,
        "seuil_danger_bas":      None,
        "seuil_danger_haut":     3.00,
        "ponderation_vitascore": 0.70,
        "description":           "Cholestérol total sanguin. Objectif < 2 g/L. HDL peut être saisi en composante.",
        "ordre_affichage":       8,
    },
    {
        "nom":                   "Triglycérides",
        "unite":                 "g/L",
        "seuil_min_normal":      None,
        "seuil_max_normal":      1.50,
        "seuil_danger_bas":      None,
        "seuil_danger_haut":     5.00,
        "ponderation_vitascore": 0.50,
        "description":           "Taux de triglycérides sanguin. Valeur normale < 1,50 g/L.",
        "ordre_affichage":       9,
    },
    {
        "nom":                   "Créatinine",
        "unite":                 "mg/L",
        "seuil_min_normal":      6.0,
        "seuil_max_normal":      13.0,
        "seuil_danger_bas":      None,
        "seuil_danger_haut":     20.0,
        "ponderation_vitascore": 0.50,
        "description":           "Déchet azoté dosé dans le sang, reflet de la fonction rénale. Normale : 6–13 mg/L.",
        "ordre_affichage":       10,
    },
]


def seed_types_mesure():
    inserted = 0
    skipped  = 0

    for data in TYPES_MESURE:
        exists = TypeMesure.query.filter_by(nom=data["nom"]).first()
        if exists:
            skipped += 1
            print(f"  [SKIP]   {data['nom']} — déjà présent (id={exists.id})")
            continue

        t = TypeMesure(**data)
        db.session.add(t)
        inserted += 1
        print(f"  [INSERT] {data['nom']} ({data['unite']})")

    db.session.commit()
    print(f"\n✅  Seed terminé : {inserted} inséré(s), {skipped} ignoré(s).")


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        print("🌱  Seed types_mesure...\n")
        seed_types_mesure()
