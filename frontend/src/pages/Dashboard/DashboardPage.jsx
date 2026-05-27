import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, differenceInDays, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ChevronRight, AlertTriangle,
  Stethoscope, MessageSquare, Users, X,
  TrendingUp, TrendingDown, Minus,
  CheckCircle2, Circle, Droplets,
  ArrowUpRight, Activity, Sparkles, Info,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import useAuthStore from '../../store/authStore'
import useAlertesStore from '../../store/alertesStore'
import { getVitascore } from '../../services/profilService'
import { getMesures, getHistorique, getCalendrier } from '../../services/mesuresService'
import { getPatients } from '../../services/medecinService'
import { getAlertes } from '../../services/alertesService'
import { getTaches } from '../../services/dashboardService'
import { getCorrelations } from '../../services/mesuresService'
import { ShieldOkIllustration, HeartECGIllustration } from '../../components/ui/HealthIllustration'
import AdviceIllustration from '../../components/ui/AdviceIllustrations'
import CalendrierRegularite from '../../components/health/CalendrierRegularite'
import VitaScoreInfoModal from '../../components/health/VitaScoreInfoModal'
import useCountUp from '../../hooks/useCountUp'
import useInView from '../../hooks/useInView'

/* ── Salutation ── */
function getGreeting(prenom) {
  const h = new Date().getHours()
  if (h >= 6  && h < 12) return `Bonjour, ${prenom}`
  if (h >= 12 && h < 18) return `Bon après-midi, ${prenom}`
  if (h >= 18 && h < 22) return `Bonsoir, ${prenom}`
  return `Bonne nuit, ${prenom}`
}

/* ── Analyse tendances ── */
function analyserTendances(mesures) {
  if (!mesures.length) return []
  const now = new Date()
  const j7  = subDays(now, 7)
  const j14 = subDays(now, 14)
  const parType = {}
  for (const m of mesures) {
    const k = m.type_mesure_id
    if (!parType[k]) parType[k] = { nom: m.nom_type, unite: m.unite, type_id: k, mesures: [] }
    parType[k].mesures.push(m)
  }
  const resultats = []
  for (const [, grp] of Object.entries(parType)) {
    if (grp.nom === 'IMC') continue
    const sorted   = [...grp.mesures].sort((a, b) => new Date(b.date_mesure) - new Date(a.date_mesure))
    const derniere = sorted[0]
    if (!derniere) continue
    const joursSince  = differenceInDays(now, new Date(derniere.date_mesure))
    const recentes    = sorted.filter(m => new Date(m.date_mesure) >= j7)
    const precedentes = sorted.filter(m => new Date(m.date_mesure) >= j14 && new Date(m.date_mesure) < j7)
    let tendance = 'stable', varPct = 0
    if (recentes.length && precedentes.length) {
      const mRec  = recentes.reduce((s, m) => s + m.valeur, 0) / recentes.length
      const mPrec = precedentes.reduce((s, m) => s + m.valeur, 0) / precedentes.length
      if (mPrec > 0) varPct = ((mRec - mPrec) / mPrec) * 100
      if (varPct > 3) tendance = 'hausse'
      else if (varPct < -3) tendance = 'baisse'
    }
    const statut = derniere.statut === 'anormal' ? 'attention' : 'normal'
    const commentaire = genererCommentaire(grp.nom, tendance, varPct, statut, joursSince, derniere.valeur)
    if (!commentaire) continue
    resultats.push({ type_id: grp.type_id, type_nom: grp.nom, type_unite: grp.unite, derniere_valeur: derniere.valeur, tendance, variation_pct: Math.round(varPct * 10) / 10, jours_depuis: joursSince, statut, commentaire })
  }
  return resultats.slice(0, 5)
}

function genererCommentaire(nom, tendance, varPct, statut, jours, valeur) {
  const n = nom.toLowerCase()
  const abs = Math.abs(Math.round(varPct * 10) / 10)
  if (jours > 3) return `Pas de ${n} depuis ${jours} jour${jours > 1 ? 's' : ''}. Une mesure régulière améliore votre VitaScore.`
  if (statut === 'attention' && tendance === 'hausse') return `Votre ${n} est en hausse (+${abs}% en 2 semaines). Consultez votre médecin.`
  if (tendance === 'stable' && statut === 'normal') return `Votre ${n} est stable depuis 2 semaines. Continuez ainsi !`
  if (tendance === 'hausse') return `Votre ${n} a augmenté de ${abs}% en 2 semaines.`
  if (tendance === 'baisse') {
    if (nom === 'Poids' || nom === 'IMC') return `Votre ${n} a baissé de ${abs}% — bonne tendance si elle est progressive.`
    if (statut === 'attention') return `Votre ${n} est en baisse (-${abs}%). Vérifiez avec votre médecin.`
    return `Votre ${n} a diminué de ${abs}%.`
  }
  if (tendance === 'stable' && statut === 'attention') return `Votre ${n} est stable mais hors zone normale. Consultez votre médecin.`
  return null
}

/* ═══════════════════════════════════════════════════════════
   COMPOSITION SYSTEM — Overlays & Focal Points
   Règle : chaque image a un focal-point déclaré.
   Règle : un seul vocabulaire d'overlay pour toutes les cards.
═══════════════════════════════════════════════════════════ */

/* Palette de base des héros */
const HERO_BASE = { patient: '#071411', medecin: '#060D1A' }

/* Overlay gauche→droite — héros cinématiques (base color → transparent) */
const overlayHeroLTR = (bg) =>
  `linear-gradient(90deg, ${bg} 0%, ${bg} 28%, ${bg}F2 44%, ${bg}88 62%, ${bg}16 82%, transparent 100%)`

/* Vignette basse — héros (renforce lisibilité du bas) */
const overlayHeroBottom = (bg) =>
  `linear-gradient(to top, ${bg}EC 0%, ${bg}44 30%, transparent 55%)`

/* Overlay lifestyle strip — gauche→droite cohérent avec la palette hero */
const OVERLAY_STRIP_LTR =
  'linear-gradient(90deg, rgba(5,13,10,0.96) 0%, rgba(5,13,10,0.86) 30%, rgba(5,13,10,0.52) 58%, rgba(5,13,10,0.10) 80%, transparent 100%)'

/* Vignette basse lifestyle strip */
const OVERLAY_STRIP_BOTTOM =
  'linear-gradient(to top, rgba(5,13,10,0.82) 0%, rgba(5,13,10,0.20) 35%, transparent 55%)'

/* Overlay bas des cards activité — structure identique, intensité calibrée */
const OVERLAY_CARD_BOTTOM =
  'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.14) 55%, transparent 100%)'

const CONSEILS = [
  { cat: 'Nutrition',   titre: 'Équilibre alimentaire',  texte: 'Privilégiez légumes, légumineuses et céréales complètes à chaque repas.',                    color: '#00D97E', img: '/illustrations/ambient/illus-patient-healthy-eating.jpeg',  fp: 'center 40%' },
  { cat: 'Hydratation', titre: 'Restez hydraté',         texte: 'Buvez au moins 1,5 L d\'eau par jour, hors café et sodas.',                                    color: '#00DDA0', img: '/illustrations/ambient/illus-patient-drinking-water.jpeg', fp: 'center 30%' },
  { cat: 'Activité',    titre: 'Bougez chaque jour',     texte: '30 min de marche quotidienne améliorent glycémie et tension artérielle.',                     color: '#FF8C42', img: '/illustrations/ambient/illus-patient-weightlifting.jpeg',   fp: 'center 25%' },
  { cat: 'Sommeil',     titre: 'Dormez suffisamment',    texte: '7 à 9 heures par nuit renforcent l\'immunité et régulent la glycémie.',                       color: '#9B77F5', img: '/illustrations/hero/illus-meditation-sunset.png',            fp: 'center 50%' },
  { cat: 'Stress',      titre: 'Gérez votre stress',     texte: '5 min de cohérence cardiaque (5s inspire / 5s expire) abaissent tension et glycémie.',  color: '#FF6B8A', img: '/illustrations/ambient/illus-zen-stones.png',                fp: 'center center' },
]

const ACTIVITES = [
  { img: '/illustrations/ambient/illus-patient-running.jpeg',    titre: 'Course',     desc: '30 min améliorent glycémie et humeur.',      color: '#00D97E', tag: 'Cardio',      fp: 'center 25%' },
  { img: '/illustrations/ambient/illus-patient-cycling.jpeg',    titre: 'Vélo',       desc: 'Cardio sans impact sur les genoux.',          color: '#FF8C42', tag: 'Endurance',   fp: 'center 28%' },
  { img: '/illustrations/ambient/illus-yoga-pose.png',           titre: 'Yoga',       desc: 'Souplesse, équilibre, apaisement.',           color: '#00DDA0', tag: 'Flexibilité', fp: 'center 18%' },
  { img: '/illustrations/ambient/illus-patient-swimming.jpeg',   titre: 'Natation',   desc: 'Activité complète, articulaires épargnées.',  color: '#9B77F5', tag: 'Complet',     fp: 'center 35%' },
  { img: '/illustrations/ambient/illus-patient-meditation.jpeg', titre: 'Méditation', desc: '5 min/j réduisent le stress et la tension.', color: '#FF6B8A', tag: 'Bien-être',   fp: 'center 22%' },
  { img: '/illustrations/ambient/illus-healthy-breakfast.png', titre: 'Nourriture', desc: 'Mangez 5 fruits et légumes par jour', color: '#FF2B8C', tag: 'Équilibre',   fp: 'center 22%' },
]

/* ══════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user }      = useAuthStore()
  const { nbNonVues } = useAlertesStore()
  const navigate      = useNavigate()
  const isMedecin     = user?.role === 'medecin'

  const [vitascore,      setVitascore]      = useState(null)
  const [mesures,        setMesures]        = useState([])
  const [alertes,        setAlertes]        = useState([])
  const [histoData,      setHistoData]      = useState([])
  const [histoLabel,     setHistoLabel]     = useState('')
  const [loading,        setLoading]        = useState(true)
  const [showVSInfo,     setShowVSInfo]     = useState(false)
  const [calendrierData, setCalendrierData] = useState(null)
  const [tendances,      setTendances]      = useState([])
  const [taches,         setTaches]         = useState([])
  const [tachesFaites,   setTachesFaites]   = useState({})
  const [correlations,   setCorrelations]   = useState([])
  const [scatterCorr,    setScatterCorr]    = useState(null)
  const [conseilIdx,     setConseilIdx]     = useState(0)

  useEffect(() => {
    if (isMedecin) { setLoading(false); return }
    Promise.all([getVitascore(), getMesures(), getAlertes(true)])
      .then(([vs, mes, al]) => {
        setVitascore(vs.data.data ?? null)
        const m = mes.data.data ?? []
        setMesures(m)
        setAlertes((al.data.data ?? []).slice(0, 5))
        setTendances(analyserTendances(m))
        if (m.length > 0) {
          const first = m[0]
          setHistoLabel(first.nom_type ?? '')
          getHistorique(first.type_mesure_id, 30)
            .then(r => {
              const pts = (r.data.data ?? []).slice().sort((a, b) => new Date(a.date_mesure) - new Date(b.date_mesure))
              setHistoData(pts.map(p => ({ date: format(new Date(p.date_mesure), 'd MMM', { locale: fr }), valeur: p.valeur })))
            }).catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    getCalendrier().then(r => setCalendrierData(r.data.data)).catch(() => {})
    getCorrelations().then(r => setCorrelations(r.data.data ?? [])).catch(() => {})
    getTaches().then(r => setTaches(r.data.data ?? [])).catch(() => {
      setTaches([
        { id: 'hydratation', label: 'Boire 1,5 L d\'eau', type_id: null },
        { id: 'activite',    label: '30 min d\'activité physique', type_id: null },
      ])
    })
  }, [isMedecin])

  if (isMedecin) return <MedecinDashboard user={user} navigate={navigate} />

  const score       = vitascore?.score ?? null
  const scoreColor  = score === null ? 'var(--ink-3)' : score >= 80 ? '#00D97E' : score >= 60 ? '#FF8C42' : '#FF4B60'
  const getLatest   = (name) => mesures.find(m => (m.nom_type ?? '').toLowerCase().includes(name.toLowerCase()))
  const statusColor = (m) => { if (!m) return 'var(--ink-3)'; if (m.statut === 'danger') return '#FF4B60'; if (m.statut === 'attention') return '#FF8C42'; return '#00D97E' }

  const histoVals  = histoData.map(d => d.valeur)
  const histoMin   = histoVals.length ? Math.min(...histoVals) : null
  const histoMax   = histoVals.length ? Math.max(...histoVals) : null
  const histoMoy   = histoVals.length ? histoVals.reduce((s, v) => s + v, 0) / histoVals.length : null
  const histoTrend = histoVals.length > 1 ? (histoVals[histoVals.length - 1] > histoVals[0] ? '↑' : histoVals[histoVals.length - 1] < histoVals[0] ? '↓' : '→') : '→'
  const histoTColor = histoTrend === '↑' ? '#00D97E' : histoTrend === '↓' ? '#FF4B60' : 'var(--ink-3)'
  const histoUnite  = mesures.find(m => (m.nom_type ?? '') === histoLabel)?.unite ?? ''

  const glycemie = getLatest('Glyc')
  const tension  = getLatest('Tension')
  const poids    = getLatest('Poids')
  const toggleTache = (id) => setTachesFaites(p => ({ ...p, [id]: !p[id] }))
  const nbFaites    = taches.filter(t => tachesFaites[t.id]).length
  const progression = taches.length ? Math.round((nbFaites / taches.length) * 100) : 0
  const glycAnorm   = mesures.some(m => (m.nom_type ?? '').includes('Glyc') && m.statut === 'anormal')
  const conseils    = glycAnorm ? [...CONSEILS.filter(c => c.cat === 'Nutrition'), ...CONSEILS.filter(c => c.cat !== 'Nutrition')] : CONSEILS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="page-enter">

      {/* ══ HERO SECTION ══ */}
      <HeroSection
        prenom={user?.prenom ?? ''}
        navigate={navigate}
        score={score}
        scoreColor={scoreColor}
        loading={loading}
        onVSInfo={() => setShowVSInfo(true)}
      />

      {/* ══ VITALS GRID ══ */}
      <div
        style={{ display: 'grid', gap: 14 }}
        className="grid-cols-1 sm:grid-cols-3 animate-fade-up delay-100"
      >
        <MetricCard
          label="Glycémie"
          value={glycemie?.valeur}
          unit={glycemie?.unite ?? 'g/L'}
          subtitle={glycemie ? format(new Date(glycemie.date_mesure), 'd MMM · HH:mm', { locale: fr }) : 'Aucune mesure'}
          color={statusColor(glycemie)}
          loading={loading}
          decimals={2}
          onClick={() => navigate('/mesures')}
        />
        <MetricCard
          label="Tension"
          value={tension?.valeur}
          unit={tension?.unite ?? 'mmHg'}
          subtitle={tension ? format(new Date(tension.date_mesure), 'd MMM · HH:mm', { locale: fr }) : 'Aucune mesure'}
          color={statusColor(tension)}
          loading={loading}
          decimals={0}
          onClick={() => navigate('/mesures')}
        />
        <MetricCard
          label="Poids"
          value={poids?.valeur}
          unit={poids?.unite ?? 'kg'}
          subtitle={poids ? format(new Date(poids.date_mesure), 'd MMM · HH:mm', { locale: fr }) : 'Aucune mesure'}
          color={statusColor(poids)}
          loading={loading}
          decimals={1}
          onClick={() => navigate('/mesures')}
        />
      </div>

      {/* ══ CHART + ALERTES ══ */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}
        className="xl:grid-cols-12 animate-fade-up delay-200"
      >
        {/* Graphique */}
        <div
          style={{
            background: 'var(--glass-card)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            borderRadius: 20,
            border: '1px solid var(--glass-border)',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}
          className="xl:col-span-8"
        >
          {/* Plasma background — "data alive" */}
          <div className="chart-plasma" style={{ position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 1 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)', margin: '0 0 4px' }}>
                Évolution 30 jours
              </p>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.5px' }}>
                {histoLabel || 'Indicateur principal'}
              </h2>
            </div>
            <button
              onClick={() => navigate('/mesures')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600, color: 'var(--accent)',
                background: 'var(--accent-dim)', border: 'none', cursor: 'pointer',
                padding: '7px 13px', borderRadius: 10,
                transition: 'all 0.18s ease',
                letterSpacing: '-0.1px',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,221,160,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
            >
              Voir tout <ArrowUpRight size={13} />
            </button>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 220, borderRadius: 12 }} />
          ) : histoData.length > 0 ? (
            <div style={{ position: 'relative', zIndex: 1 }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={histoData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#00DDA0" stopOpacity={0.32} />
                      <stop offset="90%"  stopColor="#00DDA0" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'Poppins' }} domain={['auto', 'auto']} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ stroke: 'rgba(0,221,160,0.18)', strokeWidth: 1 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div style={{
                          background: 'var(--glass-card)',
                          backdropFilter: 'blur(20px) saturate(1.8)',
                          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 12, padding: '10px 14px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.30)',
                          minWidth: 110,
                        }}>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', margin: '0 0 4px' }}>{label}</p>
                          <p style={{ fontSize: 18, fontWeight: 800, color: '#00DDA0', letterSpacing: '-0.8px', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                            {payload[0]?.value}
                            {histoUnite ? <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)', marginLeft: 3 }}>{histoUnite}</span> : ''}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone" dataKey="valeur"
                    stroke="#00DDA0" strokeWidth={2.4}
                    fill="url(#chartGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#00DDA0', strokeWidth: 2, stroke: 'rgba(0,221,160,0.28)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-0)' }}>
                {[
                  { label: 'Min',     value: histoMin?.toFixed(1),  color: '#00DDA0',        unit: histoUnite },
                  { label: 'Moyenne', value: histoMoy?.toFixed(1),  color: 'var(--ink-1)',   unit: histoUnite },
                  { label: 'Max',     value: histoMax?.toFixed(1),  color: '#FF8C42',        unit: histoUnite },
                  { label: 'Tendance',value: histoTrend,             color: histoTColor,      unit: '' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', margin: '0 0 5px' }}>{s.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: s.color, letterSpacing: '-0.8px', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {s.value}
                      {s.unit ? <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-3)' }}> {s.unit}</span> : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '32px 0', position: 'relative', zIndex: 1 }}>
              <HeartECGIllustration size={72} color="var(--accent)" animated />
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0, fontWeight: 500 }}>Aucune donnée disponible</p>
              <button
                onClick={() => navigate('/mesures')}
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 10 }}
              >
                Ajouter une mesure →
              </button>
            </div>
          )}
        </div>

        {/* Panel droit — Alertes */}
        <div
          style={{
            background: 'var(--glass-card)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            borderRadius: 20,
            border: '1px solid var(--glass-border)',
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
          }}
          className="xl:col-span-4"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)', margin: '0 0 3px' }}>Santé</p>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.5px' }}>Alertes</h2>
            </div>
            {nbNonVues > 0 && (
              <span className="badge-pulse" style={{
                background: '#FF4B60', color: 'white',
                fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
              }}>
                {nbNonVues}
              </span>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {loading
              ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />)
              : alertes.length === 0
                ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '24px 0' }}>
                    <ShieldOkIllustration size={60} color="#00D97E" />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#00D97E', margin: 0 }}>Tout va bien</p>
                    <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>Aucune alerte active</p>
                  </div>
                )
                : alertes.slice(0, 4).map(a => <AlertCard key={a.id} alerte={a} />)
            }
          </div>

          <button
            onClick={() => navigate('/alertes')}
            style={{
              marginTop: 14, width: '100%', padding: '11px',
              borderRadius: 12, background: 'var(--surface-2)',
              border: '1px solid var(--border-1)', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: 'var(--accent)',
              transition: 'all 0.18s ease',
              letterSpacing: '-0.1px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border-1)' }}
          >
            Voir toutes les alertes
          </button>
        </div>
      </div>

      {/* ══ CALENDRIER + TÂCHES ══ */}
      {(!loading && calendrierData) || taches.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="md:grid-cols-12 animate-fade-up delay-300">
          {!loading && calendrierData && (
            <div
              style={{
                background: 'var(--glass-card)',
                backdropFilter: 'blur(24px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                borderRadius: 20,
                border: '1px solid var(--glass-border)',
                padding: '18px 20px',
                overflow: 'hidden',
              }}
              className="md:col-span-5"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)', margin: '0 0 3px' }}>Habitudes</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.4px' }}>Régularité</p>
                </div>
                <button
                  onClick={() => navigate('/mesures/calendrier')}
                  style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  Calendrier <ChevronRight size={11} />
                </button>
              </div>

              {/* Stats — série + ce mois */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 16, alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)', margin: '0 0 3px' }}>Série</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)', margin: 0, letterSpacing: '-1.5px', lineHeight: 1 }}>
                    {calendrierData?.streak ?? calendrierData?.jours_consecutifs ?? 0}
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginLeft: 2 }}>j</span>
                  </p>
                </div>
                <div style={{ width: 1, height: 36, background: 'var(--border-0)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)', margin: '0 0 3px' }}>Ce mois</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink-1)', margin: 0, letterSpacing: '-1.5px', lineHeight: 1 }}>
                    {calendrierData?.nb_actifs ?? calendrierData?.actifs ?? calendrierData?.total ?? 0}
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginLeft: 1 }}>/{calendrierData?.nb_jours ?? 30}</span>
                  </p>
                </div>
              </div>

              <CalendrierRegularite data={calendrierData} compact />
            </div>
          )}

          {taches.length > 0 && (
            <div
              style={{
                background: 'var(--glass-card)',
                backdropFilter: 'blur(24px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                borderRadius: 20,
                border: '1px solid var(--glass-border)',
                overflow: 'hidden',
              }}
              className={`md:col-span-${calendrierData ? '7' : '12'}`}
            >
              <div style={{ height: 3, background: 'var(--surface-2)' }}>
                <div style={{ height: '100%', background: 'var(--gradient-accent)', width: `${progression}%`, borderRadius: 99, transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
              </div>
              <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border-0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)', margin: '0 0 3px' }}>Aujourd'hui</p>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.5px' }}>À faire</h2>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700 }}>{nbFaites}/{taches.length}</span>
                </div>
              </div>
              <div>
                {taches.map((t, idx) => {
                  const done = !!tachesFaites[t.id]
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 22px',
                      borderBottom: idx < taches.length - 1 ? '1px solid var(--border-0)' : 'none',
                      background: done ? 'rgba(0,217,126,0.03)' : 'transparent',
                      transition: 'background 0.2s ease',
                    }}>
                      <button
                        onClick={() => toggleTache(t.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: done ? '#00D97E' : 'var(--ink-3)', padding: 0, transition: 'color 0.2s ease', flexShrink: 0 }}
                      >
                        {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                      <p style={{ flex: 1, fontSize: 13, fontWeight: 500, color: done ? 'var(--ink-3)' : 'var(--ink-1)', textDecoration: done ? 'line-through' : 'none', margin: 0, transition: 'all 0.2s', letterSpacing: '-0.1px' }}>
                        {t.label}
                      </p>
                      {!done && t.type_id && (
                        <button onClick={() => navigate('/mesures')} style={{ padding: '5px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
                          Saisir
                        </button>
                      )}
                      {!done && !t.type_id && <Droplets size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* ══ TENDANCES ══ */}
      {!loading && tendances.length > 0 && (
        <div className="animate-fade-up delay-400">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)', margin: '0 0 3px' }}>Analyse</p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.6px' }}>Tendances</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12 }} className="sm:grid-cols-2 xl:grid-cols-3">
            {tendances.map((t, i) => (
              <TendanceCard key={t.type_id} tendance={t} delay={i * 60} navigate={navigate} />
            ))}
          </div>
        </div>
      )}

      {/* ══ LIFESTYLE STRIP — Art direction cinématique ══ */}
      <div
        className="animate-fade-up delay-500"
        style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', height: 580, flexShrink: 0 }}
      >
        {/* Illustration — focal point déclaré par conseil */}
        <img
          key={conseilIdx}
          src={conseils[conseilIdx].img}
          alt="" aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: conseils[conseilIdx].fp }}
        />
        {/* Overlay LTR — vocabulaire unifié strip */}
        <div style={{ position: 'absolute', inset: 0, background: OVERLAY_STRIP_LTR, pointerEvents: 'none' }} />
        {/* Vignette basse */}
        <div style={{ position: 'absolute', inset: 0, background: OVERLAY_STRIP_BOTTOM, pointerEvents: 'none' }} />
        {/* Barre couleur gauche */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: conseils[conseilIdx].color, transition: 'background 0.4s ease' }} />

        {/* Contenu */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, padding: '28px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', maxWidth: 560 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: conseils[conseilIdx].color, margin: '0 0 10px', transition: 'color 0.4s ease' }}>
              {conseils[conseilIdx].cat}
            </p>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', letterSpacing: '-1px', margin: '0 0 8px', lineHeight: 1.15 }}>
              {conseils[conseilIdx].titre}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 1.65, letterSpacing: '-0.1px', maxWidth: 380 }}>
              {conseils[conseilIdx].texte}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {conseils.map((c, i) => (
              <button key={i} onClick={() => setConseilIdx(i)} style={{
                width: i === conseilIdx ? 22 : 6, height: 6, borderRadius: 99,
                background: i === conseilIdx ? conseils[conseilIdx].color : 'rgba(255,255,255,0.28)',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0,
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ══ ACTIVITÉS — grille 5 col, illustrations dispersées ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} className="sm:grid-cols-5 animate-fade-up delay-500">
        {ACTIVITES.map((a, i) => (
          <div key={i} style={{ position: 'relative', height: 360, borderRadius: 18, overflow: 'hidden', cursor: 'pointer' }} className={`hover-lift${i === ACTIVITES.length - 1 && ACTIVITES.length % 2 !== 0 ? ' col-span-2 sm:col-span-1' : ''}`}>
            {/* Focal point déclaré par activité */}
            <img src={a.img} alt={a.titre} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: a.fp }} />
            {/* Overlay unifié — même vocabulaire que les autres cards */}
            <div style={{ position: 'absolute', inset: 0, background: OVERLAY_CARD_BOTTOM, pointerEvents: 'none' }} />
            {/* Safe zone texte — padding 16px latéral minimum */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px' }}>
              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, background: `${a.color}28`, color: a.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.3px', marginBottom: 5 }}>{a.tag}</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 2px', letterSpacing: '-0.3px' }}>{a.titre}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.4 }}>{a.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ══ MESURES RÉCENTES ══ */}
      <div
        style={{
          background: 'var(--glass-card)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
          borderRadius: 20,
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
        }}
        className="animate-fade-up delay-600"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-0)' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)', margin: '0 0 3px' }}>Historique</p>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.5px' }}>Mesures récentes</h2>
          </div>
          <button onClick={() => navigate('/mesures')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Tout voir <ChevronRight size={13} />
          </button>
        </div>
        <div style={{ padding: '8px 12px' }}>
          {loading
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 12 }} />)}</div>
            : mesures.length === 0
              ? <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 8px' }}>Aucune mesure enregistrée.</p>
                  <button onClick={() => navigate('/mesures')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Ajouter votre première mesure →
                  </button>
                </div>
              : mesures.slice(0, 6).map((m, i) => <MesureRow key={m.id} mesure={m} delay={i * 50} />)
          }
        </div>
      </div>

      {/* Modals */}
      {showVSInfo && <VitaScoreInfoModal score={score} onClose={() => setShowVSInfo(false)} />}
      {scatterCorr && <ScatterModal corr={scatterCorr} onClose={() => setScatterCorr(null)} />}
    </div>
  )
}

/* ══ HERO PARTICLES — Bulles flottantes + ondulations ══ */
function HeroParticles({ color = '#00DDA0' }) {
  const bubbles = [
    { left: '6%',  top: '82%', size: 5,  delay: 0,    dur: 6.5 },
    { left: '13%', top: '70%', size: 9,  delay: 1.4,  dur: 8 },
    { left: '4%',  top: '74%', size: 4,  delay: 2.8,  dur: 5.8 },
    { left: '19%', top: '84%', size: 6,  delay: 0.6,  dur: 7.5 },
    { left: '10%', top: '60%', size: 11, delay: 2.0,  dur: 9.5 },
    { left: '27%', top: '76%', size: 3,  delay: 3.6,  dur: 6.2 },
    { left: '16%', top: '88%', size: 7,  delay: 0.3,  dur: 7.2 },
    { left: '8%',  top: '64%', size: 5,  delay: 4.3,  dur: 6.8 },
    { left: '23%', top: '67%', size: 4,  delay: 2.4,  dur: 8.8 },
  ]
  const ripples = [
    { left: '10%', top: '76%', delay: 0,   dur: 5,   size: 18 },
    { left: '21%', top: '63%', delay: 2.1, dur: 5.5, size: 22 },
    { left: '7%',  top: '54%', delay: 3.8, dur: 4.5, size: 14 },
  ]
  const sparkles = [
    { left: '15%', top: '55%', delay: 1.0, dur: 2.8, size: 4 },
    { left: '25%', top: '80%', delay: 2.6, dur: 3.2, size: 3 },
    { left: '5%',  top: '66%', delay: 0.5, dur: 2.5, size: 5 },
    { left: '30%', top: '70%', delay: 3.3, dur: 3.0, size: 3 },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
      {bubbles.map((b, i) => (
        <div key={i} style={{
          position: 'absolute', left: b.left, top: b.top,
          width: b.size, height: b.size, borderRadius: '50%',
          background: color, opacity: 0,
          animation: `heroBubble ${b.dur}s ease-in-out ${b.delay}s infinite`,
        }} />
      ))}
      {ripples.map((r, i) => (
        <div key={`r${i}`} style={{
          position: 'absolute', left: r.left, top: r.top,
          width: r.size, height: r.size, borderRadius: '50%',
          border: `1.5px solid ${color}`, opacity: 0,
          animation: `heroRipple ${r.dur}s ease-out ${r.delay}s infinite`,
        }} />
      ))}
      {sparkles.map((s, i) => (
        <div key={`s${i}`} style={{
          position: 'absolute', left: s.left, top: s.top,
          width: s.size, height: s.size, borderRadius: '50%',
          background: color, opacity: 0,
          boxShadow: `0 0 ${s.size * 2}px ${color}`,
          animation: `heroSparkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
    </div>
  )
}

/* ══ HERO SECTION — Dark cinematic, position absolute ══ */
function HeroSection({ prenom, navigate, score, scoreColor, loading, onVSInfo }) {
  const now      = new Date()
  const dateStr  = format(now, 'EEEE d MMMM', { locale: fr })
  const dateDisp = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  const R        = 44
  const C        = 2 * Math.PI * R
  const [dash, setDash]    = useState(0)
  const [pulsed, setPulsed] = useState(false)
  const displayed           = useCountUp(score, 1800)

  useEffect(() => {
    if (score == null) return
    const t = setTimeout(() => {
      setDash((score / 100) * C)
      const t2 = setTimeout(() => setPulsed(true), 900)
      return () => clearTimeout(t2)
    }, 400)
    return () => clearTimeout(t)
  }, [score, C])

  const scoreLabel = score === null ? '—' : score >= 80 ? 'Excellent' : score >= 60 ? 'Correct' : 'À améliorer'

  return (
    <div className="animate-fade-up" style={{
      position: 'relative',
      borderRadius: 24, overflow: 'hidden', height: 500,
      background: '#071411',
      border: '1px solid rgba(0,221,160,0.12)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
    }}>

      {/* Photo full-bleed — focal point: visage/épaules haut du cadre */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <img
          src="/illustrations/artwork/family-health.jpg"
          alt="" aria-hidden
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
        />
      </div>

      {/* Overlay LTR — vocabulaire unifié hero */}
      <div style={{ position: 'absolute', inset: 0, background: overlayHeroLTR(HERO_BASE.patient), pointerEvents: 'none' }} />
      {/* Vignette basse */}
      <div style={{ position: 'absolute', inset: 0, background: overlayHeroBottom(HERO_BASE.patient), pointerEvents: 'none' }} />

      {/* Orbes de couleur ambiante */}
      <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: scoreColor, opacity: 0.14, filter: 'blur(80px)', pointerEvents: 'none', transition: 'background 0.8s ease' }} />
      <div style={{ position: 'absolute', bottom: -50, left: '20%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(155,119,245,0.10)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Particules animées — bulles + ondulations */}
      <HeroParticles color="rgba(0,221,160,0.7)" />

      {/* Contenu principal */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '28px 36px',
      }}>
        {/* Haut — date + titre */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(232,245,240,0.45)', letterSpacing: '0.3px' }}>
              {dateDisp}
            </span>
          </div>
          <h1 style={{
            fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-2.5px',
            margin: 0, lineHeight: 1.05,
            color: '#E8F5F0',
          }}>
            {getGreeting(prenom)}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(232,245,240,0.42)', margin: '7px 0 0', letterSpacing: '-0.1px' }}>
            Votre bilan santé du jour
          </p>
        </div>

        {/* Bas — VitaScore + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, flexWrap: 'wrap' }}>

          {/* Ring VitaScore */}
          <div
            className={pulsed ? 'vita-ring-pulse' : ''}
            onClick={onVSInfo}
            title="Comprendre le VitaScore"
            style={{ position: 'relative', width: 116, height: 116, flexShrink: 0, cursor: 'pointer' }}
          >
            {loading ? (
              <div style={{ width: 116, height: 116, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', animation: 'skeleton-shimmer 1.7s ease-in-out infinite' }} />
            ) : (
              <>
                {/* Glow orb — doux, pas de drop-shadow SVG */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 72, height: 72, borderRadius: '50%',
                  background: scoreColor, opacity: 0.22,
                  filter: 'blur(18px)',
                  transition: 'background 0.8s ease',
                  pointerEvents: 'none',
                }} />
                <svg width="116" height="116" viewBox="0 0 116 116" style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}>
                  <circle cx="58" cy="58" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                  <circle
                    cx="58" cy="58" r={R} fill="none"
                    stroke={scoreColor} strokeWidth="8"
                    strokeDasharray={`${dash} ${C}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 2s cubic-bezier(0.22,1,0.36,1)' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1, zIndex: 2 }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: '#E8F5F0', letterSpacing: '-2px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {score !== null ? Math.round(displayed) : '—'}
                  </span>
                  <span style={{ fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(232,245,240,0.38)' }}>
                    VitaScore
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Score label + boutons CTA */}
          <div style={{ flex: 1, minWidth: 160, paddingBottom: 2 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: 'rgba(232,245,240,0.40)', margin: '0 0 4px' }}>
              Indice global de santé
            </p>
            <p style={{ fontSize: 23, fontWeight: 800, color: loading ? 'rgba(232,245,240,0.35)' : scoreColor, letterSpacing: '-1.2px', margin: '0 0 16px', lineHeight: 1, transition: 'color 0.5s ease' }}>
              {loading ? '…' : scoreLabel}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Saisir une mesure', to: '/mesures',   accent: true },
                { label: 'Assistant IA',       to: '/assistant', accent: false },
                { label: 'Messages',           to: '/messages',  accent: false },
              ].map(({ label, to, accent }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  style={{
                    padding: '8px 15px', borderRadius: 11,
                    background: accent ? 'var(--gradient-accent)' : 'rgba(255,255,255,0.08)',
                    backdropFilter: accent ? 'none' : 'blur(10px)',
                    WebkitBackdropFilter: accent ? 'none' : 'blur(10px)',
                    border: accent ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    color: accent ? 'white' : 'rgba(232,245,240,0.80)',
                    transition: 'all 0.18s ease',
                    boxShadow: accent ? '0 3px 16px rgba(0,221,160,0.35)' : 'none',
                    letterSpacing: '-0.1px',
                  }}
                  onMouseEnter={e => {
                    if (!accent) { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#E8F5F0' }
                    else e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,221,160,0.50)'
                  }}
                  onMouseLeave={e => {
                    if (!accent) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(232,245,240,0.80)' }
                    else e.currentTarget.style.boxShadow = '0 3px 16px rgba(0,221,160,0.35)'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Badge flottant — ancré en bas à droite, toujours aligné indépendamment du flex wrap */}
        {score !== null && !loading && (
          <div style={{
            position: 'absolute', bottom: 28, right: 36,
            padding: '9px 15px', borderRadius: 14,
            background: 'rgba(7,20,17,0.72)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: scoreColor, boxShadow: `0 0 12px ${scoreColor}` }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.86)' }}>
              {score}/100
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══ METRIC CARD ══ */
function MetricCard({ label, value, unit, subtitle, color, loading, decimals = 1, onClick }) {
  const displayed = useCountUp(value ?? null, 1500, decimals)

  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(145deg, ${color}0D 0%, var(--glass-card) 55%)`,
        backdropFilter: 'blur(24px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
        borderRadius: 20,
        border: `1px solid ${color}1C`,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.25s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.25s ease, border-color 0.25s ease',
      }}
      onMouseEnter={e => {
        if (!onClick) return
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 28px ${color}22`
        e.currentTarget.style.borderColor = `${color}44`
      }}
      onMouseLeave={e => {
        if (!onClick) return
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = `${color}22`
      }}
    >
      {/* Left accent border */}
      <div style={{ position: 'absolute', top: '15%', left: 0, width: 3, height: '70%', background: `${color}`, borderRadius: '0 3px 3px 0', boxShadow: `0 0 12px ${color}60` }} />
      {/* Status dot */}
      <div style={{ position: 'absolute', top: 18, right: 18, width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}90` }} />

      <div style={{ paddingTop: 4, paddingLeft: 8 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: 'var(--ink-3)', margin: '0 0 10px' }}>
          {label}
        </p>
        {loading ? (
          <div className="skeleton" style={{ height: 44, width: '75%', borderRadius: 8 }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 8 }}>
            <span className="ghost-number" style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-3px', color: 'var(--ink-1)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {value != null ? (decimals > 0 ? displayed.toFixed(decimals) : Math.round(displayed)) : '—'}
            </span>
            {value != null && <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>{unit}</span>}
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0, lineHeight: 1.4, letterSpacing: '-0.1px' }}>{subtitle}</p>
      </div>
    </div>
  )
}

/* ══ ALERTE CARD ══ */
function AlertCard({ alerte }) {
  const sev = alerte.niveau_severite ?? alerte.severite ?? 'info'
  const colors = {
    danger:  { bg: 'rgba(255,75,96,0.08)',  border: 'rgba(255,75,96,0.20)',  text: '#FF4B60', icon: '#FF4B60' },
    warning: { bg: 'rgba(255,140,66,0.08)', border: 'rgba(255,140,66,0.20)', text: '#FF8C42', icon: '#FF8C42' },
    info:    { bg: 'var(--accent-dim)',      border: 'var(--border-2)',        text: 'var(--accent)', icon: 'var(--accent)' },
  }
  const c = colors[sev] ?? colors.info

  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 14,
      background: c.bg,
      border: `1px solid ${c.border}`,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <AlertTriangle size={14} color={c.icon} style={{ marginTop: 1, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.1px' }}>
          {alerte.titre ?? alerte.message ?? 'Alerte'}
        </p>
        {alerte.valeur != null && (
          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>
            Valeur : <span style={{ color: c.text, fontWeight: 600 }}>{alerte.valeur} {alerte.unite ?? ''}</span>
          </p>
        )}
      </div>
    </div>
  )
}

/* ══ TENDANCE CARD ══ */
function TendanceCard({ tendance, delay, navigate }) {
  const [ref, inView] = useInView(0.1)

  const badgeColor =
    tendance.tendance === 'hausse'
      ? (tendance.statut === 'normal' ? '#00DDA0' : '#FF4B60')
      : tendance.tendance === 'baisse'
        ? ((tendance.type_nom === 'Poids' || tendance.type_nom === 'IMC') ? '#00D97E' : '#FF8C42')
        : (tendance.statut === 'normal' ? '#00D97E' : '#FF8C42')

  const TrendIcon = tendance.tendance === 'hausse' ? TrendingUp : tendance.tendance === 'baisse' ? TrendingDown : Minus

  return (
    <div
      ref={ref}
      style={{
        background: 'var(--glass-card)',
        backdropFilter: 'blur(24px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
        borderRadius: 18,
        border: '1px solid var(--glass-border)',
        padding: '18px 20px',
        transform: inView ? 'translateX(0)' : 'translateX(28px)',
        opacity: inView ? 1 : 0,
        transition: `transform 0.45s ease ${delay}ms, opacity 0.45s ease ${delay}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', letterSpacing: '-0.2px' }}>
          {tendance.type_nom}
        </span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 3,
          padding: '3px 9px', borderRadius: 99,
          fontSize: 10, fontWeight: 700,
          background: `${badgeColor}15`, color: badgeColor, flexShrink: 0,
        }}>
          <TrendIcon size={10} />
          {tendance.variation_pct !== 0 ? ` ${Math.abs(tendance.variation_pct)}%` : ' stable'}
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px', lineHeight: 1.6, letterSpacing: '-0.1px' }}>
        {tendance.commentaire}
      </p>
      <button
        onClick={() => navigate('/mesures')}
        style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}
      >
        Voir le détail <ChevronRight size={11} />
      </button>
    </div>
  )
}


/* ══ MESURE ROW ══ */
function MesureRow({ mesure, delay }) {
  const [ref, inView] = useInView(0.05)
  const sc = mesure.statut === 'danger' ? '#FF4B60' : mesure.statut === 'attention' ? '#FF8C42' : '#00D97E'

  return (
    <div ref={ref} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 10px',
      borderRadius: 12,
      transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms, background 0.15s ease`,
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateX(0)' : 'translateX(-12px)',
      cursor: 'pointer',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, flexShrink: 0, boxShadow: `0 0 8px ${sc}80` }} />
      <p style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: 'var(--ink-1)', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', letterSpacing: '-0.2px' }}>
        {mesure.nom_type}
      </p>
      <span style={{ fontSize: 16, fontWeight: 800, color: sc, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.8px', flexShrink: 0 }}>
        {typeof mesure.valeur === 'number' ? mesure.valeur.toFixed(mesure.valeur % 1 === 0 ? 0 : 1) : mesure.valeur}
        <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-3)', marginLeft: 3 }}>{mesure.unite}</span>
      </span>
      <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0, flexShrink: 0, minWidth: 80, textAlign: 'right', letterSpacing: '-0.1px' }}>
        {format(new Date(mesure.date_mesure), 'd MMM · HH:mm', { locale: fr })}
      </p>
    </div>
  )
}

/* ══ SCATTER MODAL ══ */
function ScatterModal({ corr, onClose }) {
  if (!corr) return null
  const data = (corr.points ?? []).map(p => ({ x: p.x, y: p.y }))
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface-1)', borderRadius: 24, border: '1px solid var(--border-1)', padding: 28, maxWidth: 540, width: '100%', boxShadow: 'var(--shadow-xl)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ink-1)' }}>
            {corr.type1_nom} × {corr.type2_nom}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--ink-1)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}>
            <X size={18} />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart>
            <CartesianGrid stroke="var(--border-0)" />
            <XAxis dataKey="x" name={corr.type1_nom} tick={{ fontSize: 10, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="y" name={corr.type2_nom} tick={{ fontSize: 10, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} />
            <ZAxis range={[30, 30]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 10, fontSize: 12 }} />
            <Scatter data={data} fill="var(--accent)" fillOpacity={0.75} />
          </ScatterChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '16px 0 0', textAlign: 'center' }}>
          Coefficient r = <strong style={{ color: 'var(--accent)' }}>{corr.coefficient?.toFixed(2) ?? '?'}</strong>
        </p>
      </div>
    </div>
  )
}

/* ══ MEDECIN DASHBOARD ══ */
function MedecinDashboard({ user, navigate }) {
  const [stats,   setStats]   = useState(null)
  const [alertes, setAlertes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      getPatients(),
      getAlertes(true),
    ]).then(([ptsRes, alRes]) => {
      const patients     = ptsRes.status === 'fulfilled' ? (ptsRes.value.data?.data ?? []) : []
      const alertesList  = alRes.status  === 'fulfilled' ? (alRes.value.data?.data  ?? []) : []
      const critiques    = patients.filter(p => p.vitascore?.score < 40 || alertesList.some(a => a.patient_id === p.id && a.severite === 'danger'))
      const surveillance = patients.filter(p => p.vitascore?.score >= 40 && p.vitascore?.score < 65)
      const scoreMoy     = patients.length ? Math.round(patients.reduce((s, p) => s + (p.vitascore?.score ?? 0), 0) / patients.length) : null
      setStats({ total: patients.length, critiques: critiques.length, surveillance: surveillance.length, scoreMoy, patients })
      setAlertes(alertesList.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  const now     = new Date()
  const dateStr = format(now, 'EEEE d MMMM', { locale: fr })
  const dateDisp = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  const kpis = [
    { label: 'Patients suivis',    value: stats?.total,       color: '#00DDA0', icon: Users },
    { label: 'En situation critique', value: stats?.critiques,  color: '#FF4B60', icon: AlertTriangle },
    { label: 'Sous surveillance',  value: stats?.surveillance, color: '#FF8C42', icon: Activity },
    { label: 'VitaScore moyen',    value: stats?.scoreMoy,    color: '#9B77F5', icon: TrendingUp, suffix: '/100' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="page-enter">

      {/* Hero — cinématique médecin */}
      <div className="animate-fade-up" style={{
        position: 'relative',
        borderRadius: 24, overflow: 'hidden', height: 500,
        background: '#060D1A',
        border: '1px solid rgba(77,170,255,0.12)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
      }}>

        {/* Photo full-bleed — focal point: médecin + tablette visibles haut */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img
            src="/illustrations/hero/medecins.jpg"
            alt="" aria-hidden
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
          />
        </div>

        {/* Overlay LTR — vocabulaire unifié hero */}
        <div style={{ position: 'absolute', inset: 0, background: overlayHeroLTR(HERO_BASE.medecin), pointerEvents: 'none' }} />
        {/* Vignette basse */}
        <div style={{ position: 'absolute', inset: 0, background: overlayHeroBottom(HERO_BASE.medecin), pointerEvents: 'none' }} />

        {/* Orbes ambiants */}
        <div style={{ position: 'absolute', top: -80, left: -80, width: 280, height: 280, borderRadius: '50%', background: '#4DAAFF', opacity: 0.12, filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '22%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,221,160,0.08)', filter: 'blur(55px)', pointerEvents: 'none' }} />

        {/* Particules animées — bulles + ondulations (teinte bleue médecin) */}
        <HeroParticles color="rgba(77,170,255,0.65)" />

        {/* Contenu principal */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '28px 36px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <div className="live-dot" />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(220,240,255,0.45)', letterSpacing: '0.3px' }}>{dateDisp}</span>
            </div>
            <h1 style={{
              fontSize: '2rem', fontWeight: 800, letterSpacing: '-2px',
              margin: '0 0 5px', lineHeight: 1.08,
              color: '#DCF0FF',
            }}>
              Bonjour, Dr. {user?.prenom}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(220,240,255,0.42)', margin: 0, letterSpacing: '-0.1px' }}>
              Tableau de bord · {stats?.total ?? '…'} patient{(stats?.total ?? 0) > 1 ? 's' : ''} suivis
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Mes patients', to: '/medecin',   accent: true },
                { label: 'Messagerie',   to: '/messages',  accent: false },
                { label: 'Demandes',     to: '/relations', accent: false },
              ].map(({ label, to, accent }) => (
                <button key={to} onClick={() => navigate(to)} style={{
                  padding: '8px 14px', borderRadius: 11,
                  background: accent ? 'var(--gradient-accent)' : 'rgba(255,255,255,0.08)',
                  backdropFilter: accent ? 'none' : 'blur(10px)',
                  WebkitBackdropFilter: accent ? 'none' : 'blur(10px)',
                  border: accent ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  color: accent ? 'white' : 'rgba(220,240,255,0.80)',
                  transition: 'all 0.18s ease',
                  boxShadow: accent ? '0 3px 14px rgba(0,221,160,0.28)' : 'none',
                  letterSpacing: '-0.1px',
                }}
                  onMouseEnter={e => {
                    if (!accent) { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#DCF0FF' }
                    else e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,221,160,0.42)'
                  }}
                  onMouseLeave={e => {
                    if (!accent) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(220,240,255,0.80)' }
                    else e.currentTarget.style.boxShadow = '0 3px 14px rgba(0,221,160,0.28)'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {stats?.critiques > 0 && (
              <div style={{
                padding: '9px 15px', borderRadius: 14,
                background: 'rgba(6,13,26,0.72)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,75,96,0.22)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF4B60', boxShadow: '0 0 10px #FF4B60' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
                  {stats.critiques} situation{stats.critiques > 1 ? 's' : ''} critique{stats.critiques > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} className="sm:grid-cols-4 animate-fade-up delay-100">
        {kpis.map(({ label, value, color, icon: Icon, suffix }) => (
          <div key={label} style={{ background: `linear-gradient(145deg, ${color}0F 0%, var(--surface-1) 55%)`, borderRadius: 20, border: `1px solid ${color}22`, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}70, transparent)`, borderRadius: '20px 20px 0 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: 'var(--ink-3)', margin: 0 }}>{label}</p>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color={color} />
              </div>
            </div>
            {loading ? <div className="skeleton" style={{ height: 36, width: '60%', borderRadius: 8 }} /> : (
              <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-2px', margin: 0, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {value ?? '—'}
                {suffix && value != null && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-3)' }}>{suffix}</span>}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Alertes critiques */}
      {alertes.length > 0 && (
        <div style={{ background: 'var(--glass-card)', backdropFilter: 'blur(24px) saturate(1.8)', WebkitBackdropFilter: 'blur(24px) saturate(1.8)', borderRadius: 20, border: '1px solid var(--glass-border)', overflow: 'hidden' }} className="animate-fade-up delay-200">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)', margin: '0 0 3px' }}>Priorité</p>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.5px' }}>Alertes critiques</h2>
            </div>
            <button onClick={() => navigate('/medecin/alertes')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: 'none', cursor: 'pointer', padding: '7px 13px', borderRadius: 10 }}>
              Voir tout
            </button>
          </div>
          <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alertes.map(a => <AlertCard key={a.id} alerte={a} />)}
          </div>
        </div>
      )}
    </div>
  )
}
