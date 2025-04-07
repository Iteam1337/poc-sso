import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Callback() {
  const navigate = useNavigate()
  
  useEffect(() => {
    // The AuthProvider will handle extracting the token from the URL
    // Just redirect to dashboard after a short delay
    const timer = setTimeout(() => {
      navigate('/dashboard')
    }, 100)
    
    return () => clearTimeout(timer)
  }, [navigate])
  
  return (
    <div className="container">
      <h2>Authenticating...</h2>
      <p>Please wait while we complete the authentication process.</p>
    </div>
  )
}

export default Callback
