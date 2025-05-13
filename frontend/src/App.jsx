import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Callback from './pages/Callback'
import { ProtectedRoute, AuthProvider } from 'keycloak-react'
import './App.css'

// Keycloak configuration
const authConfig = {
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL || 'https://auth-test.mimer.nu/realms/onecore-test',
  clientId: import.meta.env.VITE_CLIENT_ID || 'poc-sso',
  apiUrl: '/api'
}

function App() {
  return (
    <AuthProvider config={authConfig}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
