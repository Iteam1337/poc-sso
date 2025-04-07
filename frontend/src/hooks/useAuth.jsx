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
          
          // Exchange code for token
          const tokenResponse = await axios.post(
            `${KEYCLOAK_URL}/protocol/openid-connect/token`,
            new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: CLIENT_ID,
              code: params.code,
              redirect_uri: `${window.location.origin}/callback`
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          )
          
          const accessToken = tokenResponse.data.access_token
          
          // Make a request to our API with the token to set the HTTP-only cookie
          await axios.get('/api/user', {
            headers: {
              Authorization: `Bearer ${accessToken}`
            },
            withCredentials: true // Important for cookies to be sent/received
          })
          
          // Get user info using the token
          const userInfo = await axios.get(`${KEYCLOAK_URL}/protocol/openid-connect/userinfo`, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          })
          
          setUser(userInfo.data)
          
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname)
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
        console.log('Authentication error:', error.message)
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
    const authUrl = `${KEYCLOAK_URL}/protocol/openid-connect/auth?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=openid email profile`
    console.log('Auth URL:', authUrl)
    window.location.href = authUrl
  }

  const logout = async () => {
    try {
      // Clear the auth cookie from API
      await axios.get('/api/logout', { withCredentials: true })
      
      setUser(null)
      
      // Redirect to Keycloak logout
      const redirectUri = encodeURIComponent(window.location.origin)
      window.location.href = `${KEYCLOAK_URL}/protocol/openid-connect/logout?redirect_uri=${redirectUri}`
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
