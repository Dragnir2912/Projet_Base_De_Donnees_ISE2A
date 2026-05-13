-- =====================================================
-- SOTERA — Backfill IMC
-- =====================================================
-- Ce script calcule rétroactivement les mesures d'IMC
-- pour toutes les mesures de Poids existantes qui n'ont
-- pas encore d'IMC lié (source_mesure_id manquant).
--
-- À exécuter UNE SEULE FOIS sur une base existante
-- après l'ajout de la colonne source_mesure_id.
--
-- Prérequis :
--   - Migration c3d4e5f6a7b8 appliquée (source_mesure_id)
--   - Type "IMC" présent dans types_mesure
--   - taille_cm renseignée dans utilisateurs pour le calcul
--
-- Exécution :
--   psql -U sotera -d sotera_db -f backfill_imc.sql
-- =====================================================

ROLLBACK;

BEGIN;

-- Insérer les mesures IMC manquantes pour chaque mesure de Poids
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, source, source_mesure_id)
SELECT
    m.patient_id,
    (SELECT id FROM types_mesure WHERE nom = 'IMC'),
    ROUND(
        (m.valeur / POWER(u.taille_cm / 100.0, 2))::NUMERIC,
        1
    ) AS imc,
    m.date_mesure,
    'saisie',
    m.id
FROM  mesures m
JOIN  utilisateurs u  ON u.id = m.patient_id
JOIN  types_mesure t  ON t.id = m.type_mesure_id
WHERE t.nom       = 'Poids'
  AND u.taille_cm IS NOT NULL
  AND u.taille_cm  > 0
  AND NOT EXISTS (
      -- Ne pas recréer si un IMC lié existe déjà
      SELECT 1 FROM mesures imc
      WHERE imc.source_mesure_id = m.id
  );

-- Résumé
DO $$
DECLARE
    v_nb_poids INT;
    v_nb_imc   INT;
BEGIN
    SELECT COUNT(*) INTO v_nb_poids
    FROM mesures m
    JOIN types_mesure t ON t.id = m.type_mesure_id
    WHERE t.nom = 'Poids';

    SELECT COUNT(*) INTO v_nb_imc
    FROM mesures m
    JOIN types_mesure t ON t.id = m.type_mesure_id
    WHERE t.nom = 'IMC';

    RAISE NOTICE '✅ Backfill terminé : % mesure(s) Poids, % mesure(s) IMC', v_nb_poids, v_nb_imc;

    IF v_nb_poids != v_nb_imc THEN
        RAISE WARNING '⚠️  Parité non atteinte — vérifiez que taille_cm est renseigné pour tous les patients.';
    END IF;
END;
$$;

COMMIT;
