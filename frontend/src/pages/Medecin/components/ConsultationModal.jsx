import { useState } from 'react'
import { X, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { creerConsultation, modifierConsultation } from '../../../services/medecinService'

const STATUTS = [
  { value: 'redige',  label: 'Rédigé',   color: 'var(--accent)' },
  { value: 'valide',  label: 'Validé',   color: 'var(--vital-green)' },
  { value: 'archive', label: 'Archivé',  color: 'var(--ink-3)' },
]

export default function ConsultationModal({ patientId, consultation, onSaved, onClose }) {
  const isEdit = !!consultation

  const [form, setForm] = useState({
    date_consultation: consultation?.date_consultation
      ? format(new Date(consultation.date_consultation), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    diagnostic:      consultation?.diagnostic      ?? '',
    recommandations: consultation?.recommandations ?? '',
    statut:          consultation?.statut          ?? 'redige',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let saved
      if (isEdit) {
        const res = await modifierConsultation(consultation.id, form)
        saved = res.data.data
      } else {
        const res = await creerConsultation({ ...form, patient_id: patientId })
        saved = res.data.data
      }
      toast.success(isEdit ? 'Consultation mise à jour.' : 'Consultation enregistrée.')
      onSaved(saved)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'var(--glass-card)',
          backdropFilter: 'blur(28px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
          maxHeight: '92vh', overflowY: 'auto',
          animation: 'scale-in 0.24s cubic-bezier(0.34,1.2,0.64,1) both',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--glass-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: 'var(--accent-dim)', border: '1px solid var(--border-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Calendar size={17} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.4px', margin: 0 }}>
              {isEdit ? 'Modifier la consultation' : 'Nouvelle consultation'}
            </h2>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 10,
            background: 'var(--surface-2)', border: '1px solid var(--border-0)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-3)', transition: 'all 0.15s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--ink-1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink-3)' }}
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Date */}
          <div>
            <label className="field-label">Date et heure de consultation</label>
            <input
              type="datetime-local"
              value={form.date_consultation}
              onChange={e => set('date_consultation', e.target.value)}
              required
              className="field-input"
            />
          </div>

          {/* Statut */}
          <div>
            <label className="field-label">Statut</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {STATUTS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('statut', s.value)}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 12,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    background: form.statut === s.value ? `${s.color}14` : 'var(--surface-2)',
                    color:      form.statut === s.value ? s.color : 'var(--ink-3)',
                    border:     `1.5px solid ${form.statut === s.value ? s.color : 'transparent'}`,
                    boxShadow:  form.statut === s.value ? `0 0 12px ${s.color}22` : 'none',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnostic */}
          <div>
            <label className="field-label">Diagnostic</label>
            <textarea
              value={form.diagnostic}
              onChange={e => set('diagnostic', e.target.value)}
              placeholder="Observations cliniques, résultats d'examen…"
              rows={4}
              className="field-input"
              style={{ resize: 'vertical', minHeight: 96 }}
            />
          </div>

          {/* Recommandations */}
          <div>
            <label className="field-label">Recommandations</label>
            <textarea
              value={form.recommandations}
              onChange={e => set('recommandations', e.target.value)}
              placeholder="Conseils, prescriptions, suivi à prévoir…"
              rows={3}
              className="field-input"
              style={{ resize: 'vertical', minHeight: 80 }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: 'var(--surface-2)', color: 'var(--ink-2)',
                border: '1px solid var(--border-0)', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 2, padding: '12px', borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                background: saving ? 'var(--surface-3)' : 'var(--accent)',
                color: saving ? 'var(--ink-3)' : '#0A1512',
                border: 'none',
                boxShadow: saving ? 'none' : '0 4px 18px rgba(0,221,160,0.28)',
                transition: 'all 0.18s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: 13, height: 13, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.25)',
                    borderTopColor: 'var(--ink-2)',
                    animation: 'spin 0.75s linear infinite',
                  }} />
                  Enregistrement…
                </>
              ) : isEdit ? 'Enregistrer les modifications' : 'Créer la consultation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
