import { Sun, Moon, Bell, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useAlertesStore from '../../store/alertesStore'
import useThemeStore from '../../store/themeStore'

export default function Topbar({ breadcrumb }) {
  const { user }               = useAuthStore()
  const { nbNonVues }          = useAlertesStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate               = useNavigate()
  const initials               = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase()
  const isMedecin              = user?.role === 'medecin'

  return (
    <header style={{
      height: 58,
      display: 'flex', alignItems: 'center',
      paddingLeft: 28, paddingRight: 20,
      gap: 14, flexShrink: 0,
      position: 'sticky', top: 0, zIndex: 30,
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--border-0)',
      backdropFilter: 'blur(32px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
    }}>

      {/* Breadcrumb */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        {breadcrumb?.parent && (
          <>
            <Link
              to={breadcrumb.parent.to}
              style={{
                fontSize: 13, fontWeight: 500,
                color: 'var(--ink-3)', textDecoration: 'none',
                whiteSpace: 'nowrap', transition: 'color 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink-2)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-3)' }}
            >
              {breadcrumb.parent.label}
            </Link>
            <ChevronRight size={12} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
          </>
        )}
        <h1 style={{
          fontSize: 14, fontWeight: 700,
          color: 'var(--ink-1)', letterSpacing: '-0.4px',
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          margin: 0,
        }}>
          {breadcrumb?.label ?? 'Sotera'}
        </h1>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>

        {/* Theme toggle */}
        <TopbarBtn onClick={toggleTheme} label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </TopbarBtn>

        {/* Alertes badge (patients uniquement) */}
        {!isMedecin && (
          <div style={{ position: 'relative' }}>
            <TopbarBtn onClick={() => navigate('/alertes')} label="Alertes">
              <Bell size={15} />
            </TopbarBtn>
            {nbNonVues > 0 && (
              <span className="badge-pulse" style={{
                position: 'absolute', top: 6, right: 6,
                minWidth: 15, height: 15, borderRadius: 99,
                background: 'var(--vital-red)', color: 'white',
                fontSize: 8, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', pointerEvents: 'none',
              }}>
                {nbNonVues > 9 ? '9+' : nbNonVues}
              </span>
            )}
          </div>
        )}

        <div style={{ width: 1, height: 18, background: 'var(--border-1)', margin: '0 4px' }} />

        {/* Avatar */}
        <button
          onClick={() => navigate('/profil')}
          aria-label="Mon profil"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--gradient-accent)',
            border: 'none', cursor: 'pointer',
            color: 'white', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,221,160,0.28)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            letterSpacing: '-0.5px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.06)'
            e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,221,160,0.45)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,221,160,0.28)'
          }}
        >
          {initials}
        </button>
      </div>
    </header>
  )
}

function TopbarBtn({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 34, height: 34, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--ink-3)', transition: 'all 0.18s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--surface-2)'
        e.currentTarget.style.color = 'var(--ink-1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--ink-3)'
      }}
    >
      {children}
    </button>
  )
}
