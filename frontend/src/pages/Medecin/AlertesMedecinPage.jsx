import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle2, Users,
  ChevronRight, RefreshCw, Eye, BellRing,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { getAlertesCritiques, marquerVueAlerte, getPatients } from '../../services/medecinService'

const NIVEAU_CFG = {
  danger: {
    label:   '🚨 Danger',
    bg:      'rgba(255,92,106,0.08)',
    border:  'rgba(255,92,106,0.25)',
    color:   '#FF5C6A',
    badgeBg: 'rgba(255,92,106,0.12)',
    icon:    <AlertTriangle size={14} color="#FF5C6A" />,
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
  '#2E9B83','#1A7C6C','#34C759','#FF9500',
  '#FF5C6A','#40B896','#FFD60A','#FF7B73',
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
    <div className="space-y-6 page-enter">

      {/* ══ HERO BANNER ══ */}
      <div style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden',
        height: 190, background: 'var(--surface-1)', border: '1px solid var(--border-0)',
      }} className="animate-fade-up">
        <div style={{ position: 'absolute', right: 0, top: 0, width: '55%', height: '100%' }}>
          <img src="/illustrations/hero/alertes.jpg" alt="" aria-hidden
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--surface-1) 0%, rgba(242, 247, 245, 0.52) 0%, transparent 100%)' }} />
        </div>
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, background: 'radial-gradient(circle, rgba(255,75,96,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{
          position: 'relative', zIndex: 1, height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '24px 32px',
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: nonVues > 0 ? 'var(--vital-red)' : 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <BellRing size={10} /> Surveillance en temps réel
            </span>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-1.2px', lineHeight: 1.1, margin: 0 }}>
              Alertes patients
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
              {nonVues > 0
                ? `${nonVues} alerte${nonVues > 1 ? 's' : ''} non vue${nonVues > 1 ? 's' : ''}`
                : 'Valeurs hors normes de vos patients'}
            </p>
            {totalDanger > 0 && (
              <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(255,75,96,0.12)', color: 'var(--vital-red)', border: '1px solid rgba(255,75,96,0.22)' }}>
                {totalDanger} Danger
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══ TOOLBAR ══ */}
      <div className="flex items-center gap-3 flex-wrap animate-fade-up delay-150">
        {/* Filtres */}
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
                    background: filter === t.key ? (t.key === 'danger' ? '#FF5C6A' : t.key === 'attention' ? '#FF9500' : 'var(--accent)') : 'var(--surface-3)',
                    color: filter === t.key ? 'white' : 'var(--ink-3)',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions droite */}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* Toggle : inclure vues */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-medium" style={{ color: 'var(--ink-3)' }}>
              Inclure les vues
            </span>
            <button
              onClick={() => setInclureVues(v => !v)}
              className="toggle-track"
              style={{ background: inclureVues ? 'var(--accent)' : undefined }}
            >
              <div className="toggle-thumb" style={{ transform: inclureVues ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </label>
          {/* Actualiser */}
          <button
            onClick={load}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)', cursor: 'pointer', color: 'var(--ink-3)' }}
            title="Actualiser"
          >
            <RefreshCw size={15} />
          </button>
          {/* Tout marquer vu */}
          {nonVues > 0 && (
            <button
              onClick={handleMarquerToutesVues}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--surface-2)', color: 'var(--accent)', border: '1px solid var(--border-0)', cursor: 'pointer' }}
            >
              <Eye size={15} /> Tout marquer comme vu
            </button>
          )}
        </div>
      </div>

      {/* ══ LISTE ══ */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : alertes.length === 0 ? (
        <div className="rounded-2xl overflow-hidden animate-fade-up" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)' }}>
          <div className="flex flex-col md:flex-row items-center gap-0">
            <div className="w-full md:w-52 flex-shrink-0 flex items-center justify-center p-6"
              style={{ background: 'linear-gradient(135deg, rgba(52,199,89,0.08), rgba(46,155,131,0.04))', minHeight: 200 }}>
              <img
                src="/illustrations/hero/illus-doctor-patient-smile.jpeg"
                alt="" aria-hidden="true"
                style={{ width: 150, height: 150, objectFit: 'contain' }}
              />
            </div>
            <div className="p-8">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(52,199,89,0.1)' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--vital-green)' }} />
              </div>
              <p className="font-bold text-lg mb-2" style={{ color: 'var(--ink-1)', letterSpacing: '-0.3px' }}>
                Aucune alerte {inclureVues ? '' : 'non vue '}active
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-3)', maxWidth: 280 }}>
                {inclureVues
                  ? "Vos patients ne présentent pas d'anomalie sur la période."
                  : 'Activez "Inclure les vues" pour consulter l\'historique complet.'}
              </p>
            </div>
          </div>
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
                  background:  alerte.vue ? 'var(--surface-1)' : cfg.bg,
                  border:      `1px solid ${alerte.vue ? 'var(--border-0)' : cfg.border}`,
                  opacity:     alerte.vue ? 0.7 : 1,
                }}
              >
                {/* Avatar patient */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: alerte.vue ? 'var(--surface-3)' : avatarColor }}
                >
                  {alerte.patient_nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--ink-1)' }}>
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
                        style={{ background: 'var(--surface-3)', color: 'var(--ink-3)' }}>
                        Vue
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                    {alerte.message}
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--ink-3)' }}>
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
                    style={{ background: 'rgba(46,155,131,0.1)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}
                  >
                    Voir fiche <ChevronRight size={12} />
                  </button>
                  {!alerte.vue && (
                    <button
                      onClick={() => handleMarquerVue(alerte)}
                      disabled={isMarquing}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: 'var(--surface-2)',
                        color: 'var(--ink-3)',
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

