import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import useAuthStore from './store/authStore'
import useAlertesStore from './store/alertesStore'
import { getMe } from './services/authService'
import AppLayout from './components/layout/AppLayout'

import AuthPage from './pages/Auth/AuthPage'
import { Leaf } from 'lucide-react'
import DashboardPage from './pages/Dashboard/DashboardPage'
import MesuresPage from './pages/Mesures/MesuresPage'
import AlertesPage from './pages/Alertes/AlertesPage'
import MessageriePage from './pages/Messagerie/MessageriePage'
import AssistantIAPage from './pages/AssistantIA/AssistantIAPage'
import MedecinPage from './pages/Medecin/MedecinPage'
import AlertesMedecinPage from './pages/Medecin/AlertesMedecinPage'
import FichePatientPage from './pages/Medecin/FichePatientPage'
import MesureInfoPage from './pages/Mesures/MesureInfoPage'
import CalendrierPage from './pages/Mesures/CalendrierPage'
import ProfilPage from './pages/Profil/ProfilPage'
import RelationsPage from './pages/Relations/RelationsPage'
import ConsultationsPage from './pages/Profil/ConsultationsPage'

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Leaf size={22} color="white" />
        </div>
        <div style={{
          width: 24, height: 24,
          border: '2px solid var(--border-medium)',
          borderTopColor: 'var(--health-blue)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  if (role && user?.role !== role) return <Navigate to="/dashboard" replace />
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  const { login, logout } = useAuthStore()
  const { fetchCompteur } = useAlertesStore()
  const [authLoading, setAuthLoading] = useState(!!localStorage.getItem('access_token'))

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { setAuthLoading(false); return }

    getMe()
      .then(({ data }) => {
        const user = data.data?.user ?? data.data
        if (!user) { logout(); return }
        login(user, token, localStorage.getItem('refresh_token'))
        if (user.role === 'patient') fetchCompteur()
      })
      .catch(() => logout())
      .finally(() => setAuthLoading(false))
  }, [])

  if (authLoading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/auth"      element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/mesures"          element={<ProtectedRoute role="patient"><MesuresPage /></ProtectedRoute>} />
      <Route path="/mesures/info/:type_id"  element={<ProtectedRoute role="patient"><MesureInfoPage /></ProtectedRoute>} />
      <Route path="/mesures/calendrier"     element={<ProtectedRoute role="patient"><CalendrierPage /></ProtectedRoute>} />
      <Route path="/alertes"   element={<ProtectedRoute role="patient"><AlertesPage /></ProtectedRoute>} />
      <Route path="/messages"  element={<ProtectedRoute><MessageriePage /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute role="patient"><AssistantIAPage /></ProtectedRoute>} />
      <Route path="/medecin"           element={<ProtectedRoute role="medecin"><MedecinPage /></ProtectedRoute>} />
      <Route path="/medecin/alertes"        element={<ProtectedRoute role="medecin"><AlertesMedecinPage /></ProtectedRoute>} />
      <Route path="/medecin/patients/:patient_id" element={<ProtectedRoute role="medecin"><FichePatientPage /></ProtectedRoute>} />
      <Route path="/relations"      element={<ProtectedRoute><RelationsPage /></ProtectedRoute>} />
      <Route path="/consultations"  element={<ProtectedRoute role="patient"><ConsultationsPage /></ProtectedRoute>} />
      <Route path="/profil"    element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />
      <Route path="*"          element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
