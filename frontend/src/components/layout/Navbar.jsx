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
    <header className="hidden md:flex fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-[#E5E5EA] z-50 items-center px-6 gap-6">
      <div className="flex items-center gap-2 font-bold text-[#1C1C1E] text-lg mr-4">
        <Leaf size={20} className="text-health-blue" />
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
        <span className="text-sm text-[#3A3A3C]">{user?.prenom} {user?.nom}</span>
        <NavLink to="/profil" className="w-8 h-8 rounded-full bg-health-blue text-white flex items-center justify-center text-xs font-bold">
          {user?.prenom?.[0]}{user?.nom?.[0]}
        </NavLink>
        <button onClick={handleLogout} className="text-[#8E8E93] hover:text-[#FF2D55] transition-colors">
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
      className={({ isActive }) =>
        `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
          isActive ? 'bg-[#F2F2F7] text-health-blue' : 'text-[#3A3A3C] hover:bg-[#F2F2F7]'
        }`
      }
    >
      <Icon size={16} />
      <span>{label}</span>
      {badge > 0 && (
        <span className="ml-1 w-4 h-4 bg-health-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  )
}
