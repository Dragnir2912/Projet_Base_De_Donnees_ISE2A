import { useState } from 'react'
import { X, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { creerConsultation, modifierConsultation } from '../../../services/medecinService'

const STATUTS = [
  { value: 'redige',  label: 'Rédigé',   color: 'var(--health-blue)' },
  { value: 'valide',  label: 'Validé',   color: 'var(--health-green)' },
  { value: 'archive', label: 'Archivé',  color: 'var(--text-tertiary)' },
]

/**
 * Modal de création / modification d'une consultation.
 *
 * Props:
 *   patientId  – int
 *   consultation – objet existant (null = création)
 *   onSaved(consultation) – callback après sauvegarde
 *   onClose() – callback fermeture
 */
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
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-modal)', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(10,132,255,0.1)' }}>
              <Calendar size={18} style={{ color: 'var(--health-blue)' }} />
            </div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              {isEdit ? 'Modifier la consultation' : 'Nouvelle consultation'}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">

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
            <div className="flex gap-2 mt-1">
              {STATUTS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('statut', s.value)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: form.statut === s.value ? `${s.color}18` : 'var(--bg-secondary)',
                    color:      form.statut === s.value ? s.color : 'var(--text-tertiary)',
                    border:     form.statut === s.value ? `1.5px solid ${s.color}` : '1.5px solid transparent',
                    cursor: 'pointer',
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
              className="field-input resize-none"
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
              className="field-input resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{
                background: saving ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #0A84FF, #5AC8FA)',
                color: saving ? 'var(--text-tertiary)' : 'white',
                boxShadow: saving ? 'none' : '0 4px 14px rgba(10,132,255,0.3)',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer les modifications' : 'Créer la consultation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
