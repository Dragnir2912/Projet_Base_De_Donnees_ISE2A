import { useLocation, useMatch } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomBar from './BottomBar'
import useSidebarStore from '../../store/sidebarStore'

const PAGE_LABELS = {
  '/dashboard':       'Tableau de bord',
  '/mesures':         'Mes mesures',
  '/alertes':         'Alertes',
  '/messages':        'Messagerie',
  '/assistant':       'Assistant IA',
  '/medecin':         'Mes patients',
  '/medecin/alertes': 'Alertes patients',
  '/profil':          'Mon profil',
  '/relations':       'Médecin & patients',
  '/consultations':   'Mes consultations',
}

const SIDEBAR_FULL = 260
const SIDEBAR_MINI = 64

export default function AppLayout({ children }) {
  const { pathname }    = useLocation()
  const { collapsed }   = useSidebarStore()
  const infoMatch       = useMatch('/mesures/info/:type_id')
  const ficheMatch      = useMatch('/medecin/patients/:patient_id')
  const calendrierMatch = useMatch('/mesures/calendrier')

  const breadcrumb = ficheMatch
    ? { label: 'Fiche patient',    parent: { label: 'Mes patients', to: '/medecin' } }
    : infoMatch
    ? { label: 'Fiche indicateur', parent: { label: 'Mes mesures',  to: '/mesures' } }
    : calendrierMatch
    ? { label: 'Calendrier',       parent: { label: 'Mes mesures',  to: '/mesures' } }
    : { label: PAGE_LABELS[pathname] ?? 'Sotera' }

  const sidebarWidth = collapsed ? SIDEBAR_MINI : SIDEBAR_FULL

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--canvas)' }}>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div className="ambient-orb" style={{ width: 600, height: 600, left: -120, top: -150, background: 'var(--accent)', opacity: 0.035 }} />
        <div className="ambient-orb" style={{ width: 400, height: 400, right: -60, bottom: '15%', background: 'var(--vital-purple)', opacity: 0.025, animationDelay: '9s' }} />
        <div className="ambient-orb" style={{ width: 300, height: 300, right: '20%', top: '10%', background: 'var(--vital-blue)', opacity: 0.02, animationDelay: '4s' }} />
      </div>

      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <style>{`
          @media (min-width: 768px) {
            .sidebar-content-wrapper {
              margin-left: ${sidebarWidth}px !important;
              transition: margin-left 0.26s cubic-bezier(0.4,0,0.2,1);
            }
          }
        `}</style>

        <div className="sidebar-content-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh' }}>
          <Topbar breadcrumb={breadcrumb} />
          <main
            key={pathname}
            className="page-enter"
            style={{
              flex: 1,
              padding: '24px 28px 96px',
              maxWidth: 1440,
              width: '100%',
              margin: '0 auto',
            }}
          >
            {children}
          </main>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
