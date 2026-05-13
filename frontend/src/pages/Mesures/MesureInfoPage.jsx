import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { getTypeMesure, getHistorique } from '../../services/mesuresService'
import { getFiche, getStatutValeur } from '../../utils/fichesInfo'

const TYPE_COLORS = [
  '#FF2D55', '#FF9500', '#FFD60A', '#34C759',
  '#5AC8FA', '#0A84FF', '#BF5AF2', '#FF375F',
  '#FF6B6B', '#0A84FF',
]

export default function MesureInfoPage() {
  const { type_id } = useParams()
  const navigate    = useNavigate()

  const [type,      setType]      = useState(null)
  const [historique, setHistorique] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      getTypeMesure(type_id),
      getHistorique(type_id, 30),
    ])
      .then(([t, h]) => {
        setType(t.data.data)
        setHistorique(h.data.data ?? [])
      })
      .catch(() => navigate('/mesures'))
      .finally(() => setLoading(false))
  }, [type_id])

  if (loading) return <PageSkeleton />
  if (!type)   return null

  const fiche        = getFiche(type.nom)
  const derniereVal  = historique[historique.length - 1]?.valeur ?? null
  const statut       = getStatutValeur(derniereVal, type)
  const couleur      = fiche.couleur

  const chartData = historique.map((m) => ({
    date:   format(new Date(m.date_mesure), 'd MMM', { locale: fr }),
    valeur: m.valeur,
  }))

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate('/mesures')}
        className="flex items-center gap-2 font-medium text-sm"
        style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={18} /> Retour aux mesures
      </button>

      {/* Hero */}
      <div
        className="rounded-2xl p-6"
        style={{ background: `linear-gradient(135deg, ${couleur}22, ${couleur}08)`, boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: couleur, fontSize: 28 }}
          >
            {fiche.emoji}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {type.nom}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Unité : {type.unite}
            </p>
            {derniereVal != null && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl font-bold tabular-nums" style={{ color: couleur }}>
                  {derniereVal} {type.unite}
                </span>
                <StatusBadge statut={statut} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accordéon sections */}
      <AccordionSection title="Définition" defaultOpen>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {fiche.definition}
        </p>
      </AccordionSection>

      <AccordionSection title="Zones de référence OMS" defaultOpen>
        <ZonesTable type={type} />
      </AccordionSection>

      <AccordionSection title="Facteurs d'influence">
        <div className="flex flex-wrap gap-2">
          {fiche.facteurs.map((f, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-xl text-sm font-medium"
              style={{ background: `${couleur}14`, color: couleur }}
            >
              {f}
            </span>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Quand consulter un médecin ?">
        <div
          className="flex gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.2)' }}
        >
          <span className="text-lg">⚠️</span>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--health-orange)' }}>
            {fiche.quand_consulter}
          </p>
        </div>
      </AccordionSection>

      <AccordionSection title="Conseils pratiques">
        <ul className="space-y-3">
          {fiche.conseils.map((c, i) => (
            <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: couleur }}
              >
                {i + 1}
              </span>
              {c}
            </li>
          ))}
        </ul>
      </AccordionSection>

      {/* Mini graphique historique */}
      <AccordionSection title={`Votre historique (${historique.length} mesures)`} defaultOpen={historique.length > 0}>
        {historique.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
            Aucune mesure enregistrée pour ce type.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-info" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={couleur} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={couleur} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  borderRadius: 10, border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)', color: 'var(--text-primary)',
                  fontSize: 12, fontFamily: 'DM Sans',
                }}
              />
              {type.seuil_min_normal && (
                <ReferenceLine y={type.seuil_min_normal} stroke="var(--health-orange)" strokeDasharray="4 4" strokeWidth={1.5} />
              )}
              {type.seuil_max_normal && (
                <ReferenceLine y={type.seuil_max_normal} stroke="var(--health-orange)" strokeDasharray="4 4" strokeWidth={1.5} />
              )}
              <Area
                type="monotone" dataKey="valeur" stroke={couleur} strokeWidth={2}
                fill="url(#grad-info)" dot={false} activeDot={{ r: 4, fill: couleur, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </AccordionSection>
    </div>
  )
}

/* ── Accordéon ── */
function AccordionSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</p>
        {open
          ? <ChevronUp size={16} style={{ color: 'var(--text-tertiary)' }} />
          : <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />
        }
      </button>
      {open && (
        <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

/* ── Tableau des zones OMS ── */
function ZonesTable({ type }) {
  const zones = []
  if (type.seuil_danger_bas  != null) zones.push({ label: 'Danger bas',    valeur: `< ${type.seuil_danger_bas}`,   color: '#FF2D55' })
  if (type.seuil_min_normal  != null) zones.push({ label: 'Attention',      valeur: `${type.seuil_danger_bas ?? '—'} – ${type.seuil_min_normal}`, color: '#FF9500' })
  zones.push({
    label: 'Zone normale',
    valeur: `${type.seuil_min_normal ?? '—'} – ${type.seuil_max_normal ?? '—'} ${type.unite}`,
    color: '#34C759',
  })
  if (type.seuil_max_normal  != null) zones.push({ label: 'Attention',      valeur: `${type.seuil_max_normal} – ${type.seuil_danger_haut ?? '—'}`, color: '#FF9500' })
  if (type.seuil_danger_haut != null) zones.push({ label: 'Danger haut',    valeur: `> ${type.seuil_danger_haut}`,  color: '#FF2D55' })

  return (
    <div className="space-y-2">
      {zones.map((z, i) => (
        <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < zones.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: z.color }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{z.label}</span>
          </div>
          <span className="text-sm font-semibold tabular-nums" style={{ color: z.color }}>
            {z.valeur}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Badge statut ── */
function StatusBadge({ statut }) {
  if (!statut) return null
  const cfg = {
    normal:    { label: 'Normal',    bg: 'rgba(52,199,89,0.12)',  color: 'var(--health-green)' },
    attention: { label: 'Attention', bg: 'rgba(255,149,0,0.12)',  color: 'var(--health-orange)' },
    danger:    { label: 'Danger',    bg: 'rgba(255,45,85,0.12)',  color: 'var(--health-red)' },
  }[statut]
  return (
    <span className="px-2.5 py-1 rounded-xl text-xs font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

/* ── Skeleton ── */
function PageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="h-8 w-40 rounded-xl skeleton-pulse" style={{ background: 'var(--bg-secondary)' }} />
      <div className="h-32 rounded-2xl skeleton-pulse" style={{ background: 'var(--bg-secondary)' }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-2xl skeleton-pulse" style={{ background: 'var(--bg-secondary)' }} />
      ))}
    </div>
  )
}
