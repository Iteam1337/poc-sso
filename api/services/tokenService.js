const axios = require('axios')
const jose = require('jose')

class TokenService {
  constructor(keycloakUrl, clientId, clientSecret) {
    this.keycloakUrl = keycloakUrl
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.tokenEndpoint = `${keycloakUrl}/protocol/openid-connect/token`
  }

  async exchangeCodeForTokens(code, redirectUri) {
    try {
      console.log(`Exchanging code for token with Keycloak at ${this.tokenEndpoint}`)
      console.log(`Using client ID: ${this.clientId}`)
      console.log(`Using redirect URI: ${redirectUri}`)
      
      // Check if client secret is available
      if (!this.clientSecret) {
        console.error('CLIENT_SECRET is not configured')
        throw new Error('Missing client secret configuration')
      }
      
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }).toString()
      
      const response = await axios.post(
        this.tokenEndpoint,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )

      console.log('Token exchange successful with Keycloak')
      return response.data
    } catch (error) {
      console.error('Token exchange error with Keycloak:')
      if (error.response) {
        console.error('Status:', error.response.status)
        console.error('Data:', JSON.stringify(error.response.data))
        console.error('Headers:', JSON.stringify(error.response.headers))
      } else {
        console.error('Error message:', error.message)
      }
      throw error
    }
  }

  decodeToken(token) {
    return jose.decodeJwt(token)
  }

  async extractUserFromToken(token, jwksService) {
    try {
      // If jwksService is provided, use it to verify the token
      if (jwksService) {
        const verifiedToken = await jwksService.verifyToken(token)
        return {
          id: verifiedToken.sub,
          email: verifiedToken.email,
          name: verifiedToken.name,
          preferred_username: verifiedToken.preferred_username,
        }
      } else {
        // Fall back to just decoding without verification
        const decodedToken = this.decodeToken(token)
        return {
          id: decodedToken.sub,
          email: decodedToken.email,
          name: decodedToken.name,
          preferred_username: decodedToken.preferred_username,
        }
      }
    } catch (error) {
      console.error('Error extracting user from token:', error.message)
      throw error
    }
  }

  setCookies(res, { access_token, refresh_token, expires_in }) {
    // Set the access token as an HTTP-only cookie
    res.cookie('auth_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expires_in * 1000,
    })

    // Store refresh token in a separate cookie
    if (refresh_token) {
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })
    }
  }

  clearAuthCookies(res) {
    res.clearCookie('auth_token')
    res.clearCookie('refresh_token')
  }
}

module.exports = TokenService
