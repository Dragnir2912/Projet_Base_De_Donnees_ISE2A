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

/* Couleur selon le nombre de mesures */
function dayColor(count) {
  if (!count) return null  // transparent = background natif
  if (count === 1) return 'rgba(52,199,89,0.30)'
  if (count === 2) return 'rgba(52,199,89,0.55)'
  if (count === 3) return 'rgba(52,199,89,0.78)'
  return '#34C759'
}

function dayTextColor(count) {
  if (!count) return 'var(--text-tertiary)'
  if (count >= 3) return 'white'
  return '#1a6634'
}

export default function CalendrierRegularite({ data, compact = false, onDayClick }) {
  const [hovered, setHovered] = useState(null)

  if (!data) return null

  const { mois, nb_jours, premier_jour_semaine, jours, streak, actifs } = data
  const today       = new Date().toISOString().slice(0, 10)
  const moisActuel  = new Date().toISOString().slice(0, 7)
  // Jours écoulés : jour actuel pour le mois courant, total pour les mois passés
  const joursEcoules = mois === moisActuel
    ? new Date().getDate()
    : nb_jours
  const pctRegularite = Math.min(Math.round((actifs / joursEcoules) * 100), 100)

  // Construire le tableau de jours (avec padding pour début du mois)
  // premier_jour_semaine : 0=lundi … 6=dimanche (convention Python calendar)
  const offset = premier_jour_semaine  // cases vides au début
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= nb_jours; d++) {
    const dateStr = `${mois}-${String(d).padStart(2, '0')}`
    cells.push({ d, dateStr, data: jours[dateStr] })
  }
  // Compléter pour avoir un multiple de 7
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = format(parseISO(`${mois}-01`), 'MMMM yyyy', { locale: fr })
  const monthCap   = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  if (compact) {
    /* ── VERSION MINIATURE (dashboard) ── */
    const cellSize = 22
    const gap      = 3

    return (
      <div>
        {/* Jours de la semaine */}
        <div className="flex gap-[3px] mb-1">
          {JOURS_SEMAINE.map((j, i) => (
            <div key={i}
              className="flex items-center justify-center text-[9px] font-bold"
              style={{ width: cellSize, color: 'var(--text-tertiary)', flexShrink: 0 }}>
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
                  width:        cellSize,
                  height:       cellSize,
                  borderRadius: 5,
                  background:   bg ?? 'var(--bg-tertiary)',
                  border:       isToday ? '2px solid var(--health-blue)' : '2px solid transparent',
                  cursor:       onDayClick ? 'pointer' : 'default',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  fontSize:     9,
                  fontWeight:   isToday ? 800 : 600,
                  color:        dayTextColor(count),
                  transition:   'transform 0.15s ease',
                }}
                onMouseEnter={e => { if (onDayClick) e.currentTarget.style.transform = 'scale(1.2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
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
  return (
    <div className="space-y-4">
      {/* En-tête stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Jours actifs', value: actifs, color: '#34C759', sub: `sur ${joursEcoules} j écoulés` },
          { label: 'Série actuelle', value: streak, color: '#0A84FF', sub: streak > 0 ? `jour${streak > 1 ? 's' : ''} consécutifs` : 'À améliorer !' },
          { label: 'Régularité', value: `${pctRegularite}%`, color: '#BF5AF2', sub: pctRegularite === 100 ? 'Parfait !' : pctRegularite >= 70 ? 'Très bien' : 'À améliorer' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4 text-center"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', borderTop: `3px solid ${s.color}` }}>
            <p className="text-2xl font-bold tabular-nums" style={{ color: s.color, letterSpacing: '-1px' }}>{s.value}</p>
            <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-3 justify-end">
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Moins</span>
        {[null, 1, 2, 3, 4].map((n, i) => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: 4,
            background: n === null ? 'var(--bg-tertiary)' : dayColor(n),
          }} />
        ))}
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Plus</span>
      </div>

      {/* Calendrier */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
        {/* En-tête jours */}
        <div className="grid grid-cols-7 px-4 pt-4 pb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(j => (
            <div key={j} className="text-center text-[11px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)' }}>
              {j}
            </div>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7 gap-1.5 px-4 pb-4">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} className="aspect-square" />
            const isToday   = cell.dateStr === today
            const isFuture  = cell.dateStr > today
            const count     = cell.data?.count ?? 0
            const isHovered = hovered === cell.dateStr
            const bg        = isFuture ? 'transparent' : (dayColor(count) ?? 'var(--bg-secondary)')

            return (
              <div key={i}
                className="aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all relative"
                style={{
                  background: isHovered && !isFuture ? (bg === 'var(--bg-secondary)' ? 'var(--bg-tertiary)' : bg) : bg,
                  border:     isToday ? '2px solid var(--health-blue)' : '2px solid transparent',
                  opacity:    isFuture ? 0.3 : 1,
                  transform:  isHovered && !isFuture ? 'scale(1.08)' : 'scale(1)',
                  boxShadow:  isHovered && count > 0 ? '0 4px 12px rgba(52,199,89,0.3)' : 'none',
                }}
                onClick={() => !isFuture && onDayClick?.(cell.dateStr)}
                onMouseEnter={() => setHovered(cell.dateStr)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="text-xs font-bold tabular-nums"
                  style={{ color: dayTextColor(count) }}>
                  {cell.d}
                </span>
                {count > 0 && (
                  <span className="text-[9px] font-semibold"
                    style={{ color: count >= 3 ? 'rgba(255,255,255,0.85)' : '#1a6634', lineHeight: 1 }}>
                    {count}
                  </span>
                )}

                {/* Tooltip hover */}
                {isHovered && !isFuture && (
                  <div
                    className="absolute z-10 pointer-events-none"
                    style={{
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      padding: '6px 10px',
                      whiteSpace: 'nowrap',
                      boxShadow: 'var(--shadow-elevated)',
                      minWidth: 120,
                    }}
                  >
                    <p className="text-[11px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {format(parseISO(cell.dateStr), 'd MMMM', { locale: fr })}
                    </p>
                    {count === 0 ? (
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Aucune mesure</p>
                    ) : (
                      <>
                        <p className="text-[10px] font-semibold" style={{ color: '#34C759' }}>
                          {count} mesure{count > 1 ? 's' : ''}
                        </p>
                        {cell.data?.types?.slice(0, 3).map(t => (
                          <p key={t} className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>• {t}</p>
                        ))}
                        {(cell.data?.types?.length ?? 0) > 3 && (
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
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
