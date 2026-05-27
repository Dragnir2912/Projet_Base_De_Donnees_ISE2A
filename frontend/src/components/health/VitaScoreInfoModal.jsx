import { X, Info } from 'lucide-react'

/**
 * Modal d'explication du VitaScore.
 * Peut s'ouvrir depuis le dashboard patient ou la fiche médecin.
 *
 * Props:
 *   onClose()      – ferme le modal
 *   score          – valeur actuelle (number | null) — optionnel
 */
export default function VitaScoreInfoModal({ onClose, score }) {
  const RANGES = [
    { min: 80, max: 100, label: 'Excellent',              color: '#34C759', bg: 'rgba(52,199,89,0.1)',  emoji: '🟢' },
    { min: 65, max: 79,  label: 'Bon état général',       color: '#34C759', bg: 'rgba(52,199,89,0.08)', emoji: '🟢' },
    { min: 50, max: 64,  label: 'Surveillance recommandée', color: '#FF9500', bg: 'rgba(255,149,0,0.1)', emoji: '🟡' },
    { min: 0,  max: 49,  label: 'Consultation urgente',   color: '#FF5C6A', bg: 'rgba(255,92,106,0.1)',  emoji: '🔴' },
  ]

  const INDICATEURS = [
    { nom: 'Glycémie',           coef: '0,90', poids: 'Élevé' },
    { nom: 'Tension artérielle', coef: '0,90', poids: 'Élevé' },
    { nom: 'SpO2',               coef: '1,00', poids: 'Maximal' },
    { nom: 'Fréquence cardiaque',coef: '0,80', poids: 'Élevé' },
    { nom: 'IMC',                coef: '0,70', poids: 'Moyen' },
    { nom: 'Température',        coef: '0,60', poids: 'Moyen' },
    { nom: 'Cholestérol',        coef: '0,70', poids: 'Moyen' },
    { nom: 'Poids',              coef: '0,50', poids: 'Faible' },
  ]

  const scoreRange = score !== null && score !== undefined
    ? RANGES.find(r => score >= r.min && score <= r.max) ?? RANGES[3]
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: 520,
          maxHeight: '88vh',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-modal)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #141428, #0F3460)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Mini ring décoratif */}
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                {score !== null && score !== undefined && (
                  <circle cx="24" cy="24" r="20" fill="none"
                    stroke={scoreRange?.color ?? '#7A9490'}
                    strokeWidth="4"
                    strokeDasharray={`${(score / 100) * (2 * Math.PI * 20)} ${2 * Math.PI * 20}`}
                    strokeLinecap="round" />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white tabular-nums">
                  {score ?? '—'}
                </span>
              </div>
            </div>
            <div>
              <p className="font-bold text-lg text-white" style={{ letterSpacing: '-0.3px' }}>
                VitaScore
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Score de santé global · 0 à 100
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'white' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Votre score actuel */}
          {scoreRange && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: scoreRange.bg, border: `1px solid ${scoreRange.color}30` }}
            >
              <span className="text-xl">{scoreRange.emoji}</span>
              <div>
                <p className="text-sm font-bold" style={{ color: scoreRange.color }}>
                  Votre score : {score}/100
                </p>
                <p className="text-xs" style={{ color: scoreRange.color, opacity: 0.8 }}>
                  {scoreRange.label}
                </p>
              </div>
            </div>
          )}

          {/* Définition */}
          <section>
            <SectionTitle>Qu'est-ce que le VitaScore ?</SectionTitle>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Le <strong>VitaScore</strong> est un indicateur synthétique de <strong>0 à 100</strong> qui résume
              l'état de santé global en une seule valeur. Il est calculé automatiquement à chaque nouvelle mesure
              enregistrée, en agrégeant les dernières valeurs de chaque indicateur de santé mesuré.
            </p>
            <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
              Un score de <span style={{ color: '#34C759', fontWeight: 600 }}>100</span> signifie que toutes
              vos mesures sont dans les zones normales OMS.
              Un score de <span style={{ color: '#FF5C6A', fontWeight: 600 }}>0</span> indiquerait des valeurs
              critiques sur l'ensemble des indicateurs.
            </p>
          </section>

          {/* Calcul */}
          <section>
            <SectionTitle>Comment est-il calculé ?</SectionTitle>
            <div className="space-y-2">
              <Step n={1} text="On récupère la dernière valeur enregistrée pour chaque indicateur de santé." />
              <Step n={2} text="Chaque indicateur est classé selon sa position par rapport aux seuils OMS : Normal, Attention ou Danger." />
              <Step n={3} text="On multiplie le coefficient de cet indicateur par un facteur selon le statut :" />
            </div>

            {/* Facteurs de statut */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: 'Normal',    factor: '× 1,0  (100%)', color: '#34C759' },
                { label: 'Attention', factor: '× 0,5  (50%)',  color: '#FF9500' },
                { label: 'Danger',    factor: '× 0,1  (10%)',  color: '#FF5C6A' },
              ].map(s => (
                <div key={s.label} className="rounded-xl px-3 py-2.5 text-center"
                  style={{ background: `${s.color}12`, border: `1px solid ${s.color}30` }}>
                  <p className="text-xs font-bold" style={{ color: s.color }}>{s.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: s.color, opacity: 0.8 }}>{s.factor}</p>
                </div>
              ))}
            </div>

            <div
              className="mt-3 px-4 py-3 rounded-xl text-center text-xs font-medium"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              Score = (Σ contributions) ÷ (Σ coefficients) × 100
            </div>
            <Step n={4} text="Si un indicateur n'a jamais été mesuré, il est ignoré dans le calcul." className="mt-2" />
          </section>

          {/* Coefficients */}
          <section>
            <SectionTitle>Coefficients par indicateur</SectionTitle>
            <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Les indicateurs vitaux ont un coefficient plus élevé — leur impact sur le score est plus fort.
            </p>
            <div className="space-y-1.5">
              {INDICATEURS.map(ind => (
                <div key={ind.nom}
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ind.nom}</p>
                  <div className="flex items-center gap-3">
                    <CoefBar coef={parseFloat(ind.coef.replace(',', '.'))} />
                    <span className="text-xs font-bold w-16 text-right"
                      style={{ color: 'var(--text-tertiary)' }}>
                      {ind.coef} · {ind.poids}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Interprétation */}
          <section>
            <SectionTitle>Interprétation du score</SectionTitle>
            <div className="space-y-2">
              {RANGES.map(r => {
                const isCurrent = scoreRange?.min === r.min
                return (
                  <div key={r.min}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: isCurrent ? r.bg : 'var(--bg-secondary)',
                      border: isCurrent ? `1px solid ${r.color}40` : '1px solid transparent',
                    }}>
                    <span className="text-sm w-4">{r.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: isCurrent ? r.color : 'var(--text-primary)' }}>
                        {r.label}
                      </p>
                    </div>
                    <span className="text-xs font-bold tabular-nums"
                      style={{ color: r.color }}>
                      {r.min === 0 ? '< 50' : `${r.min} – ${r.max}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Note */}
          <div className="flex gap-2 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(46,155,131,0.08)', border: '1px solid rgba(46,155,131,0.15)' }}>
            <Info size={14} style={{ color: 'var(--health-blue)', flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--health-blue)' }}>
              Le VitaScore est un outil d'aide au suivi, pas un diagnostic médical.
              Consultez toujours votre médecin pour interpréter vos résultats.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sous-composants ─────────────────────────────────── */

function SectionTitle({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-2"
      style={{ color: 'var(--health-blue)' }}>
      {children}
    </p>
  )
}

function Step({ n, text, className = '' }) {
  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
        style={{ background: 'var(--health-blue)' }}
      >
        {n}
      </span>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</p>
    </div>
  )
}

function CoefBar({ coef }) {
  return (
    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="h-full rounded-full" style={{
        width: `${coef * 100}%`,
        background: coef >= 0.8 ? '#34C759' : coef >= 0.6 ? '#2E9B83' : '#FF9500',
      }} />
    </div>
  )
}
