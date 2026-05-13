import { useState } from 'react'
import { HeartECGIllustration, StethoscopeIllustration } from '../../components/ui/HealthIllustration'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Sun, Moon, Leaf } from 'lucide-react'
import toast from 'react-hot-toast'
import { login as loginService, register as registerService } from '../../services/authService'
import useAuthStore from '../../store/authStore'
import useAlertesStore from '../../store/alertesStore'
import useThemeStore from '../../store/themeStore'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({ email: '', mot_de_passe: '', nom: '', prenom: '', role: 'patient' })
  const { login } = useAuthStore()
  const { fetchCompteur } = useAlertesStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let data
      if (mode === 'login') {
        const res = await loginService(form.email, form.mot_de_passe)
        data = res.data.data
      } else {
        const res = await registerService(form)
        data = res.data.data
      }
      const user = data.user ?? data
      login(user, data.access_token, data.refresh_token)
      if (user.role === 'patient') fetchCompteur()
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{ background: 'var(--bg-app)' }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
        style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-card)' }}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Illustration décorative gauche (desktop) */}
      <div className="hidden lg:flex flex-col items-center justify-center gap-6 mr-16 flex-shrink-0">
        <HeartECGIllustration size={160} color="#0A84FF" animated />
        <div className="text-center">
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Votre santé, au quotidien
          </p>
          <p className="text-sm mt-1 max-w-[240px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Suivez vos mesures, consultez votre médecin et comprenez votre état de santé grâce à Sotera.
          </p>
        </div>
        {/* Indicateurs de confiance */}
        <div className="flex flex-col gap-2 w-full max-w-[240px]">
          {[
            { emoji: '🔒', text: 'Données chiffrées & sécurisées' },
            { emoji: '🩺', text: 'Suivi médical personnalisé' },
            { emoji: '📊', text: 'Analyses basées sur l\'OMS' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <span>{item.emoji}</span>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-[420px]">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)', boxShadow: '0 8px 32px rgba(10,132,255,0.3)' }}
          >
            <Leaf size={28} color="white" />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}
          >
            Sotera
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Votre santé, sous contrôle
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-elevated)' }}
        >
          {/* Tab switcher */}
          <div className="pill-tabs mb-6">
            {[
              { key: 'login', label: 'Connexion' },
              { key: 'register', label: 'Inscription' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`pill-tab${mode === key ? ' active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prénom" name="prenom" value={form.prenom} onChange={onChange} placeholder="Marie" required />
                  <Field label="Nom" name="nom" value={form.nom} onChange={onChange} placeholder="Dupont" required />
                </div>

                {/* Role selector */}
                <div>
                  <label className="field-label">Rôle</label>
                  <div className="pill-tabs">
                    {[{ key: 'patient', label: 'Patient' }, { key: 'medecin', label: 'Médecin' }].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, role: key })}
                        className={`pill-tab${form.role === key ? ' active' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Field label="Adresse email" name="email" type="email" value={form.email} onChange={onChange} placeholder="marie@email.fr" required />

            {/* Password with toggle */}
            <div>
              <label className="field-label">Mot de passe</label>
              <div className="relative">
                <input
                  name="mot_de_passe"
                  type={showPwd ? 'text' : 'password'}
                  value={form.mot_de_passe}
                  onChange={onChange}
                  placeholder="••••••••"
                  required
                  className="field-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 mt-2"
              style={{
                background: loading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #0A84FF, #5AC8FA)',
                color: loading ? 'var(--text-tertiary)' : 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(10,132,255,0.3)',
              }}
            >
              {loading
                ? 'Chargement…'
                : mode === 'login'
                  ? 'Se connecter'
                  : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: 'var(--text-tertiary)' }}>
            En continuant, vous acceptez les conditions d'utilisation de Sotera.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="field-input"
      />
    </div>
  )
}
