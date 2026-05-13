import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle2, Users,
  ChevronRight, RefreshCw, Eye,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { getAlertesCritiques, marquerVueAlerte, getPatients } from '../../services/medecinService'

const NIVEAU_CFG = {
  danger: {
    label:   '🚨 Danger',
    bg:      'rgba(255,45,85,0.08)',
    border:  'rgba(255,45,85,0.25)',
    color:   '#FF2D55',
    badgeBg: 'rgba(255,45,85,0.12)',
    icon:    <AlertTriangle size={14} color="#FF2D55" />,
  },
  attention: {
    label:   '⚠️ Attention',
    bg:      'rgba(255,149,0,0.06)',
    border:  'rgba(255,149,0,0.20)',
    color:   '#FF9500',
    badgeBg: 'rgba(255,149,0,0.12)',
    icon:    <AlertTriangle size={14} color="#FF9500" />,
  },
}

const AVATAR_COLORS = [
  '#0A84FF','#BF5AF2','#34C759','#FF9500',
  '#FF2D55','#5AC8FA','#FFD60A','#FF375F',
]

export default function AlertesMedecinPage() {
  const navigate = useNavigate()

  const [alertes,      setAlertes]      = useState([])
  const [patients,     setPatients]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('toutes')    // toutes | danger | attention
  const [inclureVues,  setInclureVues]  = useState(false)
  const [marquingId,   setMarquingId]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter !== 'toutes') params.niveau = filter
      if (inclureVues) params.inclure_vues = true

      const [a, p] = await Promise.all([
        getAlertesCritiques(params),
        getPatients(),
      ])
      setAlertes(a.data.data ?? [])
      setPatients(p.data.data ?? [])
    } catch {
      toast.error('Impossible de charger les alertes.')
    } finally {
      setLoading(false)
    }
  }, [filter, inclureVues])

  useEffect(() => { load() }, [load])

  const handleMarquerVue = async (alerte) => {
    if (alerte.vue) return
    setMarquingId(alerte.id)
    try {
      await marquerVueAlerte(alerte.id)
      setAlertes(prev =>
        prev.map(a => a.id === alerte.id ? { ...a, vue: true } : a)
      )
      toast.success('Alerte marquée comme vue.')
    } catch {
      toast.error('Erreur.')
    } finally {
      setMarquingId(null)
    }
  }

  const handleMarquerToutesVues = async () => {
    const nonVues = alertes.filter(a => !a.vue)
    if (!nonVues.length) return
    try {
      await Promise.all(nonVues.map(a => marquerVueAlerte(a.id)))
      setAlertes(prev => prev.map(a => ({ ...a, vue: true })))
      toast.success(`${nonVues.length} alerte${nonVues.length > 1 ? 's' : ''} marquée${nonVues.length > 1 ? 's' : ''} comme vues.`)
    } catch {
      toast.error('Erreur lors du marquage.')
    }
  }

  /* ── Stats ── */
  const totalDanger    = alertes.filter(a => a.niveau === 'danger').length
  const totalAttention = alertes.filter(a => a.niveau === 'attention').length
  const nonVues        = alertes.filter(a => !a.vue).length
  const patientsAffecter = new Set(alertes.filter(a => !a.vue).map(a => a.patient_id)).size

  const getAvatarColor = (patientId) => {
    const idx = patients.findIndex(p => p.id === patientId)
    return AVATAR_COLORS[Math.max(0, idx) % AVATAR_COLORS.length]
  }

  const TABS = [
    { key: 'toutes',    label: 'Toutes',    count: totalDanger + totalAttention },
    { key: 'danger',    label: '🚨 Danger',    count: totalDanger },
    { key: 'attention', label: '⚠️ Attention', count: totalAttention },
  ]

  return (
    <div className="space-y-6">

      {/* ══ HEADER ══ */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Alertes patients
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Valeurs hors normes consolidées de tous vos patients, triées par urgence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
            title="Actualiser"
          >
            <RefreshCw size={15} />
          </button>
          {nonVues > 0 && (
            <button
              onClick={handleMarquerToutesVues}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}
            >
              <Eye size={15} /> Tout marquer comme vu
            </button>
          )}
        </div>
      </div>

      {/* ══ STATS RAPIDES ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ padding: '6px', margin: '-6px' }}>
        {[
          { label: 'Alertes danger',    value: totalDanger,    color: '#FF2D55', bg: 'rgba(255,45,85,0.1)' },
          { label: 'Alertes attention', value: totalAttention, color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
          { label: 'Non vues',          value: nonVues,        color: 'var(--text-primary)', bg: 'var(--bg-secondary)' },
          { label: 'Patients affectés', value: patientsAffecter, color: 'var(--health-blue)', bg: 'rgba(10,132,255,0.1)' },
        ].map((s, i) => (
          <div key={i} className="hover-lift rounded-2xl p-4"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
              style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: s.bg }}>
                <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ FILTRES ══ */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="pill-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`pill-tab${filter === t.key ? ' active' : ''}`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: filter === t.key ? (t.key === 'danger' ? '#FF2D55' : t.key === 'attention' ? '#FF9500' : 'var(--health-blue)') : 'var(--bg-tertiary)',
                    color: filter === t.key ? 'white' : 'var(--text-tertiary)',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Toggle : inclure vues */}
        <label className="flex items-center gap-2 cursor-pointer ml-auto">
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Inclure les vues
          </span>
          <button
            onClick={() => setInclureVues(v => !v)}
            className="toggle-track"
            style={{ background: inclureVues ? 'var(--health-blue)' : undefined }}
          >
            <div className="toggle-thumb" style={{ transform: inclureVues ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </label>
      </div>

      {/* ══ LISTE ══ */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : alertes.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--health-green)', margin: '0 auto 12px' }} />
          <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            Aucune alerte {inclureVues ? '' : 'non vue '}pour vos patients
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {inclureVues ? 'Vos patients ne présentent pas d\'anomalie sur la période.' : 'Activez "Inclure les vues" pour voir l\'historique.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alertes.map((alerte, i) => {
            const cfg = NIVEAU_CFG[alerte.niveau] ?? NIVEAU_CFG.attention
            const avatarColor = getAvatarColor(alerte.patient_id)
            const isMarquing = marquingId === alerte.id

            return (
              <div
                key={alerte.id}
                className="rounded-2xl px-5 py-4 flex items-start gap-4 transition-all"
                style={{
                  background:  alerte.vue ? 'var(--bg-card)' : cfg.bg,
                  border:      `1px solid ${alerte.vue ? 'var(--border-subtle)' : cfg.border}`,
                  opacity:     alerte.vue ? 0.7 : 1,
                }}
              >
                {/* Avatar patient */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: alerte.vue ? 'var(--bg-tertiary)' : avatarColor }}
                >
                  {alerte.patient_nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {alerte.patient_nom}
                    </p>
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: cfg.badgeBg, color: cfg.color }}
                    >
                      {cfg.icon} {alerte.niveau === 'danger' ? 'Danger' : 'Attention'}
                    </span>
                    {alerte.vue && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                        Vue
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {alerte.message}
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    {formatDistanceToNow(new Date(alerte.created_at), { locale: fr, addSuffix: true })}
                    {' · '}
                    {format(new Date(alerte.created_at), 'd MMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/medecin/patients/${alerte.patient_id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}
                  >
                    Voir fiche <ChevronRight size={12} />
                  </button>
                  {!alerte.vue && (
                    <button
                      onClick={() => handleMarquerVue(alerte)}
                      disabled={isMarquing}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-tertiary)',
                        border: 'none',
                        cursor: isMarquing ? 'not-allowed' : 'pointer',
                        opacity: isMarquing ? 0.6 : 1,
                      }}
                    >
                      <Eye size={12} /> {isMarquing ? '…' : 'Marquer vue'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
