import axios from 'axios';

export function initKeycloakAuth(config) {
  const { 
    keycloakUrl, 
    clientId, 
    apiUrl = '/api',
    redirectUri = `${window.location.origin}/callback` 
  } = config;

  if (!keycloakUrl) {
    throw new Error('keycloakUrl is required');
  }

  if (!clientId) {
    throw new Error('clientId is required');
  }

  return {
    // Redirect to Keycloak login
    initiateLogin() {
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      
      const authUrl = `${keycloakUrl}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=openid`;
      
      window.location.href = authUrl;
    },

    // Exchange code for token via backend
    async handleCallback(code, callbackRedirectUri = redirectUri) {
      try {
        const response = await axios.post(
          `${apiUrl}/token`,
          {
            code,
            redirect_uri: callbackRedirectUri,
          },
          {
            withCredentials: true, // Important for cookies
          }
        );

        return response.data.user;
      } catch (error) {
        console.error('Error during token exchange:', error);
        throw error;
      }
    },

    // Get user info from API
    async getUserInfo() {
      try {
        const response = await axios.get(`${apiUrl}/user`, {
          withCredentials: true, // Important for cookies
        });

        return response.data.user;
      } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
      }
    },

    // Logout
    async logout() {
      try {
        // Clear the auth cookie from API
        await axios.get(`${apiUrl}/logout`, { withCredentials: true });

        // Redirect to Keycloak logout
        const redirectUri = window.location.origin;
        const encodedRedirectUri = encodeURIComponent(redirectUri);
        window.location.href = `${keycloakUrl}/protocol/openid-connect/logout?redirect_uri=${encodedRedirectUri}`;
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    }
  };
}
