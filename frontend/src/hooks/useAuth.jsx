import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// Keycloak configuration
const KEYCLOAK_URL = 'https://keycloak.berget.ai/realms/iteam'
const CLIENT_ID = 'demo'
// We'll set the redirect URI dynamically in the login function

const AuthContext = createContext(null)

// Parse hash parameters from URL
const getHashParams = () => {
  const hash = window.location.hash.substr(1)
  return hash.split('&').reduce((result, item) => {
    const parts = item.split('=')
    result[parts[0]] = decodeURIComponent(parts[1])
    return result
  }, {})
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Check for token in URL hash (for implicit flow) or localStorage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if we have a token in localStorage
        let accessToken = localStorage.getItem('access_token')
        
        // If not, check if we have one in the URL (after redirect)
        if (!accessToken) {
          const params = getHashParams()
          if (params.access_token) {
            accessToken = params.access_token
            localStorage.setItem('access_token', accessToken)
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        }
        
        if (accessToken) {
          setToken(accessToken)
          
          // Get user info using the token
          const userInfo = await axios.get(`${KEYCLOAK_URL}/protocol/openid-connect/userinfo`, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          })
          
          setUser(userInfo.data)
        }
      } catch (error) {
        console.log('Authentication error:', error.message)
        // Clear token if it's invalid
        localStorage.removeItem('access_token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const login = () => {
    // Redirect to Keycloak login
    const redirectUri = encodeURIComponent(`${window.location.origin}/callback`)
    console.log('Redirect URI:', redirectUri)
    const authUrl = `${KEYCLOAK_URL}/protocol/openid-connect/auth?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=openid email profile`
    window.location.href = authUrl
  }

  const logout = () => {
    // Clear local token
    localStorage.removeItem('access_token')
    setToken(null)
    setUser(null)
    
    // Redirect to Keycloak logout
    const redirectUri = encodeURIComponent(window.location.origin)
    window.location.href = `${KEYCLOAK_URL}/protocol/openid-connect/logout?redirect_uri=${redirectUri}`
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
