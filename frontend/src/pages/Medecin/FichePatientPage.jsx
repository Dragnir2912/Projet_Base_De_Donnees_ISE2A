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
  '#FF5C6A','#FF9500','#FFD60A','#34C759',
  '#40B896','#2E9B83','#1A7C6C','#FF7B73',
]
const STATUT_CFG = {
  danger:    { color: '#FF5C6A', bg: 'rgba(255,92,106,0.10)',  label: 'Danger' },
  attention: { color: '#FF9500', bg: 'rgba(255,149,0,0.10)',  label: 'Attention' },
  normal:    { color: '#34C759', bg: 'rgba(52,199,89,0.10)',  label: 'Normal' },
}
const STATUT_CONSULT = {
  redige:  { label: 'Rédigé',  color: 'var(--accent)',      bg: 'rgba(46,155,131,0.1)' },
  valide:  { label: 'Validé',  color: 'var(--vital-green)', bg: 'rgba(52,199,89,0.1)' },
  archive: { label: 'Archivé', color: 'var(--ink-3)',       bg: 'var(--surface-3)' },
}
const SCORE_COLOR = s =>
  s === null ? '#7A9490' : s >= 70 ? '#34C759' : s >= 50 ? '#FF9500' : '#FF5C6A'

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
  const [showVSInfo,  setShowVSInfo]  = useState(false)

  const [consultations,   setConsultations]   = useState([])
  const [loadingC,        setLoadingC]        = useState(false)
  const [consultModal,    setConsultModal]     = useState(false)
  const [editConsult,     setEditConsult]      = useState(null)
  const [deletingConsult, setDeletingConsult]  = useState(null)

  useEffect(() => {
    Promise.all([getResumePatient(id), getMesuresPatient(id)])
      .then(([r, m]) => {
        setResume(r.data.data)
        const typesData = m.data.data ?? []
        setTypes(typesData)
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
      const sorted = (r.data.data ?? []).slice().sort((a, b) => new Date(a.date_mesure) - new Date(b.date_mesure))
      setHisto(sorted)
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

  const onConsultSaved = () => {
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
  const colorSel = selected ? (TYPE_COLORS[types.indexOf(selected) % TYPE_COLORS.length] ?? '#2E9B83') : '#2E9B83'

  const chartData = histo.map(m => ({
    date:   format(new Date(m.date_mesure), 'd MMM', { locale: fr }),
    valeur: m.valeur,
    annotation: m.annotation?.commentaire ?? null,
  }))

  return (
    <div className="space-y-5 page-enter">

      {/* ══ RETOUR ══ */}
      <button
        onClick={() => navigate('/medecin')}
        className="flex items-center gap-2 text-sm font-medium animate-fade-up"
        style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={18} /> Mes patients
      </button>

      {/* ══ HERO PATIENT ══ */}
      <div style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden',
        height: 200, background: 'var(--surface-1)', border: '1px solid var(--border-0)',
      }} className="animate-fade-up">
        <div style={{ position: 'absolute', right: 0, top: 0, width: '48%', height: '100%' }}>
          <img src="/illustrations/hero/illus-doctor-tablet.jpeg" alt="" aria-hidden
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--surface-1) 0%, rgba(10,21,18,0.52) 38%, transparent 75%)' }} />
        </div>
        <div style={{
          position: 'relative', zIndex: 1, height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '22px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--surface-3)', border: '2px solid var(--border-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
              {patient?.prenom?.[0]}{patient?.nom?.[0]}
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent)', display: 'block', marginBottom: 4 }}>
                Fiche patient
              </span>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-0.8px', lineHeight: 1.15, margin: 0 }}>
                {patient?.prenom} {patient?.nom}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
                {patient?.age ? `${patient.age} ans` : ''}{patient?.age && patient?.email ? ' · ' : ''}{patient?.email}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)' }}>
              <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                <svg width="36" height="36" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border-2)" strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" fill="none"
                    stroke={SCORE_COLOR(score)} strokeWidth="4"
                    strokeDasharray={`${score !== null ? (score / 100) * (2 * Math.PI * 20) : 0} ${2 * Math.PI * 20}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: SCORE_COLOR(score) }}>{score ?? '—'}</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)', lineHeight: 1 }}>VitaScore</p>
                  <button onClick={() => setShowVSInfo(true)}
                    style={{ fontSize: 9, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>?</button>
                </div>
                {resume?.alertes_danger > 0 && (
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--vital-red)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                    <AlertTriangle size={10} /> {resume.alertes_danger} danger
                  </p>
                )}
              </div>
            </div>

            <button onClick={() => navigate(`/messages?with=${id}`)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', cursor: 'pointer', color: 'var(--ink-2)' }}>
              <MessageSquare size={14} /> Message
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
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: downloading ? 'var(--surface-3)' : 'var(--vital-green)',
                color: '#fff',
                border: 'none',
                cursor: downloading ? 'not-allowed' : 'pointer',
                boxShadow: downloading ? 'none' : '0 4px 12px rgba(52,199,89,0.25)',
              }}>
              <Download size={14} /> {downloading ? 'Génération…' : 'Rapport PDF'}
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
          style={{ width: 220, background: 'var(--surface-1)', border: '1px solid var(--border-0)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-0)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-3)' }}>
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
                    borderBottom: '1px solid var(--border-0)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: isActive ? c : 'var(--ink-1)' }}>
                      {t.type_nom}
                    </p>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                  </div>
                  <p className="text-xs mt-0.5 tabular-nums" style={{ color: isActive ? c : 'var(--ink-3)' }}>
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
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)', boxShadow: 'var(--shadow-card)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ background: colorSel }}>
                  {selected.type_nom.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--ink-1)' }}>{selected.type_nom}</h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--ink-3)' }}>
                    {selected.description || `Unité : ${selected.type_unite}`}
                  </p>
                  {selected.seuil_min_normal && (
                    <p className="text-xs mt-1.5" style={{ color: 'var(--ink-3)' }}>
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
                  <p className="text-sm" style={{ color: 'var(--ink-3)' }}>{selected.type_unite}</p>
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
                <div className="rounded-2xl p-5"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)', boxShadow: 'var(--shadow-card)' }}>
                  <p className="font-semibold mb-4" style={{ color: 'var(--ink-1)' }}>Évolution — 90 derniers jours</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ficheGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"  stopColor={colorSel} stopOpacity={0.28} />
                          <stop offset="90%" stopColor={colorSel} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="0" stroke="var(--border-0)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'Poppins' }} domain={['auto', 'auto']} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ stroke: `${colorSel}22`, strokeWidth: 1 }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          const ann = payload[0]?.payload?.annotation
                          return (
                            <div style={{
                              background: 'var(--glass-card)',
                              backdropFilter: 'blur(20px) saturate(1.8)',
                              WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: 12, padding: '10px 14px',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
                              minWidth: 120, fontFamily: 'Poppins, system-ui',
                            }}>
                              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', margin: '0 0 4px' }}>{label}</p>
                              <p style={{ fontSize: 16, fontWeight: 800, color: colorSel, letterSpacing: '-0.5px', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                                {payload[0]?.value} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)' }}>{selected.type_unite}</span>
                              </p>
                              {ann && (
                                <p style={{ fontSize: 10, color: 'var(--accent)', marginTop: 5, fontStyle: 'italic', borderTop: '1px solid var(--glass-border)', paddingTop: 5 }}>
                                  ✏ {ann}
                                </p>
                              )}
                            </div>
                          )
                        }}
                      />
                      {selected.seuil_min_normal && <ReferenceLine y={selected.seuil_min_normal} stroke="#FF8C42" strokeDasharray="5 4" strokeWidth={1.5} />}
                      {selected.seuil_max_normal && <ReferenceLine y={selected.seuil_max_normal} stroke="#FF8C42" strokeDasharray="5 4" strokeWidth={1.5} />}
                      {selected.seuil_danger_haut && <ReferenceLine y={selected.seuil_danger_haut} stroke="#FF5C6A" strokeDasharray="3 4" strokeWidth={1} />}
                      <Area type="monotone" dataKey="valeur" stroke={colorSel} strokeWidth={2.4}
                        fill="url(#ficheGrad)"
                        dot={(props) => {
                          const { cx, cy, payload } = props
                          if (!payload.annotation) return <circle key={props.key} cx={cx} cy={cy} r={3} fill={colorSel} strokeWidth={0} />
                          return <circle key={props.key} cx={cx} cy={cy} r={6} fill="var(--accent)" stroke="rgba(255,255,255,0.9)" strokeWidth={2} />
                        }}
                        activeDot={{ r: 5, fill: colorSel, strokeWidth: 2, stroke: `${colorSel}35` }} />
                    </AreaChart>
                  </ResponsiveContainer>
                  {histo.some(m => m.annotation) && (
                    <p className="text-[11px] mt-2 text-center" style={{ color: 'var(--ink-3)' }}>
                      • Points accentués = annotations du médecin
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl p-10 text-center"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)', boxShadow: 'var(--shadow-card)' }}>
                  <BarChart2 size={32} style={{ color: 'var(--ink-3)', margin: '0 auto 8px' }} />
                  <p className="text-sm" style={{ color: 'var(--ink-3)' }}>Aucune mesure pour ce type.</p>
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
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)', boxShadow: 'var(--shadow-card)' }}>
              <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
                Sélectionnez un indicateur pour voir son évolution.
              </p>
            </div>
          )}
        </div>
      </div>
      )}

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
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={() => setDeletingConsult(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: 'var(--glass-card)',
              backdropFilter: 'blur(28px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
              animation: 'scale-in 0.24s cubic-bezier(0.34,1.2,0.64,1) both',
            }}
            onClick={e => e.stopPropagation()}>
            <p className="font-semibold mb-2" style={{ color: 'var(--ink-1)' }}>Supprimer cette consultation ?</p>
            <p className="text-sm mb-5" style={{ color: 'var(--ink-2)' }}>
              Le diagnostic et les recommandations seront définitivement supprimés.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingConsult(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--border-0)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}>
                Annuler
              </button>
              <button onClick={handleDeleteConsult}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: '#FF5C6A', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,92,106,0.3)' }}>
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
function ConsultationsSection({ consultations, loading, patientId, onNew, onEdit, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-3)' }}>
          {consultations.length} consultation{consultations.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#2E9B83,#40B896)', boxShadow: '0 4px 14px rgba(46,155,131,0.3)', border: 'none', cursor: 'pointer' }}
        >
          <PlusCircle size={15} /> Nouvelle consultation
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : consultations.length === 0 ? (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-44 flex-shrink-0 flex items-center justify-center p-5"
              style={{ background: 'linear-gradient(135deg, rgba(46,155,131,0.07), rgba(26,124,108,0.03))', minHeight: 160 }}>
              <img src="/illustrations/feature/illus-patient-medication-man.jpeg" alt="" aria-hidden="true"
                style={{ width: 120, height: 120, objectFit: 'contain' }} />
            </div>
            <div className="p-6">
              <p className="font-bold text-base mb-1.5" style={{ color: 'var(--ink-1)', letterSpacing: '-0.3px' }}>
                Aucune consultation
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-3)', maxWidth: 240 }}>
                Créez la première consultation pour suivre l'évolution de ce patient.
              </p>
            </div>
          </div>
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
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)', boxShadow: 'var(--shadow-card)', borderLeft: `3px solid ${cfg.color}` }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} style={{ color: cfg.color }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--ink-1)' }}>
                {format(new Date(consult.date_consultation), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>

          {consult.diagnostic && (
            <div className="mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--ink-3)' }}>
                Diagnostic
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                {consult.diagnostic}
              </p>
            </div>
          )}

          {consult.recommandations && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--ink-3)' }}>
                Recommandations
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                {consult.recommandations}
              </p>
            </div>
          )}
        </div>

        {hov && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={onEdit}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={{ background: 'rgba(46,155,131,0.1)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
              <Pencil size={14} />
            </button>
            <button onClick={onDelete}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={{ background: 'rgba(255,92,106,0.1)', color: '#FF5C6A', border: 'none', cursor: 'pointer' }}>
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
  const [editingId,  setEditingId]  = useState(null)
  const [draftText,  setDraftText]  = useState('')
  const [saving,     setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const isAbn = (val) =>
    selected.seuil_max_normal && (val > selected.seuil_max_normal || val < (selected.seuil_min_normal ?? -Infinity))

  const startEdit = (m) => { setEditingId(m.id); setDraftText(m.annotation?.commentaire ?? '') }
  const cancelEdit = () => { setEditingId(null); setDraftText('') }

  const saveAnnotation = async (m) => {
    const text = draftText.trim()
    if (!text) return
    setSaving(true)
    try {
      if (m.annotation?.id) {
        await modifierAnnotation(m.annotation.id, text)
      } else {
        await creerAnnotation({ mesure_id: m.id, commentaire: text })
      }
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
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <p className="font-semibold" style={{ color: 'var(--ink-1)' }}>
            Historique ({histo.length} mesures)
          </p>
          <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
            Survolez une ligne pour annoter
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-0)' }}>
          {[...histo].reverse().map((m) => {
            const abn    = isAbn(m.valeur)
            const isEdit = editingId === m.id
            const hasAnn = !!m.annotation
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

      {/* Confirmation suppression annotation */}
      {deletingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={() => setDeletingId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: 'var(--glass-card)',
              backdropFilter: 'blur(28px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
              animation: 'scale-in 0.24s cubic-bezier(0.34,1.2,0.64,1) both',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="font-semibold mb-2" style={{ color: 'var(--ink-1)' }}>
              Supprimer cette annotation ?
            </p>
            <p className="text-sm mb-5" style={{ color: 'var(--ink-2)' }}>
              Elle ne sera plus visible pour le patient.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--border-0)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}>
                Annuler
              </button>
              <button
                onClick={() => {
                  const m = histo.find(r => r.annotation?.id === deletingId)
                  if (m) deleteAnnotation(m)
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: '#FF5C6A', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,92,106,0.3)' }}>
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
      style={{ background: hov && !isEdit ? (hasAnn ? 'rgba(26,124,108,0.06)' : 'var(--surface-2)') : (hasAnn ? 'rgba(26,124,108,0.03)' : 'transparent') }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
            {format(new Date(mesure.date_mesure), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
          </p>
          {mesure.contexte && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
              {mesure.contexte.replace(/_/g, ' ')}
            </p>
          )}
          {mesure.note && (
            <p className="text-xs mt-0.5 italic" style={{ color: 'var(--ink-3)' }}>
              {mesure.note}
            </p>
          )}

          {/* Annotation existante */}
          {hasAnn && !isEdit && (
            <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(26,124,108,0.10)' }}>
              <FileText size={12} style={{ color: '#1A7C6C', flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs font-medium flex-1" style={{ color: '#1A7C6C' }}>
                {mesure.annotation.commentaire}
              </p>
              {hov && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={onStartEdit}
                    className="w-5 h-5 flex items-center justify-center rounded transition-all"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1A7C6C' }}>
                    <Pencil size={11} />
                  </button>
                  <button onClick={onDeleteRequest}
                    className="w-5 h-5 flex items-center justify-center rounded transition-all"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF5C6A' }}>
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
                style={{ fontFamily: 'Poppins, system-ui' }}
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
                  style={{ background: saving || !draftText.trim() ? 'var(--surface-3)' : '#1A7C6C', border: 'none', cursor: saving || !draftText.trim() ? 'not-allowed' : 'pointer' }}>
                  <Check size={12} /> {saving ? 'Sauvegarde…' : 'Enregistrer'}
                </button>
                <button onClick={onCancelEdit}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: 'var(--surface-2)', color: 'var(--ink-3)', border: 'none', cursor: 'pointer' }}>
                  <XIcon size={12} /> Annuler
                </button>
                <p className="text-[10px] ml-auto" style={{ color: 'var(--ink-3)' }}>
                  Ctrl+Entrée pour sauvegarder
                </p>
              </div>
            </div>
          )}

          {/* Bouton annoter si pas d'annotation */}
          {!hasAnn && !isEdit && hov && (
            <button
              onClick={onStartEdit}
              className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(26,124,108,0.10)', color: '#1A7C6C', border: 'none', cursor: 'pointer' }}>
              <PlusCircle size={11} /> Annoter cette mesure
            </button>
          )}
        </div>

        {/* Valeur */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold tabular-nums text-base"
            style={{ color: isAbn ? '#FF5C6A' : 'var(--ink-1)' }}>
            {mesure.valeur}
          </p>
          <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{typeUnite}</p>
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
