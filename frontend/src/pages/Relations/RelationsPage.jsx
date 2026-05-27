import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stethoscope, Users, Search, UserCheck, UserX,
  MessageSquare, Calendar, X, Clock, ChevronRight, SendHorizontal,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import useAuthStore from '../../store/authStore'
import {
  getMonMedecin, getMedecinsDispos, envoyerDemande, terminerSuivi,
  getDemandes, repondreDemande, rechercherPatients, getMesDemandes,
  getMesInvitations, repondreInvitation, envoyerInvitation,
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
  const [monMedecin, setMonMedecin] = useState(undefined)
  const [confirmFin, setConfirmFin] = useState(false)
  const navigate = useNavigate()

  const loadMedecin = useCallback(() =>
    getMonMedecin()
      .then(r => setMonMedecin(r.data.data ?? null))
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
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      <HeroBanner
        icon={<Stethoscope size={10} />}
        label="Suivi médical"
        title="Mon médecin"
        subtitle={monMedecin
          ? 'Votre médecin traitant vous accompagne'
          : 'Trouvez un médecin et démarrez votre suivi'}
        imgSrc="/illustrations/hero/medical-team.jpg"
      />

      {monMedecin ? (
        <>
          <GlassCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar nom={monMedecin.nom} prenom={monMedecin.prenom} size="lg" color="blue" />
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.4px' }}>
                  Dr {monMedecin.prenom} {monMedecin.nom}
                </p>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '3px 0 0' }}>
                  {monMedecin.specialite}
                </p>
                <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={11} />
                  Suivi depuis le {format(new Date(monMedecin.date_debut), 'd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ActionButton icon={<MessageSquare size={15} />} label="Envoyer un message"
                onClick={() => navigate(`/messages?with=${monMedecin.id}`)} variant="primary" />
              <ActionButton icon={<Calendar size={15} />} label="Voir mes consultations"
                onClick={() => navigate('/consultations')} variant="secondary" />
              <ActionButton icon={<X size={15} />} label="Mettre fin au suivi"
                onClick={() => setConfirmFin(true)} variant="danger" />
            </div>
          </GlassCard>

          {confirmFin && (
            <ConfirmDialog
              title="Mettre fin au suivi ?"
              message="Votre médecin n'aura plus accès à vos données. Vous pourrez en choisir un nouveau."
              confirmLabel="Terminer le suivi"
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
  const [search,       setSearch]       = useState('')
  const [allDoctors,   setAllDoctors]   = useState([])
  const [results,      setResults]      = useState([])
  const [loadingAll,   setLoadingAll]   = useState(true)
  const [loadingSearch,setLoadingSearch]= useState(false)
  const [sentRequests,  setSentRequests]  = useState({})
  const [myRequests,    setMyRequests]    = useState([])
  const [invitations,   setInvitations]   = useState([])

  // Charge tout au montage
  useEffect(() => {
    setLoadingAll(true)
    Promise.all([
      getMedecinsDispos(''),
      getMesDemandes().catch(() => ({ data: { data: [] } })),
      getMesInvitations().catch(() => ({ data: { data: [] } })),
    ])
      .then(([docRes, demRes, invRes]) => {
        const docs = docRes.data.data ?? []
        setAllDoctors(docs)
        setResults(docs)
        const pending = demRes.data.data ?? []
        setMyRequests(pending)
        const map = {}
        pending.forEach(d => { map[d.medecin.id] = d.statut })
        setSentRequests(map)
        setInvitations(invRes.data.data ?? [])
      })
      .catch(() => toast.error('Erreur lors du chargement.'))
      .finally(() => setLoadingAll(false))
  }, [])

  // Filtre local quand on tape
  useEffect(() => {
    if (!search.trim()) {
      setResults(allDoctors)
      return
    }
    setLoadingSearch(true)
    const t = setTimeout(async () => {
      try {
        const r = await getMedecinsDispos(search)
        setResults(r.data.data ?? [])
      } catch {
        /* silent */
      } finally {
        setLoadingSearch(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [search, allDoctors])

  const envoyerDem = async (medecin_id) => {
    try {
      await envoyerDemande(medecin_id)
      setSentRequests(prev => ({ ...prev, [medecin_id]: 'en_attente' }))
      toast.success('Demande envoyée !')
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'envoi.")
    }
  }

  const handleRepondreInvitation = async (invitation_id, action, medecin_id) => {
    try {
      await repondreInvitation(invitation_id, action)
      setInvitations(prev => prev.filter(i => i.id !== invitation_id))
      if (action === 'accepter') {
        toast.success('Invitation acceptée ! Votre médecin peut maintenant vous suivre.')
        onRelationCreee()
      } else {
        toast.success('Invitation refusée.')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    }
  }

  const loading = loadingAll || loadingSearch

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Invitations reçues de médecins ── */}
      {invitations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Stethoscope size={11} /> Invitations reçues
          </p>
          {invitations.map(inv => (
            <div key={inv.id} style={{
              borderRadius: 16, padding: '16px 18px',
              background: 'var(--glass-card)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border-2)',
              boxShadow: '0 0 0 1px var(--accent-glow)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar nom={inv.medecin.nom} prenom={inv.medecin.prenom} size="md" color="blue" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)', margin: 0 }}>
                    Dr {inv.medecin.prenom} {inv.medecin.nom}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>{inv.medecin.specialite}</p>
                  <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '3px 0 0' }}>
                    Vous invite à démarrer un suivi médical
                  </p>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                  background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-2)',
                }}>
                  {formatDistanceToNow(new Date(inv.created_at), { locale: fr, addSuffix: true })}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleRepondreInvitation(inv.id, 'refuser', inv.medecin.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px', borderRadius: 11, fontSize: 12, fontWeight: 600,
                    background: 'rgba(255,92,106,0.08)', color: 'var(--vital-red)',
                    border: '1px solid rgba(255,92,106,0.15)', cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                >
                  <UserX size={13} /> Refuser
                </button>
                <button
                  onClick={() => handleRepondreInvitation(inv.id, 'accepter', inv.medecin.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px', borderRadius: 11, fontSize: 12, fontWeight: 600,
                    background: 'var(--accent)', color: '#0A1512',
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 14px var(--accent-glow)', transition: 'all 0.15s ease',
                  }}
                >
                  <UserCheck size={13} /> Accepter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bannière info */}
      <div style={{
        borderRadius: 18, padding: '18px 20px',
        background: 'var(--glass-card)',
        backdropFilter: 'blur(24px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
        border: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: 'var(--accent-dim)', border: '1px solid var(--border-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Stethoscope size={19} color="var(--accent)" />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            Aucun médecin lié
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, margin: 0 }}>
            Envoyez une demande à un médecin disponible. Votre suivi démarrera dès son acceptation.
          </p>
        </div>
      </div>

      {/* Demandes en attente / refusées */}
      {myRequests.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)', margin: 0 }}>
            Vos demandes
          </p>
          {myRequests.map(d => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              borderRadius: 14, padding: '12px 16px',
              background: 'var(--glass-card)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
            }}>
              <Avatar nom={d.medecin.nom} prenom={d.medecin.prenom} size="sm" color="blue" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', margin: 0 }}>
                  Dr {d.medecin.prenom} {d.medecin.nom}
                </p>
                <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '2px 0 0' }}>
                  {formatDistanceToNow(new Date(d.created_at), { locale: fr, addSuffix: true })}
                </p>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                background: d.statut === 'en_attente' ? 'var(--accent-dim)' : 'rgba(255,92,106,0.10)',
                color: d.statut === 'en_attente' ? 'var(--accent)' : 'var(--vital-red)',
                border: `1px solid ${d.statut === 'en_attente' ? 'var(--border-2)' : 'rgba(255,92,106,0.18)'}`,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {d.statut === 'en_attente' ? <><Clock size={9} /> En attente</> : <>Refusée</>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Barre de recherche */}
      <SearchBar
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher par nom..."
      />

      {/* Résultats */}
      {loading ? (
        <SkeletonList count={3} />
      ) : results.length === 0 ? (
        <div style={{
          borderRadius: 16, padding: '28px 20px', textAlign: 'center',
          background: 'var(--glass-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            {search ? 'Aucun médecin trouvé pour cette recherche.' : 'Aucun médecin disponible pour le moment.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map(m => {
            const statut = sentRequests[m.id]
            return (
              <GlassCard key={m.id} inline>
                <Avatar nom={m.nom} prenom={m.prenom} size="md" color="blue" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', margin: 0 }}>
                    Dr {m.prenom} {m.nom}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: '2px 0 4px' }}>{m.specialite}</p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                    background: m.disponible ? 'rgba(52,199,89,0.10)' : 'rgba(142,142,147,0.10)',
                    color: m.disponible ? 'var(--vital-green)' : 'var(--ink-3)',
                  }}>
                    {m.disponible ? '● Disponible' : '● Complet'}
                  </span>
                </div>
                {statut === 'en_attente' ? (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                    padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-2)',
                  }}>
                    <Clock size={12} /> En attente
                  </span>
                ) : (
                  <button
                    onClick={() => m.disponible && envoyerDem(m.id)}
                    disabled={!m.disponible}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                      padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                      background: m.disponible ? 'var(--accent)' : 'var(--surface-3)',
                      color: m.disponible ? '#0A1512' : 'var(--ink-4)',
                      border: 'none', cursor: m.disponible ? 'pointer' : 'not-allowed',
                      boxShadow: m.disponible ? '0 2px 10px rgba(0,221,160,0.22)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <SendHorizontal size={12} /> Envoyer
                  </button>
                )}
              </GlassCard>
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
  const [tab,           setTab]           = useState('patients')
  const [demandes,      setDemandes]      = useState([])
  const [patients,      setPatients]      = useState([])
  const [searchPatient,    setSearchPatient]    = useState('')
  const [allPatients,      setAllPatients]      = useState([])
  const [patientsLoading,  setPatientsLoading]  = useState(true)
  const [sentInvitations,  setSentInvitations]  = useState({})
  const navigate = useNavigate()

  const loadDemandes = useCallback(() =>
    getDemandes().then(r => setDemandes(r.data.data ?? [])).catch(() => {}),
  [])

  const loadPatients = useCallback(() =>
    getPatients().then(r => setPatients(r.data.data ?? [])).catch(() => {}),
  [])

  const loadAllPatients = useCallback(() => {
    setPatientsLoading(true)
    rechercherPatients('')
      .then(r => {
        const list = r.data.data ?? []
        setAllPatients(list)
        const map = {}
        list.forEach(p => { if (p.invitation_envoyee) map[p.id] = true })
        setSentInvitations(map)
      })
      .catch(() => {})
      .finally(() => setPatientsLoading(false))
  }, [])

  useEffect(() => {
    loadDemandes()
    loadPatients()
    loadAllPatients()
  }, [loadDemandes, loadPatients, loadAllPatients])

  // Filtrage local
  const filteredPatients = allPatients.filter(p => {
    if (!searchPatient.trim()) return true
    const q = searchPatient.toLowerCase()
    return (
      p.nom?.toLowerCase().includes(q) ||
      p.prenom?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    )
  })

  const handleRepondre = async (demande_id, action) => {
    try {
      await repondreDemande(demande_id, action)
      toast.success(action === 'accepter' ? 'Patient accepté !' : 'Demande refusée.')
      setDemandes(prev => prev.filter(d => d.id !== demande_id))
      if (action === 'accepter') loadPatients()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    }
  }

  const TABS = [
    { key: 'patients',  label: 'Mes patients' },
    { key: 'demandes',  label: 'Demandes reçues', count: demandes.length },
    { key: 'recherche', label: 'Rechercher' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      <HeroBanner
        icon={<Users size={10} />}
        label="Gestion des patients"
        title="Patients & demandes"
        subtitle={patients.length > 0 ? `${patients.length} patient${patients.length > 1 ? 's' : ''} sous votre suivi` : 'Gérez vos patients et les demandes'}
        imgSrc="/illustrations/artwork/people-community.jpg"
      />

      {/* Onglets */}
      <div className="pill-tabs" style={{ width: '100%' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pill-tab${tab === t.key ? ' active' : ''}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                minWidth: 18, height: 18, padding: '0 4px', borderRadius: 99,
                background: 'var(--vital-red)', color: 'white', fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t.count > 9 ? '9+' : t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu onglets */}
      {tab === 'patients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {patients.length === 0 ? (
            <EmptyState icon={<Users size={24} />} text="Aucun patient pour l'instant." />
          ) : (
            patients.map(p => (
              <GlassCard key={p.id} inline>
                <Avatar nom={p.nom} prenom={p.prenom} size="md" color="green" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', margin: 0 }}>
                    {p.prenom} {p.nom}
                  </p>
                  {p.age && <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '2px 0 0' }}>{p.age} ans</p>}
                </div>
                <button onClick={() => navigate(`/messages?with=${p.id}`)}
                  style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: 'var(--accent-dim)', border: '1px solid var(--border-2)',
                    color: 'var(--accent)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,221,160,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
                >
                  <MessageSquare size={15} />
                </button>
                <ChevronRight size={14} color="var(--ink-4)" />
              </GlassCard>
            ))
          )}
        </div>
      )}

      {tab === 'demandes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {demandes.length === 0 ? (
            <EmptyState icon={<Clock size={24} />} text="Aucune demande en attente." />
          ) : (
            demandes.map(d => (
              <GlassCard key={d.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <Avatar nom={d.patient.nom} prenom={d.patient.prenom} size="md" color="purple" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', margin: 0 }}>
                      {d.patient.prenom} {d.patient.nom}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {d.patient.age && `${d.patient.age} ans · `}
                      <Clock size={10} />
                      {format(new Date(d.created_at), 'd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                {d.message && (
                  <p style={{
                    fontSize: 12, marginBottom: 14, padding: '8px 12px', borderRadius: 10,
                    background: 'var(--surface-2)', color: 'var(--ink-2)',
                    border: '1px solid var(--border-0)', fontStyle: 'italic',
                  }}>
                    "{d.message}"
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleRepondre(d.id, 'refuser')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                      background: 'rgba(255,92,106,0.08)', color: 'var(--vital-red)',
                      border: '1px solid rgba(255,92,106,0.15)', cursor: 'pointer', transition: 'all 0.15s ease',
                    }}
                  >
                    <UserX size={14} /> Refuser
                  </button>
                  <button onClick={() => handleRepondre(d.id, 'accepter')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                      background: 'var(--vital-green)', color: 'white',
                      border: 'none', cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(52,199,89,0.28)', transition: 'all 0.15s ease',
                    }}
                  >
                    <UserCheck size={14} /> Accepter
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {tab === 'recherche' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SearchBar
            value={searchPatient}
            onChange={e => setSearchPatient(e.target.value)}
            placeholder="Filtrer par nom ou email…"
          />

          {/* Compteurs */}
          {!patientsLoading && allPatients.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--vital-green)', fontWeight: 600 }}>
                {filteredPatients.filter(p => p.disponible).length} disponible{filteredPatients.filter(p => p.disponible).length !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                {filteredPatients.filter(p => !p.disponible).length} déjà suivi{filteredPatients.filter(p => !p.disponible).length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {patientsLoading ? (
            <SkeletonList count={4} />
          ) : filteredPatients.length === 0 ? (
            <EmptyState
              icon={<Users size={22} />}
              text={searchPatient ? 'Aucun patient trouvé pour cette recherche.' : 'Aucun patient enregistré.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredPatients.map(p => {
                const dejaInvite = sentInvitations[p.id] || p.invitation_envoyee
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    borderRadius: 14, padding: '12px 16px',
                    background: 'var(--glass-card)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${p.disponible ? 'var(--glass-border)' : 'var(--border-0)'}`,
                    opacity: p.disponible ? 1 : 0.55,
                    transition: 'opacity 0.15s ease',
                  }}>
                    <Avatar nom={p.nom} prenom={p.prenom} size="md" color={p.disponible ? 'green' : 'blue'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', margin: 0 }}>
                          {p.prenom} {p.nom}
                        </p>
                        {p.disponible ? (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                            background: 'rgba(52,199,89,0.12)', color: 'var(--vital-green)',
                          }}>
                            Disponible
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                            background: 'var(--surface-3)', color: 'var(--ink-3)',
                          }}>
                            Déjà suivi
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '2px 0 0' }}>{p.email}</p>
                    </div>

                    {p.disponible && (
                      dejaInvite ? (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                          padding: '5px 10px', borderRadius: 9, fontSize: 11, fontWeight: 600,
                          background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-2)',
                        }}>
                          <Clock size={10} /> En attente
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await envoyerInvitation(p.id)
                              setSentInvitations(prev => ({ ...prev, [p.id]: true }))
                              toast.success(`Invitation envoyée à ${p.prenom} ${p.nom}.`)
                            } catch (err) {
                              toast.error(err.response?.data?.error || "Erreur lors de l'envoi.")
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                            padding: '7px 12px', borderRadius: 9, fontSize: 11, fontWeight: 600,
                            background: 'var(--accent)', color: '#0A1512', border: 'none', cursor: 'pointer',
                            boxShadow: '0 2px 8px var(--accent-glow)', transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <SendHorizontal size={11} /> Inviter
                        </button>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES
════════════════════════════════════════════════════ */

function HeroBanner({ icon, label, title, subtitle, imgSrc }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 24, overflow: 'hidden',
      height: 180, background: 'var(--surface-1)', border: '1px solid var(--border-0)',
    }} className="animate-fade-up">
      <div style={{ position: 'absolute', right: 0, top: 0, width: '75%', height: '100%' }}>
        <img src={imgSrc} alt="" aria-hidden style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--surface-1) 0%, rgba(236, 240, 239, 0.5) 50%, transparent 85%)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, background: 'radial-gradient(circle, rgba(0,221,160,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 32px', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5 }}>
          {icon} {label}
        </span>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-1.2px', lineHeight: 1.1, margin: 0 }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>{subtitle}</p>
      </div>
    </div>
  )
}

function GlassCard({ children, inline = false }) {
  return (
    <div style={{
      borderRadius: 18, padding: inline ? '14px 18px' : '20px',
      display: inline ? 'flex' : 'block',
      alignItems: inline ? 'center' : undefined,
      gap: inline ? 14 : undefined,
      background: 'var(--glass-card)',
      backdropFilter: 'blur(24px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
      border: '1px solid var(--glass-border)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    }}>
      {children}
    </div>
  )
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
      borderRadius: 16,
      background: 'var(--glass-card)',
      backdropFilter: 'blur(20px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
      border: '1.5px solid var(--glass-border)',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    }}
      onFocusCapture={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,221,160,0.10)' }}
      onBlurCapture={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <Search size={15} color="var(--ink-3)" style={{ flexShrink: 0 }} />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          flex: 1, background: 'none', outline: 'none', fontSize: 14,
          color: 'var(--ink-1)', border: 'none', fontFamily: 'Poppins, system-ui',
        }}
      />
    </div>
  )
}

function Avatar({ nom, prenom, size = 'md', color = 'blue' }) {
  const initials = `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase()
  const gradients = {
    blue:   'linear-gradient(135deg, #2E9B83, #40B896)',
    green:  'linear-gradient(135deg, #34C759, #30D158)',
    purple: 'linear-gradient(135deg, #9B77F5, #7B5CF5)',
  }
  const sizes = { sm: 32, md: 40, lg: 52 }
  const s = sizes[size]
  return (
    <div style={{
      width: s, height: s, borderRadius: '50%', flexShrink: 0,
      background: gradients[color],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: s * 0.35, fontWeight: 700, color: 'white',
    }}>
      {initials}
    </div>
  )
}

function ActionButton({ icon, label, onClick, variant = 'primary' }) {
  const styles = {
    primary:   { background: 'var(--accent)', color: '#0A1512', boxShadow: '0 4px 14px rgba(0,221,160,0.25)' },
    secondary: { background: 'var(--surface-2)', color: 'var(--ink-1)', border: '1px solid var(--border-0)' },
    danger:    { background: 'rgba(255,92,106,0.08)', color: 'var(--vital-red)', border: '1px solid rgba(255,92,106,0.15)' },
  }
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
      padding: '11px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
      border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
      ...styles[variant],
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {icon} {label}
    </button>
  )
}

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    }} onClick={onCancel}>
      <div style={{
        width: '100%', maxWidth: 380, borderRadius: 20, padding: '24px',
        background: 'var(--glass-card)',
        backdropFilter: 'blur(28px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
        animation: 'scale-in 0.22s cubic-bezier(0.34,1.2,0.64,1) both',
      }} onClick={e => e.stopPropagation()}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 20px', lineHeight: 1.65 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--border-0)', cursor: 'pointer',
          }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            background: 'var(--vital-red)', color: 'white', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255,92,106,0.28)',
          }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div style={{
      borderRadius: 18, padding: '32px', textAlign: 'center',
      background: 'var(--glass-card)',
      backdropFilter: 'blur(20px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
      border: '1px solid var(--glass-border)',
    }}>
      <div style={{ color: 'var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        {icon}
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>{text}</p>
    </div>
  )
}

function SkeletonList({ count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 64, borderRadius: 16, background: 'var(--surface-2)' }} />
      ))}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 48, borderRadius: 16, background: 'var(--surface-2)' }} />
      <div className="skeleton" style={{ height: 180, borderRadius: 24, background: 'var(--surface-2)' }} />
    </div>
  )
}
