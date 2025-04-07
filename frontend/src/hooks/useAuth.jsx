import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // Try to access the userinfo endpoint from OAuth2 Proxy
        const response = await axios.get('/oauth2/userinfo', { 
          withCredentials: true 
        })
        
        if (response.data) {
          console.log('User info from OAuth2 proxy:', response.data)
          setUser(response.data)
        }
      } catch (error) {
        console.log('User not authenticated:', error.message)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = () => {
    // Redirect to OAuth2 Proxy login with a redirect back to our app
    const currentUrl = window.location.origin;
    window.location.href = `/oauth2/sign_in?rd=${encodeURIComponent(currentUrl + '/dashboard')}`;
  }

  const logout = async () => {
    try {
      // First sign out from OAuth2 Proxy
      await axios.get('/oauth2/sign_out')
      
      // Then redirect to Keycloak logout
      const redirectUri = encodeURIComponent(window.location.origin)
      window.location.href = `https://keycloak.berget.ai/realms/iteam/protocol/openid-connect/logout?redirect_uri=${redirectUri}`
      
      setUser(null)
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
