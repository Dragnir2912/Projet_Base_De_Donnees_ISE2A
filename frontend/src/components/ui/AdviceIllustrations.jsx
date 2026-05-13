/**
 * Illustrations vectorielles catégorisées — style Freepik flat design.
 * Chaque composant est une scène SVG autonome, colorée, parlante.
 */

/* ── Nutrition ─────────────────────────────────────────── */
export function NutritionIllustration({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Fond circulaire doux */}
      <circle cx="60" cy="60" r="56" fill="#F0FBF0" />

      {/* Bol */}
      <ellipse cx="60" cy="80" rx="34" ry="14" fill="#D4EDDA" />
      <path d="M26 68 Q60 94 94 68" fill="#A8D5B5" />
      <ellipse cx="60" cy="68" rx="34" ry="12" fill="#C8E6C9" />

      {/* Laitue verte */}
      <ellipse cx="48" cy="60" rx="14" ry="10" fill="#66BB6A" transform="rotate(-15 48 60)" />
      <ellipse cx="48" cy="58" rx="10" ry="7" fill="#81C784" transform="rotate(-10 48 58)" />

      {/* Tomate rouge */}
      <circle cx="70" cy="58" r="10" fill="#EF5350" />
      <path d="M67 50 Q70 46 73 50" stroke="#388E3C" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="70" cy="58" rx="5" ry="3" fill="#E57373" opacity="0.5" />

      {/* Carotte */}
      <ellipse cx="58" cy="70" rx="6" ry="3" fill="#FF8A65" transform="rotate(-30 58 70)" />
      <path d="M54 66 Q56 62 60 64" stroke="#66BB6A" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Fourchette */}
      <rect x="93" y="42" width="3" height="28" rx="1.5" fill="#BDBDBD" />
      <rect x="90" y="42" width="1.5" height="10" rx="0.75" fill="#BDBDBD" />
      <rect x="94.5" y="42" width="1.5" height="10" rx="0.75" fill="#BDBDBD" />

      {/* Petites étoiles déco */}
      <circle cx="22" cy="38" r="3" fill="#A5D6A7" />
      <circle cx="98" cy="34" r="2" fill="#FFCC80" />
      <circle cx="30" cy="95" r="2" fill="#EF9A9A" />
    </svg>
  )
}

/* ── Hydratation ───────────────────────────────────────── */
export function HydrationIllustration({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="56" fill="#E3F2FD" />

      {/* Gourde */}
      <rect x="42" y="30" width="36" height="58" rx="12" fill="#42A5F5" />
      <rect x="42" y="30" width="36" height="20" rx="12" fill="#1E88E5" />

      {/* Bouchon */}
      <rect x="50" y="22" width="20" height="12" rx="5" fill="#1565C0" />
      <rect x="54" y="18" width="12" height="7" rx="3" fill="#0D47A1" />

      {/* Eau (niveau) */}
      <clipPath id="bottle-clip">
        <rect x="42" y="30" width="36" height="58" rx="12" />
      </clipPath>
      <rect x="42" y="60" width="36" height="28" rx="0" fill="#90CAF9" clipPath="url(#bottle-clip)" />

      {/* Reflet */}
      <rect x="47" y="34" width="6" height="24" rx="3" fill="white" opacity="0.35" />

      {/* Étiquette */}
      <rect x="46" y="64" width="28" height="18" rx="4" fill="white" opacity="0.8" />
      <rect x="50" y="68" width="20" height="2" rx="1" fill="#42A5F5" opacity="0.6" />
      <rect x="52" y="72" width="16" height="2" rx="1" fill="#42A5F5" opacity="0.4" />
      <rect x="54" y="76" width="12" height="2" rx="1" fill="#42A5F5" opacity="0.3" />

      {/* Gouttes autour */}
      <ellipse cx="28" cy="55" rx="5" ry="8" fill="#64B5F6" opacity="0.7" />
      <ellipse cx="92" cy="62" rx="4" ry="6" fill="#64B5F6" opacity="0.5" />
      <ellipse cx="24" cy="80" rx="3" ry="4" fill="#90CAF9" opacity="0.6" />

      {/* Étoiles d'eau */}
      <circle cx="100" cy="40" r="3" fill="#BBDEFB" />
      <circle cx="22" cy="40" r="2" fill="#BBDEFB" />
    </svg>
  )
}

/* ── Activité physique ─────────────────────────────────── */
export function ActivityAdviceIllustration({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="56" fill="#FFF3E0" />

      {/* Sol */}
      <ellipse cx="60" cy="98" rx="40" ry="6" fill="#FFCC80" opacity="0.5" />

      {/* Corps (silhouette qui court) */}
      {/* Tête */}
      <circle cx="72" cy="35" r="11" fill="#FFCC80" />
      <circle cx="76" cy="33" r="3" fill="#FF8A65" opacity="0.4" />

      {/* Torse */}
      <path d="M65 46 Q60 55 63 70 L72 68 Q75 55 78 46 Z" fill="#FF7043" />

      {/* Jambe gauche (avant) */}
      <path d="M63 70 Q55 80 48 90" stroke="#FFCC80" strokeWidth="8" strokeLinecap="round" fill="none" />
      <ellipse cx="47" cy="92" rx="7" ry="4" fill="#FF7043" transform="rotate(-20 47 92)" />

      {/* Jambe droite (arrière) */}
      <path d="M72 68 Q78 78 85 82" stroke="#FFCC80" strokeWidth="8" strokeLinecap="round" fill="none" />
      <ellipse cx="87" cy="84" rx="7" ry="4" fill="#F4511E" transform="rotate(20 87 84)" />

      {/* Bras gauche */}
      <path d="M65 52 Q52 58 46 65" stroke="#FFCC80" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* Bras droit */}
      <path d="M78 50 Q88 54 92 60" stroke="#FFCC80" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* Lignes de vitesse */}
      <path d="M22 50 L38 50" stroke="#FFAB40" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3" />
      <path d="M18 60 L36 60" stroke="#FFAB40" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
      <path d="M24 70 L38 70" stroke="#FFAB40" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" />

      {/* Cœur en haut à droite */}
      <path d="M96 22 C96 22 92 18 88 22 C84 26 88 32 96 38 C104 32 108 26 104 22 C100 18 96 22 96 22 Z"
        fill="#EF5350" opacity="0.85" transform="scale(0.6) translate(68 14)" />
    </svg>
  )
}

/* ── Sommeil ───────────────────────────────────────────── */
export function SleepIllustration({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="56" fill="#EDE7F6" />

      {/* Lit / coussin */}
      <rect x="18" y="72" width="84" height="28" rx="10" fill="#B39DDB" />
      <rect x="18" y="72" width="84" height="12" rx="8" fill="#9575CD" />

      {/* Oreiller */}
      <rect x="22" y="62" width="34" height="18" rx="9" fill="#CE93D8" />
      <rect x="24" y="65" width="30" height="12" rx="7" fill="#E1BEE7" />

      {/* Couverture */}
      <path d="M56 70 Q68 65 92 72 L92 85 Q68 80 56 85 Z" fill="#7E57C2" />
      <path d="M56 70 Q44 68 22 72 L22 85 Q44 82 56 85 Z" fill="#9575CD" />

      {/* Personnage qui dort (tête) */}
      <circle cx="38" cy="64" r="12" fill="#FFCC80" />
      <path d="M30 66 Q38 69 46 66" stroke="#FF8A65" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M32 61 Q34 59 36 61" stroke="#795548" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M40 61 Q42 59 44 61" stroke="#795548" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Lune */}
      <path d="M90 24 A18 18 0 1 1 90 60 A12 12 0 1 0 90 24 Z" fill="#FFF176" />

      {/* Étoiles */}
      <polygon points="76,18 77.5,22 82,22 78.5,25 80,29 76,26.5 72,29 73.5,25 70,22 74.5,22"
        fill="#FFEE58" transform="scale(0.7) translate(40 10)" />
      <polygon points="45,30 46,33 49,33 47,35 48,38 45,36 42,38 43,35 41,33 44,33"
        fill="#FFEE58" transform="scale(0.5) translate(44 24)" />

      {/* ZZZ */}
      <text x="78" y="44" fontSize="12" fontWeight="bold" fill="#9575CD" opacity="0.9"
        fontFamily="Georgia, serif">Z</text>
      <text x="88" y="34" fontSize="9" fontWeight="bold" fill="#9575CD" opacity="0.7"
        fontFamily="Georgia, serif">Z</text>
      <text x="96" y="26" fontSize="7" fontWeight="bold" fill="#9575CD" opacity="0.5"
        fontFamily="Georgia, serif">Z</text>
    </svg>
  )
}

/* ── Stress / Relaxation ───────────────────────────────── */
export function StressIllustration({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="56" fill="#FCE4EC" />

      {/* Natte / tapis de yoga */}
      <ellipse cx="60" cy="95" rx="42" ry="8" fill="#F48FB1" opacity="0.4" />
      <rect x="18" y="87" width="84" height="12" rx="6" fill="#F06292" opacity="0.6" />
      <rect x="18" y="87" width="84" height="4" rx="2" fill="#EC407A" opacity="0.4" />

      {/* Corps en position lotus */}
      {/* Jambes croisées */}
      <ellipse cx="45" cy="82" rx="16" ry="7" fill="#FFCC80" transform="rotate(-10 45 82)" />
      <ellipse cx="75" cy="82" rx="16" ry="7" fill="#FFCC80" transform="rotate(10 75 82)" />

      {/* Torse */}
      <path d="M50 55 Q60 48 70 55 L68 82 Q60 85 52 82 Z" fill="#FF80AB" />

      {/* Tête */}
      <circle cx="60" cy="44" r="14" fill="#FFCC80" />
      <circle cx="63" cy="42" r="4" fill="#FF8A65" opacity="0.3" />

      {/* Yeux fermés (sourire zen) */}
      <path d="M54 44 Q56 42 58 44" stroke="#795548" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M62 44 Q64 42 66 44" stroke="#795548" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M55 50 Q60 54 65 50" stroke="#795548" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Bras en position méditation */}
      <path d="M50 62 Q40 70 38 80" stroke="#FFCC80" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M70 62 Q80 70 82 80" stroke="#FFCC80" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* Ondes de relaxation */}
      <path d="M28 30 Q34 24 40 30" stroke="#F48FB1" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M24 22 Q34 12 44 22" stroke="#F48FB1" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M80 30 Q86 24 92 30" stroke="#F48FB1" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M76 22 Q86 12 96 22" stroke="#F48FB1" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* Fleurs déco */}
      <circle cx="22" cy="72" r="4" fill="#FCE4EC" />
      <circle cx="22" cy="72" r="2" fill="#F06292" />
      <circle cx="98" cy="68" r="3" fill="#FCE4EC" />
      <circle cx="98" cy="68" r="1.5" fill="#F06292" />
    </svg>
  )
}

/* ── Fruits & Vitamines ────────────────────────────────── */
export function FruitsIllustration({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="56" fill="#F3E5F5" />

      {/* Pomme rouge */}
      <path d="M60 35 C48 35 38 46 38 58 C38 70 44 80 55 82 C58 83 62 83 65 82 C76 80 82 70 82 58 C82 46 72 35 60 35 Z"
        fill="#EF5350" />
      <path d="M60 35 C52 35 46 42 46 52 C46 42 52 37 60 35 Z" fill="#E53935" />
      <ellipse cx="52" cy="48" rx="5" ry="8" fill="white" opacity="0.2" transform="rotate(-20 52 48)" />

      {/* Queue */}
      <path d="M60 35 Q62 25 70 22" stroke="#558B2F" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Feuille */}
      <path d="M62 30 Q72 20 78 28 Q70 34 62 30 Z" fill="#66BB6A" />

      {/* Raisins */}
      <circle cx="28" cy="65" r="8" fill="#7B1FA2" />
      <circle cx="20" cy="72" r="8" fill="#8E24AA" />
      <circle cx="36" cy="72" r="8" fill="#9C27B0" />
      <circle cx="28" cy="80" r="8" fill="#7B1FA2" />
      <ellipse cx="26" cy="62" rx="3" ry="4" fill="white" opacity="0.2" transform="rotate(-20)" />

      {/* Orange */}
      <circle cx="90" cy="72" r="18" fill="#FF9800" />
      <circle cx="90" cy="72" r="14" fill="#FFA726" />
      <path d="M90 54 Q82 60 80 70 Q88 64 90 54 Z" fill="#81C784" />
      {[0,60,120,180,240,300].map((angle, i) => (
        <line key={i}
          x1="90" y1="72"
          x2={90 + 12 * Math.cos(angle * Math.PI / 180)}
          y2={72 + 12 * Math.sin(angle * Math.PI / 180)}
          stroke="#EF6C00" strokeWidth="0.8" opacity="0.4" />
      ))}
      <ellipse cx="85" cy="66" rx="4" ry="6" fill="white" opacity="0.2" transform="rotate(-30 85 66)" />

      {/* Banane */}
      <path d="M22 28 Q32 15 55 22 Q46 32 22 28 Z" fill="#FFF176" />
      <path d="M22 28 Q32 15 55 22" stroke="#F9A825" strokeWidth="1" fill="none" />
      <path d="M22 28 Q46 32 55 22" stroke="#F57F17" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  )
}

/* ── Cardio / Natation ─────────────────────────────────── */
export function CardioIllustration({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="56" fill="#E0F2F1" />

      {/* Eau (vagues) */}
      <path d="M10 80 Q30 70 50 80 Q70 90 90 80 Q110 70 120 80 L120 112 L10 112 Z" fill="#4DD0E1" opacity="0.3" />
      <path d="M10 86 Q30 76 50 86 Q70 96 90 86 Q110 76 120 86 L120 112 L10 112 Z" fill="#26C6DA" opacity="0.5" />
      <path d="M10 92 Q30 82 50 92 Q70 102 90 92 Q110 82 120 92 L120 112 L10 112 Z" fill="#00BCD4" opacity="0.7" />

      {/* Nageur (vue de côté) */}
      {/* Tête */}
      <circle cx="82" cy="64" r="10" fill="#FFCC80" />

      {/* Lunettes de natation */}
      <ellipse cx="78" cy="63" rx="5" ry="3.5" fill="#1565C0" opacity="0.8" />
      <ellipse cx="86" cy="63" rx="5" ry="3.5" fill="#1565C0" opacity="0.8" />
      <line x1="83" y1="63" x2="81" y2="63" stroke="#0D47A1" strokeWidth="1.5" />

      {/* Corps */}
      <path d="M72 68 Q50 65 28 70" stroke="#FFCC80" strokeWidth="10" strokeLinecap="round" fill="none" />

      {/* Bras gauche (dans l'eau) */}
      <path d="M50 67 Q38 55 30 58" stroke="#FFCC80" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* Bras droit (hors de l'eau) */}
      <path d="M72 64 Q85 50 94 54" stroke="#FFCC80" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* Jambes */}
      <path d="M28 70 Q20 76 16 82" stroke="#FFCC80" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M28 68 Q18 72 14 78" stroke="#FFB74D" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6" />

      {/* Éclaboussures */}
      <circle cx="32" cy="58" r="3" fill="white" opacity="0.6" />
      <circle cx="28" cy="53" r="2" fill="white" opacity="0.4" />
      <circle cx="38" cy="55" r="2" fill="white" opacity="0.5" />

      {/* Fréquence cardiaque en arrière-plan */}
      <path d="M20 30 L30 30 L35 20 L40 40 L45 28 L50 30 L60 30"
        stroke="#26C6DA" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  )
}

/* ── Tableau des correspondances catégorie → composant ── */
export const ADVICE_ILLUSTRATIONS = {
  Nutrition:   NutritionIllustration,
  Hydratation: HydrationIllustration,
  Activité:    ActivityAdviceIllustration,
  Sommeil:     SleepIllustration,
  Stress:      StressIllustration,
  Fruits:      FruitsIllustration,
  Cardio:      CardioIllustration,
}

export default function AdviceIllustration({ category, size = 100 }) {
  const Comp = ADVICE_ILLUSTRATIONS[category] ?? NutritionIllustration
  return <Comp size={size} />
}
