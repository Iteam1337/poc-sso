const axios = require('axios');
const jose = require('jose');

class TokenService {
  constructor(keycloakUrl, clientId, clientSecret) {
    this.keycloakUrl = keycloakUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tokenEndpoint = `${keycloakUrl}/protocol/openid-connect/token`;
  }

  async exchangeCodeForTokens(code, redirectUri) {
    try {
      const response = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: redirectUri
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw error;
    }
  }

  decodeToken(token) {
    return jose.decodeJwt(token);
  }

  extractUserFromToken(token) {
    const decodedToken = this.decodeToken(token);
    return {
      id: decodedToken.sub,
      email: decodedToken.email,
      name: decodedToken.name,
      preferred_username: decodedToken.preferred_username
    };
  }

  setCookies(res, { access_token, refresh_token, expires_in }) {
    // Set the access token as an HTTP-only cookie
    res.cookie('auth_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expires_in * 1000
    });
    
    // Store refresh token in a separate cookie
    if (refresh_token) {
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }
  }

  clearAuthCookies(res) {
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');
  }
}

module.exports = TokenService;
