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

-- =====================================================
-- 11. NOUVEAUX UTILISATEURS — 5 patients + 2 médecins
-- =====================================================
-- Mots de passe patients : Patient123!
-- Mots de passe médecins : Medecin123!
-- =====================================================

INSERT INTO utilisateurs (
    id, email, mot_de_passe_hash, nom, prenom, role,
    date_naissance, taille_cm, actif
) VALUES
(
    3, 'ariel.hermas@email.com',
    '$2b$12$O.wVPleGmAUmDPOdkmGyY.qpTA8cGskIZ7CVObzelr.ZuCYGGxz4O',
    'Hermas', 'Ariël', 'patient',
    '2001-12-29', 174.0, TRUE
),
(
    4, 'sophie.marchand@email.com',
    '$2b$12$O.wVPleGmAUmDPOdkmGyY.qpTA8cGskIZ7CVObzelr.ZuCYGGxz4O',
    'Marchand', 'Sophie', 'patient',
    '1985-06-14', 162.0, TRUE
),
(
    5, 'kofi.asante@email.com',
    '$2b$12$O.wVPleGmAUmDPOdkmGyY.qpTA8cGskIZ7CVObzelr.ZuCYGGxz4O',
    'Asante', 'Kofi', 'patient',
    '1972-11-03', 180.0, TRUE
),
(
    6, 'fatou.traore@email.com',
    '$2b$12$O.wVPleGmAUmDPOdkmGyY.qpTA8cGskIZ7CVObzelr.ZuCYGGxz4O',
    'Traoré', 'Fatou', 'patient',
    '1998-09-22', 158.0, TRUE
),
(
    7, 'jeanpierre.lefebvre@email.com',
    '$2b$12$O.wVPleGmAUmDPOdkmGyY.qpTA8cGskIZ7CVObzelr.ZuCYGGxz4O',
    'Lefebvre', 'Jean-Pierre', 'patient',
    '1955-04-08', 175.0, TRUE
),
(
    8, 'dr.moreau@sotera.ci',
    '$2b$12$ajfovT4F3BoWMQv7xgLveuwi5DlpSyQDLDnn6Gq1TYJ4FweLqhXkW',
    'Moreau', 'Sylvie', 'medecin',
    '1975-02-18', 168.0, TRUE
),
(
    9, 'dr.asare@sotera.ci',
    '$2b$12$ajfovT4F3BoWMQv7xgLveuwi5DlpSyQDLDnn6Gq1TYJ4FweLqhXkW',
    'Asare', 'Kwame', 'medecin',
    '1968-11-12', 182.0, TRUE
);

SELECT setval('utilisateurs_id_seq', 9);


-- =====================================================
-- 12. RELATIONS MÉDECIN — PATIENT (3 nouvelles)
-- =====================================================

INSERT INTO relations_medecin_patient (medecin_id, patient_id, date_debut, active) VALUES
(8, 3, CURRENT_DATE - INTERVAL '2 months', TRUE),  -- Dr. Moreau → Ariël Hermas
(8, 4, CURRENT_DATE - INTERVAL '6 weeks',  TRUE),  -- Dr. Moreau → Sophie Marchand
(9, 5, CURRENT_DATE - INTERVAL '2 months', TRUE);  -- Dr. Asare  → Kofi Asante


-- =====================================================
-- 13. MESURES — Ariël Hermas (ID 3)
--     22 ans · 174 cm · 58-60 kg · actif et en bonne santé
-- =====================================================

-- POIDS (kg) — stable, légère variation autour de 59 kg
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(3, 1, 58.6, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(3, 1, 58.8, NOW() - INTERVAL '52 days', 'au_repos', 'saisie'),
(3, 1, 59.0, NOW() - INTERVAL '49 days', 'au_repos', 'saisie'),
(3, 1, 58.5, NOW() - INTERVAL '45 days', 'au_repos', 'saisie'),
(3, 1, 58.9, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(3, 1, 59.2, NOW() - INTERVAL '38 days', 'au_repos', 'saisie'),
(3, 1, 59.4, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(3, 1, 59.1, NOW() - INTERVAL '31 days', 'au_repos', 'saisie'),
(3, 1, 58.8, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(3, 1, 59.6, NOW() - INTERVAL '24 days', 'au_repos', 'saisie'),
(3, 1, 59.3, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(3, 1, 59.8, NOW() - INTERVAL '17 days', 'au_repos', 'saisie'),
(3, 1, 59.5, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(3, 1, 59.2, NOW() - INTERVAL '10 days', 'au_repos', 'saisie'),
(3, 1, 59.7, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(3, 1, 59.4, NOW() - INTERVAL '3 days',  'au_repos', 'saisie'),
(3, 1, 59.6, NOW() - INTERVAL '1 day',   'au_repos', 'saisie');

-- GLYCÉMIE (g/L) — normale, jeune et sain
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(3, 2, 0.82, NOW() - INTERVAL '55 days', 'a_jeun',     'saisie'),
(3, 2, 1.08, NOW() - INTERVAL '52 days', 'post_repas', 'saisie'),
(3, 2, 0.79, NOW() - INTERVAL '48 days', 'a_jeun',     'saisie'),
(3, 2, 1.12, NOW() - INTERVAL '45 days', 'post_repas', 'saisie'),
(3, 2, 0.85, NOW() - INTERVAL '41 days', 'a_jeun',     'saisie'),
(3, 2, 0.95, NOW() - INTERVAL '38 days', 'post_repas', 'saisie'),
(3, 2, 0.81, NOW() - INTERVAL '34 days', 'a_jeun',     'saisie'),
(3, 2, 1.05, NOW() - INTERVAL '31 days', 'post_repas', 'saisie'),
(3, 2, 0.83, NOW() - INTERVAL '27 days', 'a_jeun',     'saisie'),
(3, 2, 0.78, NOW() - INTERVAL '24 days', 'a_jeun',     'saisie'),
(3, 2, 1.10, NOW() - INTERVAL '20 days', 'post_repas', 'saisie'),
(3, 2, 0.86, NOW() - INTERVAL '17 days', 'a_jeun',     'saisie'),
(3, 2, 1.02, NOW() - INTERVAL '13 days', 'post_repas', 'saisie'),
(3, 2, 0.84, NOW() - INTERVAL '10 days', 'a_jeun',     'saisie'),
(3, 2, 0.88, NOW() - INTERVAL '6 days',  'a_jeun',     'saisie'),
(3, 2, 0.90, NOW() - INTERVAL '2 days',  'a_jeun',     'saisie');

-- TENSION SYSTOLIQUE (mmHg) — excellente, jeune adulte
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(3, 3, 114.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(3, 3, 118.0, NOW() - INTERVAL '49 days', 'au_repos', 'saisie'),
(3, 3, 116.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(3, 3, 120.0, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(3, 3, 115.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(3, 3, 119.0, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(3, 3, 117.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(3, 3, 122.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(3, 3, 116.0, NOW() - INTERVAL '1 day',   'au_repos', 'saisie');

-- SpO2 (%) — parfaite
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(3, 4, 99.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(3, 4, 98.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(3, 4, 99.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(3, 4, 98.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(3, 4, 99.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(3, 4, 99.0, NOW() - INTERVAL '1 day',   'au_repos', 'saisie');

-- FRÉQUENCE CARDIAQUE (bpm) — athlétique
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(3, 5, 65.0, NOW() - INTERVAL '56 days', 'au_repos',     'saisie'),
(3, 5, 72.0, NOW() - INTERVAL '49 days', 'apres_effort', 'saisie'),
(3, 5, 63.0, NOW() - INTERVAL '42 days', 'au_repos',     'saisie'),
(3, 5, 68.0, NOW() - INTERVAL '35 days', 'au_repos',     'saisie'),
(3, 5, 70.0, NOW() - INTERVAL '28 days', 'apres_effort', 'saisie'),
(3, 5, 64.0, NOW() - INTERVAL '21 days', 'au_repos',     'saisie'),
(3, 5, 67.0, NOW() - INTERVAL '14 days', 'au_repos',     'saisie'),
(3, 5, 62.0, NOW() - INTERVAL '7 days',  'au_repos',     'saisie'),
(3, 5, 66.0, NOW() - INTERVAL '1 day',   'au_repos',     'saisie');

-- TEMPÉRATURE (°C)
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(3, 6, 36.5, NOW() - INTERVAL '50 days', 'au_repos', 'saisie'),
(3, 6, 36.7, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(3, 6, 36.4, NOW() - INTERVAL '20 days', 'au_repos', 'saisie'),
(3, 6, 36.6, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(3, 6, 36.5, NOW() - INTERVAL '2 days',  'au_repos', 'saisie');

-- Composantes diastoliques tension — Ariël (valeurs jeune adulte ~76 mmHg)
INSERT INTO mesures_composantes (mesure_id, composante, valeur)
SELECT m.id, 'diastolique',
    CASE m.valeur
        WHEN 114.0 THEN 74.0  WHEN 118.0 THEN 76.0  WHEN 116.0 THEN 75.0
        WHEN 120.0 THEN 78.0  WHEN 115.0 THEN 74.0  WHEN 119.0 THEN 77.0
        WHEN 117.0 THEN 75.0  WHEN 122.0 THEN 79.0  WHEN 116.0 THEN 75.0
    END
FROM mesures m WHERE m.patient_id = 3 AND m.type_mesure_id = 3;


-- =====================================================
-- 14. MESURES — Sophie Marchand (ID 4)
--     39 ans · 162 cm · 68-72 kg · légère surcharge
-- =====================================================

-- POIDS (kg)
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(4, 1, 70.2, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(4, 1, 70.8, NOW() - INTERVAL '52 days', 'au_repos', 'saisie'),
(4, 1, 71.0, NOW() - INTERVAL '49 days', 'au_repos', 'saisie'),
(4, 1, 70.5, NOW() - INTERVAL '45 days', 'au_repos', 'saisie'),
(4, 1, 71.2, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(4, 1, 71.6, NOW() - INTERVAL '38 days', 'au_repos', 'saisie'),
(4, 1, 71.4, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(4, 1, 72.0, NOW() - INTERVAL '31 days', 'au_repos', 'saisie'),
(4, 1, 71.8, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(4, 1, 72.2, NOW() - INTERVAL '24 days', 'au_repos', 'saisie'),
(4, 1, 72.5, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(4, 1, 72.3, NOW() - INTERVAL '17 days', 'au_repos', 'saisie'),
(4, 1, 72.8, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(4, 1, 72.6, NOW() - INTERVAL '10 days', 'au_repos', 'saisie'),
(4, 1, 72.4, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(4, 1, 72.9, NOW() - INTERVAL '3 days',  'au_repos', 'saisie');

-- GLYCÉMIE (g/L)
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(4, 2, 0.88, NOW() - INTERVAL '55 days', 'a_jeun',     'saisie'),
(4, 2, 1.25, NOW() - INTERVAL '52 days', 'post_repas', 'saisie'),
(4, 2, 0.92, NOW() - INTERVAL '48 days', 'a_jeun',     'saisie'),
(4, 2, 1.38, NOW() - INTERVAL '45 days', 'post_repas', 'saisie'),
(4, 2, 0.95, NOW() - INTERVAL '41 days', 'a_jeun',     'saisie'),
(4, 2, 1.42, NOW() - INTERVAL '38 days', 'post_repas', 'saisie'),
(4, 2, 0.90, NOW() - INTERVAL '34 days', 'a_jeun',     'saisie'),
(4, 2, 1.05, NOW() - INTERVAL '31 days', 'post_repas', 'saisie'),
(4, 2, 0.98, NOW() - INTERVAL '27 days', 'a_jeun',     'saisie'),
(4, 2, 1.30, NOW() - INTERVAL '24 days', 'post_repas', 'saisie'),
(4, 2, 0.94, NOW() - INTERVAL '20 days', 'a_jeun',     'saisie'),
(4, 2, 1.48, NOW() - INTERVAL '17 days', 'post_repas', 'saisie'),  -- ⚠️ attention
(4, 2, 0.97, NOW() - INTERVAL '13 days', 'a_jeun',     'saisie'),
(4, 2, 1.22, NOW() - INTERVAL '10 days', 'post_repas', 'saisie'),
(4, 2, 1.02, NOW() - INTERVAL '6 days',  'a_jeun',     'saisie'),
(4, 2, 1.35, NOW() - INTERVAL '2 days',  'post_repas', 'saisie');

-- TENSION SYSTOLIQUE (mmHg) — pré-hypertension
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(4, 3, 126.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(4, 3, 129.0, NOW() - INTERVAL '49 days', 'au_repos', 'saisie'),
(4, 3, 132.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(4, 3, 130.0, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(4, 3, 134.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(4, 3, 136.0, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(4, 3, 133.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(4, 3, 138.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),  -- ⚠️ attention
(4, 3, 135.0, NOW() - INTERVAL '2 days',  'au_repos', 'saisie');

-- SpO2
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(4, 4, 97.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(4, 4, 97.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(4, 4, 96.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(4, 4, 97.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(4, 4, 96.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(4, 4, 97.0, NOW() - INTERVAL '1 day',   'au_repos', 'saisie');

-- FRÉQUENCE CARDIAQUE
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(4, 5, 78.0, NOW() - INTERVAL '56 days', 'au_repos',     'saisie'),
(4, 5, 82.0, NOW() - INTERVAL '49 days', 'au_repos',     'saisie'),
(4, 5, 80.0, NOW() - INTERVAL '42 days', 'au_repos',     'saisie'),
(4, 5, 85.0, NOW() - INTERVAL '35 days', 'apres_effort', 'saisie'),
(4, 5, 79.0, NOW() - INTERVAL '28 days', 'au_repos',     'saisie'),
(4, 5, 83.0, NOW() - INTERVAL '21 days', 'au_repos',     'saisie'),
(4, 5, 80.0, NOW() - INTERVAL '14 days', 'au_repos',     'saisie'),
(4, 5, 84.0, NOW() - INTERVAL '7 days',  'au_repos',     'saisie'),
(4, 5, 81.0, NOW() - INTERVAL '2 days',  'au_repos',     'saisie');

-- TEMPÉRATURE
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(4, 6, 36.7, NOW() - INTERVAL '50 days', 'au_repos', 'saisie'),
(4, 6, 37.0, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(4, 6, 36.8, NOW() - INTERVAL '20 days', 'au_repos', 'saisie'),
(4, 6, 36.9, NOW() - INTERVAL '7 days',  'au_repos', 'saisie');

-- Composantes diastoliques — Sophie
INSERT INTO mesures_composantes (mesure_id, composante, valeur)
SELECT m.id, 'diastolique',
    CASE m.valeur
        WHEN 126.0 THEN 82.0  WHEN 129.0 THEN 84.0  WHEN 132.0 THEN 86.0
        WHEN 130.0 THEN 85.0  WHEN 134.0 THEN 87.0  WHEN 136.0 THEN 88.0
        WHEN 133.0 THEN 86.0  WHEN 138.0 THEN 90.0  WHEN 135.0 THEN 88.0
    END
FROM mesures m WHERE m.patient_id = 4 AND m.type_mesure_id = 3;


-- =====================================================
-- 15. MESURES — Kofi Asante (ID 5)
--     52 ans · 180 cm · 85-88 kg · hypertension, surpoids
-- =====================================================

-- POIDS (kg)
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(5, 1, 86.2, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(5, 1, 86.8, NOW() - INTERVAL '52 days', 'au_repos', 'saisie'),
(5, 1, 87.0, NOW() - INTERVAL '49 days', 'au_repos', 'saisie'),
(5, 1, 87.4, NOW() - INTERVAL '45 days', 'au_repos', 'saisie'),
(5, 1, 87.1, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(5, 1, 87.6, NOW() - INTERVAL '38 days', 'au_repos', 'saisie'),
(5, 1, 87.9, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(5, 1, 88.2, NOW() - INTERVAL '31 days', 'au_repos', 'saisie'),
(5, 1, 87.8, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(5, 1, 88.4, NOW() - INTERVAL '24 days', 'au_repos', 'saisie'),
(5, 1, 88.0, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(5, 1, 87.5, NOW() - INTERVAL '17 days', 'au_repos', 'saisie'),
(5, 1, 87.8, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(5, 1, 88.1, NOW() - INTERVAL '10 days', 'au_repos', 'saisie'),
(5, 1, 87.6, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(5, 1, 88.3, NOW() - INTERVAL '3 days',  'au_repos', 'saisie');

-- GLYCÉMIE (g/L) — borderline, tendance pré-diabétique
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(5, 2, 0.98, NOW() - INTERVAL '55 days', 'a_jeun',     'saisie'),
(5, 2, 1.55, NOW() - INTERVAL '52 days', 'post_repas', 'saisie'),
(5, 2, 1.05, NOW() - INTERVAL '48 days', 'a_jeun',     'saisie'),
(5, 2, 1.72, NOW() - INTERVAL '45 days', 'post_repas', 'saisie'),  -- ⚠️ attention
(5, 2, 1.02, NOW() - INTERVAL '41 days', 'a_jeun',     'saisie'),
(5, 2, 1.65, NOW() - INTERVAL '38 days', 'post_repas', 'saisie'),
(5, 2, 1.08, NOW() - INTERVAL '34 days', 'a_jeun',     'saisie'),
(5, 2, 1.80, NOW() - INTERVAL '31 days', 'post_repas', 'saisie'),  -- ⚠️ attention
(5, 2, 1.10, NOW() - INTERVAL '27 days', 'a_jeun',     'saisie'),
(5, 2, 2.10, NOW() - INTERVAL '24 days', 'post_repas', 'saisie'),  -- 🚨 DANGER
(5, 2, 1.15, NOW() - INTERVAL '20 days', 'a_jeun',     'saisie'),
(5, 2, 1.75, NOW() - INTERVAL '17 days', 'post_repas', 'saisie'),
(5, 2, 1.12, NOW() - INTERVAL '13 days', 'a_jeun',     'saisie'),
(5, 2, 1.60, NOW() - INTERVAL '10 days', 'post_repas', 'saisie'),
(5, 2, 1.08, NOW() - INTERVAL '6 days',  'a_jeun',     'saisie'),
(5, 2, 1.70, NOW() - INTERVAL '2 days',  'post_repas', 'saisie');

-- TENSION SYSTOLIQUE (mmHg) — hypertension stade 1-2
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(5, 3, 142.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),  -- ⚠️
(5, 3, 148.0, NOW() - INTERVAL '49 days', 'au_repos', 'saisie'),  -- ⚠️
(5, 3, 152.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),  -- ⚠️
(5, 3, 146.0, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(5, 3, 155.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),  -- ⚠️
(5, 3, 150.0, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(5, 3, 158.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),  -- 🚨
(5, 3, 154.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(5, 3, 160.0, NOW() - INTERVAL '2 days',  'au_repos', 'saisie');  -- 🚨

-- SpO2 (%) — légèrement diminuée
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(5, 4, 96.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(5, 4, 95.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(5, 4, 96.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(5, 4, 95.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(5, 4, 94.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),  -- ⚠️
(5, 4, 95.0, NOW() - INTERVAL '2 days',  'au_repos', 'saisie');

-- FRÉQUENCE CARDIAQUE (bpm) — élevée
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(5, 5, 88.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(5, 5, 92.0, NOW() - INTERVAL '49 days', 'au_repos', 'saisie'),
(5, 5, 86.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(5, 5, 90.0, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(5, 5, 95.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(5, 5, 88.0, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(5, 5, 93.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(5, 5, 90.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(5, 5, 92.0, NOW() - INTERVAL '2 days',  'au_repos', 'saisie');

-- TEMPÉRATURE
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(5, 6, 36.8, NOW() - INTERVAL '50 days', 'au_repos', 'saisie'),
(5, 6, 37.1, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(5, 6, 36.9, NOW() - INTERVAL '20 days', 'au_repos', 'saisie'),
(5, 6, 37.2, NOW() - INTERVAL '7 days',  'au_repos', 'saisie');

-- Composantes diastoliques — Kofi
INSERT INTO mesures_composantes (mesure_id, composante, valeur)
SELECT m.id, 'diastolique',
    CASE m.valeur
        WHEN 142.0 THEN 92.0  WHEN 148.0 THEN 95.0  WHEN 152.0 THEN 98.0
        WHEN 146.0 THEN 94.0  WHEN 155.0 THEN 100.0 WHEN 150.0 THEN 96.0
        WHEN 158.0 THEN 102.0 WHEN 154.0 THEN 99.0  WHEN 160.0 THEN 104.0
    END
FROM mesures m WHERE m.patient_id = 5 AND m.type_mesure_id = 3;


-- =====================================================
-- 16. MESURES — Fatou Traoré (ID 6)
--     25 ans · 158 cm · 55-57 kg · anémie légère possible
-- =====================================================

-- POIDS (kg)
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(6, 1, 55.4, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(6, 1, 55.2, NOW() - INTERVAL '49 days', 'au_repos', 'saisie'),
(6, 1, 55.8, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(6, 1, 56.0, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(6, 1, 55.6, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(6, 1, 56.2, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(6, 1, 55.9, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(6, 1, 56.4, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(6, 1, 56.1, NOW() - INTERVAL '2 days',  'au_repos', 'saisie');

-- GLYCÉMIE (g/L) — normale, légèrement basse parfois
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(6, 2, 0.76, NOW() - INTERVAL '54 days', 'a_jeun',     'saisie'),
(6, 2, 1.02, NOW() - INTERVAL '51 days', 'post_repas', 'saisie'),
(6, 2, 0.78, NOW() - INTERVAL '47 days', 'a_jeun',     'saisie'),
(6, 2, 0.88, NOW() - INTERVAL '40 days', 'a_jeun',     'saisie'),
(6, 2, 1.05, NOW() - INTERVAL '37 days', 'post_repas', 'saisie'),
(6, 2, 0.80, NOW() - INTERVAL '33 days', 'a_jeun',     'saisie'),
(6, 2, 0.75, NOW() - INTERVAL '26 days', 'a_jeun',     'saisie'),  -- ⚠️ légère hypoglycémie
(6, 2, 0.95, NOW() - INTERVAL '23 days', 'post_repas', 'saisie'),
(6, 2, 0.82, NOW() - INTERVAL '19 days', 'a_jeun',     'saisie'),
(6, 2, 0.79, NOW() - INTERVAL '12 days', 'a_jeun',     'saisie'),
(6, 2, 0.85, NOW() - INTERVAL '5 days',  'a_jeun',     'saisie');

-- TENSION SYSTOLIQUE (mmHg) — basse-normale jeune femme
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(6, 3, 108.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(6, 3, 112.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(6, 3, 110.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(6, 3, 114.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(6, 3, 111.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(6, 3, 109.0, NOW() - INTERVAL '2 days',  'au_repos', 'saisie');

-- SpO2 (%) — quelques baisses légères (anémie)
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(6, 4, 97.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(6, 4, 95.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),  -- ⚠️
(6, 4, 96.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(6, 4, 94.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),  -- ⚠️
(6, 4, 96.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(6, 4, 95.0, NOW() - INTERVAL '1 day',   'au_repos', 'saisie');

-- FRÉQUENCE CARDIAQUE
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(6, 5, 80.0, NOW() - INTERVAL '56 days', 'au_repos',     'saisie'),
(6, 5, 85.0, NOW() - INTERVAL '42 days', 'apres_effort', 'saisie'),
(6, 5, 78.0, NOW() - INTERVAL '28 days', 'au_repos',     'saisie'),
(6, 5, 82.0, NOW() - INTERVAL '14 days', 'au_repos',     'saisie'),
(6, 5, 76.0, NOW() - INTERVAL '7 days',  'au_repos',     'saisie'),
(6, 5, 79.0, NOW() - INTERVAL '2 days',  'au_repos',     'saisie');

-- TEMPÉRATURE
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(6, 6, 36.3, NOW() - INTERVAL '50 days', 'au_repos', 'saisie'),
(6, 6, 36.6, NOW() - INTERVAL '30 days', 'au_repos', 'saisie'),
(6, 6, 36.4, NOW() - INTERVAL '10 days', 'au_repos', 'saisie');

-- Composantes diastoliques — Fatou
INSERT INTO mesures_composantes (mesure_id, composante, valeur)
SELECT m.id, 'diastolique',
    CASE m.valeur
        WHEN 108.0 THEN 68.0  WHEN 112.0 THEN 72.0  WHEN 110.0 THEN 70.0
        WHEN 114.0 THEN 73.0  WHEN 111.0 THEN 71.0  WHEN 109.0 THEN 69.0
    END
FROM mesures m WHERE m.patient_id = 6 AND m.type_mesure_id = 3;


-- =====================================================
-- 17. MESURES — Jean-Pierre Lefebvre (ID 7)
--     69 ans · 175 cm · 78-82 kg · pré-diabétique, HTA stade 2
-- =====================================================

-- POIDS (kg)
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(7, 1, 80.2, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(7, 1, 80.6, NOW() - INTERVAL '52 days', 'au_repos', 'saisie'),
(7, 1, 81.0, NOW() - INTERVAL '49 days', 'au_repos', 'saisie'),
(7, 1, 80.8, NOW() - INTERVAL '45 days', 'au_repos', 'saisie'),
(7, 1, 81.4, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(7, 1, 81.2, NOW() - INTERVAL '38 days', 'au_repos', 'saisie'),
(7, 1, 81.8, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(7, 1, 82.0, NOW() - INTERVAL '31 days', 'au_repos', 'saisie'),
(7, 1, 81.6, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(7, 1, 82.4, NOW() - INTERVAL '24 days', 'au_repos', 'saisie'),
(7, 1, 82.2, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(7, 1, 81.9, NOW() - INTERVAL '17 days', 'au_repos', 'saisie'),
(7, 1, 82.6, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),
(7, 1, 82.3, NOW() - INTERVAL '10 days', 'au_repos', 'saisie'),
(7, 1, 82.8, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(7, 1, 82.5, NOW() - INTERVAL '3 days',  'au_repos', 'saisie');

-- GLYCÉMIE (g/L) — pré-diabétique, plusieurs valeurs critiques
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(7, 2, 1.08, NOW() - INTERVAL '55 days', 'a_jeun',     'saisie'),
(7, 2, 1.85, NOW() - INTERVAL '52 days', 'post_repas', 'saisie'),  -- ⚠️
(7, 2, 1.12, NOW() - INTERVAL '48 days', 'a_jeun',     'saisie'),
(7, 2, 2.20, NOW() - INTERVAL '45 days', 'post_repas', 'saisie'),  -- 🚨 DANGER
(7, 2, 1.18, NOW() - INTERVAL '41 days', 'a_jeun',     'saisie'),
(7, 2, 1.95, NOW() - INTERVAL '38 days', 'post_repas', 'saisie'),  -- ⚠️
(7, 2, 1.15, NOW() - INTERVAL '34 days', 'a_jeun',     'saisie'),
(7, 2, 2.40, NOW() - INTERVAL '31 days', 'post_repas', 'saisie'),  -- 🚨 DANGER
(7, 2, 1.20, NOW() - INTERVAL '27 days', 'a_jeun',     'saisie'),
(7, 2, 1.75, NOW() - INTERVAL '24 days', 'post_repas', 'saisie'),  -- ⚠️
(7, 2, 1.22, NOW() - INTERVAL '20 days', 'a_jeun',     'saisie'),
(7, 2, 2.60, NOW() - INTERVAL '17 days', 'post_repas', 'saisie'),  -- 🚨 DANGER
(7, 2, 1.16, NOW() - INTERVAL '13 days', 'a_jeun',     'saisie'),
(7, 2, 1.90, NOW() - INTERVAL '10 days', 'post_repas', 'saisie'),
(7, 2, 1.25, NOW() - INTERVAL '6 days',  'a_jeun',     'saisie'),
(7, 2, 2.10, NOW() - INTERVAL '2 days',  'post_repas', 'saisie');  -- 🚨

-- TENSION SYSTOLIQUE (mmHg) — HTA stade 2
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(7, 3, 158.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),  -- 🚨
(7, 3, 162.0, NOW() - INTERVAL '49 days', 'au_repos', 'saisie'),
(7, 3, 165.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(7, 3, 160.0, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(7, 3, 168.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),  -- 🚨
(7, 3, 163.0, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(7, 3, 170.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),  -- 🚨
(7, 3, 166.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(7, 3, 172.0, NOW() - INTERVAL '2 days',  'au_repos', 'saisie');  -- 🚨 danger

-- SpO2 (%) — diminuée
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(7, 4, 95.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(7, 4, 94.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),  -- ⚠️
(7, 4, 95.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),
(7, 4, 93.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),  -- ⚠️
(7, 4, 94.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(7, 4, 93.0, NOW() - INTERVAL '2 days',  'au_repos', 'saisie');

-- FRÉQUENCE CARDIAQUE
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(7, 5, 84.0, NOW() - INTERVAL '56 days', 'au_repos', 'saisie'),
(7, 5, 88.0, NOW() - INTERVAL '49 days', 'au_repos', 'saisie'),
(7, 5, 90.0, NOW() - INTERVAL '42 days', 'au_repos', 'saisie'),
(7, 5, 86.0, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),
(7, 5, 92.0, NOW() - INTERVAL '28 days', 'au_repos', 'saisie'),  -- ⚠️
(7, 5, 88.0, NOW() - INTERVAL '21 days', 'au_repos', 'saisie'),
(7, 5, 95.0, NOW() - INTERVAL '14 days', 'au_repos', 'saisie'),  -- ⚠️
(7, 5, 90.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie'),
(7, 5, 93.0, NOW() - INTERVAL '2 days',  'au_repos', 'saisie');

-- TEMPÉRATURE
INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, contexte, source) VALUES
(7, 6, 36.8, NOW() - INTERVAL '50 days', 'au_repos', 'saisie'),
(7, 6, 37.3, NOW() - INTERVAL '35 days', 'au_repos', 'saisie'),  -- ⚠️ fièvre légère
(7, 6, 36.9, NOW() - INTERVAL '20 days', 'au_repos', 'saisie'),
(7, 6, 37.0, NOW() - INTERVAL '7 days',  'au_repos', 'saisie');

-- Composantes diastoliques — Jean-Pierre
INSERT INTO mesures_composantes (mesure_id, composante, valeur)
SELECT m.id, 'diastolique',
    CASE m.valeur
        WHEN 158.0 THEN 98.0  WHEN 162.0 THEN 102.0 WHEN 165.0 THEN 104.0
        WHEN 160.0 THEN 100.0 WHEN 168.0 THEN 106.0 WHEN 163.0 THEN 102.0
        WHEN 170.0 THEN 108.0 WHEN 166.0 THEN 105.0 WHEN 172.0 THEN 110.0
    END
FROM mesures m WHERE m.patient_id = 7 AND m.type_mesure_id = 3;


-- =====================================================
-- 18. CONSULTATIONS — patients suivis par nouveaux médecins
-- =====================================================

-- Dr. Moreau → Ariël Hermas
INSERT INTO consultations (medecin_id, patient_id, date_consultation, diagnostic, recommandations, statut) VALUES
(8, 3,
 NOW() - INTERVAL '30 days',
 'Patient de 22 ans en excellente santé. Bilan de routine satisfaisant : glycémie, tension et SpO2 dans les normes. Poids stable à 59 kg pour 174 cm (IMC 19.5).',
 'Maintenir l''activité physique régulière. Alimentation équilibrée. Bilan annuel suffisant.',
 'valide'),
(8, 3,
 NOW() - INTERVAL '3 days',
 'Contrôle semestriel. Pas d''anomalie détectée. Bonne hygiène de vie.',
 'Continuer ainsi. Prochain bilan dans 6 mois.',
 'valide');

-- Dr. Moreau → Sophie Marchand
INSERT INTO consultations (medecin_id, patient_id, date_consultation, diagnostic, recommandations, statut) VALUES
(8, 4,
 NOW() - INTERVAL '42 days',
 'Patiente en léger surpoids (IMC 27.5). Tension en hausse progressive, pré-hypertension. Glycémie post-prandiale élevée à 1.48 g/L à surveiller.',
 'Réduire les apports caloriques et le sel. 30 min de marche quotidienne. Contrôle tensionnel hebdomadaire. Bilan lipidique à planifier.',
 'valide'),
(8, 4,
 NOW() - INTERVAL '7 days',
 'Tension toujours élevée (138/90). Pas d''amélioration significative malgré les recommandations hygiéno-diététiques.',
 'Introduction d''un traitement antihypertenseur envisagée si pas d''amélioration dans 4 semaines. Réduire le stress.',
 'valide');

-- Dr. Asare → Kofi Asante
INSERT INTO consultations (medecin_id, patient_id, date_consultation, diagnostic, recommandations, statut) VALUES
(9, 5,
 NOW() - INTERVAL '45 days',
 'Patient avec hypertension stade 1-2 et glycémie post-prandiale élevée (2.10 g/L). Risque cardiovasculaire modéré à élevé. Surpoids (IMC 27.2).',
 'Traitement antihypertenseur prescrit (Ramipril 5mg/j). Régime pauvre en sel et sucres rapides. Activité physique adaptée. Contrôle glycémique HbA1c.',
 'valide'),
(9, 5,
 NOW() - INTERVAL '14 days',
 'Tension légèrement améliorée sous traitement (150 vs 160 mmHg). Glycémie encore élevée. HbA1c à 6.8% — stade pré-diabétique confirmé.',
 'Augmenter Ramipril à 10mg/j. Consultation diabétologue recommandée. Régime strict. Prochain contrôle dans 3 semaines.',
 'valide');


-- =====================================================
-- 19. ANNOTATIONS DES MÉDECINS sur mesures critiques
-- =====================================================

-- Dr. Asare annote le pic glycémique de Kofi (2.10 g/L)
INSERT INTO annotations_medecin (medecin_id, mesure_id, commentaire)
SELECT 9, m.id,
    'Pic glycémique post-prandial à 2.10 g/L — seuil critique dépassé. HbA1c demandée. Consultation diabétologue programmée.'
FROM mesures m
WHERE m.patient_id = 5 AND m.type_mesure_id = 2 AND m.valeur = 2.10
LIMIT 1;

-- Dr. Asare annote la tension de Kofi (160 mmHg)
INSERT INTO annotations_medecin (medecin_id, mesure_id, commentaire)
SELECT 9, m.id,
    'Tension à 160/104 — HTA stade 2 confirmée. Adaptation thérapeutique en cours. Patient informé des risques cardiovasculaires.'
FROM mesures m
WHERE m.patient_id = 5 AND m.type_mesure_id = 3 AND m.valeur = 160.0
LIMIT 1;

-- Dr. Moreau annote la tension de Sophie (138 mmHg)
INSERT INTO annotations_medecin (medecin_id, mesure_id, commentaire)
SELECT 8, m.id,
    'Pré-hypertension persistante à 138/90 malgré les mesures hygiéno-diététiques. Réévaluation du traitement prévue.'
FROM mesures m
WHERE m.patient_id = 4 AND m.type_mesure_id = 3 AND m.valeur = 138.0
ORDER BY m.date_mesure DESC
LIMIT 1;


-- =====================================================
-- 20. MESSAGES entre médecins et patients suivis
-- =====================================================

-- Ariël → Dr. Moreau
INSERT INTO messages (conversation_id, expediteur_id, destinataire_id, contenu, envoye_le, lu, lu_le) VALUES
(
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    3, 8,
    'Bonjour Dr. Moreau, j''ai une question sur mes résultats de glycémie. Est-ce que des valeurs à 0.78 g/L à jeun sont normales ?',
    NOW() - INTERVAL '20 days',
    TRUE, NOW() - INTERVAL '20 days' + INTERVAL '1 hour'
),
(
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    8, 3,
    'Bonjour Ariël, oui tout à fait ! 0.78 g/L à jeun est une valeur normale. La fourchette normale se situe entre 0.70 et 1.10 g/L. Vos résultats sont excellents dans l''ensemble. Continuez comme ça !',
    NOW() - INTERVAL '20 days' + INTERVAL '2 hours',
    TRUE, NOW() - INTERVAL '19 days'
),

-- Sophie → Dr. Moreau
(
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    4, 8,
    'Docteur, je me sens souvent essoufflée le soir depuis 2 semaines. Est-ce lié à ma tension ?',
    NOW() - INTERVAL '10 days',
    TRUE, NOW() - INTERVAL '10 days' + INTERVAL '3 hours'
),
(
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    8, 4,
    'Bonjour Sophie, l''essoufflement peut effectivement être lié à votre pré-hypertension. Je vais planifier un ECG lors de votre prochaine consultation. En attendant, évitez les efforts brusques et reposez-vous davantage.',
    NOW() - INTERVAL '10 days' + INTERVAL '4 hours',
    FALSE, NULL
),

-- Kofi → Dr. Asare
(
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    5, 9,
    'Bonjour Docteur Asare, j''ai pris le Ramipril comme prescrit mais j''ai des maux de tête. C''est normal ?',
    NOW() - INTERVAL '8 days',
    TRUE, NOW() - INTERVAL '8 days' + INTERVAL '2 hours'
),
(
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    9, 5,
    'Bonjour Kofi. Les maux de tête peuvent être un effet secondaire temporaire du Ramipril, souvent lié à la baisse de tension. Si cela persiste plus d''une semaine ou s''intensifie, contactez-moi. Prenez bien le médicament le soir.',
    NOW() - INTERVAL '8 days' + INTERVAL '3 hours',
    TRUE, NOW() - INTERVAL '7 days'
);


-- =====================================================
-- 21. PRÉFÉRENCES DES NOUVEAUX UTILISATEURS
-- =====================================================

INSERT INTO preferences_utilisateur (user_id, cle, valeur) VALUES
(3, 'canal_alerte',      'email'),
(3, 'langue',            'fr'),
(3, 'vitascore_visible', 'true'),
(4, 'canal_alerte',      'email'),
(4, 'langue',            'fr'),
(4, 'vitascore_visible', 'true'),
(5, 'canal_alerte',      'email'),
(5, 'langue',            'fr'),
(5, 'vitascore_visible', 'true'),
(6, 'canal_alerte',      'email'),
(6, 'langue',            'fr'),
(6, 'vitascore_visible', 'true'),
(7, 'canal_alerte',      'email'),
(7, 'langue',            'fr'),
(7, 'vitascore_visible', 'true'),
(8, 'canal_alerte',      'email'),
(8, 'langue',            'fr'),
(9, 'canal_alerte',      'email'),
(9, 'langue',            'fr');


COMMIT;

-- =====================================================
-- RÉSUMÉ DES DONNÉES INSÉRÉES
-- =====================================================
-- ✅ 9 utilisateurs     (6 patients, 3 médecins)
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