import { Sun, Moon, BellRing } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useAlertesStore from '../../store/alertesStore'
import useThemeStore from '../../store/themeStore'

export default function Topbar({ title }) {
  const { user }      = useAuthStore()
  const { nbNonVues } = useAlertesStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate   = useNavigate()
  const initials   = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase()
  const isMedecin  = user?.role === 'medecin'

  return (
    <header
      className="glass flex items-center px-6 gap-4 flex-shrink-0"
      style={{
        height: 60,
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Titre page */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold truncate"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          {title}
        </h1>
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Theme toggle */}
        <TopbarBtn onClick={toggleTheme} label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </TopbarBtn>

        {/* Cloche alertes (patients) */}
        {!isMedecin && (
          <TopbarBtn onClick={() => navigate('/alertes')} label="Alertes" className="relative">
            <BellRing size={15} />
            {nbNonVues > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-[16px] rounded-full text-white flex items-center justify-center badge-pulse px-0.5"
                style={{ background: 'var(--health-red)', fontSize: 8, fontWeight: 800, lineHeight: 1 }}>
                {nbNonVues > 9 ? '9+' : nbNonVues}
              </span>
            )}
          </TopbarBtn>
        )}

        {/* Avatar */}
        <button
          onClick={() => navigate('/profil')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
            boxShadow: '0 2px 8px rgba(10,132,255,0.35)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Mon profil"
        >
          {initials}
        </button>
      </div>
    </header>
  )
}

function TopbarBtn({ onClick, label, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${className}`}
      style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
    >
      {children}
    </button>
  )
}
