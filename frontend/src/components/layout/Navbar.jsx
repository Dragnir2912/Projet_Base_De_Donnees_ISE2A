import { NavLink, useNavigate } from 'react-router-dom'
import { Activity, Bell, MessageSquare, LayoutDashboard, Stethoscope, LogOut, Sparkles, Leaf } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useAlertesStore from '../../store/alertesStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { nbNonVues } = useAlertesStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b z-50 items-center px-6 gap-6" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center gap-2 font-bold text-lg mr-4" style={{ color: 'var(--primary)' }}>
        <Leaf size={20} style={{ color: 'var(--primary-mid)' }} />
        <span>Sotera</span>
      </div>

      <nav className="flex items-center gap-1 flex-1">
        {user?.role === 'patient' ? (
          <>
            <NavItem to="/dashboard"  icon={LayoutDashboard} label="Accueil" />
            <NavItem to="/mesures"    icon={Activity}        label="Mesures" />
            <NavItem to="/alertes"    icon={Bell}            label="Alertes" badge={nbNonVues} />
            <NavItem to="/messages"   icon={MessageSquare}   label="Messages" />
            <NavItem to="/assistant"  icon={Sparkles}        label="Assistant IA" />
          </>
        ) : (
          <>
            <NavItem to="/medecin"   icon={Stethoscope}   label="Patients" />
            <NavItem to="/messages"  icon={MessageSquare} label="Messages" />
          </>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.prenom} {user?.nom}</span>
        <NavLink to="/profil" className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg,#1A7C6C,#2E9B83)' }}>
          {user?.prenom?.[0]}{user?.nom?.[0]}
        </NavLink>
        <button onClick={handleLogout} className="transition-colors" style={{ color: 'var(--text-tertiary)' }} onMouseEnter={e => e.currentTarget.style.color='#FF5C6A'} onMouseLeave={e => e.currentTarget.style.color='var(--text-tertiary)'}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}

function NavItem({ to, icon: Icon, label, badge }) {
  return (
    <NavLink
      to={to}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 relative"
      style={({ isActive }) => isActive
        ? { background: 'rgba(46,155,131,0.10)', color: '#2E9B83' }
        : { color: 'var(--text-secondary)' }
      }
    >
      <Icon size={16} />
      <span>{label}</span>
      {badge > 0 && (
        <span className="ml-1 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center" style={{ background: '#FF5C6A' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  )
}
