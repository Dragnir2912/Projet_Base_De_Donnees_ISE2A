import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ArrowLeft, FileText, Stethoscope } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getMesConsultations } from '../../services/profilService'

const STATUT_CFG = {
  redige:  { label: 'Rédigé',  color: 'var(--accent)',  bg: 'rgba(46,155,131,0.1)' },
  valide:  { label: 'Validé',  color: 'var(--vital-green)', bg: 'rgba(52,199,89,0.1)' },
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
    <div className="max-w-2xl mx-auto space-y-6 page-enter">

      {/* Retour */}
      <button
        onClick={() => navigate('/relations')}
        className="flex items-center gap-2 text-sm font-medium animate-fade-up"
        style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={18} /> Retour
      </button>

      {/* Hero Banner */}
      <div style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden',
        height: 170, background: 'var(--surface-1)', border: '1px solid var(--border-0)',
      }} className="animate-fade-up">
        <div style={{ position: 'absolute', right: 0, top: 0, width: '48%', height: '100%' }}>
          <img src="/illustrations/hero/illus-doctor-consultation.jpeg" alt="" aria-hidden
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--surface-1) 0%, rgba(10,21,18,0.52) 38%, transparent 75%)' }} />
        </div>
        <div style={{
          position: 'relative', zIndex: 1, height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '24px 32px',
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <Stethoscope size={10} /> Suivi médical
            </span>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-1.2px', lineHeight: 1.1, margin: 0 }}>
              Mes consultations
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            {consultations.length > 0
              ? `${consultations.length} consultation${consultations.length > 1 ? 's' : ''} enregistrée${consultations.length > 1 ? 's' : ''}`
              : 'Comptes-rendus de vos consultations médicales'}
          </p>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : consultations.length === 0 ? (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-48 flex-shrink-0 flex items-center justify-center p-6"
              style={{ background: 'linear-gradient(135deg, rgba(46,155,131,0.07), rgba(26,124,108,0.03))' }}>
              <img src="/illustrations/feature/illus-patient-medication-woman.jpeg" alt="" aria-hidden
                style={{ width: 140, height: 140, objectFit: 'contain' }} />
            </div>
            <div className="p-8 text-center md:text-left">
              <p className="font-bold text-lg" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Aucune consultation
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Vos comptes-rendus de consultation apparaîtront ici une fois rédigés par votre médecin.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map(c => {
            const cfg = STATUT_CFG[c.statut] ?? STATUT_CFG.redige
            return (
              <div key={c.id} className="rounded-2xl p-5 card-hover"
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

