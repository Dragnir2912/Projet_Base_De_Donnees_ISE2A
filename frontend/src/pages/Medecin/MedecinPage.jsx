import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, AlertTriangle, BarChart2, TrendingUp,
  X, BellRing, ChevronRight, Calendar, FileText, Search,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { getPatients, getAlertesCritiques, getResumePatient } from '../../services/medecinService'
import useAuthStore from '../../store/authStore'
import PatientDrawer from './components/PatientDrawer'

const AVATAR_COLORS = [
  '#2E9B83','#1A7C6C','#34C759','#FF9500',
  '#FF5C6A','#40B896','#FFD60A','#FF7B73',
]

export default function MedecinPage() {
  const { user }  = useAuthStore()
  const navigate  = useNavigate()

  const [patients,      setPatients]      = useState([])
  const [alertesCrit,   setAlertesCrit]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [selectedId,    setSelectedId]    = useState(null)
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [statusFilter,  setStatusFilter]  = useState('tous')

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([getPatients(), getAlertesCritiques()])
      setPatients(p.data.data ?? [])
      setAlertesCrit(a.data.data ?? [])
    } catch {
      toast.error('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openDrawer = (id) => { setSelectedId(id); setDrawerOpen(true) }
  const closeDrawer = () => { setDrawerOpen(false); setTimeout(() => setSelectedId(null), 300) }

  const filtered = patients.filter(p =>
    (statusFilter === 'tous' || p.statut_urgence === statusFilter) &&
    (search === '' ||
      `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()))
  )

  const nbDanger    = patients.filter(p => p.statut_urgence === 'danger').length
  const nbAttention = patients.filter(p => p.statut_urgence === 'attention').length
  const nbNormal    = patients.filter(p => p.statut_urgence === 'normal').length
  const avgScore    = patients.length
    ? Math.round(patients.filter(p => p.vitascore !== null)
        .reduce((s, p) => s + p.vitascore, 0) / patients.filter(p => p.vitascore !== null).length)
    : null

  const heure = new Date().getHours()
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'

  const STATUS_TABS = [
    { key: 'tous',      label: 'Tous',          count: patients.length },
    { key: 'danger',    label: '🚨 Critiques',   count: nbDanger },
    { key: 'attention', label: '⚠️ Attention',   count: nbAttention },
    { key: 'normal',    label: '✅ Stable',       count: nbNormal },
  ]

  return (
    <div className="space-y-8 page-enter">

      {/* ══ HEADER HERO ══ */}
      <div style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden',
        height: 200, background: 'var(--surface-1)', border: '1px solid var(--border-0)',
      }} className="animate-fade-up">
        <div style={{ position: 'absolute', right: 0, top: 0, width: '55%', height: '100%' }}>
          <img src="/illustrations/hero/patients.jpg" alt="" aria-hidden
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, var(--surface-1) 0%, var(--surface-1) 20%, transparent 60%)',
          }} />
        </div>
        <div style={{
          position: 'absolute', bottom: -30, left: -30, width: 160, height: 160,
          background: 'radial-gradient(circle, rgba(0,221,160,0.07) 0%, transparent 70%)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'relative', zIndex: 1, height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '24px 32px',
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <Users size={10} /> Espace médecin · Surveillance
            </span>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-1.2px', lineHeight: 1.1, margin: 0 }}>
              Mes patients
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
              {loading ? '…' : `${patients.length} patient${patients.length > 1 ? 's' : ''} · suivi depuis votre tableau de bord`}
            </p>
            {nbDanger > 0 && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 10,
                background: 'rgba(255,75,96,0.14)', border: '1px solid rgba(255,75,96,0.28)',
                fontSize: 12, fontWeight: 700, color: 'var(--vital-red)',
              }}>
                <AlertTriangle size={12} />
                {nbDanger} critique{nbDanger > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ padding: '6px', margin: '6px 6px 0px 0px' }}>
        <KpiCard
          label="Patients suivis"
          value={loading ? '…' : patients.length}
          icon={<Users size={20} color="white" />}
          gradient="linear-gradient(135deg, #2E9B83, #40B896)"
          glow="rgba(46,155,131,0.25)"
        />
        <KpiCard
          label="Alertes critiques"
          value={loading ? '…' : alertesCrit.length}
          icon={<AlertTriangle size={20} color="white" />}
          gradient={alertesCrit.length > 0
            ? "linear-gradient(135deg, #FF5C6A, #FF6B6B)"
            : "linear-gradient(135deg, #34C759, #30D158)"}
          glow={alertesCrit.length > 0 ? "rgba(255,92,106,0.25)" : "rgba(52,199,89,0.20)"}
          pulse={alertesCrit.length > 0}
        />
        <KpiCard
          label="VitaScore moyen"
          value={loading ? '…' : (avgScore ?? '—')}
          icon={<BarChart2 size={20} color="white" />}
          gradient={avgScore !== null
            ? avgScore >= 70 ? "linear-gradient(135deg, #34C759, #30D158)"
            : avgScore >= 50 ? "linear-gradient(135deg, #FF9500, #FFAA00)"
            : "linear-gradient(135deg, #FF5C6A, #FF6B6B)"
            : "linear-gradient(135deg, #7A9490, #636366)"}
          glow="rgba(52,199,89,0.20)"
        />
        <KpiCard
          label="Patients à risque"
          value={loading ? '…' : (nbDanger + nbAttention)}
          icon={<TrendingUp size={20} color="white" />}
          gradient="linear-gradient(135deg, #FF9500, #FFAA00)"
          glow="rgba(255,149,0,0.25)"
        />
      </div>

      {/* ══ ALERTES CRITIQUES ══ */}
      {!loading && alertesCrit.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BellRing size={14} color="#FF5C6A" />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF5C6A' }}>
              Alertes dangereuses en cours
            </h2>
            <button
              onClick={() => navigate('/medecin/alertes')}
              className="ml-auto flex items-center gap-1 text-xs font-semibold"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, transition: 'color 0.15s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}
            >
              Voir toutes <ChevronRight size={12} />
            </button>
          </div>
          <div
            className="flex overflow-x-auto"
            style={{
              gap: 12,
              scrollbarWidth: 'none',
              padding: '8px 8px 10px 8px',
              margin: '-8px -8px -10px -8px',
            }}
          >
            {alertesCrit.map(a => (
              <AlerteCritCard
                key={a.id}
                alerte={a}
                onClick={() => {
                  const p = patients.find(p => p.id === a.patient_id)
                  if (p) openDrawer(p.id)
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ══ LISTE PATIENTS ══ */}
      <section>
        {/* Barre de recherche pleine largeur */}
        <div
          className="flex items-center gap-2 px-4 rounded-2xl transition-all mb-3"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)', height: 46 }}
          onFocusCapture={e => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,221,160,0.08)'
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = 'var(--border-0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Search size={15} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un patient par nom ou email…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--ink-1)', border: 'none', fontFamily: 'Poppins, system-ui' }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Pills filtre statut + compteur */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="pill-tabs">
            {STATUS_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`pill-tab${statusFilter === t.key ? ' active' : ''}`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: statusFilter === t.key
                        ? (t.key === 'danger' ? '#FF5C6A' : t.key === 'attention' ? '#FF9500' : t.key === 'normal' ? '#34C759' : 'var(--accent)')
                        : 'var(--surface-3)',
                      color: statusFilter === t.key ? 'white' : 'var(--ink-3)',
                    }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs font-medium" style={{ color: 'var(--ink-3)' }}>
            {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)' }}>
            <div className="flex flex-col md:flex-row items-center gap-0">
              <div className="w-full md:w-52 flex-shrink-0 flex items-center justify-center p-6"
                style={{ background: 'linear-gradient(135deg, rgba(46,155,131,0.07), rgba(26,124,108,0.03))', minHeight: 180 }}>
                <img
                  src="/illustrations/hero/illus-doctor-patient-smile.jpeg"
                  alt="" aria-hidden="true"
                  style={{ width: 140, height: 140, objectFit: 'contain' }}
                />
              </div>
              <div className="p-8">
                <p className="font-bold text-lg mb-2" style={{ color: 'var(--ink-1)', letterSpacing: '-0.3px' }}>
                  {search ? 'Aucun patient trouvé' : 'Aucun patient suivi'}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-3)', maxWidth: 280 }}>
                  {search ? 'Affinez votre recherche ou vérifiez l\'orthographe.' : 'Les patients apparaîtront ici une fois la relation établie.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            style={{ padding: '8px', margin: '-8px' }}
          >
            {filtered.map((patient, idx) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                color={AVATAR_COLORS[idx % AVATAR_COLORS.length]}
                onOpen={() => openDrawer(patient.id)}
                onNavigate={() => navigate(`/medecin/patients/${patient.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ══ DRAWER DÉTAIL ══ */}
      <style>{`
        @keyframes kpiDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.6); }
        }
      `}</style>
      {drawerOpen && selectedId && (
        <PatientDrawer
          patientId={selectedId}
          patients={patients}
          avatarColors={AVATAR_COLORS}
          onClose={closeDrawer}
          onRefresh={load}
        />
      )}
    </div>
  )
}

/* ─── KPI Card ──────────────────────────────────────────── */
function KpiCard({ label, value, icon, gradient, glow, pulse }) {
  const accentCol = glow?.includes('255,92') || glow?.includes('255,75') ? 'var(--vital-red)'
    : glow?.includes('255,149') || glow?.includes('255,140') ? 'var(--vital-orange)'
    : glow?.includes('52,199') || glow?.includes('0,217') ? 'var(--vital-green)'
    : 'var(--accent)'
  return (
    <div style={{
      padding: '20px 20px', borderRadius: 20,
      background: 'var(--surface-1)', border: '1px solid var(--border-0)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {pulse && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--vital-red)', boxShadow: '0 0 6px var(--vital-red)', display: 'inline-block' }} />}
          <span style={{ color: accentCol, opacity: 0.7 }}>{icon}</span>
        </div>
      </div>
      <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-1.5px', margin: 0, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )
}

/* ─── Patient Card ──────────────────────────────────────── */
function PatientCard({ patient, color, onOpen, onNavigate }) {
  const STATUT_CFG = {
    danger:    { label: '🚨 Critique',   bg: 'rgba(255,92,106,0.1)',  color: '#FF5C6A',  border: '#FF5C6A' },
    attention: { label: '⚠️ Attention',  bg: 'rgba(255,149,0,0.1)', color: '#FF9500',  border: '#FF9500' },
    normal:    { label: '✅ Stable',     bg: 'rgba(52,199,89,0.1)', color: '#34C759',  border: 'transparent' },
  }
  const cfg = STATUT_CFG[patient.statut_urgence]

  const score = patient.vitascore
  const scoreColor = score === null ? '#7A9490' : score >= 70 ? '#34C759' : score >= 50 ? '#FF9500' : '#FF5C6A'
  const C = 2 * Math.PI * 18
  const dash = score !== null ? (score / 100) * C : 0

  return (
    <div
      className="card-hover rounded-2xl p-5 flex flex-col gap-4 cursor-pointer"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-0)',
        boxShadow: 'var(--shadow-card)',
        borderLeft: `3px solid ${cfg.border === 'transparent' ? 'var(--border-0)' : cfg.border}`,
      }}
      onClick={onOpen}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: color }}
        >
          {patient.prenom?.[0]}{patient.nom?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ color: 'var(--ink-1)' }}>
            {patient.prenom} {patient.nom}
          </p>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--ink-3)' }}>
            {patient.age ? `${patient.age} ans` : ''} · Suivi depuis {format(new Date(patient.relation_depuis), 'MMM yyyy', { locale: fr })}
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {/* VitaScore + alertes */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="20" cy="20" r="18" fill="none" stroke="var(--surface-3)" strokeWidth="3.5" />
            <circle cx="20" cy="20" r="18" fill="none" stroke={scoreColor} strokeWidth="3.5"
              strokeDasharray={`${dash} ${C}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold" style={{ color: scoreColor }}>
              {score !== null ? score : '—'}
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--ink-3)' }}>VitaScore</p>
          {patient.alertes_non_vues > 0 && (
            <p className="text-xs font-semibold flex items-center gap-1 mt-0.5"
              style={{ color: patient.alertes_danger > 0 ? '#FF5C6A' : '#FF9500' }}>
              <AlertTriangle size={11} />
              {patient.alertes_non_vues} alerte{patient.alertes_non_vues > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {patient.derniere_mesure && (
          <div className="ml-auto text-right">
            <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--ink-1)' }}>
              {patient.derniere_mesure.valeur} {patient.derniere_mesure.unite}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
              {patient.derniere_mesure.type}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
              {formatDistanceToNow(new Date(patient.derniere_mesure.date), { locale: fr, addSuffix: true })}
            </p>
          </div>
        )}
      </div>

      {/* Boutons */}
      <div className="flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'var(--surface-2)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); onOpen() }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(46,155,131,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
        >
          Aperçu rapide
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#2E9B83,#40B896)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(46,155,131,0.25)' }}
          onClick={e => { e.stopPropagation(); onNavigate() }}
        >
          Fiche <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

/* ─── Alerte critique card (scroll horizontal) ───────────── */
function AlerteCritCard({ alerte, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      className="flex-shrink-0 rounded-2xl p-4 cursor-pointer"
      style={{
        width: 280,
        background: hov ? 'rgba(255,92,106,0.10)' : 'rgba(255,92,106,0.06)',
        border: '1px solid rgba(255,92,106,0.20)',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? '0 8px 24px rgba(255,92,106,0.15)' : 'none',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <p className="text-xs font-bold mb-1.5" style={{ color: '#FF5C6A' }}>
        🚨 {alerte.patient_nom}
      </p>
      <p className="text-sm leading-snug" style={{ color: 'var(--ink-2)' }}>
        {alerte.message}
      </p>
      <p className="text-[11px] mt-2" style={{ color: 'var(--ink-3)' }}>
        {formatDistanceToNow(new Date(alerte.created_at), { locale: fr, addSuffix: true })}
      </p>
    </div>
  )
}
