const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3001;

app.use(express.json());

// Middleware to extract and validate token
const extractToken = (req, res, next) => {
  // OAuth2 Proxy passes the token in the Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No Authorization header or not Bearer token');
    // Check for X-Auth-Request-Email header which OAuth2 Proxy might set
    const email = req.headers['x-auth-request-email'];
    if (email) {
      req.user = { email };
      req.token = 'dummy-token';
      return next();
    }
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  req.token = token;
  
  try {
    // In a real app, you would verify the token
    // Here we just decode it to extract user info
    const decoded = jwt.decode(token);
    req.user = decoded || { email: req.headers['x-auth-request-email'] || 'unknown@example.com' };
    console.log('Decoded token:', decoded);
    next();
  } catch (error) {
    console.error('Error decoding token:', error);
    // Fallback to headers if token decoding fails
    req.user = { 
      email: req.headers['x-auth-request-email'] || 'unknown@example.com',
      error: error.message
    };
    next();
  }
};

// Protected endpoint that requires authentication
app.get('/user', extractToken, (req, res) => {
  // Log all headers for debugging
  console.log('Request headers:', req.headers);
  
  res.json({
    message: 'Authenticated successfully',
    user: req.user,
    token: req.token,
    headers: {
      'x-auth-request-email': req.headers['x-auth-request-email'],
      'x-auth-request-user': req.headers['x-auth-request-user'],
      'x-auth-request-access-token': req.headers['x-auth-request-access-token']
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});
