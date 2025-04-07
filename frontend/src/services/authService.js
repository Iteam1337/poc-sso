import axios from 'axios';

// Keycloak configuration
const KEYCLOAK_URL = 'https://keycloak.berget.ai/realms/iteam';
const CLIENT_ID = 'demo';

class AuthService {
  // Redirect to Keycloak login
  initiateLogin() {
    const redirectUri = `${window.location.origin}/callback`;
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    console.log('Redirect URI for authorization:', redirectUri);
    
    const authUrl = `${KEYCLOAK_URL}/protocol/openid-connect/auth?client_id=${CLIENT_ID}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=openid email profile&state=${Date.now()}`;
    
    window.location.href = authUrl;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForToken(code) {
    const redirectUri = `${window.location.origin}/callback`;
    console.log('Using redirect URI for token exchange:', redirectUri);
    
    try {
      const response = await axios.post(
        '/api/token',
        {
          code: code,
          redirect_uri: redirectUri
        },
        {
          withCredentials: true // Important for cookies to be sent/received
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get user info from API using the cookie
  async getUserInfo() {
    try {
      const response = await axios.get('/api/user', {
        withCredentials: true // Important for cookies to be sent
      });
      
      return response.data.user;
    } catch (error) {
      console.log('Not authenticated via API cookie');
      return null;
    }
  }

  // Logout user
  async logout() {
    try {
      // Clear the auth cookie from API
      await axios.get('/api/logout', { withCredentials: true });
      
      // Redirect to Keycloak logout
      const redirectUri = window.location.origin;
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      window.location.href = `${KEYCLOAK_URL}/protocol/openid-connect/logout?redirect_uri=${encodedRedirectUri}`;
    } catch (error) {
      console.error('Logout failed:', error.message);
      throw error;
    }
  }

  // Parse query parameters from URL
  getQueryParams() {
    const searchParams = new URLSearchParams(window.location.search);
    const params = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  }
}

export default new AuthService();
