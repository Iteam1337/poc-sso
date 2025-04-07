const express = require('express');
const cookieParser = require('cookie-parser');
const { jwtDecode } = require('jose');
const app = express();
const port = 3001;

app.use(express.json());
app.use(cookieParser());

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`API Request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Cookies:', req.cookies);
  next();
});

// Middleware to extract and verify user info from cookies
const extractUserFromCookies = async (req, res, next) => {
  try {
    // Get the _oauth2_proxy cookie which contains the session
    const sessionCookie = req.cookies._oauth2_proxy;
    
    if (!sessionCookie) {
      console.log('No OAuth2 Proxy cookie found');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // For demo purposes, we'll just extract user info from the cookie
    // In a real app, you would verify the JWT signature with the correct key
    
    // Check if we have an ID token in the Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // In a real app, you would verify the token with the public key from Keycloak
        // For demo, we'll just decode without verification
        const decodedToken = jwtDecode(token);
        
        req.user = {
          id: decodedToken.payload.sub,
          email: decodedToken.payload.email,
          name: decodedToken.payload.name,
          preferred_username: decodedToken.payload.preferred_username,
          source: 'id_token'
        };
        
        return next();
      } catch (tokenError) {
        console.error('Error decoding token:', tokenError);
      }
    }
    
    // If we don't have a valid token, extract basic info from the cookie
    // This is a simplified approach for the demo
    req.user = {
      authenticated: true,
      sessionId: sessionCookie,
      source: 'cookie'
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Protected endpoint that requires authentication
app.get('/user', extractUserFromCookies, (req, res) => {
  res.json({
    message: 'API authenticated user via cookies',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Also add the endpoint with /api prefix for direct access
app.get('/api/user', extractUserFromCookies, (req, res) => {
  res.json({
    message: 'API authenticated user via cookies',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
  console.log(`Available endpoints: /health, /user, /api/user`);
});
