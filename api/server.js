const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()
const port = 3001

// Load environment variables
require('dotenv').config()

// Import middleware
const setupCors = require('./middleware/cors')
const initKeycloak = require('keycloak-koa')

// Configuration
const KEYCLOAK_URL =
  process.env.KEYCLOAK_URL || 'https://auth-test.mimer.nu/realms/onecore-test'
const CLIENT_ID = process.env.CLIENT_ID || 'poc-sso'
const CLIENT_SECRET = process.env.CLIENT_SECRET

// Check for required environment variables
if (!CLIENT_SECRET) {
  console.warn(
    'WARNING: CLIENT_SECRET environment variable is not set. Token exchange will fail.',
  )
  console.warn(
    'Please set CLIENT_SECRET in your .env file or environment variables.',
  )
}

console.log('Keycloak URL:', KEYCLOAK_URL)
console.log('Client ID:', CLIENT_ID)
console.log('Client Secret configured:', CLIENT_SECRET ? 'Yes' : 'No')

// Initialize Keycloak
const keycloak = initKeycloak({
  keycloakUrl: KEYCLOAK_URL,
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET
})

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(setupCors)

// Token exchange endpoint
app.post('/api/token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' })
    }

    console.log(
      `Attempting to exchange code for token with redirect_uri: ${redirect_uri}`,
    )

    // Exchange the authorization code for tokens using keycloak-koa
    const { user, tokenData } = await keycloak.handleTokenExchange(
      code,
      redirect_uri,
      res
    )

    res.json({
      message: 'Authentication successful',
      user,
      expiresIn: tokenData.expires_in,
    })
  } catch (error) {
    console.error(
      'Token exchange error:',
      error.response?.data || error.message,
    )
    res.status(401).json({
      error: 'Token exchange failed',
      details: error.response?.data || error.message,
    })
  }
})

// API endpoint that requires authentication
app.get('/api/user', keycloak.middleware.extractJwtToken, (req, res) => {
  res.json({
    message: 'Authentication successful via Keycloak integration',
    user: req.user,
    timestamp: new Date().toISOString(),
  })
})

// Endpoint to clear auth cookie on logout
app.get('/api/logout', (req, res) => {
  keycloak.logout(res)
  res.json({ message: 'Logged out successfully' })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`)
})
