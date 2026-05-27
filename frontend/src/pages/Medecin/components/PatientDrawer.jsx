import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, AlertTriangle, Calendar, BellRing, ExternalLink, PlusCircle, Pencil, Trash2, Download } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  getResumePatient, getHistoriquePatient,
  supprimerConsultation, downloadRapportPDF,
} from '../../../services/medecinService'
import VitaScoreInfoModal from '../../../components/health/VitaScoreInfoModal'
import ConsultationModal from './ConsultationModal'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const SCORE_COLOR = s =>
  s === null ? 'var(--ink-3)' : s >= 70 ? '#34C759' : s >= 50 ? '#FF9500' : '#FF5C6A'

const SCORE_LABEL = s =>
  s === null ? 'Données insuffisantes'
    : s >= 80 ? 'Excellent état général'
    : s >= 60 ? 'Bon état général'
    : s >= 40 ? 'Surveillance recommandée'
    : 'Consultation urgente'

const TYPE_COLORS = [
  '#FF5C6A','#FF9500','#FFD60A','#34C759',
  '#40B896','#2E9B83','#4DAAFF','#FF7B73',
]

const STATUT_CFG = {
  redige:  { label: 'Rédigé',  color: 'var(--accent)',    bg: 'var(--accent-dim)' },
  valide:  { label: 'Validé',  color: '#34C759',          bg: 'rgba(52,199,89,0.1)' },
  archive: { label: 'Archivé', color: 'var(--ink-3)',     bg: 'var(--surface-3)' },
}

export default function PatientDrawer({ patientId, patients, avatarColors, onClose, onRefresh }) {
  const navigate = useNavigate()
  const [resume,       setResume]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [histoType,    setHistoType]    = useState(null)
  const [histoData,    setHistoData]    = useState([])
  const [histoColor,   setHistoColor]   = useState('#2E9B83')
  const [showVSInfo,   setShowVSInfo]   = useState(false)
  const [consultModal, setConsultModal] = useState(false)
  const [editConsult,  setEditConsult]  = useState(null)
  const [deletingCId,  setDeletingCId]  = useState(null)
  const [downloading,  setDownloading]  = useState(false)

  const patient = patients.find(p => p.id === patientId)
  const color   = avatarColors[patients.indexOf(patient) % avatarColors.length]

  useEffect(() => {
    setLoading(true)
    setResume(null)
    setHistoType(null)
    setHistoData([])
    getResumePatient(patientId)
      .then(r => setResume(r.data.data))
      .catch(() => toast.error('Impossible de charger la fiche.'))
      .finally(() => setLoading(false))
  }, [patientId])

  const loadHisto = async (typeId, typeName, c) => {
    setHistoType(typeName)
    setHistoColor(c)
    setHistoData([])
    try {
      const res = await getHistoriquePatient(patientId, typeId)
      const pts = (res.data.data ?? [])
        .slice()
        .sort((a, b) => new Date(a.date_mesure) - new Date(b.date_mesure))
      setHistoData(pts.map(m => ({
        date:   format(new Date(m.date_mesure), 'd MMM', { locale: fr }),
        valeur: m.valeur,
      })))
    } catch { /* silent */ }
  }

  const onConsultSaved = () => {
    setConsultModal(false)
    setEditConsult(null)
    getResumePatient(patientId).then(r => setResume(r.data.data)).catch(() => {})
  }

  const handleDeleteConsult = async () => {
    if (!deletingCId) return
    try {
      await supprimerConsultation(deletingCId)
      setResume(prev => ({
        ...prev,
        consultations_recentes: prev.consultations_recentes.filter(c => c.id !== deletingCId),
      }))
      toast.success('Consultation supprimée.')
    } catch { toast.error('Erreur lors de la suppression.') }
    finally { setDeletingCId(null) }
  }

  const score = resume?.vitascore?.score ?? null
  const scoreCol = SCORE_COLOR(score)
  const C = 2 * Math.PI * 28

  const content = (
    <>
      {/* ── Backdrop ── */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* ── Panel ── */}
      <aside
        style={{
          position: 'fixed', right: 0, top: 0, height: '100vh', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          width: 480,
          background: 'var(--surface-2)',
          borderLeft: '1px solid var(--border-1)',
          boxShadow: '-12px 0 60px rgba(0,0,0,0.35)',
          animation: 'drawerSlideIn 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <style>{`
          @keyframes drawerSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* ── Header fixe ── */}
        <div
          style={{
            padding: '20px 24px 18px',
            borderBottom: '1px solid var(--border-0)',
            background: 'var(--surface-2)',
            flexShrink: 0,
          }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: color }}
            >
              {patient?.prenom?.[0]}{patient?.nom?.[0]}
            </div>

            {/* Nom + info */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="font-bold text-base leading-tight" style={{ color: 'var(--ink-1)', letterSpacing: '-0.4px' }}>
                {patient?.prenom} {patient?.nom}
              </h2>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ink-3)' }}>
                {patient?.age ? `${patient.age} ans` : ''}{patient?.age && patient?.email ? ' · ' : ''}{patient?.email}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: 'var(--surface-3)', color: 'var(--ink-3)', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-4)'; e.currentTarget.style.color = 'var(--ink-2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--ink-3)' }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={async () => {
                setDownloading(true)
                try {
                  await downloadRapportPDF(patientId, `${patient?.prenom ?? ''} ${patient?.nom ?? ''}`)
                  toast.success('Rapport PDF téléchargé.')
                } catch (err) {
                  toast.error(err?.message || 'Erreur lors de la génération du PDF.')
                } finally { setDownloading(false) }
              }}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: downloading ? 'var(--surface-3)' : 'rgba(52,199,89,0.12)',
                color: downloading ? 'var(--ink-3)' : '#34C759',
                border: '1px solid',
                borderColor: downloading ? 'var(--border-0)' : 'rgba(52,199,89,0.22)',
                cursor: downloading ? 'not-allowed' : 'pointer',
              }}
            >
              <Download size={13} />
              {downloading ? 'Génération…' : 'Télécharger PDF'}
            </button>

            <button
              onClick={() => { onClose(); navigate(`/medecin/patients/${patientId}`) }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-mid))',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px var(--accent-glow)',
              }}
            >
              <ExternalLink size={13} /> Ouvrir la fiche complète
            </button>
          </div>
        </div>

        {/* ── Contenu scrollable ── */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <>
              {[140, 200, 160].map((h, i) => (
                <div key={i} className="skeleton rounded-2xl" style={{ height: h }} />
              ))}
            </>
          ) : !resume ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--ink-3)' }}>
              <AlertTriangle size={32} style={{ opacity: 0.4 }} />
              <p className="text-sm">Impossible de charger la fiche patient.</p>
            </div>
          ) : (
            <>
              {/* ── VitaScore ── */}
              <VitaScorePanel
                score={score}
                scoreCol={scoreCol}
                C={C}
                alertesDanger={resume.alertes_danger}
                onInfo={() => setShowVSInfo(true)}
              />

              {/* ── Dernières mesures ── */}
              {resume.dernieres_mesures?.length > 0 && (
                <DrawerSection title="Dernières mesures" subtitle="Cliquez pour afficher la courbe">
                  {resume.dernieres_mesures.map((m, i) => {
                    const c = TYPE_COLORS[i % TYPE_COLORS.length]
                    const selected = histoType === m.type
                    return (
                      <button
                        key={i}
                        onClick={() => loadHisto(m.type_id, m.type, c)}
                        className="w-full flex items-center justify-between px-4 py-3 transition-all text-left"
                        style={{
                          background: selected ? `${c}12` : 'transparent',
                          borderBottom: i < resume.dernieres_mesures.length - 1 ? '1px solid var(--border-0)' : 'none',
                          border: 'none',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--surface-3)' }}
                        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: c, boxShadow: selected ? `0 0 8px ${c}` : 'none' }}
                          />
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--ink-1)' }}>{m.type}</p>
                            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                              {format(new Date(m.date_mesure), 'd MMM yyyy · HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold tabular-nums text-sm" style={{ color: selected ? c : 'var(--ink-1)' }}>
                            {m.valeur}
                          </span>
                          <span className="text-xs ml-1" style={{ color: 'var(--ink-3)' }}>{m.unite}</span>
                        </div>
                      </button>
                    )
                  })}
                </DrawerSection>
              )}

              {/* ── Courbe historique ── */}
              {histoType && histoData.length > 0 && (
                <div style={{
                  borderRadius: 16,
                  padding: '16px 18px',
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border-0)',
                }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full" style={{ background: histoColor }} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.3px' }}>
                      {histoType}
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={histoData} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="drawerGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"  stopColor={histoColor} stopOpacity={0.30} />
                          <stop offset="90%" stopColor={histoColor} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="0" stroke="var(--border-0)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'Poppins' }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'Poppins' }}
                        domain={['auto', 'auto']}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip
                        cursor={{ stroke: `${histoColor}30`, strokeWidth: 1 }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div style={{
                              background: 'var(--surface-4)',
                              border: '1px solid var(--border-1)',
                              borderRadius: 10, padding: '7px 11px',
                              boxShadow: 'var(--shadow-md)',
                              fontFamily: 'Poppins, system-ui',
                            }}>
                              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', margin: '0 0 2px' }}>{label}</p>
                              <p style={{ fontSize: 15, fontWeight: 800, color: histoColor, letterSpacing: '-0.4px', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                                {payload[0]?.value}
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="valeur"
                        stroke={histoColor}
                        strokeWidth={2.2}
                        fill="url(#drawerGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: histoColor, strokeWidth: 2, stroke: 'var(--surface-2)' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ── Consultations ── */}
              <DrawerSection
                title="Consultations"
                action={
                  <button
                    onClick={() => { setEditConsult(null); setConsultModal(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-mid))',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    <PlusCircle size={11} /> Nouvelle
                  </button>
                }
              >
                {!resume.consultations_recentes?.length ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
                      Aucune consultation enregistrée.
                    </p>
                  </div>
                ) : (
                  resume.consultations_recentes.map((c, i) => (
                    <DrawerConsultRow
                      key={c.id}
                      consult={c}
                      cfg={STATUT_CFG[c.statut] ?? STATUT_CFG.redige}
                      isLast={i === resume.consultations_recentes.length - 1}
                      onEdit={() => { setEditConsult(c); setConsultModal(true) }}
                      onDelete={() => setDeletingCId(c.id)}
                    />
                  ))
                )}
              </DrawerSection>
            </>
          )}
        </div>
      </aside>

      {/* ── Modales ── */}
      {showVSInfo && <VitaScoreInfoModal score={score} onClose={() => setShowVSInfo(false)} />}

      {consultModal && (
        <ConsultationModal
          patientId={patientId}
          consultation={editConsult}
          onSaved={onConsultSaved}
          onClose={() => { setConsultModal(false); setEditConsult(null) }}
        />
      )}

      {deletingCId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(8px)' }}
          onClick={() => setDeletingCId(null)}
        >
          <div
            style={{
              width: '100%', maxWidth: 360, borderRadius: 20, padding: 24,
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)',
              boxShadow: 'var(--shadow-xl)',
              animation: 'scale-in 0.22s cubic-bezier(0.34,1.2,0.64,1) both',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--ink-1)', fontSize: 15 }}>Supprimer cette consultation ?</p>
            <p style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.6, color: 'var(--ink-3)' }}>
              Le diagnostic et les recommandations seront supprimés définitivement.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeletingCId(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: 'var(--surface-3)', color: 'var(--ink-2)', border: '1px solid var(--border-0)', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConsult}
                style={{ flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'white', background: '#FF5C6A', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,92,106,0.28)' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return createPortal(content, document.body)
}

/* ── VitaScore Panel ─────────────────────────────────────── */
function VitaScorePanel({ score, scoreCol, C, alertesDanger, onInfo }) {
  const dash = score !== null ? (score / 100) * C : 0

  return (
    <div style={{
      borderRadius: 18,
      padding: '18px 20px',
      background: 'var(--surface-3)',
      border: '1px solid var(--border-1)',
    }}>
      <div className="flex items-center gap-4">
        {/* Anneau */}
        <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--surface-5)" strokeWidth="5" />
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke={scoreCol}
              strokeWidth="5"
              strokeDasharray={`${dash} ${C}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1.2s ease', filter: score !== null ? `drop-shadow(0 0 6px ${scoreCol}60)` : 'none' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold tabular-nums" style={{ color: scoreCol }}>
              {score ?? '—'}
            </span>
          </div>
        </div>

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--ink-3)' }}>
              VitaScore
            </span>
            <button
              onClick={onInfo}
              className="w-4 h-4 flex items-center justify-center rounded-full transition-all"
              style={{ background: 'var(--surface-5)', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 9, fontWeight: 700, lineHeight: 1 }}
            >
              ?
            </button>
          </div>
          <p className="font-bold text-sm leading-snug" style={{ color: 'var(--ink-1)', letterSpacing: '-0.3px', margin: 0 }}>
            {SCORE_LABEL(score)}
          </p>
        </div>

        {/* Badge danger */}
        {alertesDanger > 0 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-shrink-0"
            style={{ background: 'rgba(255,92,106,0.12)', border: '1px solid rgba(255,92,106,0.22)' }}
          >
            <BellRing size={12} color="#FF5C6A" />
            <span className="text-xs font-bold" style={{ color: '#FF5C6A' }}>
              {alertesDanger}
            </span>
          </div>
        )}
      </div>

      {/* Barre de progression */}
      {score !== null && (
        <div className="mt-4">
          <div style={{ height: 4, borderRadius: 999, background: 'var(--surface-5)', overflow: 'hidden' }}>
            <div style={{
              width: `${score}%`, height: '100%', borderRadius: 999,
              background: scoreCol,
              transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
              boxShadow: `0 0 8px ${scoreCol}60`,
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Section wrapper ─────────────────────────────────────── */
function DrawerSection({ title, subtitle, action, children }) {
  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      background: 'var(--surface-3)',
      border: '1px solid var(--border-0)',
    }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-0)' }}
      >
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--ink-1)', margin: 0 }}>{title}</p>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)', margin: 0 }}>{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ── Consultation row ────────────────────────────────────── */
function DrawerConsultRow({ consult, cfg, isLast, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      className="px-4 py-3 flex items-start gap-3 transition-all"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border-0)',
        background: hov ? 'var(--surface-4)' : 'transparent',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: cfg.bg }}
      >
        <Calendar size={13} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-xs font-medium" style={{ color: 'var(--ink-3)' }}>
            {format(new Date(consult.date_consultation ?? consult.date), 'd MMMM yyyy', { locale: fr })}
          </p>
          <span
            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        {consult.diagnostic && (
          <p className="text-sm" style={{ color: 'var(--ink-1)' }}>{consult.diagnostic}</p>
        )}
        {consult.recommandations && (
          <p className="text-xs mt-0.5 italic" style={{ color: 'var(--ink-2)' }}>{consult.recommandations}</p>
        )}
      </div>
      {hov && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'rgba(255,92,106,0.1)', color: '#FF5C6A', border: 'none', cursor: 'pointer' }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  )
}
