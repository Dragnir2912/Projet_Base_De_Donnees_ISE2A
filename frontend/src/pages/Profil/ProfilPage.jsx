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
    <div className="flex gap-6">
      {/* ===== Left nav ===== */}
      <div
        className="w-64 flex-shrink-0 rounded-2xl p-4 self-start sticky top-6"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
      >
        {/* Avatar */}
        <div className="flex flex-col items-center text-center p-4 mb-4">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-bold text-white mb-3"
            style={{ background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)' }}
          >
            {initials || <User size={32} color="white" />}
          </div>
          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
            {user?.prenom} {user?.nom}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
          <span
            className="badge mt-2 capitalize"
            style={{
              background: user?.role === 'medecin' ? 'rgba(10,132,255,0.12)' : 'rgba(52,199,89,0.12)',
              color:      user?.role === 'medecin' ? 'var(--health-blue)' : 'var(--health-green)',
            }}
          >
            {user?.role}
          </span>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
          {SECTIONS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5"
              style={{
                background: activeSection === key ? 'rgba(10,132,255,0.08)' : 'transparent',
                color:      activeSection === key ? 'var(--health-blue)' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer',
                boxShadow: activeSection === key ? 'inset 3px 0 0 var(--health-blue)' : 'none',
                borderRadius: activeSection === key ? '0 10px 10px 0' : '10px',
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
          borderRadius: 20, padding: '28px 36px',
          background: 'linear-gradient(135deg, var(--health-blue), var(--health-purple, #BF5AF2))',
          boxShadow: '0 8px 32px rgba(10,132,255,0.25)',
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {user?.role === 'medecin' ? 'Médecin' : 'Patient'}
            </p>
            <h2 className="text-xl font-bold text-white mt-0.5" style={{ letterSpacing: '-0.3px' }}>
              {user?.prenom} {user?.nom}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{user?.email}</p>
          </div>
          <Illustration
            name="profile-hero"
            width={140} height={140}
            fadeSide="left"
            priority={true}
            style={{
              position: 'absolute',
              right: 24, bottom: 0,
              opacity: 0.82,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
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
                      background: saving ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #0A84FF, #5AC8FA)',
                      color: saving ? 'var(--text-tertiary)' : 'white',
                      boxShadow: saving ? 'none' : '0 4px 14px rgba(10,132,255,0.3)',
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
                      className="flex items-center justify-between px-4 py-4 rounded-xl"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
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
                      background: theme === key ? 'rgba(10,132,255,0.08)' : 'var(--bg-secondary)',
                      border: `2px solid ${theme === key ? 'var(--health-blue)' : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: theme === key ? 'rgba(10,132,255,0.12)' : 'var(--bg-tertiary)',
                        color: theme === key ? 'var(--health-blue)' : 'var(--text-tertiary)',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: theme === key ? 'var(--health-blue)' : 'var(--text-primary)' }}>
                        {label}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
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
                    background: 'rgba(255,45,85,0.08)',
                    color: 'var(--health-red)',
                    border: '1.5px solid rgba(255,45,85,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={15} />
                  Se déconnecter
                </button>
              ) : (
                <div
                  className="rounded-xl p-4 flex items-start gap-3"
                  style={{ background: 'rgba(255,45,85,0.06)', border: '1px solid rgba(255,45,85,0.2)' }}
                >
                  <AlertCircle size={18} style={{ color: 'var(--health-red)', flexShrink: 0, marginTop: 2 }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Confirmer la déconnexion ?
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      Vous devrez vous reconnecter pour accéder à Sotera.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{ background: 'var(--health-red)', border: 'none', cursor: 'pointer' }}
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
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {desc && <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
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
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</span>
    </div>
  )
}
