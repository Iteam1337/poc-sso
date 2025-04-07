const express = require('express');
const jose = require('jose');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const app = express();
const port = 3001;

// Load environment variables
require('dotenv').config();

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://keycloak.berget.ai/realms/iteam';
const CLIENT_ID = process.env.CLIENT_ID || 'demo';
const CLIENT_SECRET = process.env.CLIENT_SECRET;

app.use(express.json());
app.use(cookieParser());

// Enable CORS for the frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to extract and verify JWT from cookies
const extractJwtToken = async (req, res, next) => {
  try {
    // First check for token in cookie
    const token = req.cookies.auth_token;
    
    // Fallback to Authorization header if no cookie
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;
    
    // Use token from cookie or header
    const accessToken = token || headerToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      // In a production app, you would verify the token signature
      // For this demo, we'll just decode it
      const decodedToken = jose.decodeJwt(accessToken);
      
      req.user = {
        id: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        preferred_username: decodedToken.preferred_username,
        source: 'keycloak'
      };
      
      // If token came from header, set it as a secure cookie
      if (headerToken && !token) {
        // Set HTTP-only cookie that can't be accessed by JavaScript
        res.cookie('auth_token', headerToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Only use secure in production
          sameSite: 'strict',
          maxAge: 3600000 // 1 hour
        });
      }
      
      next();
    } catch (tokenError) {
      console.error('Token decode error:', tokenError);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Token exchange endpoint
app.post('/api/token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    
    console.log(`Attempting to exchange code for token with redirect_uri: ${redirect_uri}`);
    
    // Exchange the authorization code for tokens using client credentials
    const tokenResponse = await axios.post(
      `${KEYCLOAK_URL}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: redirect_uri
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
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
    
    // Return user info from the token
    const decodedToken = jose.decodeJwt(access_token);
    const user = {
      id: decodedToken.sub,
      email: decodedToken.email,
      name: decodedToken.name,
      preferred_username: decodedToken.preferred_username
    };
    
    res.json({ 
      message: 'Authentication successful',
      user,
      expiresIn: expires_in
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
  res.clearCookie('auth_token');
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out successfully' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});
