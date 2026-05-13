import { useLocation, useMatch } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const PAGE_TITLES = {
  '/dashboard':  'Tableau de bord',
  '/mesures':    'Mes mesures',
  '/alertes':    'Alertes',
  '/messages':   'Messagerie',
  '/assistant':  'Assistant IA',
  '/medecin':          'Mes patients',
  '/medecin/alertes':  'Alertes patients',
  '/profil':     'Mon profil',
  '/relations':      'Médecin & patients',
  '/consultations':  'Mes consultations',
}

export default function AppLayout({ children }) {
  const { pathname } = useLocation()
  const infoMatch    = useMatch('/mesures/info/:type_id')
  const ficheMatch      = useMatch('/medecin/patients/:patient_id')
  const calendrierMatch = useMatch('/mesures/calendrier')
  const title = ficheMatch      ? 'Fiche patient'
              : infoMatch       ? 'Fiche indicateur'
              : calendrierMatch ? 'Calendrier de régularité'
              : (PAGE_TITLES[pathname] ?? 'Sotera')

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Sidebar />
      <div
        className="flex flex-col flex-1 min-w-0 min-h-screen"
        style={{ marginLeft: 256 }}
      >
        <Topbar title={title} />
        <main className="flex-1 p-6 page-enter" key={pathname}>
          {children}
        </main>
      </div>
    </div>
  )
}
