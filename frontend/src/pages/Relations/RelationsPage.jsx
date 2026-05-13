import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stethoscope, Users, Search, UserCheck, UserX,
  MessageSquare, Calendar, X, Check, Clock, ChevronRight,
} from 'lucide-react'
import Illustration from '../../components/ui/Illustration'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import useAuthStore from '../../store/authStore'
import {
  getMonMedecin, getMedecinsDispos, envoyerDemande, terminerSuivi,
  getDemandes, repondreDemande, rechercherPatients,
} from '../../services/relationsService'
import { getPatients } from '../../services/medecinService'

export default function RelationsPage() {
  const { user } = useAuthStore()
  return user?.role === 'medecin' ? <MedecinView /> : <PatientView />
}

/* ════════════════════════════════════════════════════
   VUE PATIENT
════════════════════════════════════════════════════ */
function PatientView() {
  const [monMedecin,   setMonMedecin]   = useState(undefined) // undefined = loading
  const [confirmFin,   setConfirmFin]   = useState(false)
  const navigate = useNavigate()

  const loadMedecin = useCallback(() =>
    getMonMedecin()
      .then((r) => setMonMedecin(r.data.data))
      .catch(() => setMonMedecin(null)),
  [])

  useEffect(() => { loadMedecin() }, [loadMedecin])

  const handleTerminer = async () => {
    try {
      await terminerSuivi(monMedecin.relation_id)
      toast.success('Suivi terminé.')
      setMonMedecin(null)
    } catch {
      toast.error('Une erreur est survenue.')
    } finally {
      setConfirmFin(false)
    }
  }

  if (monMedecin === undefined) return <PageSkeleton />

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        icon={<Stethoscope size={20} color="white" />}
        title="Mon médecin"
        subtitle={monMedecin ? "Votre médecin traitant" : "Trouver un médecin"}
      />

      {monMedecin ? (
        <>
          {/* Card médecin actif */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-4 mb-5">
              <Avatar nom={monMedecin.nom} prenom={monMedecin.prenom} size="lg" color="blue" />
              <div>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Dr {monMedecin.prenom} {monMedecin.nom}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {monMedecin.specialite}
                </p>
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                  <Calendar size={11} />
                  Suivi depuis le {format(new Date(monMedecin.date_debut), 'd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <ActionButton
                icon={<MessageSquare size={15} />}
                label="Envoyer un message"
                onClick={() => navigate(`/messages?with=${monMedecin.id}`)}
                variant="primary"
              />
              <ActionButton
                icon={<Calendar size={15} />}
                label="Voir mes consultations"
                onClick={() => navigate('/consultations')}
                variant="secondary"
              />
              <ActionButton
                icon={<X size={15} />}
                label="Mettre fin au suivi"
                onClick={() => setConfirmFin(true)}
                variant="danger"
              />
            </div>
          </div>

          {/* Dialog confirmation fin de suivi */}
          {confirmFin && (
            <ConfirmDialog
              title="Mettre fin au suivi ?"
              message="Votre médecin n'aura plus accès à vos données. Vous pourrez en choisir un nouveau."
              confirmLabel="Terminer le suivi"
              variant="danger"
              onConfirm={handleTerminer}
              onCancel={() => setConfirmFin(false)}
            />
          )}
        </>
      ) : (
        <RecherchesMedecins onRelationCreee={loadMedecin} />
      )}
    </div>
  )
}

function RecherchesMedecins({ onRelationCreee }) {
  const [search,    setSearch]    = useState('')
  const [results,   setResults]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [demandes,  setDemandes]  = useState({}) // medecin_id → statut

  const handleSearch = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getMedecinsDispos(search)
      setResults(r.data.data ?? [])
    } catch {
      toast.error('Erreur lors de la recherche.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(handleSearch, 400)
    return () => clearTimeout(t)
  }, [handleSearch])

  const envoyerDem = async (medecin_id) => {
    try {
      await envoyerDemande(medecin_id)
      setDemandes((prev) => ({ ...prev, [medecin_id]: 'en_attente' }))
      toast.success('Demande envoyée !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Illustration vide */}
      <div
        className="rounded-2xl p-8"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}
      >
        <Illustration name="empty-medecin" width={220} height={220} />
        <div>
          <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Aucun médecin lié
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Recherchez un médecin et envoyez-lui une demande de suivi.
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div
        className="flex items-center gap-3 px-4 rounded-2xl"
        style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}
      >
        <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou spécialité…"
          className="flex-1 py-3.5 bg-transparent outline-none text-sm"
          style={{ color: 'var(--text-primary)', border: 'none', fontFamily: 'DM Sans' }}
        />
      </div>

      {/* Résultats */}
      {loading ? (
        <SkeletonList count={3} />
      ) : results.length === 0 ? (
        <p className="text-center text-sm py-4" style={{ color: 'var(--text-tertiary)' }}>
          {search ? 'Aucun médecin trouvé pour cette recherche.' : 'Commencez à taper pour rechercher…'}
        </p>
      ) : (
        <div className="space-y-3">
          {results.map((m) => {
            const statut = demandes[m.id]
            return (
              <div
                key={m.id}
                className="flex items-center gap-4 rounded-2xl p-4"
                style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
              >
                <Avatar nom={m.nom} prenom={m.prenom} size="md" color="blue" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    Dr {m.prenom} {m.nom}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.specialite}</p>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      background: m.disponible ? 'rgba(52,199,89,0.12)' : 'rgba(142,142,147,0.12)',
                      color: m.disponible ? 'var(--health-green)' : 'var(--text-tertiary)',
                    }}
                  >
                    {m.disponible ? 'Disponible' : 'Complet'}
                  </span>
                </div>
                {statut === 'en_attente' ? (
                  <span
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)' }}
                  >
                    <Clock size={12} /> Demande envoyée
                  </span>
                ) : (
                  <button
                    onClick={() => envoyerDem(m.id)}
                    disabled={!m.disponible}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
                    style={{
                      background: m.disponible ? 'var(--health-blue)' : 'var(--bg-tertiary)',
                      color: m.disponible ? 'white' : 'var(--text-tertiary)',
                      border: 'none',
                      cursor: m.disponible ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Envoyer une demande
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════
   VUE MÉDECIN
════════════════════════════════════════════════════ */
function MedecinView() {
  const [tab, setTab] = useState('patients')
  const [demandes, setDemandes] = useState([])
  const [patients, setPatients] = useState([])
  const [searchPatient, setSearchPatient] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const navigate = useNavigate()

  const loadDemandes = useCallback(() =>
    getDemandes().then((r) => setDemandes(r.data.data ?? [])).catch(() => {}),
  [])

  // "Mes patients" = uniquement les patients effectivement liés au médecin
  const loadPatients = useCallback(() =>
    getPatients().then((r) => setPatients(r.data.data ?? [])).catch(() => {}),
  [])

  useEffect(() => {
    loadDemandes()
    loadPatients()
  }, [loadDemandes, loadPatients])

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!searchPatient) { setSearchResults([]); return }
      setSearchLoading(true)
      try {
        const r = await rechercherPatients(searchPatient)
        setSearchResults(r.data.data ?? [])
      } finally {
        setSearchLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [searchPatient])

  const handleRepondre = async (demande_id, action) => {
    try {
      await repondreDemande(demande_id, action)
      toast.success(action === 'accepter' ? 'Patient accepté !' : 'Demande refusée.')
      setDemandes((prev) => prev.filter((d) => d.id !== demande_id))
      if (action === 'accepter') loadPatients()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    }
  }

  const TABS = [
    { key: 'patients',  label: 'Mes patients' },
    { key: 'demandes',  label: 'Demandes reçues', count: demandes.length },
    { key: 'recherche', label: 'Rechercher un patient' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        icon={<Users size={20} color="white" />}
        title="Patients & demandes"
        subtitle="Gérez vos patients et les demandes de suivi"
        gradient="135deg, #34C759, #0A84FF"
      />

      {/* Onglets */}
      <div
        className="flex rounded-2xl p-1 gap-1"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: tab === t.key ? 'var(--bg-card)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: tab === t.key ? 'var(--shadow-card)' : 'none',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className="min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'var(--health-red)' }}
              >
                {t.count > 9 ? '9+' : t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu onglet */}
      {tab === 'patients' && (
        <div className="space-y-3">
          {patients.length === 0 ? (
            <EmptyState icon={<Users size={24} />} text="Aucun patient pour l'instant." />
          ) : (
            patients.map((p) => (
              <PatientCard
                key={p.id}
                patient={p}
                onMessage={() => navigate(`/messages?with=${p.id}`)}
              />
            ))
          )}
        </div>
      )}

      {tab === 'demandes' && (
        <div className="space-y-3">
          {demandes.length === 0 ? (
            <EmptyState icon={<Clock size={24} />} text="Aucune demande en attente." />
          ) : (
            demandes.map((d) => (
              <DemandeCard
                key={d.id}
                demande={d}
                onAccepter={() => handleRepondre(d.id, 'accepter')}
                onRefuser={() => handleRepondre(d.id, 'refuser')}
              />
            ))
          )}
        </div>
      )}

      {tab === 'recherche' && (
        <div className="space-y-4">
          <div
            className="flex items-center gap-3 px-4 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}
          >
            <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              className="flex-1 py-3.5 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)', border: 'none', fontFamily: 'DM Sans' }}
            />
          </div>

          {searchLoading ? (
            <SkeletonList count={3} />
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 rounded-2xl p-4"
                  style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
                >
                  <Avatar nom={p.nom} prenom={p.prenom} size="md" color="green" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {p.prenom} {p.nom}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{p.email}</p>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
                    style={{ background: 'var(--health-green)', border: 'none', cursor: 'pointer' }}
                    onClick={() => toast.success(`Invitation envoyée à ${p.prenom} ${p.nom}.`)}
                  >
                    Inviter
                  </button>
                </div>
              ))}
            </div>
          ) : searchPatient ? (
            <p className="text-center text-sm py-4" style={{ color: 'var(--text-tertiary)' }}>
              Aucun patient trouvé.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES
════════════════════════════════════════════════════ */

function PatientCard({ patient, onMessage }) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl p-4"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <Avatar nom={patient.nom} prenom={patient.prenom} size="md" color="green" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          {patient.prenom} {patient.nom}
        </p>
        {patient.age && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{patient.age} ans</p>
        )}
      </div>
      <button
        onClick={onMessage}
        className="p-2 rounded-xl transition-all"
        style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}
        title="Envoyer un message"
      >
        <MessageSquare size={16} />
      </button>
      <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
    </div>
  )
}

function DemandeCard({ demande, onAccepter, onRefuser }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center gap-4 mb-3">
        <Avatar nom={demande.patient.nom} prenom={demande.patient.prenom} size="md" color="purple" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {demande.patient.prenom} {demande.patient.nom}
          </p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            {demande.patient.age && `${demande.patient.age} ans · `}
            <Clock size={10} />
            {format(new Date(demande.created_at), 'd MMM yyyy', { locale: fr })}
          </p>
        </div>
      </div>
      {demande.message && (
        <p className="text-xs mb-3 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          "{demande.message}"
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={onRefuser}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(255,45,85,0.1)', color: '#FF2D55', border: 'none', cursor: 'pointer' }}
        >
          <UserX size={14} /> Refuser
        </button>
        <button
          onClick={onAccepter}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'var(--health-green)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(52,199,89,0.3)' }}
        >
          <UserCheck size={14} /> Accepter
        </button>
      </div>
    </div>
  )
}

function Avatar({ nom, prenom, size = 'md', color = 'blue' }) {
  const initials = `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase()
  const gradients = {
    blue:   'linear-gradient(135deg, #0A84FF, #5AC8FA)',
    green:  'linear-gradient(135deg, #34C759, #30D158)',
    purple: 'linear-gradient(135deg, #BF5AF2, #AF52DE)',
  }
  const sizes = { sm: 32, md: 40, lg: 52 }
  const s = sizes[size]
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
      style={{ width: s, height: s, background: gradients[color], fontSize: s * 0.35 }}
    >
      {initials}
    </div>
  )
}

function ActionButton({ icon, label, onClick, variant = 'primary' }) {
  const styles = {
    primary:   { background: 'var(--health-blue)', color: 'white', boxShadow: '0 4px 12px rgba(10,132,255,0.25)' },
    secondary: { background: 'var(--bg-secondary)', color: 'var(--text-primary)' },
    danger:    { background: 'rgba(255,45,85,0.1)', color: '#FF2D55' },
  }
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
      style={{ border: 'none', cursor: 'pointer', ...styles[variant] }}
    >
      {icon} {label}
    </button>
  )
}

function PageHeader({ icon, title, subtitle, gradient = '135deg, #0A84FF, #BF5AF2' }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `linear-gradient(${gradient})`, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
      >
        {icon}
      </div>
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          {title}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
      </div>
    </div>
  )
}

function ConfirmDialog({ title, message, confirmLabel, variant = 'danger', onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-modal)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: '#FF2D55', border: 'none', cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-center mb-3" style={{ color: 'var(--text-tertiary)' }}>
        {icon}
      </div>
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{text}</p>
    </div>
  )
}

function SkeletonList({ count }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-2xl skeleton-pulse"
          style={{ background: 'var(--bg-secondary)' }}
        />
      ))}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="h-12 rounded-2xl skeleton-pulse" style={{ background: 'var(--bg-secondary)' }} />
      <div className="h-48 rounded-2xl skeleton-pulse" style={{ background: 'var(--bg-secondary)' }} />
    </div>
  )
}
