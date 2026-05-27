import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Activity, Bell, MessageSquare, UserCircle, Stethoscope, Users } from 'lucide-react'
import useAlertesStore from '../../store/alertesStore'
import useAuthStore from '../../store/authStore'

const PATIENT_TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { to: '/mesures',   icon: Activity,        label: 'Mesures' },
  { to: '/alertes',   icon: Bell,            label: 'Alertes', badge: true },
  { to: '/relations', icon: Stethoscope,     label: 'Médecin' },
  { to: '/profil',    icon: UserCircle,      label: 'Profil' },
]

const MEDECIN_TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { to: '/medecin',   icon: Users,           label: 'Patients', end: true },
  { to: '/messages',  icon: MessageSquare,   label: 'Messages' },
  { to: '/profil',    icon: UserCircle,      label: 'Profil' },
]

export default function BottomBar() {
  const { user }      = useAuthStore()
  const { nbNonVues } = useAlertesStore()
  const tabs          = user?.role === 'medecin' ? MEDECIN_TABS : PATIENT_TABS

  return (
    <nav
      className="bottom-nav-pill md:hidden"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '6px 6px 16px',
        maxWidth: 520, margin: '0 auto',
      }}>
        {tabs.map(({ to, icon: Icon, label, badge, end }) => (
          <NavLink key={to} to={to} end={end} style={{ display: 'block', textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 16px', borderRadius: 14,
                transition: 'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                position: 'relative',
              }}>
                {/* Active top bar */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 0, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 22, height: 2.5, borderRadius: '0 0 3px 3px',
                    background: 'var(--accent)',
                    boxShadow: '0 0 10px var(--accent-glow)',
                  }} />
                )}

                {/* Icon + badge */}
                <div style={{ position: 'relative', transition: 'transform 0.2s cubic-bezier(0.34,1.2,0.64,1)', transform: isActive ? 'scale(1.08)' : 'scale(1)' }}>
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    color={isActive ? 'var(--accent)' : 'var(--ink-3)'}
                  />
                  {badge && nbNonVues > 0 && (
                    <span className="badge-pulse" style={{
                      position: 'absolute', top: -3, right: -5,
                      minWidth: 14, height: 14, borderRadius: 99,
                      background: 'var(--vital-red)', color: 'white',
                      fontSize: 8, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px',
                    }}>
                      {nbNonVues > 9 ? '9+' : nbNonVues}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: 10, fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--accent)' : 'var(--ink-3)',
                  letterSpacing: '0.1px',
                  transition: 'color 0.2s ease',
                }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
