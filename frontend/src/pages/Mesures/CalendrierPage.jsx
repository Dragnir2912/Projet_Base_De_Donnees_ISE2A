import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, parseISO, addMonths, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { getCalendrier } from '../../services/mesuresService'
import CalendrierRegularite from '../../components/health/CalendrierRegularite'

export default function CalendrierPage() {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()

  const initMois = params.get('mois') || new Date().toISOString().slice(0, 7)
  const [mois,    setMois]    = useState(initMois)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [dayDetail, setDayDetail] = useState(null)  // dateStr du jour sélectionné

  const load = useCallback(async (m) => {
    setLoading(true)
    try {
      const r = await getCalendrier(m)
      setData(r.data.data)
    } catch {
      toast.error('Impossible de charger le calendrier.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(mois) }, [mois, load])

  const goTo = (delta) => {
    const base = parseISO(`${mois}-01`)
    const next = delta > 0 ? addMonths(base, 1) : subMonths(base, 1)
    setMois(next.toISOString().slice(0, 7))
    setDayDetail(null)
  }

  const monthLabel = data
    ? (() => {
        const s = format(parseISO(`${data.mois}-01`), 'MMMM yyyy', { locale: fr })
        return s.charAt(0).toUpperCase() + s.slice(1)
      })()
    : '…'

  const isCurrentMonth = mois === new Date().toISOString().slice(0, 7)

  // Détail d'un jour sélectionné
  const dayData    = dayDetail ? data?.jours?.[dayDetail] : null
  const dayLabel   = dayDetail ? format(parseISO(dayDetail), 'd MMMM yyyy', { locale: fr }) : ''

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/mesures')}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={18} /> Mes mesures
        </button>
        <div className="flex-1" />
        {/* Navigation mois */}
        <div className="flex items-center gap-2">
          <button onClick={() => goTo(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{ background: 'var(--bg-card)', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-card)' }}>
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-[160px] text-center">
            <p className="font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {monthLabel}
            </p>
          </div>
          <button onClick={() => goTo(1)}
            disabled={isCurrentMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{
              background: 'var(--bg-card)', border: 'none',
              cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
              color: isCurrentMonth ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              boxShadow: 'var(--shadow-card)',
              opacity: isCurrentMonth ? 0.4 : 1,
            }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendrier */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      ) : data ? (
        <CalendrierRegularite
          data={data}
          compact={false}
          onDayClick={dateStr => setDayDetail(prev => prev === dateStr ? null : dateStr)}
        />
      ) : null}

      {/* Détail du jour sélectionné */}
      {dayDetail && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(10,132,255,0.1)' }}>
              <Calendar size={16} style={{ color: 'var(--health-blue)' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{dayLabel}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {dayData ? `${dayData.count} mesure${dayData.count > 1 ? 's' : ''}` : 'Aucune mesure ce jour'}
              </p>
            </div>
          </div>

          {dayData ? (
            <div className="px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {dayData.types.map(t => (
                  <span key={t}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(52,199,89,0.1)', color: 'var(--health-green)' }}>
                    ✓ {t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navigate('/mesures')}
                className="mt-4 text-sm font-semibold flex items-center gap-1"
                style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Voir les mesures détaillées <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="px-5 py-6 text-center">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Aucune mesure enregistrée ce jour.
              </p>
              <button
                onClick={() => navigate('/mesures')}
                className="mt-2 text-sm font-semibold"
                style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Ajouter une mesure →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Conseils régularité */}
      {!loading && data && data.actifs < data.nb_jours * 0.5 && (
        <div className="rounded-2xl p-4 flex gap-3"
          style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.2)' }}>
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--health-orange)' }}>
              Améliorez votre régularité
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Des mesures quotidiennes améliorent la précision de votre VitaScore et permettent
              à votre médecin de suivre vos tendances de santé plus finement.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
