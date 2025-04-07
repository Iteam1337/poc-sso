const express = require('express');
const { jwtDecode } = require('jose');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3001;

app.use(express.json());
app.use(cookieParser());

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
      const decodedToken = jwtDecode(accessToken);
      
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
  res.json({ message: 'Logged out successfully' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});
