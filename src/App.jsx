import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import MainPage from './pages/MainPage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({ children }) {
  const { guest, loading } = useAuth()
  if (loading) return null
  if (!guest) return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { guest, loading } = useAuth()
  if (loading) return null
  if (!guest?.isAdmin) return <Navigate to="/home" replace />
  return children
}

function AppRoutes() {
  const { guest, loading } = useAuth()
  if (loading) return null

  return (
    <Routes>
      <Route path="/" element={guest ? <Navigate to="/home" replace /> : <LoginPage />} />
      <Route path="/home" element={
        <ProtectedRoute><MainPage /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute><AdminPage /></AdminRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
