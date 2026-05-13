import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, differenceInDays, subDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ChevronRight, AlertTriangle,
  Stethoscope, MessageSquare, Users, X,
  TrendingUp, TrendingDown, Minus,
  ChevronLeft, CheckCircle2, Circle, Droplets,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
} from 'recharts'
import useAuthStore from '../../store/authStore'
import useAlertesStore from '../../store/alertesStore'
import { getVitascore } from '../../services/profilService'
import { getMesures, getHistorique } from '../../services/mesuresService'
import { getAlertes } from '../../services/alertesService'
import { getTaches } from '../../services/dashboardService'
import { getCorrelations } from '../../services/mesuresService'
import { ShieldOkIllustration, HeartECGIllustration } from '../../components/ui/HealthIllustration'
import AdviceIllustration from '../../components/ui/AdviceIllustrations'
import Illustration from '../../components/ui/Illustration'
import CalendrierRegularite from '../../components/health/CalendrierRegularite'
import VitaScoreInfoModal from '../../components/health/VitaScoreInfoModal'
import useCountUp from '../../hooks/useCountUp'
import useInView from '../../hooks/useInView'

/* ─── Salutation heure ─────────────────────────────── */
function getGreeting(prenom) {
  const h = new Date().getHours()
  if (h >= 6  && h < 12) return `Bonjour ${prenom} ☀️ Comment vous sentez-vous ce matin ?`
  if (h >= 12 && h < 18) return `Bon après-midi ${prenom} 🌤️ Pensez à vous hydrater !`
  if (h >= 18 && h < 22) return `Bonsoir ${prenom} 🌙 N'oubliez pas votre mesure du soir.`
  return `Bonne nuit ${prenom} 💤 Reposez-vous bien.`
}

/* ─── Analyse de tendances côté client ────────────── */
function analyserTendances(mesures) {
  if (!mesures.length) return []

  const now   = new Date()
  const j7    = subDays(now, 7)
  const j14   = subDays(now, 14)

  // Grouper par type
  const parType = {}
  for (const m of mesures) {
    const k = m.type_mesure_id
    if (!parType[k]) parType[k] = { nom: m.nom_type, unite: m.unite, type_id: k, mesures: [] }
    parType[k].mesures.push(m)
  }

  const resultats = []

  for (const [, grp] of Object.entries(parType)) {
    if (grp.nom === 'IMC') continue  // dérivé auto

    const sorted  = [...grp.mesures].sort((a, b) => new Date(b.date_mesure) - new Date(a.date_mesure))
    const derniere = sorted[0]
    if (!derniere) continue

    const joursSince = differenceInDays(now, new Date(derniere.date_mesure))

    const recentes   = sorted.filter(m => new Date(m.date_mesure) >= j7)
    const precedentes = sorted.filter(m => new Date(m.date_mesure) >= j14 && new Date(m.date_mesure) < j7)

    let tendance = 'stable'
    let varPct   = 0

    if (recentes.length && precedentes.length) {
      const mRec  = recentes.reduce((s, m) => s + m.valeur, 0)   / recentes.length
      const mPrec = precedentes.reduce((s, m) => s + m.valeur, 0) / precedentes.length
      if (mPrec > 0) varPct = ((mRec - mPrec) / mPrec) * 100
      if      (varPct >  3) tendance = 'hausse'
      else if (varPct < -3) tendance = 'baisse'
    }

    const statut = derniere.statut === 'anormal' ? 'attention' : 'normal'
    const commentaire = genererCommentaire(grp.nom, tendance, varPct, statut, joursSince, derniere.valeur)
    if (!commentaire) continue

    resultats.push({
      type_id:        grp.type_id,
      type_nom:       grp.nom,
      type_unite:     grp.unite,
      derniere_valeur: derniere.valeur,
      tendance,
      variation_pct:  Math.round(varPct * 10) / 10,
      jours_depuis:   joursSince,
      statut,
      commentaire,
    })
  }

  return resultats.slice(0, 5)
}

function genererCommentaire(nom, tendance, varPct, statut, jours, valeur) {
  const n   = nom.toLowerCase()
  const abs = Math.abs(Math.round(varPct * 10) / 10)

  if (jours > 3)
    return `📋 Vous n'avez pas enregistré de ${n} depuis ${jours} jour${jours > 1 ? 's' : ''}. Une mesure régulière améliore la précision de votre VitaScore.`

  if (statut === 'attention' && tendance === 'hausse')
    return `⚠️ Votre ${n} montre une tendance à la hausse (+${abs}% en 2 semaines). Consultez votre médecin.`

  if (tendance === 'stable' && statut === 'normal')
    return `✅ Votre ${n} est stable depuis 2 semaines. Continuez ainsi !`

  if (tendance === 'hausse') {
    if (nom === 'Poids' || nom === 'IMC')
      return `📈 Votre ${n} a augmenté de ${abs}% ce mois-ci. Tendance à surveiller.`
    return `📈 Votre ${n} a augmenté de ${abs}% en 2 semaines.`
  }

  if (tendance === 'baisse') {
    if (nom === 'Poids' || nom === 'IMC')
      return `📉 Votre ${n} a baissé de ${abs}% — bonne tendance si elle est progressive.`
    if (statut === 'attention')
      return `⚠️ Votre ${n} est en baisse (-${abs}%). Vérifiez avec votre médecin.`
    return `📉 Votre ${n} a diminué de ${abs}%.`
  }

  if (tendance === 'stable' && statut === 'attention')
    return `⚠️ Votre ${n} est stable mais hors zone normale. Consultez votre médecin.`

  return null
}

/* ─── Conseils ────────────────────────────────────── */
const CONSEILS = [
  { cat: 'Nutrition',   illus: 'Nutrition',    titre: 'Équilibre alimentaire',  texte: 'Privilégiez légumes, légumineuses et céréales complètes à chaque repas.',             color: '#34C759' },
  { cat: 'Hydratation', illus: 'Hydratation',  titre: 'Restez hydraté',         texte: 'Buvez au moins 1,5 L d\'eau par jour, hors café et sodas.',                          color: '#5AC8FA' },
  { cat: 'Activité',    illus: 'Activité',     titre: 'Bougez chaque jour',     texte: '30 min de marche quotidienne améliorent glycémie et tension artérielle.',             color: '#FF9500' },
  { cat: 'Sommeil',     illus: 'Sommeil',      titre: 'Dormez suffisamment',    texte: '7 à 9 heures par nuit renforcent l\'immunité et régulent la glycémie.',              color: '#BF5AF2' },
  { cat: 'Stress',      illus: 'Stress',       titre: 'Gérez votre stress',     texte: '5 min de cohérence cardiaque (5s inspire / 5s expire) abaissent tension et glycémie.', color: '#FF375F' },
  { cat: 'Nutrition',   illus: 'Fruits',       titre: 'Fruits et vitamines',    texte: 'Visez 5 portions de fruits et légumes variés par jour — fibres, vitamines, antioxydants.', color: '#9C27B0' },
  { cat: 'Cardio',      illus: 'Cardio',       titre: 'Cardio modéré',          texte: '150 min/semaine de natation, vélo ou marche rapide réduisent le risque cardiaque.',  color: '#0A84FF' },
]

/* ══════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user }      = useAuthStore()
  const { nbNonVues } = useAlertesStore()
  const navigate      = useNavigate()
  const isMedecin     = user?.role === 'medecin'

  /* Données critiques */
  const [vitascore,  setVitascore]  = useState(null)
  const [mesures,    setMesures]    = useState([])
  const [alertes,    setAlertes]    = useState([])
  const [histoData,  setHistoData]  = useState([])
  const [histoLabel, setHistoLabel] = useState('')
  const [loading,    setLoading]    = useState(true)

  const [showVSInfo,    setShowVSInfo]    = useState(false)
  const [calendrierData, setCalendrierData] = useState(null)

  /* Données optionnelles */
  const [tendances,    setTendances]    = useState([])
  const [taches,       setTaches]       = useState([])
  const [tachesFaites, setTachesFaites] = useState({})
  const [correlations, setCorrelations] = useState([])
  const [scatterCorr,  setScatterCorr]  = useState(null)  // corrélation affichée en scatter

  useEffect(() => {
    if (isMedecin) { setLoading(false); return }

    /* ── Chargement critique — si ça échoue on affiche l'erreur ── */
    Promise.all([getVitascore(), getMesures(), getAlertes(true)])
      .then(([vs, mes, al]) => {
        setVitascore(vs.data.data ?? null)
        const m = mes.data.data ?? []
        setMesures(m)
        setAlertes((al.data.data ?? []).slice(0, 5))

        // Tendances calculées côté client immédiatement
        setTendances(analyserTendances(m))

        // Historique du premier type
        if (m.length > 0) {
          const first = m[0]
          setHistoLabel(first.nom_type ?? '')
          getHistorique(first.type_mesure_id, 30)
            .then((r) => {
              const pts = (r.data.data ?? []).slice().reverse()
              setHistoData(pts.map(p => ({
                date:   format(new Date(p.date_mesure), 'd MMM', { locale: fr }),
                valeur: p.valeur,
              })))
            }).catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    /* ── Calendrier régularité — optionnel, non bloquant ── */
    import('../../services/mesuresService').then(m =>
      m.getCalendrier().then(r => setCalendrierData(r.data.data)).catch(() => {})
    )

    /* ── Corrélations — optionnel, non bloquant ── */
    getCorrelations()
      .then(r => setCorrelations(r.data.data ?? []))
      .catch(() => {})

    /* ── Tâches — optionnel, non bloquant ── */
    getTaches()
      .then(r => setTaches(r.data.data ?? []))
      .catch(() => {
        // Fallback tâches fixes si API indisponible
        setTaches([
          { id: 'hydratation', label: 'Boire 1,5 L d\'eau',         type_id: null },
          { id: 'activite',    label: '30 min d\'activité physique', type_id: null },
        ])
      })
  }, [isMedecin])

  if (isMedecin) return <MedecinDashboard user={user} navigate={navigate} />

  const score      = vitascore?.score ?? null
  const scoreColor = score === null ? '#8E8E93' : score >= 80 ? '#34C759' : score >= 60 ? '#FF9500' : '#FF2D55'
  const getLatest  = (name) => mesures.find(m => (m.nom_type ?? '').toLowerCase().includes(name.toLowerCase()))

  // Mini-stats graphique (calculées ici pour éviter IIFE dans le JSX)
  const histoVals   = histoData.map(d => d.valeur)
  const histoMin    = histoVals.length ? Math.min(...histoVals) : null
  const histoMax    = histoVals.length ? Math.max(...histoVals) : null
  const histoMoy    = histoVals.length ? histoVals.reduce((s, v) => s + v, 0) / histoVals.length : null
  const histoTrend  = histoVals.length > 1
    ? histoVals[histoVals.length - 1] > histoVals[0] ? '↑'
    : histoVals[histoVals.length - 1] < histoVals[0] ? '↓' : '→'
    : '→'
  const histoTColor = histoTrend === '↑' ? 'var(--health-green)' : histoTrend === '↓' ? '#FF2D55' : 'var(--text-tertiary)'
  const histoUnite  = mesures.find(m => (m.nom_type ?? '') === histoLabel)?.unite ?? ''

  const glycemie = getLatest('Glyc')
  const tension  = getLatest('Tension')
  const poids    = getLatest('Poids')

  // Couleur selon statut OMS
  const statusColor = (m) => {
    if (!m) return '#8E8E93'
    if (m.statut === 'danger')    return '#FF2D55'
    if (m.statut === 'attention') return '#FF9500'
    return '#34C759'
  }

  const toggleTache  = (id) => setTachesFaites(p => ({ ...p, [id]: !p[id] }))
  const nbFaites     = taches.filter(t => tachesFaites[t.id]).length
  const progression  = taches.length ? Math.round((nbFaites / taches.length) * 100) : 0

  /* Contextualiser les conseils */
  const glycAnorm = mesures.some(m => (m.nom_type ?? '').includes('Glyc') && m.statut === 'anormal')
  const conseils  = glycAnorm
    ? [...CONSEILS.filter(c => c.cat === 'Nutrition'), ...CONSEILS.filter(c => c.cat !== 'Nutrition')]
    : CONSEILS

  return (
    <div className="space-y-6">

      {/* ══ HERO ══ */}
      <HeroBanner prenom={user?.prenom ?? ''} />

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <VitaScoreCard score={score} color={scoreColor} loading={loading} onInfo={() => setShowVSInfo(true)} />
        <MetricCard label="Glycémie"  value={glycemie?.valeur} unit={glycemie?.unite ?? 'g/L'}
          subtitle={glycemie ? format(new Date(glycemie.date_mesure), 'd MMM HH:mm', { locale: fr }) : 'Aucune mesure'}
          color={statusColor(glycemie)} loading={loading} decimals={2} />
        <MetricCard label="Tension"   value={tension?.valeur}  unit={tension?.unite ?? 'mmHg'}
          subtitle={tension ? format(new Date(tension.date_mesure), 'd MMM HH:mm', { locale: fr }) : 'Aucune mesure'}
          color={statusColor(tension)} loading={loading} decimals={0} />
        <MetricCard label="Poids"     value={poids?.valeur}    unit={poids?.unite ?? 'kg'}
          subtitle={poids ? format(new Date(poids.date_mesure), 'd MMM HH:mm', { locale: fr }) : 'Aucune mesure'}
          color={statusColor(poids)} loading={loading} decimals={1} />
      </div>

      {/* ══ CHART + ALERTES ══ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Graphique */}
        <div className="xl:col-span-8 rounded-2xl p-6 flex flex-col" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Évolution — <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{histoLabel}</span>
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>30 derniers jours</p>
            </div>
            <button onClick={() => navigate('/mesures')} className="flex items-center gap-1 text-sm font-medium"
              style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Voir tout <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-between">
          {loading ? (
            <div className="skeleton h-52 rounded-xl" />
          ) : histoData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={histoData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0A84FF" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#0A84FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-elevated)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'DM Sans' }} />
                  <Area type="monotone" dataKey="valeur" stroke="#0A84FF" strokeWidth={2.5} fill="url(#dashGrad)" dot={false} activeDot={{ r: 5, fill: '#0A84FF', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
              {/* Mini-stats sous la courbe */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4"
                style={{ borderTop: '1px solid var(--border-subtle)' }}>
                {[
                  { label: 'Min',      value: histoMin.toFixed(1),  color: 'var(--health-blue)',   unit: histoUnite },
                  { label: 'Moyenne',  value: histoMoy.toFixed(1),  color: 'var(--text-primary)',  unit: histoUnite },
                  { label: 'Max',      value: histoMax.toFixed(1),  color: 'var(--health-orange)', unit: histoUnite },
                  { label: 'Tendance', value: histoTrend,            color: histoTColor,            unit: '' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                      style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
                    <p className="text-base font-bold tabular-nums"
                      style={{ color: s.color, letterSpacing: '-0.5px' }}>
                      {s.value}{s.unit ? ` ${s.unit}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <HeartECGIllustration size={80} color="#0A84FF" animated />
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Aucune donnée à afficher</p>
              <button onClick={() => navigate('/mesures')} className="text-sm font-semibold px-4 py-2 rounded-xl"
                style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}>
                Ajouter une mesure →
              </button>
            </div>
          )}
          </div>{/* fin flex-1 */}
        </div>

        {/* Alertes */}
        <div className="xl:col-span-4 rounded-2xl p-6 flex flex-col" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Alertes</h2>
            {nbNonVues > 0 && (
              <span className="px-2 py-0.5 rounded-full text-white badge-pulse" style={{ background: 'var(--health-red)', fontSize: 11, fontWeight: 700 }}>
                {nbNonVues}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading
              ? [1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)
              : alertes.length === 0
                ? <div className="flex flex-col items-center justify-center h-36 gap-2">
                    <ShieldOkIllustration size={72} color="#34C759" />
                    <p className="text-sm font-semibold" style={{ color: 'var(--health-green)' }}>Tout va bien !</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Aucune alerte en cours</p>
                  </div>
                : <>
                    {alertes.slice(0, 4).map(a => <AlertBadge key={a.id} alerte={a} />)}
                    {alertes.length > 4 && (
                      <p className="text-xs text-center pt-1" style={{ color: 'var(--text-tertiary)' }}>
                        +{alertes.length - 4} alerte{alertes.length - 4 > 1 ? 's' : ''} supplémentaire{alertes.length - 4 > 1 ? 's' : ''}
                      </p>
                    )}
                  </>
            }
          </div>
          <button onClick={() => navigate('/alertes')} className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--bg-secondary)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}>
            Voir toutes les alertes
          </button>
        </div>
      </div>

      {/* ══ CALENDRIER RÉGULARITÉ (widget) ══ */}
      {!loading && calendrierData && (
        <CalendrierWidget data={calendrierData} navigate={navigate} />
      )}

      {/* ══ COMMENTAIRES ADAPTATIFS ══ */}
      {!loading && tendances.length > 0 && (
        <TendancesSection tendances={tendances} navigate={navigate} />
      )}

      {/* ══ À FAIRE AUJOURD'HUI ══ */}
      {taches.length > 0 && (
        <TachesSection
          taches={taches} faites={tachesFaites}
          onToggle={toggleTache} onSaisir={() => navigate('/mesures')}
          progression={progression} nbFaites={nbFaites}
        />
      )}

      {/* ══ CONSEIL DU JOUR ══ */}
      <ConseilCarousel conseils={conseils} />

      {/* ══ CORRÉLATIONS ══ */}
      {!loading && correlations.length > 0 && (
        <CorrelationsSection correlations={correlations} onDetail={setScatterCorr} />
      )}

      {/* ══ MODAL VITASCORE ══ */}
      {showVSInfo && (
        <VitaScoreInfoModal score={score} onClose={() => setShowVSInfo(false)} />
      )}

      {/* ══ MESURES RÉCENTES ══ */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Mesures récentes</h2>
          <button onClick={() => navigate('/mesures')} className="flex items-center gap-1 text-sm font-medium"
            style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Tout voir <ChevronRight size={14} />
          </button>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : mesures.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Aucune mesure enregistrée.</p>
            <button onClick={() => navigate('/mesures')} className="mt-2 text-sm font-semibold"
              style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Ajouter votre première mesure →
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {mesures.slice(0, 6).map((m, i) => (
              <MesureRow key={m.id} mesure={m} delay={i * 60} />
            ))}
          </div>
        )}
      </div>

      {/* ══ SCATTER MODAL ══ */}
      {scatterCorr && (
        <ScatterModal corr={scatterCorr} onClose={() => setScatterCorr(null)} />
      )}

      <style>{STYLES}</style>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   HERO BANNER
══════════════════════════════════════════════════════ */
const PARTICLES = Array.from({ length: 10 }, () => ({
  x:   `${Math.random() * 90}%`,
  y:   `${Math.random() * 90}%`,
  s:   `${4 + Math.random() * 7}px`,
  d:   `${Math.random() * 4}s`,
  dur: `${5 + Math.random() * 4}s`,
}))

function HeroBanner({ prenom }) {
  return (
    <div className="hero-banner relative rounded-2xl overflow-hidden flex items-center px-8" style={{ minHeight: 180 }}>
      {PARTICLES.map((p, i) => (
        <div key={i} className="particle" style={{ left: p.x, top: p.y, width: p.s, height: p.s, animationDelay: p.d, animationDuration: p.dur }} />
      ))}
      <div className="relative z-10">
        <p className="text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ letterSpacing: '-0.5px', textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
          {getGreeting(prenom)}
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Votre santé aujourd'hui en un coup d'œil
        </p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   VITASCORE CARD
══════════════════════════════════════════════════════ */
function VitaScoreCard({ score, color, loading, onInfo }) {
  const C = 2 * Math.PI * 28
  const [dash, setDash] = useState(0)
  const displayed = useCountUp(score, 2000)

  useEffect(() => {
    if (score == null) return
    const t = setTimeout(() => setDash((score / 100) * C), 300)
    return () => clearTimeout(t)
  }, [score, C])

  return (
    <div className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #141428, #0F3460, #16213E)', boxShadow: 'var(--shadow-card)' }}>
      <Illustration
        name="health-person"
        width={130} height={130}
        priority={true}
        fadeSide="left"
        style={{
          position: 'absolute',
          bottom: 0, right: 0,
          opacity: 0.18,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div className="flex items-center justify-between mb-4" style={{ position: 'relative', zIndex: 1 }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>VitaScore</p>
        <button onClick={onInfo}
          className="w-6 h-6 flex items-center justify-center rounded-full transition-all"
          style={{ background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700 }}
          title="Comprendre le VitaScore">
          ?
        </button>
      </div>
      <div className="flex items-center gap-4" style={{ position: 'relative', zIndex: 1 }}>
        {loading
          ? <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
          : (
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="5"
                  strokeDasharray={`${dash} ${C}`} strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 2s ease-out' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white tabular-nums">
                  {score !== null ? Math.round(displayed) : '—'}
                </span>
              </div>
            </div>
          )
        }
        <div>
          <p className="text-sm font-semibold text-white">Score de santé</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{scoreMsg(score)}</p>
        </div>
      </div>
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full" style={{ background: color, opacity: 0.08 }} />
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   METRIC CARD avec count-up
══════════════════════════════════════════════════════ */
function MetricCard({ label, value, unit, subtitle, color, loading, decimals = 1 }) {
  const displayed = useCountUp(value ?? null, 1500, decimals)
  return (
    <div className="hover-lift rounded-2xl p-5 cursor-default" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
        </div>
      </div>
      {loading
        ? <div className="skeleton h-9 w-24 rounded-lg" />
        : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)', letterSpacing: '-1px' }}>
              {value != null
                ? (decimals > 0 ? displayed.toFixed(decimals) : Math.round(displayed))
                : '—'}
            </span>
            {value != null && <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{unit}</span>}
          </div>
        )
      }
      <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   COMMENTAIRES ADAPTATIFS DES TENDANCES
══════════════════════════════════════════════════════ */
function TendancesSection({ tendances, navigate }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
        Analyse de vos tendances
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {tendances.map((t, i) => (
          <TendanceCard key={t.type_id} tendance={t} delay={i * 80} navigate={navigate} />
        ))}
      </div>
    </div>
  )
}

function TendanceCard({ tendance, delay, navigate }) {
  const [ref, inView] = useInView(0.1)

  const ICONE_MAP = {
    hausse: <TrendingUp size={13} />,
    baisse: <TrendingDown size={13} />,
    stable: <Minus size={13} />,
  }
  const badgeColor = tendance.tendance === 'hausse'
    ? (tendance.statut === 'normal' ? 'var(--health-blue)' : 'var(--health-red)')
    : tendance.tendance === 'baisse'
      ? ((tendance.type_nom === 'Poids' || tendance.type_nom === 'IMC') ? 'var(--health-green)' : 'var(--health-orange)')
      : (tendance.statut === 'normal' ? 'var(--health-green)' : 'var(--health-orange)')

  return (
    <div
      ref={ref}
      className="rounded-2xl p-4"
      style={{
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        transform: inView ? 'translateX(0)' : 'translateX(40px)',
        opacity: inView ? 1 : 0,
        transition: `transform 0.4s ease ${delay}ms, opacity 0.4s ease ${delay}ms`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider flex-1 truncate" style={{ color: 'var(--text-tertiary)' }}>
          {tendance.type_nom}
        </span>
        <span
          className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
          style={{ background: `${badgeColor}18`, color: badgeColor }}
        >
          {ICONE_MAP[tendance.tendance]}
          {tendance.variation_pct !== 0 ? ` ${Math.abs(tendance.variation_pct)}%` : ' stable'}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {tendance.commentaire}
      </p>
      <button
        onClick={() => navigate('/mesures')}
        className="mt-3 text-xs font-semibold flex items-center gap-1 transition-all"
        style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Voir le détail <ChevronRight size={11} />
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   À FAIRE AUJOURD'HUI
══════════════════════════════════════════════════════ */
function TachesSection({ taches, faites, onToggle, onSaisir, progression, nbFaites }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
          À faire aujourd'hui
        </p>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
          {nbFaites}/{taches.length} complétées
        </span>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="h-1.5" style={{ background: 'var(--bg-secondary)' }}>
          <div className="h-full rounded-full"
            style={{ width: `${progression}%`, background: 'linear-gradient(90deg, #0A84FF, #34C759)', transition: 'width 0.5s ease' }} />
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {taches.map((t) => {
            const done = !!faites[t.id]
            return (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 transition-all"
                style={{ background: done ? 'rgba(52,199,89,0.04)' : 'transparent' }}>
                <button onClick={() => onToggle(t.id)} className="flex-shrink-0 transition-all duration-200"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: done ? 'var(--health-green)' : 'var(--text-tertiary)' }}>
                  {done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>
                <p className="flex-1 text-sm font-medium transition-all"
                  style={{ color: done ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
                  {t.label}
                </p>
                {!done && t.type_id && (
                  <button onClick={onSaisir} className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}>
                    Saisir
                  </button>
                )}
                {!done && !t.type_id && <Droplets size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   CARROUSEL CONSEIL DU JOUR
══════════════════════════════════════════════════════ */
const CONSEIL_ILLU = {
  'Nutrition':   'conseil-nutrition',
  'Hydratation': 'conseil-hydratation',
  'Activité':    'conseil-activite',
  'Sommeil':     'conseil-sommeil',
}

function ConseilCarousel({ conseils }) {
  const [idx,    setIdx]    = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => setIdx(i => (i + 1) % conseils.length), 5000)
    return () => clearTimeout(t)
  }, [idx, paused, conseils.length])

  const c = conseils[idx]

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
        Conseil du jour
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${c.color}14, ${c.color}06)`, boxShadow: 'var(--shadow-card)', border: `1px solid ${c.color}20` }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex items-center gap-4 p-5">
          {CONSEIL_ILLU[c.cat] ? (
            <Illustration
              name={CONSEIL_ILLU[c.cat]}
              width={72} height={72}
              style={{ borderRadius: 12, flexShrink: 0 }}
            />
          ) : (
            <div className="flex-shrink-0">
              <AdviceIllustration category={c.illus} size={72} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.color }}>{c.cat}</span>
            <p className="font-bold text-base mt-0.5 mb-1.5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{c.titre}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{c.texte}</p>
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button onClick={() => setIdx(i => (i - 1 + conseils.length) % conseils.length)}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-card)', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
              <ChevronLeft size={15} />
            </button>
            <button onClick={() => setIdx(i => (i + 1) % conseils.length)}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-card)', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {conseils.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className="rounded-full transition-all duration-300"
              style={{ width: i === idx ? 20 : 6, height: 6, background: i === idx ? c.color : `${c.color}40`, border: 'none', cursor: 'pointer' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   COMPOSANTS SECONDAIRES
══════════════════════════════════════════════════════ */
function AlertBadge({ alerte }) {
  const isDanger = alerte.niveau === 'danger'
  return (
    <div className="rounded-xl px-3 py-2.5 flex items-start gap-2.5"
      style={{ borderLeft: `3px solid ${isDanger ? 'var(--health-red)' : 'var(--health-orange)'}`, background: isDanger ? 'rgba(255,45,85,0.06)' : 'rgba(255,149,0,0.06)', borderRadius: '0 10px 10px 0' }}>
      <AlertTriangle size={14} style={{ color: isDanger ? 'var(--health-red)' : 'var(--health-orange)', marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{alerte.message}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {format(new Date(alerte.created_at), 'd MMM HH:mm', { locale: fr })}
        </p>
      </div>
    </div>
  )
}

const TYPE_COLORS_MAP = {
  'Glycémie': '#FF2D55', 'Tension': '#FF9500', 'Poids': '#34C759',
  'SpO2': '#5AC8FA', 'Fréquence': '#FF375F', 'Température': '#FFD60A', 'IMC': '#BF5AF2',
}

function MesureRow({ mesure, delay = 0 }) {
  const nom   = mesure.nom_type ?? mesure.type_mesure ?? ''
  const color = Object.entries(TYPE_COLORS_MAP).find(([k]) => nom.includes(k))?.[1] ?? '#0A84FF'
  const isAbn = mesure.statut === 'anormal'
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
      style={{ animation: `fadeSlideIn 0.3s ease ${delay}ms both` }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{nom}</p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {format(new Date(mesure.date_mesure), 'd MMM yyyy · HH:mm', { locale: fr })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-base font-bold tabular-nums" style={{ color: isAbn ? 'var(--health-red)' : 'var(--text-primary)' }}>{mesure.valeur}</span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{mesure.unite}</span>
        {isAbn && <span className="badge badge-danger">Anormal</span>}
      </div>
    </div>
  )
}

function MedecinDashboard({ user, navigate }) {
  const [patients,    setPatients]    = useState([])
  const [alertesCrit, setAlertesCrit] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    import('../../services/medecinService').then(m =>
      Promise.all([m.getPatients(), m.getAlertesCritiques()])
        .then(([p, a]) => {
          setPatients(p.data.data ?? [])
          setAlertesCrit(a.data.data ?? [])
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    )
  }, [])

  const heure      = new Date().getHours()
  const salut      = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'
  const nbCrit     = patients.filter(p => p.statut_urgence === 'danger').length
  const nbAttn     = patients.filter(p => p.statut_urgence === 'attention').length
  const avgScore   = patients.length
    ? Math.round(patients.filter(p => p.vitascore !== null)
        .reduce((s, p) => s + p.vitascore, 0) / Math.max(1, patients.filter(p => p.vitascore !== null).length))
    : null
  const scoreColor = avgScore === null ? '#8E8E93' : avgScore >= 70 ? '#34C759' : avgScore >= 50 ? '#FF9500' : '#FF2D55'

  return (
    <div className="space-y-6">

      {/* ══ HERO ══ */}
      <div className="rounded-2xl px-8 py-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)', boxShadow: '0 8px 32px rgba(10,132,255,0.25)', minHeight: 120 }}>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
            </p>
            <h1 className="text-2xl font-bold text-white mt-1" style={{ letterSpacing: '-0.5px' }}>
              {salut}, Dr {user?.prenom} {user?.nom}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Vue d'ensemble de votre activité médicale
            </p>
          </div>
          {nbCrit > 0 && (
            <button onClick={() => navigate('/medecin')}
              className="px-4 py-3 rounded-2xl flex items-center gap-2"
              style={{ background: 'rgba(255,45,85,0.25)', border: '1px solid rgba(255,45,85,0.4)', cursor: 'pointer' }}>
              <AlertTriangle size={16} color="white" />
              <div className="text-left">
                <p className="text-white text-sm font-bold">{nbCrit} patient{nbCrit > 1 ? 's' : ''} critique{nbCrit > 1 ? 's' : ''}</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>Voir les fiches →</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ══ KPI ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Patients suivis',       value: loading ? '…' : patients.length,  color: '#0A84FF', sub: 'Relations actives',   to: '/medecin' },
          { label: 'En situation critique', value: loading ? '…' : nbCrit,           color: nbCrit > 0 ? '#FF2D55' : '#34C759', sub: 'Alertes danger', to: '/medecin' },
          { label: 'Sous surveillance',     value: loading ? '…' : nbAttn,           color: nbAttn > 0 ? '#FF9500' : '#34C759', sub: 'Alertes attention', to: '/medecin' },
          { label: 'VitaScore moyen',       value: loading ? '…' : (avgScore ?? '—'), color: scoreColor, sub: 'Tous patients', to: '/medecin' },
        ].map((k, i) => (
          <button key={i} onClick={() => navigate(k.to)}
            className="hover-lift rounded-2xl p-5 text-left"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: 'none', cursor: 'pointer' }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>{k.label}</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: k.color, letterSpacing: '-1px' }}>{k.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{k.sub}</p>
          </button>
        ))}
      </div>

      {/* ══ ALERTES CRITIQUES ══ */}
      {!loading && alertesCrit.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full badge-pulse" style={{ background: '#FF2D55' }} />
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Alertes critiques en cours</h2>
            </div>
            <button onClick={() => navigate('/medecin')} className="flex items-center gap-1 text-sm font-medium"
              style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Voir tous les patients <ChevronRight size={14} />
            </button>
          </div>
          {alertesCrit.slice(0, 5).map((a, i) => (
            <div key={a.id} className="flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-all"
              style={{ borderBottom: i < Math.min(alertesCrit.length, 5) - 1 ? '1px solid var(--border-subtle)' : 'none' }}
              onClick={() => navigate('/medecin')}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,45,85,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,45,85,0.1)' }}>
                <AlertTriangle size={14} color="#FF2D55" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.patient_nom}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{a.message}</p>
              </div>
              <p className="text-[11px] flex-shrink-0 mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {format(new Date(a.created_at), 'HH:mm')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ══ ACCÈS RAPIDE ══ */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>Accès rapide</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: <Users size={20} color="white" />, bg: 'linear-gradient(135deg,#0A84FF,#5AC8FA)', glow: 'rgba(10,132,255,0.25)', title: 'Mes patients', sub: 'Fiches, courbes, annotations', to: '/medecin' },
            { icon: <MessageSquare size={20} color="white" />, bg: 'linear-gradient(135deg,#34C759,#30D158)', glow: 'rgba(52,199,89,0.20)', title: 'Messagerie', sub: 'Échangez avec vos patients', to: '/messages' },
            { icon: <Stethoscope size={20} color="white" />, bg: 'linear-gradient(135deg,#BF5AF2,#AF52DE)', glow: 'rgba(191,90,242,0.20)', title: 'Demandes', sub: 'Accepter de nouveaux patients', to: '/relations' },
          ].map(c => (
            <button key={c.to} onClick={() => navigate(c.to)}
              className="hover-lift rounded-2xl p-5 flex items-center gap-4 text-left"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: 'none', cursor: 'pointer' }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: c.bg, boxShadow: `0 4px 14px ${c.glow}` }}>{c.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{c.sub}</p>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>

      {/* ══ PATIENTS CRITIQUES (aperçu, si existants) ══ */}
      {!loading && nbCrit > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF2D55' }}>
              Attention immédiate requise
            </p>
            <button onClick={() => navigate('/medecin')} className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Voir tous <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {patients.filter(p => p.statut_urgence === 'danger').map(p => (
              <button key={p.id} onClick={() => navigate('/medecin')}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl hover-lift text-left"
                style={{ background: 'rgba(255,45,85,0.06)', border: '1px solid rgba(255,45,85,0.15)', cursor: 'pointer' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: '#FF2D55' }}>
                  {p.prenom?.[0]}{p.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.prenom} {p.nom}</p>
                  <p className="text-xs" style={{ color: '#FF2D55' }}>
                    {p.alertes_danger} alerte{p.alertes_danger > 1 ? 's' : ''} critique{p.alertes_danger > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums" style={{ color: p.vitascore !== null && p.vitascore < 40 ? '#FF2D55' : 'var(--text-primary)' }}>
                    {p.vitascore ?? '—'}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>VitaScore</p>
                </div>
                <ChevronRight size={14} style={{ color: '#FF2D55', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   WIDGET CALENDRIER RÉGULARITÉ (dashboard)
══════════════════════════════════════════════════════ */
function CalendrierWidget({ data, navigate }) {
  const monthLabel = (() => {
    const s = format(parseISO(`${data.mois}-01`), 'MMMM yyyy', { locale: fr })
    return s.charAt(0).toUpperCase() + s.slice(1)
  })()

  // Jours écoulés : jour actuel si mois courant, sinon tous les jours du mois
  const today       = new Date()
  const moisActuel  = today.toISOString().slice(0, 7)
  const joursEcoules = data.mois === moisActuel
    ? today.getDate()
    : data.nb_jours

  const pct = Math.round((data.actifs / joursEcoules) * 100)
  const scoreColor = pct >= 80 ? 'var(--health-green)' : pct >= 50 ? 'var(--health-orange)' : '#FF2D55'
  const scoreLabel = pct >= 80 ? 'Excellent' : pct >= 50 ? 'Bien' : 'À améliorer'

  return (
    <div
      className="rounded-2xl p-5 hover-lift cursor-pointer"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
      onClick={() => navigate('/mesures/calendrier')}
    >
      {/* Titre */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-tertiary)' }}>Calendrier de régularité</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{monthLabel}</p>
        </div>
        <span className="text-xs font-medium flex items-center gap-1"
          style={{ color: 'var(--health-blue)' }}>
          Voir le détail <ChevronRight size={12} />
        </span>
      </div>

      {/* Layout 2 colonnes : calendrier à gauche, stats à droite */}
      <div className="flex items-start gap-6">
        {/* Mini calendrier — taille fixe */}
        <div className="flex-shrink-0">
          <CalendrierRegularite data={data} compact />
        </div>

        {/* Stats à droite — remplit l'espace restant */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-3">

          {/* Score principal */}
          <div>
            <p className="text-3xl font-bold tabular-nums"
              style={{ color: scoreColor, letterSpacing: '-1.5px' }}>
              {data.actifs}
              <span className="text-base font-medium ml-1" style={{ color: 'var(--text-tertiary)' }}>
                /{joursEcoules}j
              </span>
            </p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: scoreColor }}>{scoreLabel}</p>
          </div>

          {/* Barre de progression */}
          <div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, background: scoreColor }} />
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {pct}% des jours écoulés
            </p>
          </div>

          {/* Série */}
          {data.streak > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,149,0,0.1)' }}>
              <span>🔥</span>
              <p className="text-xs font-bold" style={{ color: 'var(--health-orange)' }}>
                {data.streak} jour{data.streak > 1 ? 's' : ''} d'affilée
              </p>
            </div>
          ) : (
            <div className="px-2.5 py-1.5 rounded-xl"
              style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Mesurez aujourd'hui pour démarrer une série !
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function scoreMsg(s) {
  if (s === null || s === undefined) return 'Ajoutez vos premières mesures'
  if (s >= 80) return 'Excellent'
  if (s >= 60) return 'Bon état général'
  if (s >= 40) return 'Attention requise'
  return 'Consultez un médecin'
}

/* ══════════════════════════════════════════════════════
   CORRÉLATIONS
══════════════════════════════════════════════════════ */
function CorrelationsSection({ correlations, onDetail }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
        🔗 Corrélations entre vos mesures
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {correlations.map((c, i) => (
          <CorrelationCard key={i} corr={c} onDetail={() => onDetail(c)} />
        ))}
      </div>
    </div>
  )
}

function CorrelationCard({ corr, onDetail }) {
  const isPositive = corr.direction === 'positive'
  const isForte    = corr.force === 'forte'
  const badgeBg    = isForte ? 'rgba(10,132,255,0.1)' : 'rgba(255,149,0,0.1)'
  const badgeColor = isForte ? 'var(--health-blue)' : 'var(--health-orange)'

  return (
    <div
      className="rounded-2xl p-4 cursor-pointer transition-all duration-200 hover-lift"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
      onClick={onDetail}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{corr.mesure_a}</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>{isPositive ? '→' : '↕'}</span>
          <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{corr.mesure_b}</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
          style={{ background: badgeBg, color: badgeColor }}>
          {corr.force}
        </span>
      </div>

      {/* Interprétation */}
      <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
        {corr.interpretation}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          r = {corr.coefficient} · {corr.nb_points} points
        </span>
        <span className="text-[10px] font-semibold" style={{ color: 'var(--health-blue)' }}>
          Voir le graphique →
        </span>
      </div>
    </div>
  )
}

/* ── Scatter Plot Modal ── */
function ScatterModal({ corr, onClose }) {
  const data = (corr.points ?? []).map(p => ({ x: p.x, y: p.y }))

  // Ligne de tendance (régression simple)
  const n  = data.length
  const sx = data.reduce((s, p) => s + p.x, 0)
  const sy = data.reduce((s, p) => s + p.y, 0)
  const mx = sx / n
  const my = sy / n
  const num = data.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0)
  const den = data.reduce((s, p) => s + (p.x - mx) ** 2, 0)
  const slope = den ? num / den : 0
  const intercept = my - slope * mx

  const xMin = Math.min(...data.map(p => p.x))
  const xMax = Math.max(...data.map(p => p.x))
  const trendLine = [
    { x: xMin, y: slope * xMin + intercept },
    { x: xMax, y: slope * xMax + intercept },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-modal)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {corr.mesure_a} ↔ {corr.mesure_b}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {corr.interpretation}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
            <X size={15} />
          </button>
        </div>

        <div className="p-6">
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="x" name={corr.mesure_a} type="number" domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }}
                label={{ value: `${corr.mesure_a} (${corr.unite_a})`, position: 'insideBottom', offset: -5, fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <YAxis dataKey="y" name={corr.mesure_b} type="number" domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }} />
              <ZAxis range={[40, 40]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', fontSize: 12, fontFamily: 'DM Sans' }}
                formatter={(val, name) => [`${val}`, name]}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter data={data} fill="#0A84FF" fillOpacity={0.7} />
              {/* Ligne de tendance */}
              <Scatter data={trendLine} line={{ stroke: '#FF9500', strokeWidth: 2, strokeDasharray: '4 2' }} shape={() => null} />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            r = {corr.coefficient} · {corr.force} · direction {corr.direction} · {corr.nb_points} points sur 30j
          </p>
        </div>
      </div>
    </div>
  )
}

const STYLES = `
  .hero-banner {
    background: linear-gradient(135deg, #0A84FF, #BF5AF2, #34C759);
    background-size: 300% 300%;
    animation: heroGradient 8s ease infinite;
  }
  @keyframes heroGradient {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .particle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    animation: particleFloat linear infinite;
    pointer-events: none;
  }
  @keyframes particleFloat {
    0%   { transform: translateY(0)    scale(1);   opacity: 0.6; }
    50%  { transform: translateY(-18px) scale(1.2); opacity: 0.3; }
    100% { transform: translateY(0)    scale(1);   opacity: 0.6; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-banner { animation: none; }
    .particle    { animation: none; }
  }
`
