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
        // Try to access a protected endpoint
        const response = await axios.get('/api/user')
        if (response.data && response.data.token) {
          try {
            const decodedToken = jwtDecode(response.data.token)
            setUser({
              ...decodedToken,
              token: response.data.token
            })
            console.log('User authenticated:', decodedToken)
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError)
            console.log('Raw token:', response.data.token)
            setUser({
              email: 'unknown@example.com',
              name: 'Unknown User',
              token: response.data.token
            })
          }
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
    // Redirect to OAuth2 Proxy login
    window.location.href = '/oauth2/sign_in'
  }

  const logout = async () => {
    try {
      await axios.get('/oauth2/sign_out')
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
