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
  '#0A84FF','#BF5AF2','#34C759','#FF9500',
  '#FF2D55','#5AC8FA','#FFD60A','#FF375F',
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
    search === '' ||
    `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  /* ── KPIs ── */
  const nbDanger    = patients.filter(p => p.statut_urgence === 'danger').length
  const nbAttention = patients.filter(p => p.statut_urgence === 'attention').length
  const avgScore    = patients.length
    ? Math.round(patients.filter(p => p.vitascore !== null)
        .reduce((s, p) => s + p.vitascore, 0) / patients.filter(p => p.vitascore !== null).length)
    : null

  const heure = new Date().getHours()
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="space-y-6">

      {/* ══ HEADER ══ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {salut}, Dr {user?.prenom} {user?.nom}
          </h1>
        </div>
        {nbDanger > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl"
            style={{ background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)' }}>
            <AlertTriangle size={16} color="#FF2D55" />
            <span className="text-sm font-bold" style={{ color: '#FF2D55' }}>
              {nbDanger} patient{nbDanger > 1 ? 's' : ''} en situation critique
            </span>
          </div>
        )}
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ padding: '6px', margin: '-6px' }}>
        <KpiCard
          label="Patients suivis"
          value={loading ? '…' : patients.length}
          icon={<Users size={20} color="white" />}
          gradient="linear-gradient(135deg, #0A84FF, #5AC8FA)"
          glow="rgba(10,132,255,0.25)"
        />
        <KpiCard
          label="Alertes critiques"
          value={loading ? '…' : alertesCrit.length}
          icon={<AlertTriangle size={20} color="white" />}
          gradient={alertesCrit.length > 0
            ? "linear-gradient(135deg, #FF2D55, #FF6B6B)"
            : "linear-gradient(135deg, #34C759, #30D158)"}
          glow={alertesCrit.length > 0 ? "rgba(255,45,85,0.25)" : "rgba(52,199,89,0.20)"}
          pulse={alertesCrit.length > 0}
        />
        <KpiCard
          label="VitaScore moyen"
          value={loading ? '…' : (avgScore ?? '—')}
          icon={<BarChart2 size={20} color="white" />}
          gradient={avgScore !== null
            ? avgScore >= 70 ? "linear-gradient(135deg, #34C759, #30D158)"
            : avgScore >= 50 ? "linear-gradient(135deg, #FF9500, #FFAA00)"
            : "linear-gradient(135deg, #FF2D55, #FF6B6B)"
            : "linear-gradient(135deg, #8E8E93, #636366)"}
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
            <BellRing size={14} color="#FF2D55" />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF2D55' }}>
              Alertes dangereuses en cours
            </h2>
          </div>
          <div
            className="flex overflow-x-auto"
            style={{
              gap: 12,
              scrollbarWidth: 'none',
              /* padding sur tous les côtés pour laisser respirer l'ombre + le translateY */
              padding: '8px 8px 10px 8px',
              /* compensation pour ne pas décaler le layout parent */
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
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest flex-shrink-0"
            style={{ color: 'var(--text-tertiary)' }}>
            Patients ({filtered.length})
          </h2>
          {/* Recherche */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 max-w-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <Search size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un patient…"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)', border: 'none', fontFamily: 'DM Sans' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-14 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <Users size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {search ? 'Aucun patient trouvé' : 'Aucun patient suivi'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {search ? 'Affinez votre recherche.' : 'Les patients apparaîtront ici une fois la relation établie.'}
            </p>
          </div>
        ) : (
          /* padding + margin négatif pour que scale() ne soit pas coupé par la grille */
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
  return (
    <div
      className="hover-lift rounded-2xl p-5 flex items-center gap-4 cursor-default"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: gradient, boxShadow: `0 4px 16px ${glow}` }}
      >
        {icon}
      </div>
      <div>
        {/* Label avec point pulsant si alerte active */}
        <div className="flex items-center gap-1.5 mb-0.5">
          {pulse && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{
                background: '#FF2D55',
                animation: 'kpiDotPulse 1.8s ease-in-out infinite',
              }}
            />
          )}
          <p className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-tertiary)' }}>{label}</p>
        </div>
        {/* Nombre — sans badge-pulse pour éviter le box-shadow rouge */}
        <p className="text-3xl font-bold tabular-nums"
          style={{ color: 'var(--text-primary)', letterSpacing: '-1px' }}>
          {value}
        </p>
      </div>
    </div>
  )
}

/* ─── Patient Card ──────────────────────────────────────── */
function PatientCard({ patient, color, onOpen, onNavigate }) {
  const STATUT_CFG = {
    danger:    { label: '🚨 Critique',   bg: 'rgba(255,45,85,0.1)',  color: '#FF2D55',  border: '#FF2D55' },
    attention: { label: '⚠️ Attention',  bg: 'rgba(255,149,0,0.1)', color: '#FF9500',  border: '#FF9500' },
    normal:    { label: '✅ Stable',     bg: 'rgba(52,199,89,0.1)', color: '#34C759',  border: 'transparent' },
  }
  const cfg = STATUT_CFG[patient.statut_urgence]

  const score = patient.vitascore
  const scoreColor = score === null ? '#8E8E93' : score >= 70 ? '#34C759' : score >= 50 ? '#FF9500' : '#FF2D55'
  const C = 2 * Math.PI * 18
  const dash = score !== null ? (score / 100) * C : 0

  return (
    <div
      className="hover-lift rounded-2xl p-5 flex flex-col gap-4 cursor-pointer"
      style={{
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        borderLeft: `3px solid ${cfg.border === 'transparent' ? 'var(--border-subtle)' : cfg.border}`,
      }}
      onClick={onOpen}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: color }}
        >
          {patient.prenom?.[0]}{patient.nom?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {patient.prenom} {patient.nom}
          </p>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {patient.age ? `${patient.age} ans` : ''} · Suivi depuis {format(new Date(patient.relation_depuis), 'MMM yyyy', { locale: fr })}
          </p>
        </div>
        {/* Badge statut */}
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {/* VitaScore + alertes */}
      <div className="flex items-center gap-3">
        {/* Mini VitaScore ring */}
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="20" cy="20" r="18" fill="none" stroke="var(--bg-tertiary)" strokeWidth="3.5" />
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
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>VitaScore</p>
          {patient.alertes_non_vues > 0 && (
            <p className="text-xs font-semibold flex items-center gap-1 mt-0.5"
              style={{ color: patient.alertes_danger > 0 ? '#FF2D55' : '#FF9500' }}>
              <AlertTriangle size={11} />
              {patient.alertes_non_vues} alerte{patient.alertes_non_vues > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Dernière mesure */}
        {patient.derniere_mesure && (
          <div className="ml-auto text-right">
            <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {patient.derniere_mesure.valeur} {patient.derniere_mesure.unite}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {patient.derniere_mesure.type}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {formatDistanceToNow(new Date(patient.derniere_mesure.date), { locale: fr, addSuffix: true })}
            </p>
          </div>
        )}
      </div>

      {/* Boutons */}
      <div className="flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'var(--bg-secondary)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); onOpen() }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,132,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
        >
          Aperçu rapide
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#0A84FF,#5AC8FA)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(10,132,255,0.25)' }}
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
        background: hov ? 'rgba(255,45,85,0.10)' : 'rgba(255,45,85,0.06)',
        border: '1px solid rgba(255,45,85,0.20)',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? '0 8px 24px rgba(255,45,85,0.15)' : 'none',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <p className="text-xs font-bold mb-1.5" style={{ color: '#FF2D55' }}>
        🚨 {alerte.patient_nom}
      </p>
      <p className="text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>
        {alerte.message}
      </p>
      <p className="text-[11px] mt-2" style={{ color: 'var(--text-tertiary)' }}>
        {formatDistanceToNow(new Date(alerte.created_at), { locale: fr, addSuffix: true })}
      </p>
    </div>
  )
}

