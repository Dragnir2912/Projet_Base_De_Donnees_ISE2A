import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { getTypeMesure, getHistorique } from '../../services/mesuresService'
import { getFiche, getStatutValeur } from '../../utils/fichesInfo'

const TYPE_COLORS = [
  '#FF5C6A', '#FF9500', '#FFD60A', '#34C759',
  '#40B896', '#2E9B83', '#1A7C6C', '#FF7B73',
  '#FF6B6B', '#2E9B83',
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
    <div className="max-w-2xl mx-auto space-y-4 page-enter">
      {/* Back */}
      <button
        onClick={() => navigate('/mesures')}
        className="flex items-center gap-2 font-medium text-sm animate-fade-up"
        style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={18} /> Retour aux mesures
      </button>

      {/* ══ HERO BANNER ══ */}
      <div style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden',
        height: 200, background: '#071411',
        border: `1px solid ${couleur}18`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      }} className="animate-fade-up">
        {/* Photo full-bleed */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src="/illustrations/artwork/people-waving.jpg" alt="" aria-hidden
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
        </div>
        {/* Overlay LTR */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #071411 0%, #071411 26%, rgba(7,20,17,0.90) 42%, rgba(7,20,17,0.50) 62%, rgba(7,20,17,0.12) 82%, transparent 100%)', pointerEvents: 'none' }} />
        {/* Vignette basse */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,20,17,0.90) 0%, rgba(7,20,17,0.30) 35%, transparent 55%)', pointerEvents: 'none' }} />
        {/* Ambient glow couleur indicateur */}
        <div style={{ position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: couleur, opacity: 0.10, filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '24px 32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${couleur}20`, border: `1px solid ${couleur}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>
              {fiche.emoji}
            </div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: couleur }}>
                Mesure de santé
              </span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#E8F5F0', letterSpacing: '-1.2px', lineHeight: 1.1, margin: 0 }}>
                {type.nom}
              </h1>
            </div>
          </div>
          {derniereVal != null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: couleur, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>
                {derniereVal}
              </span>
              <span style={{ fontSize: 14, color: 'rgba(232,245,240,0.55)', fontWeight: 500 }}>{type.unite}</span>
              <StatusBadge statut={statut} />
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'rgba(232,245,240,0.45)', margin: 0 }}>
              Unité : {type.unite} · Aucune mesure enregistrée
            </p>
          )}
        </div>
      </div>

      {/* Accordéon sections */}
      <AccordionSection title="Définition" defaultOpen>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
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
          <p className="text-sm leading-relaxed" style={{ color: 'var(--vital-orange)' }}>
            {fiche.quand_consulter}
          </p>
        </div>
      </AccordionSection>

      <AccordionSection title="Conseils pratiques">
        <ul className="space-y-3">
          {fiche.conseils.map((c, i) => (
            <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--ink-2)' }}>
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
          <p className="text-sm text-center py-4" style={{ color: 'var(--ink-3)' }}>
            Aucune mesure enregistrée pour ce type.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-info" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor={couleur} stopOpacity={0.30} />
                  <stop offset="90%" stopColor={couleur} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="var(--border-0)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'Poppins' }} domain={['auto', 'auto']} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ stroke: `${couleur}22`, strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div style={{
                      background: 'var(--glass-card)',
                      backdropFilter: 'blur(20px) saturate(1.8)',
                      WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 12, padding: '10px 14px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
                      minWidth: 110,
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', margin: '0 0 4px' }}>{label}</p>
                      <p style={{ fontSize: 17, fontWeight: 800, color: couleur, letterSpacing: '-0.5px', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {payload[0]?.value} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)' }}>{type.unite}</span>
                      </p>
                    </div>
                  )
                }}
              />
              {type.seuil_min_normal && (
                <ReferenceLine y={type.seuil_min_normal} stroke="#FF8C42" strokeDasharray="5 4" strokeWidth={1.5} />
              )}
              {type.seuil_max_normal && (
                <ReferenceLine y={type.seuil_max_normal} stroke="#FF8C42" strokeDasharray="5 4" strokeWidth={1.5} />
              )}
              <Area
                type="monotone" dataKey="valeur" stroke={couleur} strokeWidth={2.4}
                fill="url(#grad-info)" dot={false}
                activeDot={{ r: 5, fill: couleur, strokeWidth: 2, stroke: `${couleur}35` }}
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
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      background: 'var(--glass-card)',
      backdropFilter: 'blur(24px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
      border: '1px solid var(--glass-border)',
    }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '15px 20px', background: 'none', border: 'none', cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,221,160,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.2px' }}>{title}</p>
        {open
          ? <ChevronUp size={15} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          : <ChevronDown size={15} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ paddingTop: 16 }}>{children}</div>
        </div>
      )}
    </div>
  )
}

/* ── Tableau des zones OMS ── */
function ZonesTable({ type }) {
  const zones = []
  if (type.seuil_danger_bas  != null) zones.push({ label: 'Danger bas',    valeur: `< ${type.seuil_danger_bas}`,   color: '#FF5C6A' })
  if (type.seuil_min_normal  != null) zones.push({ label: 'Attention',      valeur: `${type.seuil_danger_bas ?? '—'} – ${type.seuil_min_normal}`, color: '#FF9500' })
  zones.push({
    label: 'Zone normale',
    valeur: `${type.seuil_min_normal ?? '—'} – ${type.seuil_max_normal ?? '—'} ${type.unite}`,
    color: '#34C759',
  })
  if (type.seuil_max_normal  != null) zones.push({ label: 'Attention',      valeur: `${type.seuil_max_normal} – ${type.seuil_danger_haut ?? '—'}`, color: '#FF9500' })
  if (type.seuil_danger_haut != null) zones.push({ label: 'Danger haut',    valeur: `> ${type.seuil_danger_haut}`,  color: '#FF5C6A' })

  return (
    <div className="space-y-2">
      {zones.map((z, i) => (
        <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < zones.length - 1 ? '1px solid var(--border-0)' : 'none' }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: z.color }} />
            <span className="text-sm" style={{ color: 'var(--ink-2)' }}>{z.label}</span>
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
    normal:    { label: 'Normal',    bg: 'rgba(52,199,89,0.12)',  color: 'var(--vital-green)' },
    attention: { label: 'Attention', bg: 'rgba(255,149,0,0.12)',  color: 'var(--vital-orange)' },
    danger:    { label: 'Danger',    bg: 'rgba(255,92,106,0.12)',  color: 'var(--vital-red)' },
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
      <div className="h-8 w-40 rounded-xl skeleton-pulse" style={{ background: 'var(--surface-2)' }} />
      <div className="h-32 rounded-2xl skeleton-pulse" style={{ background: 'var(--surface-2)' }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-2xl skeleton-pulse" style={{ background: 'var(--surface-2)' }} />
      ))}
    </div>
  )
}


