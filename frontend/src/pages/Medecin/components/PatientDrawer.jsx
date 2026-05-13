import { useEffect, useState } from 'react'
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
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const SCORE_COLOR = s =>
  s === null ? '#8E8E93' : s >= 70 ? '#34C759' : s >= 50 ? '#FF9500' : '#FF2D55'

export default function PatientDrawer({ patientId, patients, avatarColors, onClose, onRefresh }) {
  const navigate = useNavigate()
  const [resume,        setResume]        = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [histoType,     setHistoType]     = useState(null)
  const [histoData,     setHistoData]     = useState([])
  const [histoColor,    setHistoColor]    = useState('#0A84FF')
  const [showVSInfo,    setShowVSInfo]    = useState(false)
  const [consultModal,  setConsultModal]  = useState(false)
  const [editConsult,   setEditConsult]   = useState(null)
  const [deletingCId,   setDeletingCId]   = useState(null)
  const [downloading,   setDownloading]   = useState(false)

  const patient = patients.find(p => p.id === patientId)
  const color   = avatarColors[patients.indexOf(patient) % avatarColors.length]

  const TYPE_COLORS = [
    '#FF2D55','#FF9500','#FFD60A','#34C759',
    '#5AC8FA','#0A84FF','#BF5AF2','#FF375F',
  ]

  useEffect(() => {
    setLoading(true)
    setResume(null)
    getResumePatient(patientId)
      .then(r => setResume(r.data.data))
      .catch(() => toast.error('Impossible de charger la fiche.'))
      .finally(() => setLoading(false))
  }, [patientId])

  // typeId est maintenant passé directement depuis dernieres_mesures
  const loadHisto = async (typeId, typeName, color) => {
    setHistoType(typeName)
    setHistoColor(color)
    setHistoData([])
    try {
      const res = await getHistoriquePatient(patientId, typeId)
      const pts = (res.data.data ?? []).slice().reverse()
      setHistoData(pts.map(m => ({
        date:   format(new Date(m.date_mesure), 'd MMM', { locale: fr }),
        valeur: m.valeur,
      })))
    } catch { /* silent */ }
  }

  const onConsultSaved = (saved) => {
    setConsultModal(false)
    setEditConsult(null)
    // Recharger le résumé pour mettre à jour la liste
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
    } catch { toast.error('Erreur.') }
    finally { setDeletingCId(null) }
  }

  const score = resume?.vitascore?.score ?? null
  const C = 2 * Math.PI * 28

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-screen overflow-y-auto z-50 p-6 space-y-5"
        style={{
          width: 500,
          background: 'var(--bg-primary)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.20)',
          animation: 'slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold"
              style={{ background: color }}>
              {patient?.prenom?.[0]}{patient?.nom?.[0]}
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {patient?.prenom} {patient?.nom}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {patient?.age ? `${patient.age} ans` : ''} · {patient?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setDownloading(true)
                try {
                  const nom = `${patient?.prenom ?? ''} ${patient?.nom ?? ''}`
                  await downloadRapportPDF(patientId, nom)
                  toast.success('Rapport PDF téléchargé.')
                } catch (err) {
                  toast.error(err?.message || 'Erreur lors de la génération du PDF.')
                } finally {
                  setDownloading(false)
                }
              }}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: downloading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg,#34C759,#30D158)',
                border: 'none',
                cursor: downloading ? 'not-allowed' : 'pointer',
              }}
              title="Télécharger le rapport PDF"
            >
              <Download size={14} /> {downloading ? '…' : 'PDF'}
            </button>
            <button
              onClick={() => { onClose(); navigate(`/medecin/patients/${patientId}`) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}
              title="Ouvrir la fiche complète"
            >
              <ExternalLink size={14} /> Fiche complète
            </button>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : resume ? (
          <>
            {/* VitaScore */}
            <div className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(135deg, #0F0F28, #0F3460)', boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                    <circle cx="32" cy="32" r="28" fill="none"
                      stroke={SCORE_COLOR(score)} strokeWidth="5"
                      strokeDasharray={`${score !== null ? (score / 100) * C : 0} ${C}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 1.2s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{score ?? '—'}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: 'rgba(255,255,255,0.5)' }}>VitaScore</p>
                    <button onClick={() => setShowVSInfo(true)}
                      className="w-5 h-5 flex items-center justify-center rounded-full transition-all"
                      style={{ background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700 }}
                      title="Comprendre le VitaScore">
                      ?
                    </button>
                  </div>
                  <p className="text-lg font-bold text-white mt-0.5">
                    {score === null ? 'Insuffisant'
                      : score >= 80 ? 'Excellent état général'
                      : score >= 60 ? 'Bon état général'
                      : score >= 40 ? 'Surveillance recommandée'
                      : 'Consultation urgente'}
                  </p>
                </div>
                {resume.alertes_danger > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,45,85,0.2)' }}>
                    <BellRing size={13} color="#FF2D55" />
                    <span className="text-sm font-bold" style={{ color: '#FF2D55' }}>
                      {resume.alertes_danger} danger
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Dernières mesures — cliquables pour afficher la courbe */}
            {resume.dernieres_mesures?.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Dernières mesures
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    Cliquez sur une mesure pour voir la courbe
                  </p>
                </div>
                {resume.dernieres_mesures.map((m, i) => {
                  const c = TYPE_COLORS[i % TYPE_COLORS.length]
                  const isSelected = histoType === m.type
                  return (
                    <button key={i}
                      onClick={() => loadHisto(m.type_id, m.type, c)}
                      className="w-full flex items-center justify-between px-5 py-3 transition-all text-left"
                      style={{
                        background: isSelected ? `${c}10` : 'transparent',
                        borderBottom: i < resume.dernieres_mesures.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        border: 'none', cursor: 'pointer',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.type}</p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {format(new Date(m.date_mesure), 'd MMM yyyy · HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold tabular-nums" style={{ color: isSelected ? c : 'var(--text-primary)' }}>
                          {m.valeur}
                        </span>
                        <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>{m.unite}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Courbe historique */}
            {histoType && histoData.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <p className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Courbe — {histoType}
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={histoData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="drawerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={histoColor} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={histoColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', fontSize: 11, fontFamily: 'DM Sans' }} />
                    <Area type="monotone" dataKey="valeur" stroke={histoColor} strokeWidth={2.5} fill="url(#drawerGrad)" dot={false} activeDot={{ r: 4, fill: histoColor, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Consultations — liste + bouton créer */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Consultations</p>
                <button
                  onClick={() => { setEditConsult(null); setConsultModal(true) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#0A84FF,#5AC8FA)', border: 'none', cursor: 'pointer' }}>
                  <PlusCircle size={12} /> Nouvelle
                </button>
              </div>
              {!resume.consultations_recentes?.length ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Aucune consultation. Cliquez sur "Nouvelle" pour en créer une.</p>
                </div>
              ) : resume.consultations_recentes.map((c, i) => {
                const STATUT_CFG = {
                  redige:  { label: 'Rédigé',  color: 'var(--health-blue)',  bg: 'rgba(10,132,255,0.1)' },
                  valide:  { label: 'Validé',  color: 'var(--health-green)', bg: 'rgba(52,199,89,0.1)' },
                  archive: { label: 'Archivé', color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
                }
                const cfg = STATUT_CFG[c.statut] ?? STATUT_CFG.redige
                return (
                  <DrawerConsultRow
                    key={c.id}
                    consult={c}
                    cfg={cfg}
                    isLast={i === resume.consultations_recentes.length - 1}
                    onEdit={() => { setEditConsult(c); setConsultModal(true) }}
                    onDelete={() => setDeletingCId(c.id)}
                  />
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-10" style={{ color: 'var(--text-tertiary)' }}>
            Impossible de charger la fiche.
          </div>
        )}
      </div>

      {/* VitaScore info */}
      {showVSInfo && (
        <VitaScoreInfoModal score={score} onClose={() => setShowVSInfo(false)} />
      )}

      {/* Modals */}
      {consultModal && (
        <ConsultationModal
          patientId={patientId}
          consultation={editConsult}
          onSaved={onConsultSaved}
          onClose={() => { setConsultModal(false); setEditConsult(null) }}
        />
      )}
      {deletingCId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeletingCId(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-modal)' }}
            onClick={e => e.stopPropagation()}>
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Supprimer cette consultation ?</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Le diagnostic et les recommandations seront supprimés définitivement.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingCId(null)}
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
    </>
  )
}

function DrawerConsultRow({ consult, cfg, isLast, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      className="px-5 py-4 flex items-start gap-3 transition-all"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)', background: hov ? 'var(--bg-hover)' : 'transparent' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: cfg.bg }}>
        <Calendar size={14} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {format(new Date(consult.date_consultation ?? consult.date), 'd MMMM yyyy', { locale: fr })}
          </p>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
            style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        </div>
        {consult.diagnostic && (
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{consult.diagnostic}</p>
        )}
        {consult.recommandations && (
          <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-secondary)' }}>{consult.recommandations}</p>
        )}
      </div>
      {hov && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}>
            <Pencil size={12} />
          </button>
          <button onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'rgba(255,45,85,0.1)', color: '#FF2D55', border: 'none', cursor: 'pointer' }}>
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
