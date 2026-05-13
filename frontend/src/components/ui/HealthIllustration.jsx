/**
 * Illustrations SVG santé réutilisables.
 * Toutes animent subtilement au hover ou en boucle.
 */

/* ─── Stéthoscope ─────────────────────────────────────── */
export function StethoscopeIllustration({ size = 120, color = '#0A84FF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(10,132,255,0.2))' }}>
      {/* Fond circulaire */}
      <circle cx="60" cy="60" r="52" fill={`${color}12`} />
      {/* Tête du stéthoscope */}
      <circle cx="60" cy="80" r="16" stroke={color} strokeWidth="3" fill={`${color}18`} />
      <circle cx="60" cy="80" r="8"  fill={color} opacity="0.5" />
      {/* Tube */}
      <path d="M44 80 C44 80 30 80 30 65 C30 50 44 50 44 50 L76 50 C76 50 90 50 90 65 C90 80 76 80 76 80"
        stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Embouts */}
      <circle cx="30" cy="50" r="5" fill={color} opacity="0.8" />
      <circle cx="90" cy="50" r="5" fill={color} opacity="0.8" />
      {/* Ligne ECG dans la tête */}
      <path d="M51 80 L55 80 L57 76 L60 84 L63 77 L65 80 L69 80"
        stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  )
}

/* ─── Cœur ECG ────────────────────────────────────────── */
export function HeartECGIllustration({ size = 120, color = '#FF2D55', animated = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="52" fill={`${color}10`} />
      {/* Cœur */}
      <path
        d="M60 90 C60 90 28 70 28 48 C28 38 36 30 46 30 C52 30 57 33 60 37 C63 33 68 30 74 30 C84 30 92 38 92 48 C92 70 60 90 60 90Z"
        fill={color} opacity="0.15" stroke={color} strokeWidth="2.5"
      />
      {/* Ligne ECG animée */}
      <path
        d="M32 60 L44 60 L48 50 L55 72 L62 46 L67 60 L76 60 L80 55 L84 60 L88 60"
        stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={animated ? {
          strokeDasharray: 120,
          strokeDashoffset: 0,
          animation: 'ecgDraw 2s ease-in-out infinite',
        } : {}}
      />
      <style>{`
        @keyframes ecgDraw {
          0%   { stroke-dashoffset: 120; opacity: 0.4; }
          50%  { stroke-dashoffset: 0;   opacity: 1; }
          100% { stroke-dashoffset: -120; opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes ecgDraw { from { opacity: 1; } to { opacity: 1; } }
        }
      `}</style>
    </svg>
  )
}

/* ─── Bouclier (pas d'alertes) ────────────────────────── */
export function ShieldOkIllustration({ size = 100, color = '#34C759' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="44" fill={`${color}10`} />
      {/* Bouclier */}
      <path d="M50 18 L72 28 L72 52 C72 66 62 78 50 82 C38 78 28 66 28 52 L28 28 Z"
        fill={color} opacity="0.15" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {/* Coche */}
      <path d="M38 50 L46 58 L62 42"
        stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Robot IA ────────────────────────────────────────── */
export function AIAssistantIllustration({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="52" fill="rgba(191,90,242,0.08)" />
      {/* Tête robot arrondie */}
      <rect x="32" y="36" width="56" height="48" rx="14" fill="rgba(191,90,242,0.15)" stroke="#BF5AF2" strokeWidth="2.5" />
      {/* Antenne */}
      <line x1="60" y1="20" x2="60" y2="36" stroke="#BF5AF2" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="60" cy="18" r="4" fill="#BF5AF2" />
      {/* Yeux */}
      <circle cx="47" cy="56" r="6" fill="#BF5AF2" opacity="0.7">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="73" cy="56" r="6" fill="#BF5AF2" opacity="0.7">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Pupilles */}
      <circle cx="47" cy="56" r="2.5" fill="white" />
      <circle cx="73" cy="56" r="2.5" fill="white" />
      {/* Sourire ECG */}
      <path d="M40 70 L48 70 L51 65 L55 75 L59 67 L62 70 L66 70 L69 67 L72 70 L80 70"
        stroke="#BF5AF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Oreilles */}
      <rect x="22" y="50" width="10" height="20" rx="5" fill="rgba(191,90,242,0.3)" />
      <rect x="88" y="50" width="10" height="20" rx="5" fill="rgba(191,90,242,0.3)" />
    </svg>
  )
}

/* ─── Clipboard / presse-papiers (mesures) ────────────── */
export function ClipboardIllustration({ size = 100, color = '#FF9500' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="44" fill={`${color}10`} />
      {/* Planche */}
      <rect x="26" y="28" width="48" height="52" rx="6" fill={`${color}15`} stroke={color} strokeWidth="2.5" />
      {/* Clip */}
      <rect x="40" y="22" width="20" height="12" rx="4" fill="var(--bg-card)" stroke={color} strokeWidth="2.5" />
      {/* Lignes */}
      <line x1="36" y1="46" x2="64" y2="46" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="36" y1="56" x2="58" y2="56" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="36" y1="66" x2="52" y2="66" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Mini graphique */}
      <path d="M36 72 L42 68 L48 71 L54 64 L60 67 L64 63"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Médecin / Blouse ────────────────────────────────── */
export function DoctorIllustration({ size = 120, color = '#0A84FF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="52" fill={`${color}08`} />
      {/* Corps */}
      <rect x="35" y="68" width="50" height="36" rx="10" fill={`${color}20`} stroke={color} strokeWidth="2.5" />
      {/* Croix médicale sur la blouse */}
      <rect x="56" y="76" width="8" height="20" rx="2" fill={color} opacity="0.6" />
      <rect x="50" y="82" width="20" height="8" rx="2" fill={color} opacity="0.6" />
      {/* Tête */}
      <circle cx="60" cy="48" r="18" fill={`${color}20`} stroke={color} strokeWidth="2.5" />
      {/* Stéthoscope */}
      <path d="M40 78 C40 78 30 78 30 68 C30 58 40 56 40 56"
        stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="54" r="5" fill={color} opacity="0.5" />
      {/* Yeux souriants */}
      <path d="M52 46 C54 44 56 44 58 46" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M62 46 C64 44 66 44 68 46" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Sourire */}
      <path d="M52 54 C56 58 64 58 68 54" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/* ─── Pas de données / Empty ──────────────────────────── */
export function EmptyDataIllustration({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" fill="var(--bg-secondary)" />
      {/* Graphique vide */}
      <rect x="20" y="60" width="10" height="15" rx="3" fill="var(--bg-tertiary)" />
      <rect x="36" y="50" width="10" height="25" rx="3" fill="var(--bg-tertiary)" />
      <rect x="52" y="42" width="10" height="33" rx="3" fill="var(--bg-tertiary)" />
      <path d="M15 75 L75 75" stroke="var(--border-medium)" strokeWidth="2" strokeLinecap="round" />
      {/* Point d'interrogation */}
      <text x="45" y="32" textAnchor="middle" fontSize="20" fill="var(--text-tertiary)" fontFamily="DM Sans, sans-serif">
        ?
      </text>
    </svg>
  )
}
