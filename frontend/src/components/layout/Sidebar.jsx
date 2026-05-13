import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Activity, Bell, MessageSquare, Sparkles,
  Stethoscope, Users, User, LogOut, Leaf,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useAlertesStore from '../../store/alertesStore'

const PATIENT_NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/mesures',    icon: Activity,         label: 'Mes mesures' },
  { to: '/alertes',    icon: Bell,            label: 'Alertes',     badge: true },
  { to: '/messages',   icon: MessageSquare,   label: 'Messagerie' },
  { to: '/assistant',  icon: Sparkles,        label: 'Assistant IA' },
  { to: '/relations',  icon: Stethoscope,     label: 'Mon médecin' },
]

const MEDECIN_NAV = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Tableau de bord', end: true },
  { to: '/medecin',          icon: Users,           label: 'Mes patients',    end: true },
  { to: '/medecin/alertes',  icon: Bell,            label: 'Alertes patients' },
  { to: '/relations',        icon: Stethoscope,     label: 'Demandes' },
  { to: '/messages',         icon: MessageSquare,   label: 'Messagerie' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { nbNonVues }    = useAlertesStore()
  const navigate         = useNavigate()
  const isMedecin  = user?.role === 'medecin'
  const navItems   = isMedecin ? MEDECIN_NAV : PATIENT_NAV
  const initials   = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase()

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{
        width: 256,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center px-5 flex-shrink-0"
        style={{ height: 60, borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
              boxShadow: '0 4px 12px rgba(10,132,255,0.35)',
            }}
          >
            <Leaf size={18} color="white" />
          </div>
          <span
            className="text-lg font-bold"
            style={{
              background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.5px',
            }}
          >
            Sotera
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Section label */}
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2"
          style={{ color: 'var(--text-tertiary)' }}>
          Navigation
        </p>
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              item={item}
              badge={item.badge === true ? nbNonVues : 0}
            />
          ))}
        </div>
      </nav>

      {/* ── Profil utilisateur ── */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl group cursor-pointer transition-all duration-200"
          onClick={() => navigate('/profil')}
          style={{ position: 'relative' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Avatar gradient */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
              boxShadow: '0 2px 8px rgba(10,132,255,0.3)',
            }}
          >
            {initials || <User size={13} color="white" />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-[11px] truncate capitalize" style={{ color: 'var(--text-tertiary)' }}>
              {user?.role === 'medecin' ? '🩺 Médecin' : '👤 Patient'}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={e => { e.stopPropagation(); logout(); navigate('/auth') }}
            className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{ background: 'rgba(255,45,85,0.1)', color: 'var(--health-red)', border: 'none', cursor: 'pointer' }}
            title="Déconnexion"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function SidebarNavItem({ item, badge }) {
  const { icon: Icon, to, label, end } = item

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
            style={{
              background: isActive
                ? 'linear-gradient(135deg, rgba(10,132,255,0.15), rgba(191,90,242,0.10))'
                : 'transparent',
            }}
          >
            <Icon size={15} />
          </div>
          <span>{label}</span>
          {badge > 0 && (
            <span
              className="ml-auto min-w-[20px] h-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center badge-pulse"
              style={{ background: 'var(--health-red)' }}
            >
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
