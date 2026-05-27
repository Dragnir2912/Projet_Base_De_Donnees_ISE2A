import { useEffect, useState } from 'react'

const RINGS = [
  { color: '#FF6B8A', label: 'Cardio',    r: 54, delay: 0   },
  { color: '#00D97E', label: 'Équilibre', r: 38, delay: 180 },
  { color: '#00DDA0', label: 'Activité',  r: 22, delay: 360 },
]

function Ring({ color, r, progress, strokeWidth = 10, animated }) {
  const circumference = 2 * Math.PI * r
  const offset        = animated ? circumference * (1 - Math.min(progress, 1)) : circumference
  const glowOpacity   = Math.min(progress, 1) * 0.28

  return (
    <g>
      {/* Track */}
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth={strokeWidth} opacity={0.10} />
      {/* Soft glow layer — wider, very low opacity, no filter */}
      <circle
        cx="70" cy="70" r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth + 10}
        opacity={glowOpacity}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1), opacity 1.4s ease' }}
      />
      {/* Main arc */}
      <circle
        cx="70" cy="70" r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: `stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)` }}
      />
    </g>
  )
}

export default function VitaRing({ score = null, size = 140 }) {
  const [phases, setPhases] = useState([false, false, false])

  useEffect(() => {
    const timers = RINGS.map((ring, i) =>
      setTimeout(() => setPhases(p => p.map((v, j) => j === i ? true : v)), ring.delay + 120)
    )
    return () => timers.forEach(clearTimeout)
  }, [score])

  const scoreNorm = score !== null ? score / 100 : 0

  const progresses = [
    Math.min(scoreNorm * 1.2, 1),
    Math.min(scoreNorm * 1.0, 1),
    Math.min(scoreNorm * 0.85, 1),
  ]

  const scoreLabel = score === null ? '—'
    : score >= 80 ? 'Excellent'
    : score >= 60 ? 'Correct'
    : 'À améliorer'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 140 140" style={{ display: 'block' }}>
          {RINGS.map((ring, i) => (
            <Ring
              key={ring.label}
              color={ring.color}
              r={ring.r}
              progress={progresses[i]}
              animated={phases[i]}
            />
          ))}

          {/* Score numerique */}
          <text
            x="70" y="63"
            textAnchor="middle"
            fontSize="26" fontWeight="800" letterSpacing="-2"
            style={{ fill: 'var(--ink-1)', fontFamily: 'Poppins, system-ui', fontVariantNumeric: 'tabular-nums' }}
          >
            {score !== null ? Math.round(score) : '—'}
          </text>
          <text
            x="70" y="79"
            textAnchor="middle"
            fontSize="9" fontWeight="700" letterSpacing="1"
            style={{ fill: 'var(--ink-3)', fontFamily: 'Poppins, system-ui' }}
          >
            VITASCORE
          </text>
        </svg>
      </div>

      {/* Label score */}
      {score !== null && (
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '-0.2px',
          color: score >= 80 ? '#00D97E' : score >= 60 ? '#FF8C42' : '#FF4B60',
          padding: '3px 10px', borderRadius: 99,
          background: score >= 80 ? 'rgba(0,217,126,0.10)' : score >= 60 ? 'rgba(255,140,66,0.10)' : 'rgba(255,75,96,0.10)',
        }}>
          {scoreLabel}
        </span>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12 }}>
        {RINGS.map(ring => (
          <div key={ring.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: ring.color,
              boxShadow: `0 0 6px ${ring.color}70`,
              flexShrink: 0,
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', fontFamily: 'Poppins, system-ui', letterSpacing: '-0.1px' }}>
              {ring.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
