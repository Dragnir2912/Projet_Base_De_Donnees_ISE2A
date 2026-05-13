# CLAUDE.md — Sotera · Instructions permanentes

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il définit les règles de développement, la stack, le design et les conventions du projet.

---

## 🏥 Présentation du projet

**Sotera** (du grec Σωτήρα — "celle qui protège") est une application web médicale de suivi de santé.
Elle permet aux patients de suivre leurs indicateurs de santé et aux médecins de consulter leurs données,
avec un assistant IA conversationnel alimenté par Google Gemini.

---

## 📁 Structure du projet

```
sotera/
├── backend/                        # API Flask (Python)
│   ├── app/
│   │   ├── __init__.py             # Factory Flask + blueprints
│   │   ├── config.py               # Config dev / prod via .env
│   │   ├── extensions.py           # db, jwt, ma (extensions Flask)
│   │   ├── models/                 # Modèles SQLAlchemy (1 fichier = 1 table)
│   │   │   ├── utilisateur.py
│   │   │   ├── mesure.py
│   │   │   ├── mesure_composante.py
│   │   │   ├── type_mesure.py
│   │   │   ├── alerte.py
│   │   │   ├── relation.py
│   │   │   ├── consultation.py
│   │   │   ├── message.py
│   │   │   ├── conversation_ia.py
│   │   │   ├── annotation.py
│   │   │   └── preference.py
│   │   ├── routes/                 # Blueprints Flask (1 fichier = 1 domaine)
│   │   │   ├── auth.py             # /api/auth/*
│   │   │   ├── mesures.py          # /api/mesures/*
│   │   │   ├── alertes.py          # /api/alertes/*
│   │   │   ├── medecin.py          # /api/medecin/*
│   │   │   ├── messages.py         # /api/messages/*
│   │   │   ├── ia.py               # /api/ia/*
│   │   │   └── profil.py           # /api/profil/*
│   │   ├── services/               # Logique métier (jamais dans les routes)
│   │   │   ├── auth_service.py
│   │   │   ├── mesure_service.py
│   │   │   ├── alerte_service.py
│   │   │   ├── gemini_service.py   # Intégration API Gemini
│   │   │   └── vitascore_service.py
│   │   ├── schemas/                # Sérialisation Marshmallow
│   │   └── utils/
│   │       ├── decorators.py       # @patient_required, @medecin_required
│   │       └── helpers.py
│   ├── migrations/                 # Flask-Migrate (Alembic)
│   ├── tests/
│   ├── Scripts/
│   │   └── creation_base_v2.sql   # Schéma PostgreSQL de référence
│   ├── requirements.txt
│   ├── .env                        # Variables d'environnement (ne jamais commiter)
│   └── run.py
│
├── frontend/                       # Application React (Vite)
│   ├── src/
│   │   ├── assets/                 # Fonts, images statiques
│   │   ├── components/             # Composants réutilisables
│   │   │   ├── ui/                 # Primitives (Button, Card, Badge…)
│   │   │   ├── charts/             # Graphiques Recharts
│   │   │   ├── health/             # Composants métier (VitaRing, MesureCard…)
│   │   │   └── layout/             # Navbar, Sidebar, BottomBar
│   │   ├── pages/                  # Pages (1 dossier = 1 page)
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── Mesures/
│   │   │   ├── Alertes/
│   │   │   ├── Messagerie/
│   │   │   ├── AssistantIA/
│   │   │   ├── Medecin/
│   │   │   └── Profil/
│   │   ├── hooks/                  # Custom hooks React
│   │   ├── services/               # Appels API axios (1 fichier = 1 domaine)
│   │   ├── store/                  # État global Zustand
│   │   ├── utils/
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .env.example
└── README.md
```

---

## 🛠️ Stack technique

### Backend
| Outil | Usage |
|-------|-------|
| Python 3.11+ | Langage principal |
| Flask 3.x | Framework API REST |
| SQLAlchemy 2.x | ORM PostgreSQL |
| Flask-Migrate | Migrations (Alembic) |
| Flask-JWT-Extended | Authentification JWT |
| Marshmallow | Validation & sérialisation |
| google-generativeai | API Gemini (assistant IA) |
| psycopg2-binary | Driver PostgreSQL |
| python-dotenv | Variables d'environnement |
| pytest | Tests unitaires |

### Frontend
| Outil | Usage |
|-------|-------|
| React 18 | UI |
| Vite 5 | Bundler |
| TailwindCSS 3 | Styles utilitaires |
| React Router v6 | Navigation |
| Zustand | État global |
| Axios | Requêtes HTTP |
| Recharts | Graphiques de santé |
| Lucide React | Icônes (UNIQUEMENT cette lib) |
| date-fns | Manipulation des dates |
| react-hot-toast | Notifications toast |

---

## 🎨 Design System — inspiré Apple Health

### Palette de couleurs
```css
:root {
  /* Fonds */
  --color-bg-primary:    #FFFFFF;
  --color-bg-secondary:  #F2F2F7;
  --color-bg-tertiary:   #E5E5EA;

  /* Textes */
  --color-text-primary:   #1C1C1E;
  --color-text-secondary: #3A3A3C;
  --color-text-tertiary:  #8E8E93;
  --color-text-inverse:   #FFFFFF;

  /* Couleurs santé (Apple Health palette) */
  --color-health-red:    #FF2D55;   /* Cardio, tension */
  --color-health-orange: #FF9500;   /* Activité */
  --color-health-yellow: #FFCC00;   /* Vigilance */
  --color-health-green:  #34C759;   /* Normal, SpO2 */
  --color-health-teal:   #5AC8FA;   /* Hydratation */
  --color-health-blue:   #007AFF;   /* Actions, liens */
  --color-health-purple: #AF52DE;   /* Sommeil */
  --color-health-pink:   #FF375F;   /* Fréquence cardiaque */

  /* États */
  --color-success: #34C759;
  --color-warning: #FF9500;
  --color-danger:  #FF2D55;

  /* Composants */
  --radius-sm:  8px;
  --radius-md:  14px;
  --radius-lg:  20px;
  --radius-xl:  28px;
  --shadow-card: 0 2px 20px rgba(0,0,0,0.06);
  --shadow-modal: 0 8px 40px rgba(0,0,0,0.12);
}
```

### Typographie
- **Police principale** : `SF Pro Display` / fallback `system-ui, -apple-system`
- Titres : `font-weight: 700`, `letter-spacing: -0.5px`
- Corps : `font-weight: 400`, `line-height: 1.5`
- Labels : `font-weight: 600`, `font-size: 13px`, `letter-spacing: 0.3px`

### Composants clés
- **Cards** : `border-radius: var(--radius-lg)`, `background: white`, `box-shadow: var(--shadow-card)`, padding `20px`
- **VitaRing** : SVG animé style Apple Activity Ring — 3 anneaux concentriques colorés
- **BottomBar** : navigation fixe en bas sur mobile (5 onglets max, icônes Lucide + label)
- **Graphiques** : Recharts `AreaChart` avec gradient, courbes fluides, tooltip personnalisé
- **Badges alertes** : pastille rouge sur icône cloche si alertes non vues

### Règles design absolues
- ❌ Jamais de `border` visible sur les cards (ombre uniquement)
- ❌ Jamais de couleurs criardes ou néons
- ❌ Jamais d'autres libs d'icônes que `lucide-react`
- ✅ Toujours `transition: all 0.2s ease` sur les éléments interactifs
- ✅ États hover/focus soignés sur tous les boutons
- ✅ Skeleton loaders pendant les chargements (jamais de spinner seul)
- ✅ Design responsive : mobile-first, breakpoints `sm:` `md:` `lg:`

---

## 🔌 API REST — conventions

### Base URL
```
http://localhost:5000/api
```

### Authentification
Toutes les routes protégées reçoivent :
```
Authorization: Bearer <jwt_token>
```

### Format des réponses
```json
{
  "success": true,
  "data": { ... },
  "message": "optionnel"
}
```
```json
{
  "success": false,
  "error": "Message d'erreur lisible",
  "code": "ERROR_CODE"
}
```

### Endpoints principaux
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/mesures/                    # Liste des mesures du patient connecté
POST   /api/mesures/                    # Créer une mesure
GET    /api/mesures/<id>
GET    /api/mesures/types               # Référentiel types_mesure
GET    /api/mesures/historique/<type_id>  # Courbe historique

GET    /api/alertes/                    # Alertes du patient
PATCH  /api/alertes/<id>/vue            # Marquer comme vue

GET    /api/messages/conversations      # Liste des conversations
GET    /api/messages/<conversation_id>  # Messages d'une conversation
POST   /api/messages/                   # Envoyer un message

POST   /api/ia/chat                     # Message à l'assistant Gemini
GET    /api/ia/sessions                 # Historique des sessions

GET    /api/medecin/patients            # Patients du médecin
GET    /api/medecin/patients/<id>/resume  # Résumé santé d'un patient
POST   /api/medecin/annotations         # Annoter une mesure
POST   /api/medecin/consultations       # Créer une consultation

GET    /api/profil/
PATCH  /api/profil/
GET    /api/profil/preferences
PATCH  /api/profil/preferences
```

---

## 🤖 Intégration Google Gemini

### Configuration
```python
# backend/app/services/gemini_service.py
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-pro")
```

### Prompt système (injecter dans chaque session)
```
Tu es Sotera, un assistant de santé bienveillant et professionnel.
Tu aides les patients à comprendre leurs données de santé.
Tu ne poses JAMAIS de diagnostic médical.
Tu encourages toujours à consulter un médecin pour toute décision médicale.
Tu t'exprimes en français, avec clarté et empathie.

Données de santé du patient :
{context_mesures}
```

### Contexte à injecter
Avant chaque message, récupérer et inclure :
- Les 5 dernières mesures par type
- Les alertes non vues
- Le VitaScore actuel

---

## 🗄️ Base de données

### Fichier de référence
```
Scripts/creation_base_v2.sql
```
**Toujours** se référer à ce fichier pour la structure exacte des tables.

### Connexion
```python
DATABASE_URL=postgresql://sotera:sotera@localhost:5432/sotera_db
```

### Initialisation
```bash
flask db init
flask db migrate -m "initial"
flask db upgrade
```

---

## 🔐 Sécurité

- Mots de passe : `bcrypt` (jamais en clair)
- JWT : expiration `access_token = 1h`, `refresh_token = 30j`
- CORS : autoriser uniquement `http://localhost:5173` en dev
- Variables sensibles : uniquement dans `.env` (jamais dans le code)
- Validation : toutes les entrées validées par Marshmallow avant traitement
- Décorateurs : `@patient_required` et `@medecin_required` sur toutes les routes protégées

---

## ⚙️ Variables d'environnement (.env)

```env
# PostgreSQL
DATABASE_URL=postgresql://sotera:sotera@localhost:5432/sotera_db

# Flask
FLASK_ENV=development
SECRET_KEY=<générer avec : python -c "import secrets; print(secrets.token_hex(32))">

# JWT
JWT_SECRET_KEY=<générer avec : python -c "import secrets; print(secrets.token_hex(32))">
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000

# Google Gemini
GEMINI_API_KEY=<obtenir sur https://aistudio.google.com>

# Frontend (Vite)
VITE_API_URL=http://localhost:5000/api
```

---

## 📋 Règles de développement

### Conventions de code
- Python : PEP8, type hints sur toutes les fonctions
- React : composants fonctionnels uniquement, hooks pour la logique
- Nommage : `snake_case` Python, `camelCase` JS, `PascalCase` composants React
- Commentaires : en français pour la logique métier

### Workflow de développement
1. Toujours écrire les modèles SQLAlchemy avant les routes
2. Toujours écrire les services avant les routes
3. Toujours valider avec Marshmallow avant d'insérer en base
4. Tester chaque endpoint avec un exemple avant de passer au suivant

### Ce qu'il ne faut JAMAIS faire
- ❌ Mettre de la logique métier dans les routes Flask
- ❌ Faire des requêtes SQL brutes (utiliser SQLAlchemy)
- ❌ Stocker le JWT dans localStorage (utiliser httpOnly cookie ou memory)
- ❌ Committer le fichier `.env`
- ❌ Utiliser `SELECT *` dans les requêtes ORM

---

## 🚀 Lancer le projet (sans Docker)

Le projet nécessite **3 prérequis** installés sur la machine :
- Python 3.11+ → https://python.org
- Node.js 20+ → https://nodejs.org
- PostgreSQL 16 → https://postgresql.org

### Étape 1 — Préparer PostgreSQL (une seule fois)

Après installation de PostgreSQL, ouvrir **pgAdmin** ou **psql** et exécuter :

```sql
CREATE DATABASE sotera_db;
CREATE USER sotera WITH PASSWORD 'sotera';
GRANT ALL PRIVILEGES ON DATABASE sotera_db TO sotera;
```

Puis exécuter le schéma SQL pour créer toutes les tables :
```bash
psql -U sotera -d sotera_db -f backend/Scripts/creation_base_v2.sql
```

### Étape 2 — Préparer le backend (une seule fois)

```bash
cd backend

# Créer l'environnement virtuel Python
python -m venv venv

# Activer l'environnement (Windows)
venv\Scripts\activate
# Activer l'environnement (Mac/Linux)
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Appliquer les migrations
flask db upgrade
```

### Étape 3 — Préparer le frontend (une seule fois)

```bash
cd frontend
npm install
```

---

### Lancer le projet au quotidien

Ouvrir **2 terminaux** :

**Terminal 1 — Backend :**
```bash
cd backend
venv\Scripts\activate        # Windows
# ou source venv/bin/activate  # Mac/Linux
flask run --debug
# → API disponible sur http://localhost:5000
```

**Terminal 2 — Frontend :**
```bash
cd frontend
npm run dev
# → App disponible sur http://localhost:5173
```

---

### Autres commandes utiles

```bash
# Créer une nouvelle migration après modification d'un modèle
cd backend && flask db migrate -m "description" && flask db upgrade

# Lancer les tests backend
cd backend && pytest

# Linter Python
cd backend && flake8 app/

# Build frontend pour la production
cd frontend && npm run build
```
