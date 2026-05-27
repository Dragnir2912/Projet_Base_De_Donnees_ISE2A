import { useEffect, useState } from 'react'
import { LogOut, Save, User, Shield, BellRing, Palette, Sun, Moon, ChevronRight, AlertCircle } from 'lucide-react'
import Illustration from '../../components/ui/Illustration'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { getProfil, updateProfil, getPreferences, updatePreferences } from '../../services/profilService'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'

const SECTIONS = [
  { key: 'info',   icon: User,    label: 'Informations personnelles' },
  { key: 'prefs',  icon: BellRing, label: 'Préférences' },
  { key: 'theme',  icon: Palette, label: 'Apparence' },
  { key: 'compte', icon: Shield,  label: 'Compte & sécurité' },
]

const PREFS_CONFIG = [
  { cle: 'notifications_email', label: 'Notifications par email',      desc: 'Recevez vos alertes par email' },
  { cle: 'vitascore_visible',   label: 'VitaScore sur le dashboard',  desc: 'Afficher votre score de santé global' },
  { cle: 'alertes_push',        label: 'Alertes push',                desc: 'Activez les notifications push' },
]

export default function ProfilPage() {
  const { user, logout, setUser } = useAuthStore()
  const { theme, setTheme }       = useThemeStore()
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState('info')
  const [form,    setForm]    = useState({ nom: '', prenom: '', date_naissance: '', taille_cm: '' })
  const [prefs,   setPrefs]   = useState({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    Promise.all([getProfil(), getPreferences()])
      .then(([p, pr]) => {
        const u = p.data.data ?? {}
        setForm({
          nom:            u.nom            ?? '',
          prenom:         u.prenom         ?? '',
          date_naissance: u.date_naissance ?? '',
          taille_cm:      u.taille_cm      ?? '',
        })
        setPrefs(pr.data.data ?? {})
      })
      .catch(() => toast.error('Impossible de charger le profil.'))
      .finally(() => setLoading(false))
  }, [])

  const onSaveProfil = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateProfil(form)
      setUser(res.data.data?.user ?? res.data.data)
      toast.success('Profil mis à jour !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  const onTogglePref = async (cle, currentVal) => {
    const newVal = currentVal === 'true' ? 'false' : 'true'
    setPrefs((prev) => ({ ...prev, [cle]: newVal }))
    try {
      await updatePreferences({ [cle]: newVal })
    } catch {
      setPrefs((prev) => ({ ...prev, [cle]: currentVal }))
      toast.error('Impossible de sauvegarder la préférence.')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="flex gap-6 page-enter">
      {/* ===== Left nav ===== */}
      <div
        className="w-64 flex-shrink-0 self-start sticky top-6"
        style={{
          borderRadius: 20,
          background: 'var(--glass-card)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          padding: 16,
        }}
      >
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px 12px 16px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, marginBottom: 12,
            background: 'var(--accent-dim)', border: '2px solid var(--border-2)', color: 'var(--accent)',
          }}>
            {initials || <User size={28} color="var(--accent)" />}
          </div>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.3px' }}>
            {user?.prenom} {user?.nom}
          </p>
          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '3px 0 0' }}>{user?.email}</p>
          <span
            className="badge mt-2 capitalize"
            style={{
              background: user?.role === 'medecin' ? 'rgba(46,155,131,0.12)' : 'rgba(52,199,89,0.12)',
              color:      user?.role === 'medecin' ? 'var(--accent)' : 'var(--vital-green)',
            }}
          >
            {user?.role}
          </span>
        </div>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 8 }}>
          {SECTIONS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5"
              style={{
                background: activeSection === key ? 'var(--accent-dim)' : 'transparent',
                color:      activeSection === key ? 'var(--accent)' : 'var(--ink-2)',
                border: 'none', cursor: 'pointer',
                boxShadow: 'none',
                borderRadius: 10,
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Right content ===== */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Hero bannière profil */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          borderRadius: 22, height: 160,
          background: 'var(--surface-1)',
          border: '1px solid var(--border-0)',
        }} className="animate-fade-up">
          {/* Photo fills right half */}
          <div style={{ position: 'absolute', right: 0, top: 0, width: '45%', height: '100%' }}>
            <img src="/illustrations/hero/doctor.jpg" alt="" aria-hidden
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, var(--surface-1) 0%, rgba(241, 243, 242, 0.5) 40%, transparent 80%)',
            }} />
          </div>
          <div style={{
            position: 'absolute', bottom: -30, left: -30, width: 160, height: 160,
            background: 'radial-gradient(circle, rgba(0,221,160,0.06) 0%, transparent 70%)', pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 28px', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent)' }}>
              {user?.role === 'medecin' ? 'Médecin' : 'Patient'}
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-0.8px', margin: 0 }}>
              {user?.prenom} {user?.nom}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>{user?.email}</p>
          </div>
        </div>
        {/* === Informations personnelles === */}
        {activeSection === 'info' && (
          <SectionCard title="Informations personnelles" desc="Vos données de profil">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : (
              <form onSubmit={onSaveProfil} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
                  <Field label="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                </div>
                <Field
                  label="Date de naissance"
                  type="date"
                  value={form.date_naissance}
                  onChange={(e) => setForm({ ...form, date_naissance: e.target.value })}
                />
                <Field
                  label="Taille (cm)"
                  type="number"
                  value={form.taille_cm}
                  onChange={(e) => setForm({ ...form, taille_cm: e.target.value })}
                  placeholder="170"
                />
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
                    style={{
                      background: saving ? 'var(--surface-3)' : 'var(--accent)',
                      color: saving ? 'var(--ink-3)' : '#0A1512',
                      boxShadow: saving ? 'none' : '0 4px 16px rgba(0,221,160,0.28)',
                      border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Save size={15} />
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}
          </SectionCard>
        )}

        {/* === Préférences === */}
        {activeSection === 'prefs' && (
          <SectionCard title="Préférences" desc="Gérez vos notifications et paramètres">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-1">
                {PREFS_CONFIG.map(({ cle, label, desc }) => {
                  const val = prefs[cle] === 'true'
                  return (
                    <div
                      key={cle}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 0', borderBottom: '1px solid var(--border-0)',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', margin: 0 }}>{label}</p>
                        <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '2px 0 0' }}>{desc}</p>
                      </div>
                      <button
                        onClick={() => onTogglePref(cle, String(val))}
                        className={`toggle-track${val ? ' on' : ''}`}
                        aria-label={label}
                      >
                        <span className="toggle-thumb" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* === Apparence === */}
        {activeSection === 'theme' && (
          <SectionCard title="Apparence" desc="Personnalisez l'interface">
            <div>
              <label className="field-label mb-3 block">Thème de l'interface</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'light', icon: Sun,  label: 'Mode clair',  desc: 'Interface lumineuse' },
                  { key: 'dark',  icon: Moon, label: 'Mode sombre', desc: 'Interface sombre' },
                ].map(({ key, icon: Icon, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-150"
                    style={{
                      background: theme === key ? 'var(--accent-dim)' : 'var(--surface-2)',
                      border: `1.5px solid ${theme === key ? 'var(--border-2)' : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: theme === key ? 'rgba(0,221,160,0.12)' : 'var(--surface-3)',
                        color: theme === key ? 'var(--accent)' : 'var(--ink-3)',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: theme === key ? 'var(--accent)' : 'var(--ink-1)', margin: 0 }}>
                        {label}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '2px 0 0' }}>{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* === Compte === */}
        {activeSection === 'compte' && (
          <>
            <SectionCard title="Informations du compte" desc="Détails de votre compte Sotera">
              <div className="space-y-1">
                <InfoRow label="Email" value={user?.email} />
                <InfoRow label="Rôle" value={user?.role === 'medecin' ? 'Médecin' : 'Patient'} />
                {user?.created_at && (
                  <InfoRow
                    label="Membre depuis"
                    value={format(new Date(user.created_at), 'd MMMM yyyy', { locale: fr })}
                  />
                )}
                {user?.derniere_connexion && (
                  <InfoRow
                    label="Dernière connexion"
                    value={format(new Date(user.derniere_connexion), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                  />
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Déconnexion"
              desc="Mettre fin à votre session en cours"
            >
              {!showLogoutConfirm ? (
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: 'rgba(255,92,106,0.08)',
                    color: 'var(--vital-red)',
                    border: '1.5px solid rgba(255,92,106,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={15} />
                  Se déconnecter
                </button>
              ) : (
                <div style={{
                  borderRadius: 16, padding: '16px 18px',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: 'rgba(255,92,106,0.06)', border: '1px solid rgba(255,92,106,0.18)',
                }}>
                  <AlertCircle size={18} style={{ color: 'var(--vital-red)', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', margin: 0 }}>
                      Confirmer la déconnexion ?
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '3px 0 0' }}>
                      Vous devrez vous reconnecter pour accéder à Sotera.
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        style={{
                          padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--border-0)',
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{ background: 'var(--vital-red)', border: 'none', cursor: 'pointer' }}
                      >
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  )
}

/* ===== Helpers ===== */
function SectionCard({ title, desc, children }) {
  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      background: 'var(--glass-card)',
      backdropFilter: 'blur(24px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
      border: '1px solid var(--glass-border)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--glass-border)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.3px', margin: 0 }}>{title}</h2>
        {desc && <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3, marginBottom: 0 }}>{desc}</p>}
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="field-input"
      />
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid var(--border-0)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{value ?? '—'}</span>
    </div>
  )
}
