import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ArrowLeft, FileText, Stethoscope } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getMesConsultations } from '../../services/profilService'

const STATUT_CFG = {
  redige:  { label: 'Rédigé',  color: 'var(--health-blue)',  bg: 'rgba(10,132,255,0.1)' },
  valide:  { label: 'Validé',  color: 'var(--health-green)', bg: 'rgba(52,199,89,0.1)' },
}

export default function ConsultationsPage() {
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    getMesConsultations()
      .then(r => setConsultations(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/relations')}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} /> Retour
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Mes consultations
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Comptes-rendus de vos consultations médicales
          </p>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : consultations.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(10,132,255,0.1)' }}>
            <FileText size={28} style={{ color: 'var(--health-blue)' }} />
          </div>
          <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            Aucune consultation
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Vos comptes-rendus de consultation apparaîtront ici une fois rédigés par votre médecin.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map(c => {
            const cfg = STATUT_CFG[c.statut] ?? STATUT_CFG.redige
            return (
              <div key={c.id} className="rounded-2xl p-5 hover-lift"
                style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', borderLeft: `3px solid ${cfg.color}` }}>

                {/* En-tête */}
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} style={{ color: cfg.color }} />
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {format(new Date(c.date_consultation), "d MMMM yyyy", { locale: fr })}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Stethoscope size={12} style={{ color: 'var(--text-tertiary)' }} />
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{c.medecin}</p>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Rédigé le {format(new Date(c.created_at), 'd MMM yyyy', { locale: fr })}
                  </p>
                </div>

                {/* Diagnostic */}
                {c.diagnostic && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: 'var(--text-tertiary)' }}>
                      Diagnostic
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {c.diagnostic}
                    </p>
                  </div>
                )}

                {/* Recommandations */}
                {c.recommandations && (
                  <div className="px-4 py-3 rounded-xl"
                    style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: cfg.color }}>
                      Recommandations
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {c.recommandations}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
