-- =====================================================
-- SOTERA
--   1. CHECK avec sous-requêtes → remplacés par triggers BEFORE INSERT
--   2. valeur2 → table mesures_composantes (extensible)
--   3. Soft delete sur messages
--   4. Flag RGPD sur conversations_ia
--   5. Table preferences_utilisateur
--   6. Vue vue_dernieres_mesures_patient
--   7. Commentaires enrichis sur tous les objets
-- =====================================================


-- =====================================================
-- 1. TABLE : utilisateurs
-- =====================================================
-- Compte central pour patients et médecins.
-- Le champ 'role' détermine les droits d'accès.
-- =====================================================

CREATE TABLE utilisateurs (
    id                 SERIAL PRIMARY KEY,
    email              VARCHAR(150)  UNIQUE NOT NULL,
    mot_de_passe_hash  VARCHAR(256)  NOT NULL,
    nom                VARCHAR(100)  NOT NULL,
    prenom             VARCHAR(100)  NOT NULL,
    role               VARCHAR(20)   NOT NULL DEFAULT 'patient',
    date_naissance     DATE,
    taille_cm          FLOAT         CHECK (taille_cm > 0 AND taille_cm < 300),
    created_at         TIMESTAMP     NOT NULL DEFAULT NOW(),
    derniere_connexion TIMESTAMP,
    actif              BOOLEAN       NOT NULL DEFAULT TRUE,
    specialite         VARCHAR(100),

    CONSTRAINT ck_role_valid CHECK (role IN ('patient', 'medecin'))
);

COMMENT ON TABLE  utilisateurs                    IS 'Comptes patients et médecins';
COMMENT ON COLUMN utilisateurs.role               IS 'patient | medecin';
COMMENT ON COLUMN utilisateurs.taille_cm          IS 'Pour calcul IMC, en centimètres';
COMMENT ON COLUMN utilisateurs.mot_de_passe_hash  IS 'Hash bcrypt — jamais le mot de passe en clair';
COMMENT ON COLUMN utilisateurs.specialite         IS 'Spécialité médicale (médecins uniquement)';

-- Index pour recherche rapide par email (connexion)
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);


-- =====================================================
-- 2. TABLE : types_mesure
-- =====================================================
-- Référentiel des indicateurs de santé avec leurs seuils OMS.
-- Pondération utilisée pour le VitaScore (0 = ignoré, 1 = poids max).
-- =====================================================

CREATE TABLE types_mesure (
    id                     SERIAL PRIMARY KEY,
    nom                    VARCHAR(100) NOT NULL UNIQUE,
    unite                  VARCHAR(20)  NOT NULL,
    seuil_min_normal       FLOAT,
    seuil_max_normal       FLOAT,
    seuil_danger_bas       FLOAT,
    seuil_danger_haut      FLOAT,
    ponderation_vitascore  FLOAT        DEFAULT 1.0
                               CHECK (ponderation_vitascore BETWEEN 0 AND 1),
    description            TEXT,
    ordre_affichage        INT          DEFAULT 0,

    CONSTRAINT ck_seuils_normaux_coherents CHECK (
        seuil_min_normal IS NULL OR seuil_max_normal IS NULL
        OR seuil_min_normal <= seuil_max_normal
    ),
    CONSTRAINT ck_seuils_danger_coherents CHECK (
        seuil_danger_bas IS NULL OR seuil_danger_haut IS NULL
        OR seuil_danger_bas <= seuil_danger_haut
    )
);

COMMENT ON TABLE  types_mesure                        IS 'Types d''indicateurs (poids, tension, glycémie…) avec seuils OMS';
COMMENT ON COLUMN types_mesure.ponderation_vitascore  IS 'Poids de cet indicateur dans le VitaScore (0 à 1)';
COMMENT ON COLUMN types_mesure.seuil_min_normal       IS 'Borne basse zone normale (OMS)';
COMMENT ON COLUMN types_mesure.seuil_max_normal       IS 'Borne haute zone normale (OMS)';
COMMENT ON COLUMN types_mesure.seuil_danger_bas       IS 'Borne basse zone danger — déclenche alerte rouge';
COMMENT ON COLUMN types_mesure.seuil_danger_haut      IS 'Borne haute zone danger — déclenche alerte rouge';


-- =====================================================
-- 3. TABLE : mesures
-- =====================================================
-- Stockage de la mesure principale saisie par le patient.
-- Les composantes additionnelles (ex. diastolique, HDL…)
-- sont stockées dans mesures_composantes.
-- =====================================================

CREATE TABLE mesures (
    id              SERIAL PRIMARY KEY,
    patient_id      INTEGER       NOT NULL,
    type_mesure_id  INTEGER       NOT NULL,
    valeur          FLOAT         NOT NULL CHECK (valeur > 0),
    date_mesure     TIMESTAMP     NOT NULL,
    contexte        VARCHAR(50),
    note            TEXT,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    source          VARCHAR(20)   DEFAULT 'saisie',
    source_mesure_id INTEGER,                             -- Lien vers la mesure d'origine (ex. IMC ← Poids)

    CONSTRAINT fk_mesures_patient FOREIGN KEY (patient_id)
        REFERENCES utilisateurs(id) ON DELETE CASCADE,
    CONSTRAINT fk_mesures_type FOREIGN KEY (type_mesure_id)
        REFERENCES types_mesure(id),
    CONSTRAINT ck_contexte_valid CHECK (
        contexte IS NULL
        OR contexte IN ('a_jeun', 'post_repas', 'au_repos', 'apres_effort', 'avant_coucher')
    ),
    CONSTRAINT ck_source_valid CHECK (
        source IN ('saisie', 'import_csv', 'api')
    ),
    CONSTRAINT fk_mesures_source FOREIGN KEY (source_mesure_id)
        REFERENCES mesures(id) ON DELETE CASCADE
);

COMMENT ON TABLE  mesures            IS 'Mesure principale de santé saisie par le patient';
COMMENT ON COLUMN mesures.valeur     IS 'Valeur principale (ex. systolique pour la tension, poids, glycémie…)';
COMMENT ON COLUMN mesures.contexte   IS 'NULL = non renseigné | a_jeun | post_repas | au_repos | apres_effort | avant_coucher';
COMMENT ON COLUMN mesures.source          IS 'saisie (manuelle) | import_csv | api (wearable…)';
COMMENT ON COLUMN mesures.source_mesure_id IS 'ID de la mesure d''origine pour les valeurs dérivées (ex. IMC calculé depuis Poids)';

-- Index pour récupérer les mesures d'un patient sur une période (courbes)
CREATE INDEX idx_mesures_patient_date ON mesures(patient_id, date_mesure DESC);
CREATE INDEX idx_mesures_type         ON mesures(type_mesure_id);
CREATE INDEX idx_mesures_source       ON mesures(source_mesure_id);


-- =====================================================
-- 3b. TABLE : mesures_composantes
-- =====================================================
-- Stocke les valeurs secondaires d'une mesure (ex. tension
-- diastolique, HDL, LDL…).
-- Extensible : aucun ALTER TABLE nécessaire pour un nouvel indicateur.
-- =====================================================

CREATE TABLE mesures_composantes (
    id          SERIAL PRIMARY KEY,
    mesure_id   INTEGER       NOT NULL,
    composante  VARCHAR(50)   NOT NULL,   -- ex. 'diastolique', 'HDL', 'LDL'
    valeur      FLOAT         NOT NULL CHECK (valeur > 0),

    CONSTRAINT fk_composante_mesure FOREIGN KEY (mesure_id)
        REFERENCES mesures(id) ON DELETE CASCADE,
    CONSTRAINT uk_mesure_composante UNIQUE (mesure_id, composante)
);

COMMENT ON TABLE  mesures_composantes             IS 'Valeurs secondaires d''une mesure (diastolique, HDL, LDL…)';
COMMENT ON COLUMN mesures_composantes.composante  IS 'Nom libre de la composante — ex. diastolique, HDL, LDL';
COMMENT ON COLUMN mesures_composantes.valeur      IS 'Valeur numérique de la composante';

CREATE INDEX idx_composantes_mesure ON mesures_composantes(mesure_id);


-- =====================================================
-- 4. TABLE : alertes
-- =====================================================
-- Alertes générées automatiquement (seuil dépassé ou tendance).
-- =====================================================

CREATE TABLE alertes (
    id           SERIAL PRIMARY KEY,
    patient_id   INTEGER      NOT NULL,
    mesure_id    INTEGER,
    type_alerte  VARCHAR(30)  NOT NULL,
    niveau       VARCHAR(20)  NOT NULL,
    message      TEXT         NOT NULL,
    vue          BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_alertes_patient FOREIGN KEY (patient_id)
        REFERENCES utilisateurs(id) ON DELETE CASCADE,
    CONSTRAINT fk_alertes_mesure FOREIGN KEY (mesure_id)
        REFERENCES mesures(id) ON DELETE SET NULL,
    CONSTRAINT ck_type_alerte CHECK (
        type_alerte IN ('seuil', 'tendance', 'correlation')
    ),
    CONSTRAINT ck_niveau_alerte CHECK (
        niveau IN ('attention', 'danger')
    )
);

COMMENT ON TABLE  alertes      IS 'Alertes de santé (seuils, tendances, corrélations)';
COMMENT ON COLUMN alertes.vue  IS 'TRUE = le patient a vu cette alerte (badge vidé)';

-- Index pour afficher rapidement les alertes non vues (badge)
CREATE INDEX idx_alertes_patient_vue ON alertes(patient_id, vue);


-- =====================================================
-- 5. TABLE : relations_medecin_patient
-- =====================================================
-- Table de liaison entre médecins et leurs patients.
-- La vérification des rôles est assurée par trigger
-- (plus fiable qu'un CHECK avec sous-requête).
-- =====================================================

CREATE TABLE relations_medecin_patient (
    id          SERIAL PRIMARY KEY,
    medecin_id  INTEGER  NOT NULL,
    patient_id  INTEGER  NOT NULL,
    date_debut  DATE     NOT NULL,
    date_fin    DATE,
    active      BOOLEAN  NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_rel_medecin FOREIGN KEY (medecin_id)
        REFERENCES utilisateurs(id) ON DELETE CASCADE,
    CONSTRAINT fk_rel_patient FOREIGN KEY (patient_id)
        REFERENCES utilisateurs(id) ON DELETE CASCADE,
    CONSTRAINT ck_dates_coherentes CHECK (
        date_fin IS NULL OR date_fin >= date_debut
    ),
    CONSTRAINT uk_medecin_patient_unique UNIQUE (medecin_id, patient_id)
);

COMMENT ON TABLE relations_medecin_patient  IS 'Quels médecins suivent quels patients';
COMMENT ON COLUMN relations_medecin_patient.active  IS 'FALSE = relation terminée (date_fin renseignée)';

-- Index pour lister rapidement les patients actifs d'un médecin
CREATE INDEX idx_rel_medecin_active ON relations_medecin_patient(medecin_id, active);
CREATE INDEX idx_rel_patient_active ON relations_medecin_patient(patient_id, active);


-- =====================================================
-- 5b. TABLE : demandes_relation
-- =====================================================
-- Demandes de mise en relation envoyées par un patient
-- à un médecin. Cycle : en_attente → acceptee | refusee.
-- Quand acceptée, crée une ligne dans relations_medecin_patient.
-- =====================================================

CREATE TABLE demandes_relation (
    id          SERIAL PRIMARY KEY,
    patient_id  INTEGER       NOT NULL,
    medecin_id  INTEGER       NOT NULL,
    statut      VARCHAR(20)   NOT NULL DEFAULT 'en_attente',
    message     TEXT,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_dem_patient FOREIGN KEY (patient_id)
        REFERENCES utilisateurs(id) ON DELETE CASCADE,
    CONSTRAINT fk_dem_medecin FOREIGN KEY (medecin_id)
        REFERENCES utilisateurs(id) ON DELETE CASCADE,
    CONSTRAINT ck_statut_demande CHECK (statut IN ('en_attente', 'acceptee', 'refusee')),
    CONSTRAINT uk_demande_patient_medecin UNIQUE (patient_id, medecin_id)
);

COMMENT ON TABLE  demandes_relation         IS 'Demandes de mise en relation patient → médecin';
COMMENT ON COLUMN demandes_relation.statut  IS 'en_attente | acceptee | refusee';

CREATE INDEX idx_demandes_medecin_statut ON demandes_relation(medecin_id, statut);
CREATE INDEX idx_demandes_patient        ON demandes_relation(patient_id);


-- =====================================================
-- 6. TABLE : consultations
-- =====================================================
-- Comptes-rendus de consultation rédigés par le médecin.
-- =====================================================

CREATE TABLE consultations (
    id                  SERIAL PRIMARY KEY,
    medecin_id          INTEGER     NOT NULL,
    patient_id          INTEGER     NOT NULL,
    date_consultation   TIMESTAMP   NOT NULL,
    diagnostic          TEXT,
    recommandations     TEXT,
    statut              VARCHAR(30) NOT NULL DEFAULT 'redige',
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_consult_medecin FOREIGN KEY (medecin_id)
        REFERENCES utilisateurs(id),
    CONSTRAINT fk_consult_patient FOREIGN KEY (patient_id)
        REFERENCES utilisateurs(id),
    CONSTRAINT ck_statut_consult CHECK (
        statut IN ('redige', 'valide', 'archive')
    )
);

COMMENT ON TABLE consultations  IS 'Comptes-rendus des consultations médicales';
COMMENT ON COLUMN consultations.statut  IS 'redige | valide | archive';

CREATE INDEX idx_consultations_patient_date ON consultations(patient_id, date_consultation DESC);


-- =====================================================
-- 7. TABLE : messages
-- =====================================================
-- Messagerie entre patient et médecin.
-- Soft delete : les suppressions n'effacent pas les données
-- (obligation de traçabilité médicale).
-- =====================================================

CREATE TABLE messages (
    id                           SERIAL PRIMARY KEY,
    conversation_id              UUID       NOT NULL,
    expediteur_id                INTEGER    NOT NULL,
    destinataire_id              INTEGER    NOT NULL,
    contenu                      TEXT       NOT NULL,
    envoye_le                    TIMESTAMP  NOT NULL DEFAULT NOW(),
    lu                           BOOLEAN    NOT NULL DEFAULT FALSE,
    lu_le                        TIMESTAMP,
    supprime_par_expediteur      BOOLEAN    NOT NULL DEFAULT FALSE,
    supprime_par_destinataire    BOOLEAN    NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_msg_expediteur FOREIGN KEY (expediteur_id)
        REFERENCES utilisateurs(id),
    CONSTRAINT fk_msg_destinataire FOREIGN KEY (destinataire_id)
        REFERENCES utilisateurs(id),
    CONSTRAINT ck_expediteur_destinataire_diff CHECK (
        expediteur_id != destinataire_id
    )
);

COMMENT ON TABLE  messages                                IS 'Messages échangés entre patient et médecin';
COMMENT ON COLUMN messages.conversation_id                IS 'UUID — regroupe tous les messages d''un même fil';
COMMENT ON COLUMN messages.supprime_par_expediteur        IS 'Soft delete côté expéditeur — message masqué, non effacé';
COMMENT ON COLUMN messages.supprime_par_destinataire      IS 'Soft delete côté destinataire — message masqué, non effacé';

-- Reconstitue l'ordre d'une conversation
CREATE INDEX idx_messages_conversation_date ON messages(conversation_id, envoye_le ASC);
-- Badges messages non lus
CREATE INDEX idx_messages_destinataire_non_lus ON messages(destinataire_id, lu, envoye_le);


-- =====================================================
-- 8. TABLE : conversations_ia
-- =====================================================
-- Historique des échanges avec l'assistant IA (Claude).
-- Champ anonymise pour conformité RGPD.
-- =====================================================

CREATE TABLE conversations_ia (
    id                   SERIAL PRIMARY KEY,
    patient_id           INTEGER     NOT NULL,
    session_id           UUID        NOT NULL,
    ordre_dans_session   INT         NOT NULL,
    role                 VARCHAR(20) NOT NULL,   -- 'user' | 'assistant'
    message              TEXT        NOT NULL,
    date_message         TIMESTAMP   NOT NULL DEFAULT NOW(),
    contexte_inclus      TEXT,
    model_utilise        VARCHAR(50),
    tokens_estimes       INT,
    anonymise            BOOLEAN     NOT NULL DEFAULT FALSE,
    supprime             BOOLEAN     NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_conv_ia_patient FOREIGN KEY (patient_id)
        REFERENCES utilisateurs(id) ON DELETE CASCADE,
    CONSTRAINT ck_role_ia CHECK (role IN ('user', 'assistant')),
    CONSTRAINT ck_ordre_positif CHECK (ordre_dans_session >= 0),
    CONSTRAINT uk_session_ordre UNIQUE (session_id, ordre_dans_session)
);

COMMENT ON TABLE  conversations_ia                    IS 'Historique des conversations avec l''assistant IA';
COMMENT ON COLUMN conversations_ia.session_id         IS 'UUID — identifie une session de conversation';
COMMENT ON COLUMN conversations_ia.ordre_dans_session IS 'Ordre chronologique dans la session (0, 1, 2…)';
COMMENT ON COLUMN conversations_ia.anonymise          IS 'TRUE = données anonymisées (conformité RGPD — droit à l''oubli)';
COMMENT ON COLUMN conversations_ia.supprime           IS 'TRUE = soft delete — session supprimée par le patient';

-- Reconstituer une conversation dans l'ordre (hors supprimés)
CREATE INDEX idx_ia_session_ordre    ON conversations_ia(session_id, ordre_dans_session ASC) WHERE supprime = FALSE;
-- Retrouver toutes les sessions d'un patient
CREATE INDEX idx_ia_patient_session  ON conversations_ia(patient_id, session_id, date_message DESC);


-- =====================================================
-- 8b. TABLE : sessions_ia
-- =====================================================
-- Métadonnées d'une session IA : titre et timestamps.
-- Le titre est généré automatiquement par Gemini à partir
-- du premier message, et peut être édité par le patient.
-- =====================================================

CREATE TABLE sessions_ia (
    id          SERIAL PRIMARY KEY,
    patient_id  INTEGER       NOT NULL,
    session_id  UUID          NOT NULL UNIQUE,
    titre       VARCHAR(100),
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_session_ia_patient FOREIGN KEY (patient_id)
        REFERENCES utilisateurs(id) ON DELETE CASCADE
);

COMMENT ON TABLE  sessions_ia            IS 'Métadonnées des sessions IA : titre généré par Gemini, editable';
COMMENT ON COLUMN sessions_ia.session_id IS 'Correspond à conversations_ia.session_id';
COMMENT ON COLUMN sessions_ia.titre      IS 'Titre auto-généré par Gemini (≤5 mots), modifiable par le patient';

CREATE INDEX idx_sessions_ia_patient ON sessions_ia(patient_id, updated_at DESC);

-- Trigger : updated_at automatique
CREATE OR REPLACE FUNCTION fcn_maj_session_ia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maj_session_ia_updated_at
BEFORE UPDATE ON sessions_ia
FOR EACH ROW
EXECUTE FUNCTION fcn_maj_session_ia_updated_at();


-- =====================================================
-- 9. TABLE : annotations_medecin
-- =====================================================
-- Le médecin peut commenter une mesure spécifique.
-- Le patient voit ce commentaire sur son graphique.
-- =====================================================

CREATE TABLE annotations_medecin (
    id           SERIAL PRIMARY KEY,
    medecin_id   INTEGER   NOT NULL,
    mesure_id    INTEGER   NOT NULL,
    commentaire  TEXT      NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_annot_medecin FOREIGN KEY (medecin_id)
        REFERENCES utilisateurs(id),
    CONSTRAINT fk_annot_mesure FOREIGN KEY (mesure_id)
        REFERENCES mesures(id) ON DELETE CASCADE,
    CONSTRAINT uk_medecin_mesure UNIQUE (medecin_id, mesure_id)
);

COMMENT ON TABLE annotations_medecin  IS 'Annotations médicales sur une mesure spécifique (visible patient)';

CREATE INDEX idx_annotations_mesure ON annotations_medecin(mesure_id);


-- =====================================================
-- 10. TABLE : preferences_utilisateur  [NOUVEAU]
-- =====================================================
-- Configuration souple des préférences par utilisateur.
-- Modèle clé/valeur — extensible sans ALTER TABLE.
-- Exemples : canal_alerte=email|push, langue=fr, dashboard_compact=true
-- =====================================================

CREATE TABLE preferences_utilisateur (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER       NOT NULL,
    cle         VARCHAR(100)  NOT NULL,
    valeur      TEXT          NOT NULL,
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pref_user FOREIGN KEY (user_id)
        REFERENCES utilisateurs(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_cle UNIQUE (user_id, cle)
);

COMMENT ON TABLE  preferences_utilisateur         IS 'Préférences utilisateur (notifications, affichage…) — modèle clé/valeur';
COMMENT ON COLUMN preferences_utilisateur.cle     IS 'Ex. canal_alerte, langue, vitascore_visible, dashboard_compact';
COMMENT ON COLUMN preferences_utilisateur.valeur  IS 'Valeur texte libre — parser côté applicatif selon la clé';

CREATE INDEX idx_prefs_user ON preferences_utilisateur(user_id);


-- =====================================================
-- =====================================================
-- TRIGGERS
-- =====================================================
-- =====================================================


-- =====================================================
-- TRIGGER 1 : Alerte automatique au dépassement de seuil
-- =====================================================
-- Dès qu'une mesure est insérée, vérifie si la valeur
-- dépasse les seuils OMS. Si oui, crée une alerte.
-- =====================================================

CREATE OR REPLACE FUNCTION fcn_calcul_alerte_seuil()
RETURNS TRIGGER AS $$
DECLARE
    v_seuil_min   FLOAT;
    v_seuil_max   FLOAT;
    v_danger_bas  FLOAT;
    v_danger_haut FLOAT;
    v_unite       VARCHAR(20);
    v_nom_type    VARCHAR(100);
    v_niveau      VARCHAR(20);
    v_message     TEXT;
BEGIN
    SELECT seuil_min_normal, seuil_max_normal,
           seuil_danger_bas, seuil_danger_haut,
           nom, unite
    INTO   v_seuil_min, v_seuil_max,
           v_danger_bas, v_danger_haut,
           v_nom_type, v_unite
    FROM   types_mesure
    WHERE  id = NEW.type_mesure_id;

    -- Zone DANGER (rouge)
    IF (v_danger_haut IS NOT NULL AND NEW.valeur > v_danger_haut)
    OR (v_danger_bas  IS NOT NULL AND NEW.valeur < v_danger_bas)  THEN
        v_niveau  := 'danger';
        v_message := format(
            '🚨 DANGER : %s = %s %s dépasse le seuil critique !',
            v_nom_type, NEW.valeur, v_unite
        );

    -- Zone ATTENTION (orange)
    ELSIF (v_seuil_max IS NOT NULL AND NEW.valeur > v_seuil_max)
       OR (v_seuil_min IS NOT NULL AND NEW.valeur < v_seuil_min) THEN
        v_niveau  := 'attention';
        v_message := format(
            '⚠️ Attention : %s = %s %s est en dehors de la zone normale',
            v_nom_type, NEW.valeur, v_unite
        );

    ELSE
        RETURN NEW;   -- Pas d'alerte
    END IF;

    INSERT INTO alertes (patient_id, mesure_id, type_alerte, niveau, message)
    VALUES (NEW.patient_id, NEW.id, 'seuil', v_niveau, v_message);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fcn_calcul_alerte_seuil()
    IS 'Déclenche une alerte seuil OMS à chaque nouvelle mesure';

CREATE TRIGGER trg_calcul_alerte_seuil
AFTER INSERT ON mesures
FOR EACH ROW
EXECUTE FUNCTION fcn_calcul_alerte_seuil();

COMMENT ON TRIGGER trg_calcul_alerte_seuil ON mesures
    IS 'Automatise la création d''alerte de seuil';


-- =====================================================
-- TRIGGER 2 : Calcul automatique de l'IMC depuis le Poids
-- =====================================================
-- À chaque INSERT ou UPDATE d'une mesure de type "Poids",
-- calcule automatiquement l'IMC (poids / taille²) et
-- insère ou met à jour la mesure IMC correspondante,
-- liée via source_mesure_id.
-- Prérequis : le patient doit avoir renseigné sa taille_cm.
-- =====================================================

CREATE OR REPLACE FUNCTION fcn_calc_imc_auto()
RETURNS TRIGGER AS $$
DECLARE
    v_taille_cm   FLOAT;
    v_imc_type_id INT;
    v_type_nom    VARCHAR(100);
    v_imc         FLOAT;
BEGIN
    -- Traiter uniquement les mesures de Poids
    SELECT nom INTO v_type_nom FROM types_mesure WHERE id = NEW.type_mesure_id;
    IF v_type_nom IS DISTINCT FROM 'Poids' THEN
        RETURN NEW;
    END IF;

    -- Récupérer la taille du patient
    SELECT taille_cm INTO v_taille_cm FROM utilisateurs WHERE id = NEW.patient_id;
    IF v_taille_cm IS NULL OR v_taille_cm <= 0 THEN
        RETURN NEW;  -- Impossible de calculer sans taille
    END IF;

    -- Récupérer l'ID du type IMC
    SELECT id INTO v_imc_type_id FROM types_mesure WHERE nom = 'IMC';
    IF v_imc_type_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calcul de l'IMC arrondi à 1 décimale
    v_imc := ROUND((NEW.valeur / POWER(v_taille_cm / 100.0, 2))::NUMERIC, 1);

    IF TG_OP = 'INSERT' THEN
        INSERT INTO mesures (patient_id, type_mesure_id, valeur, date_mesure, source, source_mesure_id)
        VALUES (NEW.patient_id, v_imc_type_id, v_imc, NEW.date_mesure, 'saisie', NEW.id);

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE mesures
        SET valeur      = v_imc,
            date_mesure = NEW.date_mesure
        WHERE source_mesure_id = NEW.id
          AND type_mesure_id   = v_imc_type_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fcn_calc_imc_auto()
    IS 'Calcule et synchronise automatiquement l''IMC à chaque mesure de Poids';

CREATE TRIGGER trg_calc_imc_auto
AFTER INSERT OR UPDATE ON mesures
FOR EACH ROW
EXECUTE FUNCTION fcn_calc_imc_auto();

COMMENT ON TRIGGER trg_calc_imc_auto ON mesures
    IS 'Maintient la parité Poids ↔ IMC : 1 Poids = 1 IMC, toujours synchronisés';


-- =====================================================
-- TRIGGER 3 : Mise à jour automatique de lu_le
-- =====================================================

CREATE OR REPLACE FUNCTION fcn_maj_lu_message()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lu = TRUE AND OLD.lu = FALSE THEN
        NEW.lu_le := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fcn_maj_lu_message()
    IS 'Enregistre automatiquement lu_le quand un message est marqué lu';

CREATE TRIGGER trg_mise_a_jour_lu_message
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION fcn_maj_lu_message();

COMMENT ON TRIGGER trg_mise_a_jour_lu_message ON messages
    IS 'Enregistre l''instant de lecture d''un message';


-- =====================================================
-- TRIGGER 3 : Vérification relation médecin-patient (messages)
-- =====================================================
-- Bloque tout message entre un médecin et un patient
-- non liés dans relations_medecin_patient.
-- =====================================================

CREATE OR REPLACE FUNCTION fcn_verifier_relation_medecin()
RETURNS TRIGGER AS $$
DECLARE
    v_role_exp  VARCHAR(20);
    v_role_dest VARCHAR(20);
BEGIN
    SELECT role INTO v_role_exp  FROM utilisateurs WHERE id = NEW.expediteur_id;
    SELECT role INTO v_role_dest FROM utilisateurs WHERE id = NEW.destinataire_id;

    -- Patient → Médecin
    IF v_role_exp = 'patient' AND v_role_dest = 'medecin' THEN
        IF NOT EXISTS (
            SELECT 1 FROM relations_medecin_patient
            WHERE medecin_id = NEW.destinataire_id
              AND patient_id = NEW.expediteur_id
              AND active = TRUE
        ) THEN
            RAISE EXCEPTION
                '❌ Ce médecin ne suit pas ce patient. Envoi impossible.';
        END IF;
    END IF;

    -- Médecin → Patient
    IF v_role_exp = 'medecin' AND v_role_dest = 'patient' THEN
        IF NOT EXISTS (
            SELECT 1 FROM relations_medecin_patient
            WHERE medecin_id = NEW.expediteur_id
              AND patient_id = NEW.destinataire_id
              AND active = TRUE
        ) THEN
            RAISE EXCEPTION
                '❌ Ce médecin ne suit pas ce patient. Envoi impossible.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fcn_verifier_relation_medecin()
    IS 'Vérifie que patient et médecin sont liés avant envoi d''un message';

CREATE TRIGGER trg_verifier_relation_medecin
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION fcn_verifier_relation_medecin();

COMMENT ON TRIGGER trg_verifier_relation_medecin ON messages
    IS 'Bloque les messages entre personnes non liées médicalement';


-- =====================================================
-- TRIGGER 4 : Vérification des rôles — relations_medecin_patient  [NOUVEAU]
-- =====================================================
-- Remplace les CHECK (SELECT role …) qui ne se ré-évaluent
-- pas lors d'un UPDATE de la table utilisateurs.
-- =====================================================

CREATE OR REPLACE FUNCTION fcn_verifier_roles_relation()
RETURNS TRIGGER AS $$
DECLARE
    v_role_medecin VARCHAR(20);
    v_role_patient VARCHAR(20);
BEGIN
    SELECT role INTO v_role_medecin FROM utilisateurs WHERE id = NEW.medecin_id;
    SELECT role INTO v_role_patient FROM utilisateurs WHERE id = NEW.patient_id;

    IF v_role_medecin IS DISTINCT FROM 'medecin' THEN
        RAISE EXCEPTION
            '❌ L''utilisateur % n''a pas le rôle médecin.', NEW.medecin_id;
    END IF;

    IF v_role_patient IS DISTINCT FROM 'patient' THEN
        RAISE EXCEPTION
            '❌ L''utilisateur % n''a pas le rôle patient.', NEW.patient_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fcn_verifier_roles_relation()
    IS 'Garantit que medecin_id est bien médecin et patient_id bien patient';

CREATE TRIGGER trg_verifier_roles_relation
BEFORE INSERT OR UPDATE ON relations_medecin_patient
FOR EACH ROW
EXECUTE FUNCTION fcn_verifier_roles_relation();

COMMENT ON TRIGGER trg_verifier_roles_relation ON relations_medecin_patient
    IS 'Valide les rôles avant toute insertion/modification de relation';


-- =====================================================
-- TRIGGER 5 : Vérification du rôle médecin — consultations  [NOUVEAU]
-- =====================================================

CREATE OR REPLACE FUNCTION fcn_verifier_role_medecin_consult()
RETURNS TRIGGER AS $$
DECLARE
    v_role VARCHAR(20);
BEGIN
    SELECT role INTO v_role FROM utilisateurs WHERE id = NEW.medecin_id;

    IF v_role IS DISTINCT FROM 'medecin' THEN
        RAISE EXCEPTION
            '❌ L''utilisateur % n''est pas un médecin.', NEW.medecin_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fcn_verifier_role_medecin_consult()
    IS 'Vérifie que l''auteur d''une consultation est bien un médecin';

CREATE TRIGGER trg_verifier_role_medecin_consult
BEFORE INSERT OR UPDATE ON consultations
FOR EACH ROW
EXECUTE FUNCTION fcn_verifier_role_medecin_consult();

COMMENT ON TRIGGER trg_verifier_role_medecin_consult ON consultations
    IS 'Valide le rôle médecin avant création d''une consultation';


-- =====================================================
-- TRIGGER 6 : Vérification du rôle médecin — annotations_medecin  [NOUVEAU]
-- =====================================================

CREATE OR REPLACE FUNCTION fcn_verifier_role_medecin_annot()
RETURNS TRIGGER AS $$
DECLARE
    v_role VARCHAR(20);
BEGIN
    SELECT role INTO v_role FROM utilisateurs WHERE id = NEW.medecin_id;

    IF v_role IS DISTINCT FROM 'medecin' THEN
        RAISE EXCEPTION
            '❌ L''utilisateur % n''est pas un médecin.', NEW.medecin_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fcn_verifier_role_medecin_annot()
    IS 'Vérifie que l''auteur d''une annotation est bien un médecin';

CREATE TRIGGER trg_verifier_role_medecin_annot
BEFORE INSERT OR UPDATE ON annotations_medecin
FOR EACH ROW
EXECUTE FUNCTION fcn_verifier_role_medecin_annot();

COMMENT ON TRIGGER trg_verifier_role_medecin_annot ON annotations_medecin
    IS 'Valide le rôle médecin avant création d''une annotation';


-- =====================================================
-- TRIGGER 7 : Mise à jour de preferences_utilisateur.updated_at  [NOUVEAU]
-- =====================================================

CREATE OR REPLACE FUNCTION fcn_maj_pref_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fcn_maj_pref_updated_at()
    IS 'Horodate automatiquement la dernière modification d''une préférence';

CREATE TRIGGER trg_maj_pref_updated_at
BEFORE UPDATE ON preferences_utilisateur
FOR EACH ROW
EXECUTE FUNCTION fcn_maj_pref_updated_at();

COMMENT ON TRIGGER trg_maj_pref_updated_at ON preferences_utilisateur
    IS 'Met à jour updated_at à chaque modification de préférence';


-- =====================================================
-- =====================================================
-- VUES UTILITAIRES
-- =====================================================
-- =====================================================


-- =====================================================
-- VUE 1 : Dernière mesure par patient et par type  [NOUVEAU]
-- =====================================================
-- Utilisée par le tableau de bord médecin et le résumé patient.
-- DISTINCT ON est la syntaxe PostgreSQL optimisée pour ce cas.
-- =====================================================

CREATE VIEW vue_dernieres_mesures_patient AS
SELECT DISTINCT ON (m.patient_id, m.type_mesure_id)
    m.patient_id,
    m.type_mesure_id,
    t.nom          AS nom_type,
    t.unite,
    m.valeur,
    m.date_mesure,
    m.contexte,
    -- Indique si la valeur est hors zone normale
    CASE
        WHEN (t.seuil_danger_haut IS NOT NULL AND m.valeur > t.seuil_danger_haut)
          OR (t.seuil_danger_bas  IS NOT NULL AND m.valeur < t.seuil_danger_bas)
        THEN 'danger'
        WHEN (t.seuil_max_normal IS NOT NULL AND m.valeur > t.seuil_max_normal)
          OR (t.seuil_min_normal IS NOT NULL AND m.valeur < t.seuil_min_normal)
        THEN 'attention'
        ELSE 'normal'
    END AS statut_seuil
FROM      mesures      m
JOIN      types_mesure t ON t.id = m.type_mesure_id
ORDER BY  m.patient_id, m.type_mesure_id, m.date_mesure DESC;

COMMENT ON VIEW vue_dernieres_mesures_patient
    IS 'Dernière valeur connue par patient et par type — optimisée pour tableaux de bord';


-- =====================================================
-- VUE 2 : Alertes non vues par patient  [NOUVEAU]
-- =====================================================

CREATE VIEW vue_alertes_non_vues AS
SELECT
    a.patient_id,
    u.nom || ' ' || u.prenom  AS patient_nom,
    count(*)                  AS nb_alertes,
    max(CASE WHEN a.niveau = 'danger' THEN 1 ELSE 0 END) = 1
                              AS a_une_alerte_danger
FROM  alertes      a
JOIN  utilisateurs u ON u.id = a.patient_id
WHERE a.vue = FALSE
GROUP BY a.patient_id, u.nom, u.prenom;

COMMENT ON VIEW vue_alertes_non_vues
    IS 'Nombre d''alertes non vues par patient — alimente les badges de l''interface';