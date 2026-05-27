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
    <div className="max-w-2xl mx-auto space-y-6 page-enter">

      {/* Retour */}
      <button onClick={() => navigate('/mesures')}
        className="flex items-center gap-2 text-sm font-medium animate-fade-up"
        style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
        <ChevronLeft size={18} /> Mes mesures
      </button>

      {/* ══ HERO BANNER ══ */}
      <div style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden',
        height: 170, background: 'var(--surface-1)', border: '1px solid var(--border-0)',
      }} className="animate-fade-up">
        <div style={{ position: 'absolute', right: 0, top: 0, width: '48%', height: '100%' }}>
          <img src="/illustrations/hero/illus-patient-vitals.jpeg" alt="" aria-hidden
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--surface-1) 0%, rgba(10,21,18,0.52) 38%, transparent 75%)' }} />
        </div>
        <div style={{
          position: 'relative', zIndex: 1, height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '24px 32px',
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <Calendar size={10} /> Régularité
            </span>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-1.2px', lineHeight: 1.1, margin: 0 }}>
              Calendrier
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', margin: 0 }}>{monthLabel}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => goTo(-1)}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-1)', cursor: 'pointer', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => goTo(1)} disabled={isCurrentMonth}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-1)', cursor: isCurrentMonth ? 'not-allowed' : 'pointer', color: isCurrentMonth ? 'var(--ink-4)' : 'var(--ink-2)', opacity: isCurrentMonth ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
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
        <div style={{
          borderRadius: 20, overflow: 'hidden',
          background: 'var(--glass-card)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
          border: '1px solid var(--glass-border)',
          animation: 'scale-in 0.22s cubic-bezier(0.34,1.2,0.64,1) both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              background: 'var(--accent-dim)', border: '1px solid var(--border-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Calendar size={15} color="var(--accent)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.3px' }}>{dayLabel}</p>
              <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>
                {dayData ? `${dayData.count} mesure${dayData.count > 1 ? 's' : ''}` : 'Aucune mesure ce jour'}
              </p>
            </div>
          </div>

          {dayData ? (
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {dayData.types.map(t => (
                  <span key={t} style={{
                    padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: 'var(--accent-dim)', color: 'var(--accent)',
                    border: '1px solid var(--border-2)',
                  }}>
                    {t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navigate('/mesures')}
                style={{ marginTop: 14, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Voir les mesures détaillées <ChevronRight size={13} />
              </button>
            </div>
          ) : (
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 8px' }}>
                Aucune mesure enregistrée ce jour.
              </p>
              <button
                onClick={() => navigate('/mesures')}
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Ajouter une mesure →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Conseil régularité */}
      {!loading && data && data.actifs < data.nb_jours * 0.5 && (
        <div style={{
          borderRadius: 20, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
          background: 'rgba(255,140,66,0.07)', border: '1px solid rgba(255,140,66,0.18)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: 'rgba(255,140,66,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14 }}>⚡</span>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#FF8C42', margin: '0 0 4px', letterSpacing: '-0.2px' }}>
              Améliorez votre régularité
            </p>
            <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
              Des mesures quotidiennes améliorent la précision de votre VitaScore et permettent
              à votre médecin de suivre vos tendances de santé plus finement.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

