import { useEffect, useState } from 'react'
import { CheckCheck, AlertTriangle, ShieldAlert, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { getAlertes, marquerVue, toutVoir } from '../../services/alertesService'
import useAlertesStore from '../../store/alertesStore'

export default function AlertesPage() {
  const [alertes, setAlertes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const { fetchCompteur, reset } = useAlertesStore()

  useEffect(() => {
    getAlertes()
      .then((res) => setAlertes(res.data.data ?? []))
      .catch(() => toast.error('Impossible de charger les alertes.'))
      .finally(() => setLoading(false))
  }, [])

  const handleVoir = async (id) => {
    await marquerVue(id)
    setAlertes((prev) => prev.map((a) => (a.id === id ? { ...a, vue: true } : a)))
    fetchCompteur()
  }

  const handleToutVoir = async () => {
    await toutVoir()
    setAlertes((prev) => prev.map((a) => ({ ...a, vue: true })))
    reset()
    toast.success('Toutes les alertes marquées comme vues.')
  }

  const nonVues  = alertes.filter((a) => !a.vue)
  const filtered = filter === 'all'
    ? alertes
    : filter === 'non-vues'
    ? alertes.filter((a) => !a.vue)
    : alertes.filter((a) => a.niveau === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="page-enter">

      {/* ── Hero ── */}
      <div style={{
        background: 'var(--surface-1)',
        borderRadius: 22,
        border: '1px solid var(--border-1)',
        padding: '28px 32px',
        position: 'relative',
        overflow: 'hidden',
      }} className="animate-fade-up">
        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'radial-gradient(ellipse at 90% 30%, rgba(255,75,96,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 0, width: 180, height: 180, background: 'radial-gradient(circle, rgba(255,140,66,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: nonVues.length > 0 ? 'rgba(255,75,96,0.12)' : 'rgba(0,217,126,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={15} color={nonVues.length > 0 ? '#FF4B60' : '#00D97E'} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)' }}>Santé</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-1.6px', margin: '0 0 6px', lineHeight: 1.1 }}>
              Mes alertes
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0, letterSpacing: '-0.1px' }}>
              {nonVues.length > 0
                ? `${nonVues.length} alerte${nonVues.length > 1 ? 's' : ''} nécessite${nonVues.length > 1 ? 'nt' : ''} votre attention`
                : 'Vos indicateurs sont dans les normes'}
            </p>
          </div>

          {/* Stats résumé */}
          <div style={{ display: 'flex', gap: 10 }} className="hidden sm:flex">
            {[
              { label: 'Danger',    count: alertes.filter(a => a.niveau === 'danger').length,    color: '#FF4B60', bg: 'rgba(255,75,96,0.10)' },
              { label: 'Attention', count: alertes.filter(a => a.niveau === 'attention').length, color: '#FF8C42', bg: 'rgba(255,140,66,0.10)' },
              { label: 'Non vues',  count: nonVues.length,                                       color: 'var(--ink-2)', bg: 'var(--surface-3)' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} style={{ padding: '12px 18px', borderRadius: 14, background: bg, minWidth: 80, textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-1.5px', margin: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{count}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }} className="animate-fade-up delay-100">
        {/* Filtres */}
        <div className="pill-tabs" style={{ width: 'fit-content' }}>
          {[
            { key: 'all',       label: 'Toutes',    count: alertes.length },
            { key: 'non-vues',  label: 'Non vues',  count: nonVues.length },
            { key: 'danger',    label: 'Danger',    count: alertes.filter(a => a.niveau === 'danger').length },
            { key: 'attention', label: 'Attention', count: alertes.filter(a => a.niveau === 'attention').length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              className={`pill-tab${filter === key ? ' active' : ''}`}
              onClick={() => setFilter(key)}
              type="button"
            >
              {label}
              {count > 0 && (
                <span style={{
                  marginLeft: 5, minWidth: 18, height: 16, padding: '0 4px',
                  borderRadius: 99, fontSize: 10, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: key === 'danger' ? 'rgba(255,75,96,0.20)' : key === 'attention' ? 'rgba(255,140,66,0.20)' : 'var(--surface-3)',
                  color: key === 'danger' ? '#FF4B60' : key === 'attention' ? '#FF8C42' : 'var(--ink-3)',
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tout marquer vu */}
        {nonVues.length > 0 && (
          <button
            onClick={handleToutVoir}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 12,
              background: 'var(--surface-2)', border: '1px solid var(--border-1)',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)',
              transition: 'all 0.18s ease', letterSpacing: '-0.1px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border-1)'; e.currentTarget.style.color = 'var(--ink-2)' }}
          >
            <CheckCheck size={14} />
            Tout marquer comme vu
          </button>
        )}
      </div>

      {/* ── Liste des alertes ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 84, borderRadius: 18 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyAlertes filter={filter} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="animate-fade-up delay-200">
          {filtered.map((a, i) => (
            <AlerteCard key={a.id} alerte={a} onVoir={() => handleVoir(a.id)} delay={i * 40} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyAlertes({ filter }) {
  return (
    <div style={{
      background: 'var(--surface-1)',
      borderRadius: 22,
      border: '1px solid var(--border-1)',
      padding: '48px 32px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
    }} className="animate-fade-up">
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,217,126,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <CheckCheck size={28} color="#00D97E" />
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.6px', margin: 0 }}>
        {filter === 'all' ? 'Tout va bien !' : 'Aucune alerte ici'}
      </p>
      <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0, lineHeight: 1.65, maxWidth: 320 }}>
        {filter === 'all'
          ? 'Vos indicateurs de santé sont dans les normes. Continuez comme ça !'
          : 'Aucune alerte dans cette catégorie pour le moment.'}
      </p>
    </div>
  )
}

function AlerteCard({ alerte, onVoir, delay = 0 }) {
  const isDanger    = alerte.niveau === 'danger'
  const accentColor = isDanger ? '#FF4B60' : '#FF8C42'
  const bgColor     = isDanger ? 'rgba(255,75,96,0.07)' : 'rgba(255,140,66,0.07)'
  const borderColor = isDanger ? 'rgba(255,75,96,0.18)' : 'rgba(255,140,66,0.18)'

  return (
    <div style={{
      padding: '16px 20px',
      borderRadius: 18,
      background: alerte.vue ? 'var(--surface-1)' : bgColor,
      border: `1px solid ${alerte.vue ? 'var(--border-0)' : borderColor}`,
      display: 'flex', alignItems: 'flex-start', gap: 14,
      opacity: alerte.vue ? 0.60 : 1,
      transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms, background 0.2s ease`,
      animation: `fade-up 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
    }}>
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        background: isDanger ? 'rgba(255,75,96,0.12)' : 'rgba(255,140,66,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isDanger
          ? <ShieldAlert size={17} color={accentColor} />
          : <AlertTriangle size={17} color={accentColor} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{
            padding: '2px 9px', borderRadius: 99,
            fontSize: 11, fontWeight: 600,
            background: isDanger ? 'rgba(255,75,96,0.12)' : 'rgba(255,140,66,0.12)',
            color: accentColor,
          }}>
            {isDanger ? 'Danger' : 'Attention'}
          </span>
          {alerte.type_alerte && (
            <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'var(--accent-dim)', color: 'var(--accent)' }}>
              {alerte.type_alerte}
            </span>
          )}
          {!alerte.vue && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, display: 'inline-block', boxShadow: `0 0 8px ${accentColor}` }} />
          )}
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-1)', margin: '0 0 5px', lineHeight: 1.5, letterSpacing: '-0.1px' }}>
          {alerte.message}
        </p>
        <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>
          {format(new Date(alerte.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
        </p>
      </div>

      {/* Action */}
      {!alerte.vue && (
        <button
          onClick={onVoir}
          style={{
            padding: '7px 14px', borderRadius: 10, flexShrink: 0,
            fontSize: 12, fontWeight: 600, color: 'var(--accent)',
            background: 'var(--accent-dim)', border: 'none', cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,221,160,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
        >
          Vu
        </button>
      )}
    </div>
  )
}
