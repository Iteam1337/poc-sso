import axios from 'axios'

// Keycloak configuration
const KEYCLOAK_URL = 'https://auth-test.mimer.nu/realms/onecore-test'
const CLIENT_ID = 'poc-sso'

class AuthService {
  // Redirect to Keycloak login
  initiateLogin() {
    const redirectUri = `${window.location.origin}/callback`
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    console.log('Redirect URI for authorization:', redirectUri)

    const authUrl = `${KEYCLOAK_URL}/protocol/openid-connect/auth?client_id=${CLIENT_ID}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=openid email profile&state=${Date.now()}`

    window.location.href = authUrl
  }

  // Exchange authorization code for tokens
  async exchangeCodeForToken(code) {
    const redirectUri = `${window.location.origin}/callback`
    console.log('Using redirect URI for token exchange:', redirectUri)

    try {
      console.log('Sending code to backend for token exchange')
      const response = await axios.post(
        '/api/token',
        {
          code: code,
          redirect_uri: redirectUri,
        },
        {
          withCredentials: true, // Important for cookies to be sent/received
        },
      )

      console.log('Token exchange successful')
      return response.data
    } catch (error) {
      console.error(
        'Token exchange error:',
        error.response?.data || error.message,
      )
      // Log more details about the error
      if (error.response) {
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
      }
      throw error
    }
  }

  // Get user info from API using the cookie
  async getUserInfo() {
    try {
      const response = await axios.get('/api/user', {
        withCredentials: true, // Important for cookies to be sent
      })

      return response.data.user
    } catch (error) {
      console.log('Not authenticated via API cookie')
      return null
    }
  }

  // Logout user
  async logout() {
    try {
      // Clear the auth cookie from API
      await axios.get('/api/logout', { withCredentials: true })

      // Redirect to Keycloak logout
      const redirectUri = window.location.origin
      const encodedRedirectUri = encodeURIComponent(redirectUri)
      window.location.href = `${KEYCLOAK_URL}/protocol/openid-connect/logout?redirect_uri=${encodedRedirectUri}`
    } catch (error) {
      console.error('Logout failed:', error.message)
      throw error
    }
  }
}

export default new AuthService()
