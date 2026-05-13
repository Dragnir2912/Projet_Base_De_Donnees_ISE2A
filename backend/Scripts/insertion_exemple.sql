-- =====================================================
-- SOTERA — Données de test
-- =====================================================
-- IDENTIFIANTS DE CONNEXION
-- -------------------------------------------------
-- 👤 PATIENT
--    Email    : aminata.diallo@email.com
--    Password : Patient123!
--
-- 🩺 MÉDECIN
--    Email    : dr.kouassi@sotera.ci
--    Password : Medecin123!
-- =====================================================

ROLLBACK;  -- Assurez-vous de ne pas exécuter ce script en production sans révision préalable
-- Désactiver les contraintes FK temporairement
SET session_replication_role = replica;

-- Vider toutes les tables
TRUNCATE TABLE sessions_ia               RESTART IDENTITY CASCADE;
TRUNCATE TABLE conversations_ia          RESTART IDENTITY CASCADE;
TRUNCATE TABLE demandes_relation         RESTART IDENTITY CASCADE;
TRUNCATE TABLE annotations_medecin       RESTART IDENTITY CASCADE;
TRUNCATE TABLE messages                  RESTART IDENTITY CASCADE;
TRUNCATE TABLE consultations             RESTART IDENTITY CASCADE;
TRUNCATE TABLE alertes                   RESTART IDENTITY CASCADE;
TRUNCATE TABLE mesures_composantes       RESTART IDENTITY CASCADE;
TRUNCATE TABLE mesures                   RESTART IDENTITY CASCADE;
TRUNCATE TABLE preferences_utilisateur   RESTART IDENTITY CASCADE;
TRUNCATE TABLE relations_medecin_patient RESTART IDENTITY CASCADE;
TRUNCATE TABLE types_mesure              RESTART IDENTITY CASCADE;
TRUNCATE TABLE utilisateurs              RESTART IDENTITY CASCADE;

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;

BEGIN;

-- =====================================================
-- 1. UTILISATEURS
-- =====================================================

INSERT INTO utilisateurs (
    id, email, mot_de_passe_hash, nom, prenom, role,
    date_naissance, taille_cm, actif
) VALUES
(
    1,
    'aminata.diallo@email.com',
    '$2b$12$O.wVPleGmAUmDPOdkmGyY.qpTA8cGskIZ7CVObzelr.ZuCYGGxz4O',
    'Diallo', 'Aminata', 'patient',
    '1990-03-15', 165.0, TRUE
),
(
    2,
    'dr.kouassi@sotera.ci',
    '$2b$12$ajfovT4F3BoWMQv7xgLveuwi5DlpSyQDLDnn6Gq1TYJ4FweLqhXkW',
    'Kouassi', 'Emmanuel', 'medecin',
    '1978-07-22', 178.0, TRUE
);

-- Réinitialiser la séquence après insertion manuelle d'IDs
SELECT setval('utilisateurs_id_seq', 2);


-- =====================================================
-- 2. TYPES DE MESURE (référentiel OMS)
-- =====================================================

INSERT INTO types_mesure (
    id, nom, unite,
    seuil_min_normal, seuil_max_normal,
    seuil_danger_bas, seuil_danger_haut,
    ponderation_vitascore, description, ordre_affichage
) VALUES
(1,  'Poids',              'kg',    50.0,  90.0,   35.0,  150.0,  0.8,  'Poids corporel',                          1),
(2,  'Glycémie',           'g/L',   0.70,  1.10,   0.50,   2.50,  1.0,  'Taux de glucose dans le sang',            2),
(3,  'Tension systolique', 'mmHg', 90.0,  139.0,  70.0,  180.0,  1.0,  'Pression artérielle maximale (systole)',  3),
(4,  'SpO2',               '%',    95.0,  100.0,  88.0,   100.0,  0.9,  'Saturation en oxygène',                  4),
(5,  'Fréquence cardiaque','bpm',  60.0,   99.0,  40.0,  150.0,  0.7,  'Battements cardiaques par minute',        5),
(6,  'Température',        '°C',   36.1,   37.2,  35.0,   40.0,  0.6,  'Température corporelle',                  6),
(7,  'IMC',                'kg/m²',18.5,   24.9,  16.0,   40.0,  0.8,  'Indice de masse corporelle',              7);

SELECT setval('types_mesure_id_seq', 7);


-- =====================================================
-- 3. RELATION MÉDECIN — PATIENT
-- =====================================================

INSERT INTO relations_medecin_patient (
    medecin_id, patient_id, date_debut, active
) VALUES (2, 1, CURRENT_DATE - INTERVAL '3 months', TRUE);


-- =====================================================
-- 4. MESURES DU PATIENT — 30 derniers jours
-- =====================================================
-- Poids (quotidien — légère prise de poids)
-- Glycémie (tous les 2 jours — quelques pics)
-- Tension (hebdomadaire — légère hypertension)
-- SpO2 (hebdomadaire — normale)
-- Fréquence cardiaque (hebdomadaire)
-- Température (quelques relevés)
-- =====================================================

-- POIDS (kg) — mesures matinales, légère progression
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(1, 1, 68.2, NOW() - INTERVAL '30 days', 'au_repos', 'saisie'),
(1, 1, 68.4, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(1, 1, 68.1, NOW() - INTERVAL '26 days', 'au_repos', 'saisie'),
(1, 1, 68.6, NOW() - INTERVAL '24 days', 'au_repos', 'saisie'),
(1, 1, 68.9, NOW() - INTERVAL '22 days', 'au_repos', 'saisie'),
(1, 1, 69.0, NOW() - INTERVAL '20 days', 'au_repos', 'saisie'),
(1, 1, 69.2, NOW() - INTERVAL '18 days', 'au_repos', 'saisie'),
(1, 1, 68.8, NOW() - INTERVAL '16 days', 'au_repos', 'saisie'),
(1, 1, 69.4, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(1, 1, 69.1, NOW() - INTERVAL '12 days', 'au_repos', 'saisie'),
(1, 1, 69.6, NOW() - INTERVAL '10 days', 'au_repos', 'saisie'),
(1, 1, 69.8, NOW() - INTERVAL '8 days',  'au_repos', 'saisie'),
(1, 1, 70.0, NOW() - INTERVAL '6 days',  'au_repos', 'saisie'),
(1, 1, 70.2, NOW() - INTERVAL '4 days',  'au_repos', 'saisie'),
(1, 1, 70.1, NOW() - INTERVAL '2 days',  'au_repos', 'saisie'),
(1, 1, 70.3, NOW() - INTERVAL '1 day',   'au_repos', 'saisie');

-- GLYCÉMIE (g/L) — quelques pics post-repas (déclenchera alertes)
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(1, 2, 0.85, NOW() - INTERVAL '29 days', 'a_jeun',     'saisie'),
(1, 2, 1.45, NOW() - INTERVAL '27 days', 'post_repas', 'saisie'),
(1, 2, 0.90, NOW() - INTERVAL '25 days', 'a_jeun',     'saisie'),
(1, 2, 1.62, NOW() - INTERVAL '23 days', 'post_repas', 'saisie'),  -- ⚠️ attention
(1, 2, 0.88, NOW() - INTERVAL '21 days', 'a_jeun',     'saisie'),
(1, 2, 1.80, NOW() - INTERVAL '19 days', 'post_repas', 'saisie'),  -- ⚠️ attention
(1, 2, 0.92, NOW() - INTERVAL '17 days', 'a_jeun',     'saisie'),
(1, 2, 1.15, NOW() - INTERVAL '15 days', 'post_repas', 'saisie'),
(1, 2, 0.87, NOW() - INTERVAL '13 days', 'a_jeun',     'saisie'),
(1, 2, 2.60, NOW() - INTERVAL '11 days', 'post_repas', 'saisie'),  -- 🚨 DANGER
(1, 2, 0.95, NOW() - INTERVAL '9 days',  'a_jeun',     'saisie'),
(1, 2, 1.20, NOW() - INTERVAL '7 days',  'post_repas', 'saisie'),
(1, 2, 0.91, NOW() - INTERVAL '5 days',  'a_jeun',     'saisie'),
(1, 2, 1.35, NOW() - INTERVAL '3 days',  'post_repas', 'saisie'),
(1, 2, 0.94, NOW() - INTERVAL '1 day',   'a_jeun',     'saisie');

-- TENSION SYSTOLIQUE (mmHg) — légère hypertension progressive
-- Note : la composante diastolique est dans mesures_composantes
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(1, 3, 128.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(1, 3, 132.0, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(1, 3, 138.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(1, 3, 142.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),  -- ⚠️ attention
(1, 3, 145.0, NOW() - INTERVAL '2 days',  'au_repos', 'saisie');  -- ⚠️ attention

-- SpO2 (%) — normale tout au long du mois
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(1, 4, 98.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(1, 4, 97.0, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(1, 4, 98.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(1, 4, 97.5, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(1, 4, 98.0, NOW() - INTERVAL '1 day',   'au_repos', 'saisie');

-- FRÉQUENCE CARDIAQUE (bpm)
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(1, 5, 78.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(1, 5, 82.0, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(1, 5, 75.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(1, 5, 88.0, NOW() - INTERVAL '7 days',  'apres_effort', 'saisie'),
(1, 5, 76.0, NOW() - INTERVAL '1 day',   'au_repos', 'saisie');

-- TEMPÉRATURE (°C)
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(1, 6, 36.8, NOW() - INTERVAL '20 days', 'au_repos', 'saisie'),
(1, 6, 37.6, NOW() - INTERVAL '15 days', 'au_repos', 'saisie'),  -- ⚠️ légère fièvre
(1, 6, 36.9, NOW() - INTERVAL '10 days', 'au_repos', 'saisie'),
(1, 6, 36.7, NOW() - INTERVAL '3 days',  'au_repos', 'saisie');


-- =====================================================
-- 5. COMPOSANTES DIASTOLIQUES (tension)
-- =====================================================
-- On récupère les IDs des mesures de tension insérées

INSERT INTO mesures_composantes (mesure_id, composante, valeur)
SELECT m.id, 'diastolique',
    CASE
        WHEN m.valeur = 128.0 THEN 82.0
        WHEN m.valeur = 132.0 THEN 85.0
        WHEN m.valeur = 138.0 THEN 88.0
        WHEN m.valeur = 142.0 THEN 91.0
        WHEN m.valeur = 145.0 THEN 93.0
    END
FROM mesures m
WHERE m.patient_id = 1
  AND m.type_mesure_id = 3
ORDER BY m.date_mesure;


-- =====================================================
-- 6. CONSULTATION MÉDICALE
-- =====================================================

INSERT INTO consultations (
    medecin_id, patient_id, date_consultation,
    diagnostic, recommandations, statut
) VALUES (
    2, 1,
    NOW() - INTERVAL '10 days',
    'Patiente présentant une légère prise de poids (+2 kg en 1 mois) et des pics glycémiques post-prandiaux élevés. Tension artérielle en hausse progressive. Surveillance recommandée.',
    'Réduire les sucres rapides et les plats en sauce. Reprendre une activité physique modérée (30 min de marche quotidienne). Contrôle glycémique à jeun dans 2 semaines. Réévaluation tensionnelle dans 1 mois.',
    'valide'
);


-- =====================================================
-- 7. ANNOTATION DU MÉDECIN sur la mesure de glycémie critique
-- =====================================================

INSERT INTO annotations_medecin (medecin_id, mesure_id, commentaire)
SELECT
    2,
    m.id,
    'Pic glycémique très élevé (2.60 g/L post-repas). À surveiller de près. Demander un bilan HbA1c si cela se répète.'
FROM mesures m
WHERE m.patient_id = 1
  AND m.type_mesure_id = 2
  AND m.valeur = 2.60
LIMIT 1;


-- =====================================================
-- 8. MESSAGES entre patient et médecin
-- =====================================================

INSERT INTO messages (
    conversation_id, expediteur_id, destinataire_id,
    contenu, envoye_le, lu, lu_le
) VALUES
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    1, 2,
    'Bonjour Docteur Kouassi, je voulais vous signaler que je me sens un peu fatiguée ces derniers jours et que j''ai souvent soif. Est-ce lié à ma glycémie ?',
    NOW() - INTERVAL '11 days',
    TRUE,
    NOW() - INTERVAL '11 days' + INTERVAL '2 hours'
),
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    2, 1,
    'Bonjour Aminata, en effet ces symptômes (fatigue, soif excessive) peuvent être liés à vos pics glycémiques. J''ai noté votre mesure de 2.60 g/L qui est préoccupante. Je vous recommande de limiter les sucres rapides et de venir me voir rapidement pour un bilan complet.',
    NOW() - INTERVAL '11 days' + INTERVAL '3 hours',
    TRUE,
    NOW() - INTERVAL '10 days'
),
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    1, 2,
    'Merci Docteur, je ferai attention. J''ai pris rendez-vous pour la semaine prochaine.',
    NOW() - INTERVAL '10 days' + INTERVAL '1 hour',
    TRUE,
    NOW() - INTERVAL '10 days' + INTERVAL '4 hours'
),
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    2, 1,
    'Parfait Aminata. En attendant, continuez à surveiller votre glycémie à jeun chaque matin et notez ce que vous mangez. À bientôt.',
    NOW() - INTERVAL '9 days',
    FALSE,
    NULL
);


-- =====================================================
-- 9. PRÉFÉRENCES UTILISATEUR
-- =====================================================

INSERT INTO preferences_utilisateur (user_id, cle, valeur) VALUES
(1, 'canal_alerte',        'email'),
(1, 'langue',              'fr'),
(1, 'vitascore_visible',   'true'),
(1, 'dashboard_compact',   'false'),
(2, 'canal_alerte',        'email'),
(2, 'langue',              'fr'),
(2, 'dashboard_compact',   'false');


-- =====================================================
-- 10. CONVERSATION IA (historique d'exemple)
-- =====================================================

INSERT INTO conversations_ia (
    patient_id, session_id, ordre_dans_session,
    role, message, date_message, model_utilise, tokens_estimes, anonymise, supprime
) VALUES
(
    1,
    'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
    0, 'user',
    'Bonjour Sotera, ma glycémie était à 2.60 g/L après le repas hier soir. Est-ce grave ?',
    NOW() - INTERVAL '11 days' + INTERVAL '30 minutes',
    'gemini-1.5-pro', 45, FALSE, FALSE
),
(
    1,
    'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
    1, 'assistant',
    'Bonjour Aminata. Une glycémie post-prandiale de 2.60 g/L est effectivement élevée — la norme après un repas est généralement inférieure à 1.40 g/L. Ce n''est pas une urgence immédiate, mais c''est un signal important à prendre au sérieux. Je vous recommande vivement d''en parler à votre médecin, le Dr Kouassi, qui suit votre dossier. En attendant, évitez les sucres rapides (sodas, pâtisseries, riz blanc) et préférez des féculents à index glycémique bas. Avez-vous d''autres symptômes comme une soif intense ou une fatigue inhabituelle ?',
    NOW() - INTERVAL '11 days' + INTERVAL '31 minutes',
    'gemini-1.5-pro', 180, FALSE, FALSE
),
(
    1,
    'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
    2, 'user',
    'Oui justement, je me sens très fatiguée et j''ai beaucoup soif depuis quelques jours.',
    NOW() - INTERVAL '11 days' + INTERVAL '33 minutes',
    'gemini-1.5-pro', 28, FALSE, FALSE
),
(
    1,
    'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
    3, 'assistant',
    'Ces symptômes — fatigue et soif excessive — combinés à votre pic glycémique sont des signaux que votre corps envoie. Ils peuvent indiquer que votre pancréas a du mal à réguler le sucre. Je vous encourage fortement à consulter le Dr Kouassi dans les 48 heures. D''ici là, buvez suffisamment d''eau, évitez les sucreries et reposez-vous. Je ne suis pas médecin et ne peux pas poser de diagnostic, mais votre santé mérite une attention professionnelle rapide.',
    NOW() - INTERVAL '11 days' + INTERVAL '34 minutes',
    'gemini-1.5-pro', 145, FALSE, FALSE
);

-- Métadonnées de session IA (titre généré)
INSERT INTO sessions_ia (patient_id, session_id, titre)
VALUES (
    1,
    'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
    'Glycémie post-repas élevée'
);

COMMIT;

-- =====================================================
-- RÉSUMÉ DES DONNÉES INSÉRÉES
-- =====================================================
-- ✅ 2 utilisateurs     (1 patient, 1 médecin)
-- ✅ 7 types de mesure  (référentiel OMS)
-- ✅ 1 relation         médecin ↔ patient
-- ✅ 45 mesures saisies sur 30 jours (poids, glycémie,
--                       tension, SpO2, FC, température)
-- ✅ 16 mesures IMC     calculées automatiquement
--                       par trigger à partir du Poids
--                       (taille Aminata = 165 cm)
-- ✅ 5 composantes      diastoliques (tension)
-- ✅ 1 consultation     médicale validée
-- ✅ 1 annotation       sur pic glycémique critique
-- ✅ 4 messages         dans une conversation
-- ✅ 7 préférences      utilisateur
-- ✅ 4 messages IA      (session Gemini)
-- ✅ 1 session IA       avec titre
--
-- ⚠️  Les triggers génèrent automatiquement :
--     - Les alertes pour les mesures hors seuils OMS
--     - Les mesures IMC pour chaque mesure de Poids
--       (trigger trg_calc_imc_auto)
-- =====================================================