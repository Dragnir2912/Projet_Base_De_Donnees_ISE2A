import { useEffect, useState } from 'react'

const RINGS = [
  { color: '#FF2D55', label: 'Cardio',    r: 54 },
  { color: '#34C759', label: 'Équilibre', r: 38 },
  { color: '#007AFF', label: 'Activité',  r: 22 },
]

function Ring({ color, r, progress, strokeWidth = 10 }) {
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(progress, 1))

  return (
    <g>
      {/* Fond de l'anneau */}
      <circle
        cx="70" cy="70" r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.15}
      />
      {/* Anneau de progression */}
      <circle
        cx="70" cy="70" r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </g>
  )
}

export default function VitaRing({ score = null, detail = [], size = 140 }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const scoreNorm = score !== null ? score / 100 : 0

  // Répartit le score entre les 3 anneaux (simplification visuelle)
  const progresses = animated
    ? [
        Math.min(scoreNorm * 1.2, 1),
        Math.min(scoreNorm * 1.0, 1),
        Math.min(scoreNorm * 0.85, 1),
      ]
    : [0, 0, 0]

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 140 140">
        {RINGS.map((ring, i) => (
          <Ring key={ring.label} color={ring.color} r={ring.r} progress={progresses[i]} />
        ))}
        {/* Score central */}
        <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1C1C1E">
          {score !== null ? Math.round(score) : '—'}
        </text>
        <text x="70" y="82" textAnchor="middle" fontSize="10" fill="#8E8E93" fontWeight="500">
          VitaScore
        </text>
      </svg>

      {/* Légende compacte */}
      <div className="flex gap-3">
        {RINGS.map((ring) => (
          <div key={ring.label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: ring.color }} />
            <span className="text-xs text-[#8E8E93]">{ring.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
