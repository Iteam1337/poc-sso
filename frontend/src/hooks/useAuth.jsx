import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// Keycloak configuration
const KEYCLOAK_URL = 'https://keycloak.berget.ai/realms/iteam'
const CLIENT_ID = 'demo'
// We'll set the redirect URI dynamically in the login function

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Parse query parameters from URL
  const getQueryParams = () => {
    const searchParams = new URLSearchParams(window.location.search)
    const params = {}
    for (const [key, value] of searchParams.entries()) {
      params[key] = value
    }
    return params
  }

  // Check for code in URL query params (for authorization code flow)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a code in the URL (after redirect)
        const params = getQueryParams()
        if (params.code) {
          console.log('Authorization code received:', params.code)
          
          const redirectUri = `${window.location.origin}/callback`
          console.log('Using redirect URI for token exchange:', redirectUri)
          
          // Exchange code for token through our secure API
          try {
            const tokenResponse = await axios.post(
              '/api/token',
              {
                code: params.code,
                redirect_uri: redirectUri
              },
              {
                withCredentials: true // Important for cookies to be sent/received
              }
            )
            
            // The API has already set the HTTP-only cookie with the token
            // and returned the user info
            setUser(tokenResponse.data.user)
            
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname)
          } catch (tokenError) {
            console.error('Token exchange error:', tokenError.response?.data || tokenError.message)
            setUser(null)
          }
        } else {
          // Try to get user info from API using the cookie
          try {
            const apiResponse = await axios.get('/api/user', {
              withCredentials: true // Important for cookies to be sent
            })
            
            if (apiResponse.data && apiResponse.data.user) {
              setUser(apiResponse.data.user)
            }
          } catch (apiError) {
            console.log('Not authenticated via API cookie')
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Authentication error:', error.message)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = () => {
    // Redirect to Keycloak login
    const redirectUri = `${window.location.origin}/callback`
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    console.log('Redirect URI for authorization:', redirectUri)
    const authUrl = `${KEYCLOAK_URL}/protocol/openid-connect/auth?client_id=${CLIENT_ID}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=openid email profile&state=${Date.now()}`
    console.log('Auth URL:', authUrl)
    window.location.href = authUrl
  }

  const logout = async () => {
    try {
      // Clear the auth cookie from API
      await axios.get('/api/logout', { withCredentials: true })
      
      setUser(null)
      
      // Redirect to Keycloak logout
      const redirectUri = window.location.origin
      const encodedRedirectUri = encodeURIComponent(redirectUri)
      window.location.href = `${KEYCLOAK_URL}/protocol/openid-connect/logout?redirect_uri=${encodedRedirectUri}`
    } catch (error) {
      console.error('Logout failed:', error.message)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
