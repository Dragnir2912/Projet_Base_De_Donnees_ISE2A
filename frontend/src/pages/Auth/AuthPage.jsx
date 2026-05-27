import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Sun, Moon,
  ShieldCheck, HeartPulse, Stethoscope,
  ArrowRight, User, Lock, Mail,
  Activity, TrendingUp, Leaf,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { login as loginService, register as registerService } from '../../services/authService'
import useAuthStore from '../../store/authStore'
import useAlertesStore from '../../store/alertesStore'
import useThemeStore from '../../store/themeStore'

/* ═══════════════════════════════════════
   AUTH PAGE — Direction "Vital Intelligence"
   Architecture cinématique : image plein cadre + form flottant
═══════════════════════════════════════ */
export default function AuthPage() {
  const [mode,    setMode]    = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [form,    setForm]    = useState({ email: '', mot_de_passe: '', nom: '', prenom: '', role: 'patient' })
  const { login }              = useAuthStore()
  const { fetchCompteur }      = useAlertesStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate               = useNavigate()

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
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--canvas)', position: 'relative', overflow: 'hidden' }}>

      {/* ── LEFT PANEL — Cinématique ── */}
      <div className="hidden lg:flex" style={{
        width: '54%',
        flexShrink: 0,
        position: 'relative',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Image hero plein cadre */}
        <img
          src="/illustrations/hero/illus-doctor-office-consultation.jpeg"
          alt=""
          aria-hidden="true"
          className="hero-img-reveal"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 30%',
          }}
        />

        {/* Overlay multi-couches pour profondeur cinématique */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(3,8,6,0.97) 0%, rgba(5,13,10,0.90) 30%, rgba(5,13,10,0.75) 65%, rgba(0,221,160,0.08) 100%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '55%',
          background: 'linear-gradient(to top, rgba(3,8,6,0.98) 0%, rgba(3,8,6,0.70) 50%, transparent 100%)',
        }} />
        {/* Grain texture subtil */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '200px',
        }} />
        {/* Accent glow bottom-left */}
        <div style={{
          position: 'absolute',
          bottom: -100, left: -100,
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,221,160,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        {/* Contenu du panel gauche */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '36px 44px' }}>

          {/* Logo */}
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, #2E9B83, #1A7C6C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,168,117,0.35)',
            }}>
              <Leaf size={21} color="white" />
            </div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.9px', display: 'block', lineHeight: 1.1 }}>Sotera</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(0,221,160,0.50)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Vital Intelligence</span>
            </div>
          </div>

          {/* Carte vitaux flottante */}
          <div className="animate-fade-up delay-200" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <FloatingVitalsCard />
          </div>

          {/* Titre principal */}
          <div className="animate-fade-up delay-100">
            <h2 style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.06,
              letterSpacing: '-2.8px',
              marginBottom: 16,
            }}>
              Votre santé,<br />
              <span style={{
                background: 'linear-gradient(135deg, #00DDA0 0%, #00F5C0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                intelligemment.
              </span>
            </h2>
            <p style={{
              fontSize: 14.5,
              color: 'rgba(255,255,255,0.48)',
              lineHeight: 1.70,
              maxWidth: 360,
              marginBottom: 32,
              letterSpacing: '-0.1px',
            }}>
              Suivez vos indicateurs, comprenez vos tendances et restez connecté à votre équipe médicale.
            </p>

            {/* Badges de confiance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: ShieldCheck, text: 'Données chiffrées AES-256', sub: 'Sécurité médicale de bout en bout' },
                { icon: HeartPulse,  text: 'Normes OMS validées',        sub: 'Seuils et références internationaux' },
                { icon: Stethoscope, text: 'Connecté à votre médecin',   sub: 'Suivi coordonné de votre santé' },
              ].map(({ icon: Icon, text, sub }, i) => (
                <div
                  key={i}
                  className={`animate-fade-up delay-${(i + 3) * 100}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: 'rgba(0,221,160,0.14)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color="#00DDA0" />
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 13, fontWeight: 600, margin: 0, letterSpacing: '-0.2px' }}>{text}</p>
                    <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11, margin: 0, marginTop: 1 }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Formulaire ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        minHeight: '100vh',
      }}>

        {/* Fond mobile : image légère */}
        <div className="lg:hidden" style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url("/illustrations/hero/illus-doctor-office-consultation.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          opacity: 0.08,
        }} />

        {/* Bouton thème */}
        <button
          onClick={toggleTheme}
          style={{
            position: 'absolute', top: 20, right: 20,
            width: 36, height: 36, borderRadius: 11,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-3)',
            transition: 'all 0.18s ease',
            zIndex: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--ink-1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink-3)' }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Conteneur formulaire */}
        <div className="animate-fade-up" style={{ width: '100%', maxWidth: 432, position: 'relative', zIndex: 1 }}>

          {/* Logo mobile */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, justifyContent: 'center' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 11,
              background: 'linear-gradient(135deg, #2E9B83, #1A7C6C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,168,117,0.30)',
            }}>
              <Leaf size={19} color="white" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.9px', color: 'var(--ink-1)' }}>Sotera</span>
          </div>

          {/* En-tête */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--ink-1)',
              letterSpacing: '-1.4px',
              marginBottom: 8,
            }}>
              {mode === 'login' ? 'Bon retour' : 'Créer un compte'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.55, letterSpacing: '-0.1px' }}>
              {mode === 'login'
                ? 'Accédez à votre espace de santé personnel.'
                : 'Commencez à surveiller votre santé dès aujourd\'hui.'}
            </p>
          </div>

          {/* Toggle mode */}
          <div className="pill-tabs" style={{ marginBottom: 28 }}>
            {[
              { key: 'login',    label: 'Connexion' },
              { key: 'register', label: 'Inscription' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`pill-tab${mode === key ? ' active' : ''}`}
                onClick={() => setMode(key)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Formulaire */}
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Champs inscription */}
            {mode === 'register' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="field-label">Prénom</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>
                        <User size={14} />
                      </div>
                      <input name="prenom" value={form.prenom} onChange={onChange} required placeholder="Prénom" className="field-input" style={{ paddingLeft: 36 }} />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Nom</label>
                    <input name="nom" value={form.nom} onChange={onChange} required placeholder="Nom de famille" className="field-input" />
                  </div>
                </div>

                <div>
                  <label className="field-label">Vous êtes</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { value: 'patient', label: 'Patient', sub: 'Suivi personnel', icon: Activity },
                      { value: 'medecin', label: 'Médecin', sub: 'Suivi de patients', icon: Stethoscope },
                    ].map(({ value, label, sub, icon: RoleIcon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm({ ...form, role: value })}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 14,
                          border: `1.5px solid ${form.role === value ? 'var(--accent)' : 'var(--border-1)'}`,
                          background: form.role === value ? 'var(--accent-dim)' : 'var(--surface-2)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                          background: form.role === value ? 'rgba(0,221,160,0.15)' : 'var(--surface-3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}>
                          <RoleIcon size={15} color={form.role === value ? 'var(--accent)' : 'var(--ink-3)'} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: form.role === value ? 'var(--accent)' : 'var(--ink-1)', margin: 0, letterSpacing: '-0.2px' }}>{label}</p>
                          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0, marginTop: 1 }}>{sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="field-label">Adresse e-mail</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>
                  <Mail size={14} />
                </div>
                <input
                  name="email" type="email" value={form.email} onChange={onChange}
                  required placeholder="vous@exemple.com" className="field-input"
                  style={{ paddingLeft: 38 }} autoComplete="email"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="field-label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>
                  <Lock size={14} />
                </div>
                <input
                  name="mot_de_passe"
                  type={showPwd ? 'text' : 'password'}
                  value={form.mot_de_passe}
                  onChange={onChange}
                  required placeholder="••••••••"
                  className="field-input"
                  style={{ paddingLeft: 38, paddingRight: 44 }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-3)', padding: 4,
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--ink-1)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 14,
                background: loading ? 'var(--accent-dark)' : 'var(--gradient-accent)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: 'white',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '-0.3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : '0 4px 22px rgba(0,221,160,0.30)',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 32px rgba(0,221,160,0.48)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 22px rgba(0,221,160,0.30)' }}
            >
              {loading ? (
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.30)',
                  borderTopColor: 'white',
                  animation: 'spin 0.75s linear infinite',
                }} />
              ) : (
                <>
                  {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>

          </form>

          {/* Lien bascule */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-3)', marginTop: 24 }}>
            {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            {' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent)', fontWeight: 600, fontSize: 13,
                padding: 0, fontFamily: 'inherit', letterSpacing: '-0.1px',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>

          {/* Légal */}
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-4)', marginTop: 32, lineHeight: 1.65 }}>
            En continuant, vous acceptez nos{' '}
            <span style={{ color: 'var(--ink-3)' }}>conditions d'utilisation</span>
            {' '}et notre{' '}
            <span style={{ color: 'var(--ink-3)' }}>politique de confidentialité</span>.
          </p>
        </div>
      </div>

    </div>
  )
}

/* ─── Carte vitaux flottante ─── */
function FloatingVitalsCard() {
  const vitals = [
    { label: 'Glycémie', value: '0.89', unit: 'g/L',  color: '#00D97E', trend: '+2%' },
    { label: 'Tension',  value: '118',  unit: 'mmHg', color: '#00DDA0', trend: 'stable' },
    { label: 'Poids',    value: '72',   unit: 'kg',   color: '#9B77F5', trend: '-0.5kg' },
  ]

  return (
    <div className="float-el" style={{
      padding: '20px 24px',
      borderRadius: 20,
      background: 'rgba(5,13,10,0.72)',
      backdropFilter: 'blur(28px)',
      border: '1px solid rgba(0,221,160,0.16)',
      boxShadow: '0 28px 70px rgba(0,0,0,0.45), 0 0 50px rgba(0,221,160,0.07)',
      minWidth: 210,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(0,221,160,0.55)', margin: 0 }}>
          VitaScore
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={11} color="#00D97E" />
          <span style={{ fontSize: 10, color: '#00D97E', fontWeight: 600 }}>+3 pts</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        {/* SVG ring */}
        <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
          <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
            {/* Glow layer — wider, low opacity, same dash */}
            <circle cx="27" cy="27" r="22" fill="none" stroke="#00D97E" strokeWidth="14"
              strokeDasharray={`${(87/100) * 2 * Math.PI * 22} ${2 * Math.PI * 22}`}
              strokeLinecap="round" opacity={0.18}
            />
            {/* Main arc */}
            <circle cx="27" cy="27" r="22" fill="none" stroke="#00D97E" strokeWidth="5"
              strokeDasharray={`${(87/100) * 2 * Math.PI * 22} ${2 * Math.PI * 22}`}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'white', letterSpacing: '-1.2px' }}>87</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 19, fontWeight: 800, color: 'white', letterSpacing: '-1.2px', margin: 0, lineHeight: 1 }}>Excellent</p>
          <p style={{ fontSize: 11, color: 'rgba(0,217,126,0.75)', margin: 0, marginTop: 5 }}>Cette semaine</p>
        </div>
      </div>

      {/* Mini vitaux */}
      <div style={{
        display: 'flex', gap: 0,
        paddingTop: 16,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {vitals.map(({ label, value, unit, color, trend }, i) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center',
            borderRight: i < vitals.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            padding: '0 6px',
          }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.28)', marginBottom: 5 }}>{label}</p>
            <p style={{ fontSize: 16, fontWeight: 800, color, letterSpacing: '-0.8px', margin: 0, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', margin: 0, marginTop: 2 }}>{unit}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

