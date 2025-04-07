import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function Callback() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for error in URL
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')

    if (errorParam) {
      setError(`${errorParam}: ${errorDescription || 'Unknown error'}`)
      return
    }

    // The AuthProvider will handle extracting the code from the URL
    const checkAuthStatus = () => {
      if (user) {
        navigate('/dashboard')
      } else if (!urlParams.has('code')) {
        // If no code and no user, something went wrong
        setError(
          'No authorization code received from Keycloak. Please refresh the page and try again.',
        )
      }
    }

    const timer = setTimeout(checkAuthStatus, 1000)
    return () => clearTimeout(timer)
  }, [navigate, user])

  if (error) {
    return (
      <div className="container">
        <h2>Authentication Error</h2>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Return to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h2>Authenticating...</h2>
      <p>Please wait while we complete the authentication process.</p>
    </div>
  )
}

export default Callback
