import { useEffect, useState } from 'react'
import { BellRing, CheckCheck, AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import Illustration from '../../components/ui/Illustration'
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

  const nonVues = alertes.filter((a) => !a.vue)
  const filtered = filter === 'all'
    ? alertes
    : filter === 'non-vues'
      ? alertes.filter((a) => !a.vue)
      : alertes.filter((a) => a.niveau === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Alertes
          </h1>
          {nonVues.length > 0 && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {nonVues.length} alerte{nonVues.length > 1 ? 's' : ''} non vue{nonVues.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {nonVues.length > 0 && (
          <button
            onClick={handleToutVoir}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150"
            style={{
              background: 'var(--bg-card)', color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-card)', border: 'none', cursor: 'pointer',
            }}
          >
            <CheckCheck size={15} />
            Tout marquer comme vu
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div
        className="inline-flex items-center gap-1 p-1 rounded-xl"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
      >
        {[
          { key: 'all',      label: 'Toutes',    count: alertes.length },
          { key: 'non-vues', label: 'Non vues',  count: nonVues.length },
          { key: 'danger',   label: 'Danger',    count: alertes.filter((a) => a.niveau === 'danger').length },
          { key: 'attention',label: 'Attention', count: alertes.filter((a) => a.niveau === 'attention').length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
              background: filter === key ? 'var(--bg-secondary)' : 'transparent',
              color:      filter === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: 'none', cursor: 'pointer',
              boxShadow: filter === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {label}
            {count > 0 && (
              <span
                className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{
                  background: filter === key ? 'var(--text-tertiary)' : 'var(--bg-tertiary)',
                  color: filter === key ? 'var(--bg-card)' : 'var(--text-tertiary)',
                }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center text-center"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <Illustration name="empty-alerts" width={200} height={200} />
          <p className="font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>Aucune alerte</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {filter === 'all'
              ? 'Vos indicateurs de santé sont dans les normes.'
              : 'Aucune alerte dans cette catégorie.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <AlerteCard key={a.id} alerte={a} onVoir={() => handleVoir(a.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function AlerteCard({ alerte, onVoir }) {
  const isDanger = alerte.niveau === 'danger'
  const accentColor = isDanger ? 'var(--health-red)' : 'var(--health-orange)'

  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4 transition-all duration-200"
      style={{
        background:  'var(--bg-card)',
        boxShadow:   'var(--shadow-card)',
        opacity:     alerte.vue ? 0.65 : 1,
        borderLeft:  `4px solid ${accentColor}`,
        borderRadius: '0 16px 16px 0',
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: isDanger ? 'rgba(255,45,85,0.1)' : 'rgba(255,149,0,0.1)' }}
      >
        {isDanger
          ? <ShieldAlert size={18} style={{ color: 'var(--health-red)' }} />
          : <AlertTriangle size={18} style={{ color: 'var(--health-orange)' }} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className="badge"
            style={{
              background: isDanger ? 'rgba(255,45,85,0.12)' : 'rgba(255,149,0,0.12)',
              color:      isDanger ? 'var(--health-red)' : 'var(--health-orange)',
            }}
          >
            {isDanger ? 'Danger' : 'Attention'}
          </span>
          {alerte.type_alerte && (
            <span className="badge badge-blue">{alerte.type_alerte}</span>
          )}
          {!alerte.vue && (
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--health-red)' }} />
          )}
        </div>
        <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
          {alerte.message}
        </p>
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
          {format(new Date(alerte.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
        </p>
      </div>

      {/* Action */}
      {!alerte.vue && (
        <button
          onClick={onVoir}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--health-blue)',
            border: 'none', cursor: 'pointer',
          }}
        >
          Marquer vu
        </button>
      )}
    </div>
  )
}
