import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // Get user info from OAuth2 Proxy
        const response = await axios.get('/oauth2/userinfo', { 
          withCredentials: true 
        })
        
        if (response.data) {
          console.log('User authenticated:', response.data)
          setUser(response.data)
        }
      } catch (error) {
        console.log('User not authenticated')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = () => {
    // Redirect to OAuth2 Proxy login
    const currentUrl = window.location.origin
    window.location.href = `/oauth2/sign_in?rd=${encodeURIComponent(currentUrl + '/dashboard')}`
  }

  const logout = async () => {
    try {
      // Sign out from OAuth2 Proxy
      await axios.get('/oauth2/sign_out')
      
      // Redirect to Keycloak logout
      const redirectUri = encodeURIComponent(window.location.origin)
      window.location.href = `https://keycloak.berget.ai/realms/iteam/protocol/openid-connect/logout?redirect_uri=${redirectUri}`
    } catch (error) {
      console.error('Logout failed')
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
