import { useAuth } from 'keycloak-react'
import { useNavigate } from 'react-router-dom'

function Home() {
  const { user, login, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return <div>Loading...</div>
  }

  if (user) {
    navigate('/dashboard')
    return null
  }

  return (
    <div className="container">
      <h1>OAuth2 Proxy Demo</h1>
      <p>
        This is a demonstration of using OAuth2 Proxy with a Vite application.
      </p>
      <button onClick={login} className="login-button">
        Login with Keycloak
      </button>
    </div>
  )
}

export default Home
