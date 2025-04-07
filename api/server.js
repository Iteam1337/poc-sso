const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3001;

// Load environment variables
require('dotenv').config();

// Import middleware and services
const setupCors = require('./middleware/cors');
const { extractJwtToken } = require('./middleware/auth');
const TokenService = require('./services/tokenService');

// Configuration
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://keycloak.berget.ai/realms/iteam';
const CLIENT_ID = process.env.CLIENT_ID || 'demo';
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Initialize token service
const tokenService = new TokenService(KEYCLOAK_URL, CLIENT_ID, CLIENT_SECRET);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(setupCors);

// Token exchange endpoint
app.post('/api/token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    
    console.log(`Attempting to exchange code for token with redirect_uri: ${redirect_uri}`);
    
    // Exchange the authorization code for tokens
    const tokenData = await tokenService.exchangeCodeForTokens(code, redirect_uri);
    
    // Set cookies with the tokens
    tokenService.setCookies(res, tokenData);
    
    // Extract user info from token
    const user = tokenService.extractUserFromToken(tokenData.access_token);
    
    res.json({ 
      message: 'Authentication successful',
      user,
      expiresIn: tokenData.expires_in
    });
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(401).json({ 
      error: 'Token exchange failed', 
      details: error.response?.data || error.message 
    });
  }
});

// API endpoint that requires authentication
app.get('/api/user', extractJwtToken, (req, res) => {
  res.json({
    message: 'Authentication successful via direct Keycloak integration',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Also support /user endpoint
app.get('/user', extractJwtToken, (req, res) => {
  res.json({
    message: 'Authentication successful via direct Keycloak integration',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Endpoint to clear auth cookie on logout
app.get('/api/logout', (req, res) => {
  tokenService.clearAuthCookies(res);
  res.json({ message: 'Logged out successfully' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});
