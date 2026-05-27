/**
 * CalendrierRegularite — vue mensuelle de la régularité des mesures.
 *
 * Props:
 *   data      — réponse API { mois, nb_jours, premier_jour_semaine, jours, streak, actifs }
 *   compact   — true = affichage miniature sans détails (widget dashboard)
 *   onDayClick(dateStr) — callback quand on clique sur un jour
 */
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const JOURS_SEMAINE = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/* Heatmap basée sur la palette accent (teal émeraude) */
function dayColor(count) {
  if (!count) return null
  if (count === 1) return 'rgba(0,221,160,0.20)'
  if (count === 2) return 'rgba(0,221,160,0.46)'
  if (count === 3) return 'rgba(0,221,160,0.72)'
  return 'var(--accent)'
}

function dayTextColor(count) {
  if (!count) return 'var(--ink-3)'
  if (count >= 3) return '#051A12'
  return 'var(--accent)'
}

export default function CalendrierRegularite({ data, compact = false, onDayClick }) {
  const [hovered, setHovered] = useState(null)

  if (!data) return null

  const { mois, nb_jours, premier_jour_semaine, jours, streak, actifs } = data
  const today       = new Date().toISOString().slice(0, 10)
  const moisActuel  = new Date().toISOString().slice(0, 7)
  const joursEcoules = mois === moisActuel ? new Date().getDate() : nb_jours
  const pctRegularite = Math.min(Math.round((actifs / joursEcoules) * 100), 100)

  /* Grille jours */
  const offset = premier_jour_semaine
  const cells  = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= nb_jours; d++) {
    const dateStr = `${mois}-${String(d).padStart(2, '0')}`
    cells.push({ d, dateStr, data: jours[dateStr] })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = format(parseISO(`${mois}-01`), 'MMMM yyyy', { locale: fr })
  const monthCap   = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  /* ── VERSION COMPACTE (dashboard widget) ── */
  if (compact) {
    const cellSize = 22
    const gap      = 3

    return (
      <div>
        {/* Jours de la semaine */}
        <div style={{ display: 'flex', gap, marginBottom: 4 }}>
          {JOURS_SEMAINE.map((j, i) => (
            <div key={i} style={{
              width: cellSize, textAlign: 'center',
              fontSize: 9, fontWeight: 700,
              color: 'var(--ink-3)', flexShrink: 0,
              fontFamily: 'Poppins, system-ui',
            }}>
              {j}
            </div>
          ))}
        </div>

        {/* Grille */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${cellSize}px)`, gap }}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} style={{ width: cellSize, height: cellSize }} />
            const isToday = cell.dateStr === today
            const count   = cell.data?.count ?? 0
            const bg      = dayColor(count)

            return (
              <div key={i}
                title={cell.data ? `${count} mesure${count > 1 ? 's' : ''}` : 'Aucune mesure'}
                onClick={() => onDayClick?.(cell.dateStr)}
                style={{
                  width:            cellSize,
                  height:           cellSize,
                  borderRadius:     5,
                  background:       bg ?? 'var(--surface-2)',
                  border:           isToday ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor:           onDayClick ? 'pointer' : 'default',
                  display:          'flex',
                  alignItems:       'center',
                  justifyContent:   'center',
                  fontSize:         9,
                  fontWeight:       isToday ? 800 : 600,
                  color:            dayTextColor(count),
                  transition:       'transform 0.15s ease, box-shadow 0.15s ease',
                  boxShadow:        count > 0 ? `0 0 6px rgba(0,221,160,${count * 0.07})` : 'none',
                  fontFamily:       'Poppins, system-ui',
                  fontVariantNumeric: 'tabular-nums',
                }}
                onMouseEnter={e => {
                  if (onDayClick) {
                    e.currentTarget.style.transform = 'scale(1.22)'
                    e.currentTarget.style.boxShadow = `0 0 10px rgba(0,221,160,0.30)`
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = count > 0 ? `0 0 6px rgba(0,221,160,${count * 0.07})` : 'none'
                }}
              >
                {cell.d}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── VERSION COMPLÈTE ── */
  const stats = [
    { label: 'Jours actifs',   value: actifs,           color: 'var(--accent)', sub: `sur ${joursEcoules} j écoulés` },
    { label: 'Série actuelle', value: streak,            color: '#9B77F5',        sub: streak > 0 ? `jour${streak > 1 ? 's' : ''} consécutifs` : 'À améliorer !' },
    { label: 'Régularité',     value: `${pctRegularite}%`, color: '#00D97E',    sub: pctRegularite === 100 ? 'Parfait !' : pctRegularite >= 70 ? 'Très bien' : 'À améliorer' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Stats — glass cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            borderRadius: 20,
            padding: '16px 18px',
            textAlign: 'center',
            background: 'var(--glass-card)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            border: '1px solid var(--glass-border)',
            borderTop: `3px solid ${s.color}`,
            transition: 'transform 0.2s ease',
          }}>
            <p style={{
              fontSize: 26, fontWeight: 800, letterSpacing: '-1.5px',
              color: s.color, margin: 0, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'Poppins, system-ui',
            }}>
              {s.value}
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-1)', margin: '5px 0 2px', letterSpacing: '-0.2px' }}>
              {s.label}
            </p>
            <p style={{ fontSize: 10, color: 'var(--ink-3)', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>Moins</span>
        {[null, 1, 2, 3, 4].map((n, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: 4,
            background: n === null ? 'var(--surface-2)' : dayColor(n) ?? 'var(--accent)',
          }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>Plus</span>
      </div>

      {/* Calendrier */}
      <div style={{
        borderRadius: 20, overflow: 'hidden',
        background: 'var(--glass-card)',
        backdropFilter: 'blur(24px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
        border: '1px solid var(--glass-border)',
      }}>
        {/* En-tête jours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '16px 16px 8px' }}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(j => (
            <div key={j} style={{
              textAlign: 'center',
              fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.6px',
              color: 'var(--ink-3)',
              fontFamily: 'Poppins, system-ui',
            }}>
              {j}
            </div>
          ))}
        </div>

        {/* Grille */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, padding: '0 16px 16px' }}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} style={{ aspectRatio: '1' }} />
            const isToday   = cell.dateStr === today
            const isFuture  = cell.dateStr > today
            const count     = cell.data?.count ?? 0
            const isHovered = hovered === cell.dateStr
            const bg        = isFuture ? 'transparent' : (dayColor(count) ?? 'var(--surface-2)')

            return (
              <div key={i}
                style={{
                  aspectRatio: '1',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 12, cursor: onDayClick ? 'pointer' : 'default',
                  position: 'relative',
                  background: isHovered && !isFuture
                    ? (bg === 'var(--surface-2)' ? 'var(--surface-3)' : bg)
                    : bg,
                  border: isToday ? '2px solid var(--accent)' : '2px solid transparent',
                  opacity: isFuture ? 0.25 : 1,
                  transform: isHovered && !isFuture ? 'scale(1.10)' : 'scale(1)',
                  boxShadow: isHovered && count > 0
                    ? '0 4px 14px rgba(0,221,160,0.28)'
                    : count > 0 ? `0 0 8px rgba(0,221,160,${count * 0.06})` : 'none',
                  transition: 'all 0.18s cubic-bezier(0.34,1.2,0.64,1)',
                  zIndex: isHovered ? 2 : 1,
                }}
                onClick={() => !isFuture && onDayClick?.(cell.dateStr)}
                onMouseEnter={() => setHovered(cell.dateStr)}
                onMouseLeave={() => setHovered(null)}
              >
                <span style={{
                  fontSize: 12, fontWeight: isToday ? 800 : 600,
                  color: dayTextColor(count),
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'Poppins, system-ui',
                }}>
                  {cell.d}
                </span>
                {count > 0 && (
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: count >= 3 ? 'rgba(5,26,18,0.70)' : 'var(--accent)',
                    lineHeight: 1,
                  }}>
                    {count}
                  </span>
                )}

                {/* Tooltip premium */}
                {isHovered && !isFuture && (
                  <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--glass-card)',
                    backdropFilter: 'blur(20px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 12,
                    padding: '8px 12px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
                    minWidth: 130,
                    zIndex: 20,
                    pointerEvents: 'none',
                    animation: 'fadeIn 0.12s ease',
                  }}>
                    <p style={{
                      fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.8px',
                      color: 'var(--ink-3)', margin: '0 0 4px',
                    }}>
                      {format(parseISO(cell.dateStr), 'd MMMM', { locale: fr })}
                    </p>
                    {count === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>Aucune mesure</p>
                    ) : (
                      <>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                          {count} mesure{count > 1 ? 's' : ''}
                        </p>
                        {cell.data?.types?.slice(0, 3).map(t => (
                          <p key={t} style={{ fontSize: 10, color: 'var(--ink-3)', margin: '1px 0' }}>· {t}</p>
                        ))}
                        {(cell.data?.types?.length ?? 0) > 3 && (
                          <p style={{ fontSize: 10, color: 'var(--ink-3)', margin: '1px 0' }}>
                            +{cell.data.types.length - 3} autre{cell.data.types.length - 3 > 1 ? 's' : ''}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
