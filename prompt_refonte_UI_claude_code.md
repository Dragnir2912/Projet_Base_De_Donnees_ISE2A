# Prompt — Refonte UI Premium (pour Claude Code)

> **Mode d'emploi** : Colle ce prompt dans Claude Code.
> Claude Code exécute les phases **une par une** et attend ta validation avant de passer à la suivante.
> Réponds `ok` pour continuer, ou donne tes retours pour ajuster.

---

## Instruction d'orchestration

Tu vas refondre entièrement l'interface de cette application web.
Tu travailles **phase par phase**. À la fin de chaque phase, tu t'arrêtes, tu résumes ce que tu as fait, et tu attends ma validation avant de continuer.

Ne fais jamais deux phases en même temps.
Ne saute jamais une phase.
Si une phase est complexe, découpe-la en sous-étapes et valide chacune.

---

## Niveau de qualité cible

Le résultat final doit atteindre le niveau de sophistication visuelle des meilleurs produits tech actuels.

**Références de niveau** (ne pas copier leur style — capturer leur niveau de finition, cohérence, fluidité et modernité) :
Apple · Linear · Stripe · Raycast · Framer · Vercel · Arc Browser · Notion · Resend · Supabase

**La question à poser avant chaque décision** :
*"Est-ce que cela ressemble à un vrai produit web premium conçu par une équipe design exceptionnelle ?"*
Si la réponse est non — refaire.

---

## PHASE 1 — Audit et cartographie

**Commence par lire et analyser le projet existant. Ne touche à aucun fichier.**

Lis tous les fichiers sources : HTML, CSS, JS, templates Jinja2, layouts, assets, configs.

Produis un rapport structuré contenant :

1. **Architecture actuelle** — liste de tous les fichiers et leur rôle
2. **Pages et routes Flask** — toutes les routes et les templates associés
3. **Composants identifiés** — navbar, cartes, formulaires, graphiques, etc.
4. **Assets visuels** — toutes les images, icônes, fonts présents avec leur chemin
5. **Flows utilisateurs** — comment un patient navigue, comment un médecin navigue
6. **Problèmes UX/UI** — hiérarchie visuelle, lisibilité, incohérences de navigation
7. **Points faibles visuels** — sections monotones, spacing incohérent, rythme visuel cassé, composants génériques
8. **Composants à supprimer** — ce qui n'a pas sa place dans un produit premium
9. **Composants à reconstruire** — ce qui peut être refondu plutôt que recréé

**→ Attends ma validation avant de continuer.**

---

## PHASE 2 — Direction artistique

**Propose une direction artistique complète. Ne touche à aucun fichier.**

Sur la base de l'audit, définis :

1. **Concept créatif** — une phrase qui résume l'identité visuelle (ex. : "biomédical cinématique sobre", "minimalisme clinique avec tension dramatique")
2. **Palette de couleurs** — couleurs primaires, secondaires, accents, backgrounds, surfaces, avec valeurs hex précises
3. **Typographie** — 1 à 2 familles max (Google Fonts), rôles précis pour chaque : display / body / mono éventuel. La typographie doit être un élément fort du design : grands titres impactants, hiérarchie très claire, compositions typographiques premium, rythme de lecture sophistiqué
4. **Effets visuels retenus** — liste précise avec usage pour chacun, parmi :
   - glassmorphism subtil
   - mesh gradients premium
   - cinematic lighting
   - glow subtil
   - layered / ambient backgrounds
   - visual depth
   - blur artistique
   - soft shadows modernes
   - floating elements
   - oversized visuals
   - parallax subtil
   - premium hover states
   - depth effects
   - immersive transitions
5. **Principes de layout web** — grille desktop, densité d'information, colonnes, espacement vertical, compositions asymétriques si pertinent
6. **Motion design prévu** — liste des animations, leur déclencheur, durée indicative (voir exigences Phase 9)
7. **Composants signature** — 2 ou 3 composants qui incarneront le style
8. **Ambiance par page** — description de l'atmosphère cible pour chaque page principale

**ÉVITER ABSOLUMENT :**
- look Bootstrap / Material générique
- design SaaS cliché (cartes répétitives, blocs uniformes)
- esthétique "template AI"
- gradients flashy mal maîtrisés
- effets visuels cheap ou gadget
- sections monotones et répétitives
- surcharge visuelle
- esthétique Dribbble "fake premium"

**→ Attends ma validation et mes ajustements avant de continuer.**

---

## PHASE 3 — Organisation des assets et système de design

**Deux volets dans cette phase.**

### Volet A — Inventaire, analyse et réorganisation des assets

Analyse tous les fichiers présents dans `static/`.

**1. Inventaire des images**
Pour chaque image : nom actuel, format, dimensions estimées.

**2. Analyse du potentiel artistique**
Pour chaque image, déduis son rôle potentiel dans la refonte :
- hero visual (pièce centrale d'une page)
- storytelling illustration (renforce une feature ou une émotion)
- immersive section visual (background d'une zone)
- decorative depth element (couche de profondeur)
- floating artwork (élément flottant au-dessus d'une composition)
- feature visual (illustre une fonctionnalité précise)
- background element (texture ou ambiance)
- artistic layer (overlay créatif)
- élément à ne pas réutiliser (mauvaise qualité ou hors sujet)

**3. Renommage SEO-friendly**
Renomme chaque image : `kebab-case`, descriptif, sans caractères spéciaux.
Ex. : `img1.png` → `hero-dashboard-vitascore.png` / `photo.jpg` → `illustration-saisie-mesures.jpg`

**4. Réorganisation en sous-dossiers**
```
static/
├── css/
├── js/
├── fonts/
└── img/
    ├── hero/           → visuels principaux des pages
    ├── illustrations/  → illustrations de fonctionnalités
    ├── backgrounds/    → textures, fonds, éléments d'ambiance
    ├── features/       → visuels associés à une feature
    ├── artwork/        → éléments décoratifs artistiques
    ├── floating/       → éléments flottants / overlays
    ├── cards/          → visuels pour les cartes UI
    └── ui/             → icônes, logos, éléments d'interface
```

**5. Rapport d'assets**
Tableau : ancien chemin → nouveau chemin · rôle déduit · note d'utilisation dans la refonte.

Ne touche aux templates Jinja2 que dans les phases suivantes.

### Volet B — Système de design CSS

1. **Variables CSS globales** — couleurs, espacements, typographie, radius, shadows, z-index, transitions
2. **Reset / base CSS** — normalisation propre et moderne
3. **Fonts** — import des polices via Google Fonts ou @font-face
4. **Composants atomiques** — boutons, badges, inputs, tags, séparateurs, loaders
5. **Composants de layout** — conteneur centré, grille de colonnes, wrappers de sections
6. **Classes utilitaires** — spacing, flex, alignement, visibilité

Crée `static/css/design-system.css` et `static/css/components.css`.
Crée `static/preview.html` (hors Flask) pour visualiser les composants dans le navigateur.

**→ Attends ma validation avant de continuer.**

---

## PHASE 4 — Refonte de la navigation

**Refonds uniquement la navigation principale. Desktop-first.**

Elle doit :
- Être visuellement premium à 1280px+
- Utiliser une **sidebar fixe** ou une **topbar persistante** selon ce qui sert le mieux l'app
- Indiquer clairement la page active
- Avoir des hover states élégants avec micro-interactions
- Distinguer logiquement les menus patient vs médecin
- Refléter la direction artistique de la Phase 2
- S'adapter proprement sur tablette (≥768px)

Livre le code complet : template Jinja2 + CSS + JS si besoin.

**→ Attends ma validation avant de continuer.**

---

## PHASE 5 — Refonte du Dashboard principal

**Refonds la page dashboard. Exploite l'espace horizontal du navigateur desktop.**

Elle doit :
- Utiliser un layout multi-colonnes (sidebar + contenu, ou grille de zones)
- Avoir une zone d'accueil à fort impact visuel (VitaScore en grand, statut de santé)
- Présenter les métriques principales de façon premium
- Guider le regard naturellement (gauche → droite, haut → bas)
- **Intégrer les illustrations identifiées en Phase 3 comme éléments de direction artistique** — pas comme décoration. Certaines doivent devenir des pièces centrales du storytelling, des éléments oversize, des backgrounds immersifs ou des flottants
- Intégrer les effets visuels définis en Phase 2
- Avoir une animation d'entrée au chargement de la page

Traite section par section si complexe.

**→ Attends ma validation avant de continuer.**

---

## PHASE 6 — Refonte des graphiques et visualisations

**Refonds tous les composants de données visuelles.**

Pour chaque graphique :
- Applique la palette et les styles du design system
- Personnalise couleurs, fonts, tooltips, axes dans Chart.js
- Ajoute des animations d'apparition (draw-on, fade-in)
- Soigne les états hover (tooltips premium, highlight de points)
- Assure la cohérence entre tous les graphiques

Couvre : courbes d'évolution, calendrier de régularité, jauge VitaScore, tout autre visuel de données.

**→ Attends ma validation avant de continuer.**

---

## PHASE 7 — Refonte des formulaires

**Refonds tous les formulaires (saisie de mesures, connexion, inscription, etc.).**

Ils doivent :
- Avoir des champs premium (focus states animés, iconographie subtile, labels clairs)
- Donner un feedback visuel immédiat (validation inline, erreurs élégants)
- Exploiter intelligemment l'espace horizontal (pas une colonne étroite centrée)
- Être confortables à la souris et au clavier
- Correspondre au design system

**→ Attends ma validation avant de continuer.**

---

## PHASE 8 — Pages secondaires

**Refonds les pages secondaires une par une, dans cet ordre :**

1. Historique / liste des mesures
2. Profil utilisateur
3. Dashboard médecin
4. Fiche patient détaillée
5. Messagerie médecin-patient
6. Pages d'authentification (connexion, inscription)
7. Toute autre page identifiée en Phase 1

Pour chaque page : **intègre les illustrations pertinentes** identifiées en Phase 3 comme éléments visuels structurants, pas comme décoration. Livre le code complet, attends ma validation, puis passe à la suivante.

**→ Attends ma validation après chaque page.**

---

## PHASE 9 — Animations et motion design

**Ajoute la couche animations après validation de toutes les pages statiques.**

Le motion doit être : fluide · naturel · discret · sophistiqué · jamais gadget.

1. **Page load** — staggered reveal des éléments principaux (smooth reveals, fade transitions)
2. **Scroll reveals** — apparitions au scroll via IntersectionObserver (cinematic scroll effects)
3. **Hover states** — micro-interactions sur tous les interactifs : liens, boutons, cartes, tableaux (fluid hover interactions, elegant micro-interactions)
4. **Transitions de navigation** — fade ou slide discret entre pages Flask (immersive transitions)
5. **Animations de données** — graphiques qui se dessinent, VitaScore qui monte, parallax subtil sur les visuels
6. **Feedback d'actions** — confirmation de saisie, succès/erreur de formulaire

Règles absolues :
- Respecter `prefers-reduced-motion`
- Aucune animation ne bloque l'interaction
- Uniquement `transform` et `opacity` pour les animations GPU-accelerated

**→ Attends ma validation avant de continuer.**

---

## PHASE 10 — Contrôle qualité et polish final

**Revue systématique avant livraison. Desktop d'abord.**

### Checklist visuelle (à appliquer sur chaque page)
- [ ] Cohérence visuelle avec le design system
- [ ] Équilibre des compositions (pas de zones trop lourdes ou trop vides)
- [ ] Lisibilité irréprochable sur fond clair et foncé
- [ ] Qualité du spacing et du rythme vertical
- [ ] Rythme visuel fluide du haut en bas de la page
- [ ] Les illustrations **renforcent réellement l'expérience** (pas juste posées là)
- [ ] Aucune page ne paraît générique, template ou artificielle

### Responsive
1. **Desktop 1280px** — référence principale, tout doit être parfait ici
2. **Desktop large 1440px+** — rien ne s'étire de façon absurde
3. **Tablette 768px** — ajustements mineurs, l'app reste utilisable

### Polish technique
- Polish typographique : espacements, tailles, line-heights, alignements
- États vides soignés : aucune page sans données ne laisse du blanc vide
- Performance : pas de layout shift, fonts qui chargent proprement, animations GPU seulement

Produis un rapport de polish avec la liste des corrections apportées.

**→ Attends ma validation finale.**

---

## Règles permanentes

- **C'est une application web navigateur, desktop-first.** Jamais de pensée mobile-first.
- **Jamais de Bootstrap, Tailwind générique ou framework UI préfabriqué** sans customisation totale.
- **Jamais de composants reconnaissables** comme "template" (cartes Bootstrap, navbar Material, etc.).
- **Jamais de gradients violets sur blanc** ni d'esthétique "AI SaaS générique".
- **Les illustrations ne sont jamais de la décoration.** Elles sont des éléments de direction artistique qui guident le regard, renforcent l'émotion, améliorent la mémorisation et enrichissent le rythme visuel.
- **Code propre, commenté aux endroits clés, maintenable.**
- **Les templates Jinja2 héritent tous de `base.html`** — jamais de duplication de nav ou footer.
- **Tout fichier modifié ou créé est annoncé** avant d'être écrit.

---

## Contexte du projet

- **Nom** : Sotera
- **Type** : Application web médicale — journal de santé personnel + espace médecin
- **Accès** : Navigateur web sur ordinateur (desktop-first)
- **Stack** : Python / Flask / PostgreSQL / Jinja2 / HTML + CSS + JS vanilla / Chart.js
- **Utilisateurs** : Patients (suivi personnel) · Médecins (suivi de leurs patients)
- **Fonctionnalités** : Saisie de mesures · Courbes d'évolution · VitaScore · Analyse prédictive · Détection de corrélations · Calendrier de régularité · Assistant IA · Messagerie médecin-patient · Rapport PDF
- **Ambiance cible** : Médical premium · sobre · cinématique · digne de confiance — pas "app santé grand public colorée"

---

*Lance la Phase 1 maintenant.*
