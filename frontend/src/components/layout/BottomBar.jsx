import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Activity, Bell, MessageSquare, UserCircle, Stethoscope, Users } from 'lucide-react'
import useAlertesStore from '../../store/alertesStore'
import useAuthStore from '../../store/authStore'

const PATIENT_TABS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Accueil' },
  { to: '/mesures',    icon: Activity,        label: 'Mesures' },
  { to: '/alertes',    icon: Bell,            label: 'Alertes', badge: true },
  { to: '/relations',  icon: Stethoscope,     label: 'Médecin' },
  { to: '/profil',     icon: UserCircle,      label: 'Profil' },
]

const MEDECIN_TABS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Accueil' },
  { to: '/relations',  icon: Users,           label: 'Patients' },
  { to: '/messages',   icon: MessageSquare,   label: 'Messages' },
  { to: '/profil',     icon: UserCircle,      label: 'Profil' },
]

export default function BottomBar() {
  const { user } = useAuthStore()
  const { nbNonVues } = useAlertesStore()

  const tabs = user?.role === 'medecin' ? MEDECIN_TABS : PATIENT_TABS

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#E5E5EA] z-50 md:hidden">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 ${
                isActive ? 'text-health-blue' : 'text-[#8E8E93]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  {badge && nbNonVues > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-health-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {nbNonVues > 9 ? '9+' : nbNonVues}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
