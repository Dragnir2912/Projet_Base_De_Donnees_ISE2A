import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, AlertTriangle, MessageSquare,
  BarChart2, FileText, Pencil, Trash2, PlusCircle, Check, X as XIcon,
  Calendar, ChevronRight, Download,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  ComposedChart, AreaChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  getResumePatient, getMesuresPatient, getHistoriquePatient,
  getConsultationsPatient, supprimerConsultation,
  creerAnnotation, modifierAnnotation, supprimerAnnotation,
  downloadRapportPDF,
} from '../../services/medecinService'
import ConsultationModal from './components/ConsultationModal'
import VitaScoreInfoModal from '../../components/health/VitaScoreInfoModal'

/* ── Constantes ─────────────────────────────────────────── */
const TYPE_COLORS = [
  '#FF2D55','#FF9500','#FFD60A','#34C759',
  '#5AC8FA','#0A84FF','#BF5AF2','#FF375F',
]
const STATUT_CFG = {
  danger:    { color: '#FF2D55', bg: 'rgba(255,45,85,0.10)',  label: 'Danger' },
  attention: { color: '#FF9500', bg: 'rgba(255,149,0,0.10)',  label: 'Attention' },
  normal:    { color: '#34C759', bg: 'rgba(52,199,89,0.10)',  label: 'Normal' },
}
const SCORE_COLOR = s =>
  s === null ? '#8E8E93' : s >= 70 ? '#34C759' : s >= 50 ? '#FF9500' : '#FF2D55'

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function FichePatientPage() {
  const { patient_id } = useParams()
  const navigate = useNavigate()
  const id = parseInt(patient_id)

  const [resume,      setResume]      = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [types,     setTypes]     = useState([])
  const [selected,  setSelected]  = useState(null)
  const [histo,     setHisto]     = useState([])
  const [loadingR,  setLoadingR]  = useState(true)
  const [loadingH,  setLoadingH]  = useState(false)
  const [activeTab,   setActiveTab]   = useState('mesures')
  const [showVSInfo,  setShowVSInfo]  = useState(false)   // mesures | consultations

  // Consultations
  const [consultations,   setConsultations]   = useState([])
  const [loadingC,        setLoadingC]        = useState(false)
  const [consultModal,    setConsultModal]     = useState(false)
  const [editConsult,     setEditConsult]      = useState(null)
  const [deletingConsult, setDeletingConsult]  = useState(null)

  /* Chargement initial */
  useEffect(() => {
    Promise.all([getResumePatient(id), getMesuresPatient(id)])
      .then(([r, m]) => {
        setResume(r.data.data)
        const typesData = m.data.data ?? []
        setTypes(typesData)
        // Sélectionner le premier type par défaut
        if (typesData.length > 0) selectType(typesData[0])
      })
      .catch(() => { toast.error('Impossible de charger la fiche.'); navigate('/medecin') })
      .finally(() => setLoadingR(false))
  }, [id])

  const selectType = useCallback(async (t) => {
    setSelected(t)
    setHisto([])
    setLoadingH(true)
    try {
      const r = await getHistoriquePatient(id, t.type_id)
      setHisto(r.data.data ?? [])
    } catch {
      setHisto([])
    } finally {
      setLoadingH(false)
    }
  }, [id])

  const loadConsultations = useCallback(async () => {
    setLoadingC(true)
    try {
      const r = await getConsultationsPatient(id)
      setConsultations(r.data.data ?? [])
    } catch { /* silent */ }
    finally { setLoadingC(false) }
  }, [id])

  useEffect(() => { if (activeTab === 'consultations') loadConsultations() }, [activeTab, loadConsultations])

  const onConsultSaved = (saved) => {
    setConsultModal(false)
    setEditConsult(null)
    loadConsultations()
  }

  const handleDeleteConsult = async () => {
    if (!deletingConsult) return
    try {
      await supprimerConsultation(deletingConsult)
      setConsultations(prev => prev.filter(c => c.id !== deletingConsult))
      toast.success('Consultation supprimée.')
    } catch { toast.error('Erreur lors de la suppression.') }
    finally { setDeletingConsult(null) }
  }

  if (loadingR) return <PageSkeleton />

  const patient = resume?.patient
  const score   = resume?.vitascore?.score ?? null
  const C = 2 * Math.PI * 28
  const colorSel = selected ? (TYPE_COLORS[types.indexOf(selected) % TYPE_COLORS.length] ?? '#0A84FF') : '#0A84FF'

  /* Chart data */
  const chartData = histo.slice().map(m => ({
    date:   format(new Date(m.date_mesure), 'd MMM', { locale: fr }),
    valeur: m.valeur,
    annotation: m.annotation?.commentaire ?? null,
  }))

  return (
    <div className="space-y-5">

      {/* ══ HEADER ══ */}
      <div className="flex items-start gap-4 flex-wrap">
        <button
          onClick={() => navigate('/medecin')}
          className="flex items-center gap-2 text-sm font-medium mt-1"
          style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} /> Mes patients
        </button>

        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)', boxShadow: '0 4px 14px rgba(10,132,255,0.3)' }}
          >
            {patient?.prenom?.[0]}{patient?.nom?.[0]}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {patient?.prenom} {patient?.nom}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {patient?.age ? `${patient.age} ans` : ''}{patient?.age && patient?.email ? ' · ' : ''}{patient?.email}
            </p>
          </div>

          {/* VitaScore mini */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl flex-shrink-0"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="relative w-12 h-12">
              <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="24" cy="24" r="20" fill="none" stroke="var(--bg-tertiary)" strokeWidth="4" />
                <circle cx="24" cy="24" r="20" fill="none"
                  stroke={SCORE_COLOR(score)} strokeWidth="4"
                  strokeDasharray={`${score !== null ? (score / 100) * (2 * Math.PI * 20) : 0} ${2 * Math.PI * 20}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold" style={{ color: SCORE_COLOR(score) }}>{score ?? '—'}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>VitaScore</p>
                <button onClick={() => setShowVSInfo(true)}
                  className="w-4 h-4 flex items-center justify-center rounded-full transition-all"
                  style={{ background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 700 }}
                  title="Comprendre le VitaScore">
                  ?
                </button>
              </div>
              {resume?.alertes_danger > 0 && (
                <p className="text-xs font-semibold flex items-center gap-1 mt-0.5" style={{ color: '#FF2D55' }}>
                  <AlertTriangle size={11} /> {resume.alertes_danger} danger
                </p>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/messages?with=${id}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}>
              <MessageSquare size={15} /> Message
            </button>
            <button
              onClick={async () => {
                setDownloading(true)
                try {
                  const nom = `${patient?.prenom ?? ''} ${patient?.nom ?? ''}`
                  await downloadRapportPDF(id, nom)
                  toast.success('Rapport téléchargé.')
                } catch (err) {
                  toast.error(err?.message || 'Erreur lors de la génération du PDF.')
                } finally {
                  setDownloading(false)
                }
              }}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: downloading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg,#34C759,#30D158)',
                boxShadow: downloading ? 'none' : '0 4px 12px rgba(52,199,89,0.3)',
                border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
              }}>
              <Download size={15} /> {downloading ? 'Génération…' : 'Rapport PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div className="pill-tabs" style={{ maxWidth: 320 }}>
        {[
          { key: 'mesures',       label: '📊 Mesures' },
          { key: 'consultations', label: '🩺 Consultations' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`pill-tab${activeTab === t.key ? ' active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ MASTER-DETAIL ══ */}
      {activeTab === 'consultations' ? (
        <ConsultationsSection
          consultations={consultations}
          loading={loadingC}
          patientId={id}
          onNew={() => { setEditConsult(null); setConsultModal(true) }}
          onEdit={(c) => { setEditConsult(c); setConsultModal(true) }}
          onDelete={(c) => setDeletingConsult(c.id)}
        />
      ) : (
      <div className="flex gap-5 min-h-[600px]">

        {/* ── Liste des types (gauche) ── */}
        <div
          className="flex-shrink-0 rounded-2xl overflow-hidden flex flex-col"
          style={{ width: 220, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
              Indicateurs ({types.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {types.map((t, i) => {
              const c   = TYPE_COLORS[i % TYPE_COLORS.length]
              const cfg = STATUT_CFG[t.statut] ?? STATUT_CFG.normal
              const isActive = selected?.type_id === t.type_id
              return (
                <button
                  key={t.type_id}
                  onClick={() => selectType(t)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={{
                    background: isActive ? `${c}14` : 'transparent',
                    borderLeft:  isActive ? `3px solid ${c}` : '3px solid transparent',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: isActive ? c : 'var(--text-primary)' }}>
                      {t.type_nom}
                    </p>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: cfg.color }}
                    />
                  </div>
                  <p className="text-xs mt-0.5 tabular-nums" style={{ color: isActive ? c : 'var(--text-tertiary)' }}>
                    {t.derniere_valeur} {t.type_unite}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Contenu principal (droite) ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {selected ? (
            <>
              {/* Info type */}
              <div className="rounded-2xl p-5 flex items-start gap-4"
                style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ background: colorSel }}>
                  {selected.type_nom.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selected.type_nom}</h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {selected.description || `Unité : ${selected.type_unite}`}
                  </p>
                  {selected.seuil_min_normal && (
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      Zone normale :{' '}
                      <span style={{ color: '#34C759', fontWeight: 600 }}>
                        {selected.seuil_min_normal} – {selected.seuil_max_normal} {selected.type_unite}
                      </span>
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold tabular-nums" style={{ color: colorSel, letterSpacing: '-1px' }}>
                    {selected.derniere_valeur}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{selected.type_unite}</p>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: STATUT_CFG[selected.statut]?.bg, color: STATUT_CFG[selected.statut]?.color }}
                  >
                    {STATUT_CFG[selected.statut]?.label}
                  </span>
                </div>
              </div>

              {/* Graphique */}
              {loadingH ? (
                <div className="skeleton h-60 rounded-2xl" />
              ) : chartData.length > 0 ? (
                <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                  <p className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Évolution — 90 derniers jours</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ficheGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={colorSel} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={colorSel} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', fontSize: 12, fontFamily: 'DM Sans' }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          const ann = payload[0]?.payload?.annotation
                          return (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
                              <p style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</p>
                              <p style={{ color: colorSel, fontWeight: 700 }}>{payload[0]?.value} {selected.type_unite}</p>
                              {ann && <p style={{ color: '#BF5AF2', marginTop: 4, fontStyle: 'italic' }}>✏️ {ann}</p>}
                            </div>
                          )
                        }}
                      />
                      {selected.seuil_min_normal && <ReferenceLine y={selected.seuil_min_normal} stroke="#FF9500" strokeDasharray="4 4" strokeWidth={1.5} />}
                      {selected.seuil_max_normal && <ReferenceLine y={selected.seuil_max_normal} stroke="#FF9500" strokeDasharray="4 4" strokeWidth={1.5} />}
                      {selected.seuil_danger_haut && <ReferenceLine y={selected.seuil_danger_haut} stroke="#FF2D55" strokeDasharray="2 4" strokeWidth={1} />}
                      <Area type="monotone" dataKey="valeur" stroke={colorSel} strokeWidth={2.5}
                        fill="url(#ficheGrad)" dot={(props) => {
                          // Point spécial si annoté
                          const { cx, cy, payload } = props
                          if (!payload.annotation) return <circle key={props.key} cx={cx} cy={cy} r={3} fill={colorSel} strokeWidth={0} />
                          return <circle key={props.key} cx={cx} cy={cy} r={6} fill="#BF5AF2" stroke="white" strokeWidth={2} />
                        }}
                        activeDot={{ r: 5, fill: colorSel, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                  {histo.some(m => m.annotation) && (
                    <p className="text-[11px] mt-2 text-center" style={{ color: 'var(--text-tertiary)' }}>
                      • Points violets = annotations du médecin
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                  <BarChart2 size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Aucune mesure pour ce type.</p>
                </div>
              )}

              {/* Historique avec annotations éditables */}
              {histo.length > 0 && (
                <HistoriqueAnnotable
                  histo={histo}
                  selected={selected}
                  patientId={id}
                  onHistoChange={setHisto}
                />
              )}
            </>
          ) : (
            <div className="rounded-2xl p-16 flex items-center justify-center"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Sélectionnez un indicateur pour voir son évolution.
              </p>
            </div>
          )}
        </div>
      </div>
      )}  {/* fin activeTab === 'mesures' */}

      {/* ══ MODALS ══ */}
      {showVSInfo && (
        <VitaScoreInfoModal score={score} onClose={() => setShowVSInfo(false)} />
      )}

      {consultModal && (
        <ConsultationModal
          patientId={id}
          consultation={editConsult}
          onSaved={onConsultSaved}
          onClose={() => { setConsultModal(false); setEditConsult(null) }}
        />
      )}

      {deletingConsult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeletingConsult(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-modal)' }}
            onClick={e => e.stopPropagation()}>
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Supprimer cette consultation ?</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              Le diagnostic et les recommandations seront définitivement supprimés.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingConsult(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleDeleteConsult}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#FF2D55', border: 'none', cursor: 'pointer' }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SECTION CONSULTATIONS
══════════════════════════════════════════════════════════ */
const STATUT_CONSULT = {
  redige:  { label: 'Rédigé',  color: 'var(--health-blue)',  bg: 'rgba(10,132,255,0.1)' },
  valide:  { label: 'Validé',  color: 'var(--health-green)', bg: 'rgba(52,199,89,0.1)' },
  archive: { label: 'Archivé', color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
}

function ConsultationsSection({ consultations, loading, patientId, onNew, onEdit, onDelete }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
          {consultations.length} consultation{consultations.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#0A84FF,#5AC8FA)', boxShadow: '0 4px 14px rgba(10,132,255,0.3)', border: 'none', cursor: 'pointer' }}
        >
          <PlusCircle size={15} /> Nouvelle consultation
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : consultations.length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <Calendar size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Aucune consultation</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Créez la première consultation pour ce patient.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map(c => {
            const cfg = STATUT_CONSULT[c.statut] ?? STATUT_CONSULT.redige
            return (
              <ConsultationCard key={c.id} consult={c} cfg={cfg} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} />
            )
          })}
        </div>
      )}
    </div>
  )
}

function ConsultationCard({ consult, cfg, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      className="rounded-2xl p-5 transition-all"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', borderLeft: `3px solid ${cfg.color}` }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Date + statut */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} style={{ color: cfg.color }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {format(new Date(consult.date_consultation), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>

          {/* Diagnostic */}
          {consult.diagnostic && (
            <div className="mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Diagnostic
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {consult.diagnostic}
              </p>
            </div>
          )}

          {/* Recommandations */}
          {consult.recommandations && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Recommandations
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {consult.recommandations}
              </p>
            </div>
          )}
        </div>

        {/* Actions hover */}
        {hov && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={onEdit}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}>
              <Pencil size={14} />
            </button>
            <button onClick={onDelete}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={{ background: 'rgba(255,45,85,0.1)', color: '#FF2D55', border: 'none', cursor: 'pointer' }}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   HISTORIQUE AVEC ANNOTATIONS ÉDITABLES
══════════════════════════════════════════════════════════ */
function HistoriqueAnnotable({ histo, selected, patientId, onHistoChange }) {
  const [editingId,  setEditingId]  = useState(null)   // mesure_id en édition
  const [draftText,  setDraftText]  = useState('')
  const [saving,     setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)   // annotation_id à supprimer

  const isAbn = (val) =>
    selected.seuil_max_normal && (val > selected.seuil_max_normal || val < (selected.seuil_min_normal ?? -Infinity))

  const startEdit = (m) => {
    setEditingId(m.id)
    setDraftText(m.annotation?.commentaire ?? '')
  }
  const cancelEdit = () => { setEditingId(null); setDraftText('') }

  const saveAnnotation = async (m) => {
    const text = draftText.trim()
    if (!text) return
    setSaving(true)
    try {
      if (m.annotation?.id) {
        // Modifier
        await modifierAnnotation(m.annotation.id, text)
      } else {
        // Créer
        await creerAnnotation({ mesure_id: m.id, commentaire: text })
      }
      // Mettre à jour localement
      onHistoChange(prev => prev.map(r =>
        r.id === m.id
          ? { ...r, annotation: { ...(r.annotation ?? {}), commentaire: text } }
          : r
      ))
      setEditingId(null)
      setDraftText('')
      toast.success('Annotation sauvegardée.')
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const deleteAnnotation = async (m) => {
    if (!m.annotation?.id) return
    try {
      await supprimerAnnotation(m.annotation.id)
      onHistoChange(prev => prev.map(r =>
        r.id === m.id ? { ...r, annotation: null } : r
      ))
      toast.success('Annotation supprimée.')
    } catch {
      toast.error('Erreur lors de la suppression.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Historique ({histo.length} mesures)
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Survolez une ligne pour annoter
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {[...histo].reverse().map((m) => {
            const abn      = isAbn(m.valeur)
            const isEdit   = editingId === m.id
            const hasAnn   = !!m.annotation

            return (
              <MesureAnnotRow
                key={m.id}
                mesure={m}
                typeUnite={selected.type_unite}
                isAbn={abn}
                isEdit={isEdit}
                hasAnn={hasAnn}
                draftText={draftText}
                saving={saving}
                onStartEdit={() => startEdit(m)}
                onCancelEdit={cancelEdit}
                onSave={() => saveAnnotation(m)}
                onDraftChange={setDraftText}
                onDeleteRequest={() => setDeletingId(m.annotation?.id ?? null)}
              />
            )
          })}
        </div>
      </div>

      {/* Confirmation suppression */}
      {deletingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeletingId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-modal)' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Supprimer cette annotation ?
            </p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              Elle ne sera plus visible pour le patient.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={() => {
                  const m = histo.find(r => r.annotation?.id === deletingId)
                  if (m) deleteAnnotation(m)
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#FF2D55', border: 'none', cursor: 'pointer' }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MesureAnnotRow({
  mesure, typeUnite, isAbn, isEdit, hasAnn,
  draftText, saving,
  onStartEdit, onCancelEdit, onSave, onDraftChange, onDeleteRequest,
}) {
  const [hov, setHov] = useState(false)

  return (
    <div
      className="px-5 py-3 transition-all"
      style={{ background: hov && !isEdit ? (hasAnn ? 'rgba(191,90,242,0.06)' : 'var(--bg-hover)') : (hasAnn ? 'rgba(191,90,242,0.03)' : 'transparent') }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="flex items-start gap-4">
        {/* Infos mesure */}
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {format(new Date(mesure.date_mesure), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
          </p>
          {mesure.contexte && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {mesure.contexte.replace(/_/g, ' ')}
            </p>
          )}
          {mesure.note && (
            <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-tertiary)' }}>
              {mesure.note}
            </p>
          )}

          {/* Annotation existante */}
          {hasAnn && !isEdit && (
            <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(191,90,242,0.10)' }}>
              <FileText size={12} style={{ color: '#BF5AF2', flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs font-medium flex-1" style={{ color: '#BF5AF2' }}>
                {mesure.annotation.commentaire}
              </p>
              {hov && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={onStartEdit}
                    className="w-5 h-5 flex items-center justify-center rounded transition-all"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BF5AF2' }}>
                    <Pencil size={11} />
                  </button>
                  <button onClick={onDeleteRequest}
                    className="w-5 h-5 flex items-center justify-center rounded transition-all"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF2D55' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Éditeur inline */}
          {isEdit && (
            <div className="mt-2 space-y-2">
              <textarea
                value={draftText}
                onChange={e => onDraftChange(e.target.value)}
                placeholder="Votre annotation pour ce patient…"
                rows={2}
                autoFocus
                className="w-full field-input resize-none text-sm"
                style={{ fontFamily: 'DM Sans' }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSave()
                  if (e.key === 'Escape') onCancelEdit()
                }}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={onSave}
                  disabled={!draftText.trim() || saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
                  style={{ background: saving || !draftText.trim() ? 'var(--bg-tertiary)' : '#BF5AF2', border: 'none', cursor: saving || !draftText.trim() ? 'not-allowed' : 'pointer' }}>
                  <Check size={12} /> {saving ? 'Sauvegarde…' : 'Enregistrer'}
                </button>
                <button onClick={onCancelEdit}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer' }}>
                  <XIcon size={12} /> Annuler
                </button>
                <p className="text-[10px] ml-auto" style={{ color: 'var(--text-tertiary)' }}>
                  Ctrl+Entrée pour sauvegarder
                </p>
              </div>
            </div>
          )}

          {/* Bouton annoter si pas d'annotation et au hover */}
          {!hasAnn && !isEdit && hov && (
            <button
              onClick={onStartEdit}
              className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(191,90,242,0.10)', color: '#BF5AF2', border: 'none', cursor: 'pointer' }}>
              <PlusCircle size={11} /> Annoter cette mesure
            </button>
          )}
        </div>

        {/* Valeur */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold tabular-nums text-base"
            style={{ color: isAbn ? '#FF2D55' : 'var(--text-primary)' }}>
            {mesure.valeur}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{typeUnite}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Skeleton ─────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-16 rounded-2xl" />
      <div className="flex gap-5">
        <div className="skeleton rounded-2xl flex-shrink-0" style={{ width: 220, height: 500 }} />
        <div className="flex-1 space-y-4">
          <div className="skeleton h-28 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
