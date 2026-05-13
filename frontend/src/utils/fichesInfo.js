/**
 * Contenu éditorial statique des fiches par type de mesure.
 * Clé = nom exact du type dans la BDD.
 */
export const FICHES = {
  'Glycémie': {
    emoji: '🩸',
    couleur: '#FF2D55',
    quoi: 'Taux de glucose dans le sang. Mesuré idéalement à jeun le matin, avant tout repas. Indicateur principal pour le dépistage et le suivi du diabète.',
    conseils: [
      'Évitez les sucres rapides (bonbons, sodas) le soir.',
      'Marchez 20 à 30 min après le repas pour aider l\'assimilation du glucose.',
    ],
    facteurs: ['Alimentation', 'Activité physique', 'Stress', 'Médicaments', 'Jeûne'],
    quand_consulter: 'Si votre glycémie est régulièrement > 1,26 g/L à jeun, ou si vous ressentez fatigue intense, soif excessive, mictions fréquentes.',
    definition: 'La glycémie désigne la concentration de glucose dans le sang. Le glucose est la source d\'énergie principale des cellules. Après un repas, la glycémie monte puis redescend grâce à l\'insuline produite par le pancréas. Un dysfonctionnement de ce mécanisme conduit au diabète.',
  },

  'Tension artérielle': {
    emoji: '💓',
    couleur: '#FF9500',
    quoi: 'Force exercée par le sang sur les parois des artères. Notée systolique/diastolique, ex. 120/80 mmHg (12/8 en cmHg). La systolique est la valeur mesurée ici.',
    conseils: [
      'Réduisez votre consommation de sel (< 5 g/j recommandés par l\'OMS).',
      'Évitez le café et l\'effort intense dans les 30 min précédant la mesure.',
    ],
    facteurs: ['Sel', 'Stress', 'Poids', 'Alcool', 'Sédentarité', 'Tabac'],
    quand_consulter: 'Si votre tension dépasse régulièrement 140 mmHg (systolique) ou descend sous 90 mmHg, consultez votre médecin.',
    definition: 'La pression artérielle mesure la force que le sang exerce sur les parois des vaisseaux lors de chaque contraction cardiaque (systole) et entre deux battements (diastole). Une pression trop élevée (hypertension) fatigue le cœur et les artères. Une pression trop basse (hypotension) peut causer des étourdissements.',
  },

  'Fréquence cardiaque': {
    emoji: '❤️',
    couleur: '#FF375F',
    quoi: 'Nombre de battements du cœur par minute, mesurée au repos. Une fréquence élevée peut signaler stress, déshydratation ou pathologie cardiaque.',
    conseils: [
      'Pratiquez la cohérence cardiaque (5 min de respiration rythmée) pour abaisser la FC au repos.',
      'Évitez la caféine et le tabac qui accélèrent le rythme cardiaque.',
    ],
    facteurs: ['Activité physique', 'Stress', 'Caféine', 'Fièvre', 'Déshydratation'],
    quand_consulter: 'Si votre FC au repos est régulièrement > 100 bpm (tachycardie) ou < 50 bpm (bradycardie) sans être sportif de haut niveau.',
    definition: 'La fréquence cardiaque (FC) correspond au nombre de fois que le cœur se contracte par minute. Au repos, une FC normale est entre 60 et 100 bpm. Les sportifs entraînés peuvent avoir une FC de repos plus basse (autour de 40–50 bpm), ce qui est signe d\'un cœur efficace.',
  },

  'SpO2': {
    emoji: '🫁',
    couleur: '#5AC8FA',
    quoi: 'Pourcentage d\'oxygène transporté par vos globules rouges. Mesuré indolore avec un oxymètre de pouls sur le doigt. En dessous de 95 %, une consultation est recommandée.',
    conseils: [
      'En cas de valeur basse, restez au repos et mesurez à nouveau 5 min plus tard.',
      'Une bonne hydratation et une respiration profonde aident à maintenir la SpO2.',
    ],
    facteurs: ['Altitude', 'Maladies pulmonaires', 'Anémie', 'Position du corps', 'Circulation périphérique'],
    quand_consulter: 'Immédiatement si SpO2 < 90 % avec essoufflement, cyanose (lèvres bleues) ou douleur thoracique.',
    definition: 'La saturation en oxygène (SpO2) mesure le pourcentage d\'hémoglobine saturée en oxygène dans le sang. Une valeur ≥ 95 % est considérée normale. En dessous de 90 %, les organes risquent de souffrir d\'un manque d\'oxygène (hypoxie).',
  },

  'Température': {
    emoji: '🌡️',
    couleur: '#FFD60A',
    quoi: 'Température corporelle centrale. La fièvre (> 38 °C) est un mécanisme de défense de l\'organisme face à une infection. L\'hypothermie (< 35 °C) est une urgence.',
    conseils: [
      'Mesurez toujours à la même heure et dans les mêmes conditions pour comparer.',
      'En cas de fièvre, buvez suffisamment d\'eau et consultez si > 39 °C ou persistante.',
    ],
    facteurs: ['Infections', 'Effort physique', 'Chaleur', 'Médicaments', 'Cycle menstruel'],
    quand_consulter: 'Si la température dépasse 39,5 °C, persiste plus de 3 jours, ou est < 35 °C.',
    definition: 'La température corporelle normale est de 36,1 à 37,8 °C. Elle varie légèrement selon l\'heure (plus basse le matin, plus haute le soir) et selon la méthode de mesure (axillaire, buccale, tympanique, rectale). La fièvre est un signal d\'alarme du système immunitaire.',
  },

  'Poids': {
    emoji: '⚖️',
    couleur: '#34C759',
    quoi: 'Poids corporel total en kilogrammes. Suivi de son évolution dans le temps pour détecter des variations anormales. Utilisé avec la taille pour calculer l\'IMC.',
    conseils: [
      'Pesez-vous le matin à jeun, après les toilettes, toujours dans les mêmes conditions.',
      'Une variation de ± 1 kg d\'un jour à l\'autre est normale (eau, repas).',
    ],
    facteurs: ['Alimentation', 'Activité physique', 'Rétention d\'eau', 'Hormones', 'Médicaments'],
    quand_consulter: 'Si vous perdez ou prenez plus de 5 % de votre poids en moins d\'un mois sans raison apparente.',
    definition: 'Le poids corporel est la somme de la masse musculaire, graisseuse, osseuse et hydrique. Il varie normalement de ± 1–2 kg dans la journée. Un suivi régulier (hebdomadaire) est plus pertinent qu\'une pesée quotidienne.',
  },

  'IMC': {
    emoji: '📊',
    couleur: '#BF5AF2',
    quoi: 'Indice de Masse Corporelle = poids (kg) ÷ taille² (m²). Indicateur de corpulence, pas de composition corporelle. Un sportif musclé peut avoir un IMC élevé sans excès de graisse.',
    conseils: [
      'L\'IMC est un indicateur de population, pas un diagnostic individuel.',
      'Combinez-le avec le tour de taille pour une meilleure évaluation du risque cardiovasculaire.',
    ],
    facteurs: ['Masse musculaire', 'Alimentation', 'Activité physique', 'Génétique', 'Âge'],
    quand_consulter: 'Si votre IMC est < 18,5 (sous-poids) ou > 30 (obésité), une consultation avec votre médecin est recommandée.',
    definition: 'L\'IMC est un outil de dépistage simple du surpoids et de l\'obésité. Selon l\'OMS : < 18,5 = sous-poids, 18,5–25 = normal, 25–30 = surpoids, > 30 = obésité. Il ne distingue pas la masse graisseuse de la masse musculaire.',
  },

  'Cholestérol': {
    emoji: '🫀',
    couleur: '#FF9500',
    quoi: 'Taux de cholestérol total dans le sang. Le cholestérol est essentiel en quantité normale (membranes cellulaires, hormones), mais un excès favorise les maladies cardiovasculaires.',
    conseils: [
      'Privilégiez les acides gras insaturés (huile d\'olive, poisson gras, noix).',
      'Limitez les graisses saturées (charcuterie, fromages gras, fritures).',
    ],
    facteurs: ['Alimentation', 'Génétique (hypercholestérolémie familiale)', 'Sédentarité', 'Tabac', 'Alcool'],
    quand_consulter: 'Si le cholestérol total dépasse 2 g/L, ou en présence d\'autres facteurs de risque cardiovasculaire (diabète, tabac, HTA).',
    definition: 'Le cholestérol circule dans le sang sous forme de lipoprotéines. Le LDL ("mauvais cholestérol") se dépose sur les parois des artères. Le HDL ("bon cholestérol") le transporte vers le foie pour élimination. L\'équilibre entre les deux est crucial.',
  },

  'Triglycérides': {
    emoji: '🧪',
    couleur: '#FF6B6B',
    quoi: 'Graisses circulant dans le sang, issues principalement de l\'alimentation et de la production hépatique. Un taux élevé augmente le risque cardiovasculaire et de pancréatite.',
    conseils: [
      'Réduisez les sucres simples et l\'alcool, principaux responsables de l\'élévation.',
      'L\'activité physique régulière fait baisser efficacement les triglycérides.',
    ],
    facteurs: ['Sucres simples', 'Alcool', 'Sédentarité', 'Diabète', 'Hypothyroïdie'],
    quand_consulter: 'Si les triglycérides dépassent 1,5 g/L de façon persistante, ou 5 g/L (risque de pancréatite aiguë).',
    definition: 'Les triglycérides sont la principale forme de stockage des graisses dans l\'organisme. Après un repas, les graisses alimentaires transitent dans le sang sous forme de triglycérides avant d\'être stockées ou utilisées comme énergie.',
  },

  'Créatinine': {
    emoji: '🫘',
    couleur: '#0A84FF',
    quoi: 'Déchet azoté produit par les muscles et éliminé par les reins. Reflet direct de la fonction rénale. Un taux élevé peut signaler une insuffisance rénale.',
    conseils: [
      'Buvez suffisamment d\'eau (1,5 à 2 L/j) pour aider vos reins à filtrer.',
      'Limitez les anti-inflammatoires (ibuprofène) en automédication, qui fragilisent les reins.',
    ],
    facteurs: ['Masse musculaire', 'Alimentation (viande)', 'Médicaments', 'Déshydratation', 'Maladies rénales'],
    quand_consulter: 'Si la créatinine dépasse 13 mg/L ou si vous constatez une hausse progressive sur plusieurs analyses.',
    definition: 'La créatinine est un déchet issu du métabolisme musculaire, filtré et éliminé par les reins. Un taux stable dans la normale indique une bonne fonction rénale. Une élévation progressive peut signaler une maladie rénale chronique.',
  },
}

/** Retourne la fiche d'un type, ou un fallback générique. */
export function getFiche(nomType) {
  return FICHES[nomType] ?? {
    emoji: '📋',
    couleur: '#8E8E93',
    quoi: 'Indicateur de santé suivi dans Sotera.',
    conseils: ['Consultez votre médecin pour l\'interprétation de cette valeur.'],
    facteurs: ['Voir avec votre médecin'],
    quand_consulter: 'En cas de valeur hors de la zone normale.',
    definition: 'Cet indicateur de santé est suivi par votre médecin.',
  }
}

/** Calcule le statut d'une valeur par rapport aux seuils d'un type. */
export function getStatutValeur(valeur, type) {
  if (valeur == null || !type) return null
  const { seuil_danger_bas, seuil_danger_haut, seuil_min_normal, seuil_max_normal } = type
  if ((seuil_danger_haut != null && valeur > seuil_danger_haut) ||
      (seuil_danger_bas  != null && valeur < seuil_danger_bas))  return 'danger'
  if ((seuil_max_normal  != null && valeur > seuil_max_normal)  ||
      (seuil_min_normal  != null && valeur < seuil_min_normal))  return 'attention'
  return 'normal'
}
