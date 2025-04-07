const express = require('express');
const cookieParser = require('cookie-parser');
const { jwtDecode } = require('jose');
const app = express();
const port = 3001;

app.use(express.json());
app.use(cookieParser());

// Middleware to extract user info from OAuth2 Proxy
const extractUserInfo = async (req, res, next) => {
  try {
    // Check for OAuth2 Proxy cookie
    const sessionCookie = req.cookies._oauth2_proxy;
    
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check for Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // Decode token (in production, you would verify it)
        const decodedToken = jwtDecode(token);
        req.user = {
          id: decodedToken.payload.sub,
          email: decodedToken.payload.email,
          name: decodedToken.payload.name,
          source: 'token'
        };
        return next();
      } catch (error) {
        console.error('Token decode error:', error);
      }
    }
    
    // Fallback to basic session info
    req.user = {
      authenticated: true,
      sessionId: sessionCookie,
      source: 'cookie'
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// API endpoint that requires authentication
app.get('/api/user', extractUserInfo, (req, res) => {
  res.json({
    message: 'Authentication successful',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Also support /user endpoint
app.get('/user', extractUserInfo, (req, res) => {
  res.json({
    message: 'Authentication successful',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});
