import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for code in URL query params (for authorization code flow)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a code in the URL (after redirect)
        const params = authService.getQueryParams()

        if (params.code) {
          console.log('Authorization code received:', params.code)

          try {
            // Exchange code for token through our secure API
            const tokenResponse = await authService.exchangeCodeForToken(
              params.code,
            )

            // Set user from the response
            setUser(tokenResponse.user)

            // Clean up the URL
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            )
          } catch (tokenError) {
            console.error('Token exchange error:', tokenError)
            setUser(null)
          }
        } else {
          // Try to get user info from API using the cookie
          const userInfo = await authService.getUserInfo()
          setUser(userInfo)
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
    authService.initiateLogin()
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
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
