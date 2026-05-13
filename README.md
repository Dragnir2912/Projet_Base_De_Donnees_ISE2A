# Sotera — Application de suivi de santé

> Du grec Σωτήρα — « celle qui protège »

Application web médicale permettant aux patients de suivre leurs indicateurs de santé et aux médecins de consulter leurs données, avec un assistant IA conversationnel alimenté par Google Gemini.

---

## Stack technique

**Backend** : Python 3.11 · Flask 3 · SQLAlchemy 2 · PostgreSQL 16 · JWT · Marshmallow  
**Frontend** : React 18 · Vite 5 · TailwindCSS 3 · Recharts · Zustand · Lucide React  
**IA** : Google Gemini 1.5 Pro

---

## Prérequis

- [Python 3.11+](https://python.org)
- [Node.js 20+](https://nodejs.org)
- [PostgreSQL 16](https://postgresql.org)

---

## Installation

### 1. Base de données (une seule fois)

Depuis **pgAdmin** ou **psql** :
```sql
CREATE DATABASE Sotera_app;
CREATE USER sotera WITH PASSWORD 'sotera';
GRANT ALL PRIVILEGES ON DATABASE Sotera_app TO sotera;
```

Puis appliquer le schéma SQL :
```bash
psql -U sotera -d sotera_db -f backend/Scripts/creation_base.sql
```

### 2. Backend

```bash
cd backend

# Environnement virtuel
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Dépendances
pip install -r requirements.txt

# Variables d'environnement
copy .env.example .env       # Windows
# cp .env.example .env       # Mac/Linux
# → Éditer .env et remplir les valeurs
```

### 3. Frontend

```bash
cd frontend
npm install
```

---

## Lancement

Ouvrir **2 terminaux** :

**Terminal 1 — Backend :**
```bash
cd backend
venv\Scripts\activate
flask run --debug
# API disponible sur http://localhost:5000
```

**Terminal 2 — Frontend :**
```bash
cd frontend
npm run dev
# App disponible sur http://localhost:5173
```

---

## Variables d'environnement

Copier `.env.example` en `backend/.env` et renseigner :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL |
| `SECRET_KEY` | Clé secrète Flask |
| `JWT_SECRET_KEY` | Clé secrète JWT |
| `GEMINI_API_KEY` | Clé API Google Gemini ([aistudio.google.com](https://aistudio.google.com)) |

---

## Fonctionnalités

### Patient
- **Dashboard** : VitaRing animé (score de santé global), résumé des dernières mesures, alertes
- **Mesures** : Saisie de mesures par type (tension, glycémie, poids…), graphiques d'évolution Recharts
- **Alertes** : Notifications automatiques en cas de dépassement des seuils OMS
- **Messages** : Messagerie sécurisée avec le médecin
- **Assistant IA** : Chat avec Sotera, alimenté par Gemini et contextualisé par les données de santé
- **Profil** : Gestion du compte et des préférences

### Médecin
- **Patients** : Liste des patients suivis avec VitaScore et alertes
- **Résumé patient** : Vue complète (VitaScore, alertes, consultations)
- **Consultations** : Rédaction de comptes-rendus médicaux
- **Messagerie** : Échange sécurisé avec les patients

---

## Structure du projet

```
sotera/
├── backend/
│   ├── app/
│   │   ├── models/        # Modèles SQLAlchemy
│   │   ├── routes/        # Blueprints Flask
│   │   ├── schemas/       # Sérialisation Marshmallow
│   │   ├── services/      # Logique métier
│   │   └── utils/         # Décorateurs, helpers
│   ├── Scripts/
│   │   └── creation_base.sql
│   ├── requirements.txt
│   └── run.py
└── frontend/
    └── src/
        ├── components/    # UI, health, layout
        ├── pages/         # 8 pages
        ├── services/      # Appels API
        └── store/         # Zustand
```

---

## Commandes utiles

```bash
# Migration après modification d'un modèle
cd backend && flask db migrate -m "description" && flask db upgrade

# Tests backend
cd backend && pytest

# Linter Python
cd backend && flake8 app/

# Build frontend production
cd frontend && npm run build
```
