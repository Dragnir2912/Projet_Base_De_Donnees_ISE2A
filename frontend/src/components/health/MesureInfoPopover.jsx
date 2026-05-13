import { useNavigate } from 'react-router-dom'
import { X, Info, ChevronRight } from 'lucide-react'
import { getFiche, getStatutValeur } from '../../utils/fichesInfo'
import Illustration from '../ui/Illustration'

const TYPE_ILLU_MAP = {
  'glyc':      'mesure-glycemie',
  'tension':   'mesure-tension',
  'poids':     'mesure-poids',
  'spo2':      'mesure-spo2',
  'spo₂':      'mesure-spo2',
  'fréquence': 'mesure-cardio',
  'cardio':    'mesure-cardio',
}

function getMesureIllu(nom) {
  const key = nom.toLowerCase()
  for (const [pattern, illu] of Object.entries(TYPE_ILLU_MAP)) {
    if (key.includes(pattern)) return illu
  }
  return null
}

/**
 * Modal d'information sur un type de mesure.
 * Affiche : zones de référence, interprétation, définition, conseils.
 *
 * Props:
 *   type        – objet TypeMesure (avec seuils)
 *   derniereValeur – nombre | null  (dernière valeur du patient)
 *   onClose     – callback fermeture
 */
export default function MesureInfoPopover({ type, derniereValeur, onClose }) {
  const navigate = useNavigate()
  const fiche    = getFiche(type.nom)
  const statut   = getStatutValeur(derniereValeur, type)

  const STATUT_MSG = {
    normal:    `✅ Votre ${type.nom.toLowerCase()} est dans la zone optimale.`,
    attention: `⚠️ Votre valeur est légèrement hors norme. Consultez votre médecin.`,
    danger:    `🚨 Valeur critique. Contactez votre médecin immédiatement.`,
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          maxWidth: 360,
          maxHeight: '88vh',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-modal)',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── En-tête ── */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ background: `${fiche.couleur}14`, borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: fiche.couleur, fontSize: 20 }}
          >
            {fiche.emoji}
          </div>
          <div className="flex-1">
            <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{type.nom}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Unité : {type.unite}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer' }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">

          {/* ── Illustration type mesure ── */}
          {getMesureIllu(type.nom) && (
            <Illustration
              name={getMesureIllu(type.nom)}
              width={100} height={100}
              style={{ margin: '0 auto 4px', display: 'block' }}
            />
          )}

          {/* ── Zones de référence ── */}
          {(type.seuil_min_normal != null || type.seuil_max_normal != null) && (
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Zones de référence
              </p>
              <GradientBar type={type} valeur={derniereValeur} />
            </section>
          )}

          {/* ── Interprétation ── */}
          {derniereValeur != null && statut && (
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Votre situation
              </p>
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: statut === 'normal' ? 'rgba(52,199,89,0.1)' : statut === 'attention' ? 'rgba(255,149,0,0.1)' : 'rgba(255,45,85,0.1)',
                  color: statut === 'normal' ? 'var(--health-green)' : statut === 'attention' ? 'var(--health-orange)' : 'var(--health-red)',
                  fontWeight: 500,
                }}
              >
                {STATUT_MSG[statut]}
              </div>
            </section>
          )}

          {/* ── C'est quoi ? ── */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
              C'est quoi ?
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {fiche.quoi}
            </p>
          </section>

          {/* ── Conseils ── */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
              Conseils pratiques
            </p>
            <ul className="space-y-2">
              {fiche.conseils.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: fiche.couleur, flexShrink: 0 }}>•</span>
                  {c}
                </li>
              ))}
            </ul>
          </section>

          {/* ── Lien page dédiée ── */}
          <button
            onClick={() => { onClose(); navigate(`/mesures/info/${type.id}`) }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: `${fiche.couleur}12`,
              color: fiche.couleur,
              border: `1px solid ${fiche.couleur}30`,
              cursor: 'pointer',
            }}
          >
            <span className="flex items-center gap-2">
              <Info size={15} /> En savoir plus
            </span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Barre de gradient zones de référence ── */
function GradientBar({ type, valeur }) {
  const { seuil_danger_bas, seuil_danger_haut, seuil_min_normal, seuil_max_normal } = type

  // Bornes de la barre
  const min = seuil_danger_bas  ?? (seuil_min_normal != null ? seuil_min_normal * 0.7 : 0)
  const max = seuil_danger_haut ?? (seuil_max_normal != null ? seuil_max_normal * 1.3 : 100)
  const range = max - min || 1

  // Pourcentages des zones
  const pMinNormal = seuil_min_normal != null ? ((seuil_min_normal - min) / range) * 100 : 0
  const pMaxNormal = seuil_max_normal != null ? ((seuil_max_normal - min) / range) * 100 : 100

  // Position du marqueur
  const markerPct = valeur != null
    ? Math.max(2, Math.min(98, ((valeur - min) / range) * 100))
    : null

  return (
    <div>
      {/* Barre gradient */}
      <div className="relative h-4 rounded-full overflow-hidden mb-1" style={{ background: '#E5E5EA' }}>
        {/* Zone normale (verte) */}
        <div
          className="absolute top-0 h-full"
          style={{
            left:  `${pMinNormal}%`,
            width: `${pMaxNormal - pMinNormal}%`,
            background: 'var(--health-green)',
            opacity: 0.7,
          }}
        />
        {/* Zone attention gauche */}
        {pMinNormal > 0 && (
          <div
            className="absolute top-0 h-full"
            style={{ left: 0, width: `${pMinNormal}%`, background: 'var(--health-orange)', opacity: 0.6 }}
          />
        )}
        {/* Zone attention droite */}
        {pMaxNormal < 100 && (
          <div
            className="absolute top-0 h-full"
            style={{ left: `${pMaxNormal}%`, width: `${100 - pMaxNormal}%`, background: '#FF2D55', opacity: 0.6 }}
          />
        )}
        {/* Marqueur valeur patient */}
        {markerPct != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
            style={{
              left: `calc(${markerPct}% - 6px)`,
              background: 'var(--text-primary)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              zIndex: 2,
            }}
          />
        )}
      </div>

      {/* Labels bornes */}
      <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
        <span>{min}</span>
        {seuil_min_normal != null && (
          <span style={{ color: 'var(--health-green)' }}>{seuil_min_normal}</span>
        )}
        {seuil_max_normal != null && (
          <span style={{ color: 'var(--health-green)' }}>{seuil_max_normal}</span>
        )}
        <span>{max}</span>
      </div>

      {/* Légende */}
      {valeur != null && (
        <p className="text-[11px] mt-2 text-center" style={{ color: 'var(--text-tertiary)' }}>
          Votre valeur : <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{valeur} {type.unite}</span>
        </p>
      )}
    </div>
  )
}
