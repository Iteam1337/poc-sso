import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import authService from '../services/authService'

function Callback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, setUser } = useAuth()
  const [error, setError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error in URL
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (errorParam) {
        setError(`${errorParam}: ${errorDescription || 'Unknown error'}`)
        return
      }

      const code = searchParams.get('code')
      if (!code) {
        setError('No authorization code received from Keycloak. Please try again.')
        return
      }

      if (isProcessing || user) return

      setIsProcessing(true)
      try {
        // Exchange code for token through our secure API
        const tokenResponse = await authService.exchangeCodeForToken(code)
        
        // Set user from the response
        setUser(tokenResponse.user)
        
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // Navigate to dashboard
        navigate('/dashboard')
      } catch (tokenError) {
        console.error('Token exchange error:', tokenError)
        const errorMessage = tokenError.response?.data?.details || 
                            tokenError.response?.data?.error || 
                            tokenError.message || 
                            'Unknown error';
        setError(`Authentication failed: ${errorMessage}`)
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [searchParams, navigate, user, setUser, isProcessing])

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
