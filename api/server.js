const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3001;

app.use(express.json());

// Middleware to extract user info from headers
const extractUserInfo = (req, res, next) => {
  console.log('Headers received by API:', req.headers);
  
  // Get user info from headers that might be set by the frontend
  const email = req.headers['x-auth-email'];
  const user = req.headers['x-auth-user'];
  
  if (!email && !user) {
    console.log('No user info in headers');
    return res.status(401).json({ error: 'No user information provided' });
  }
  
  req.user = { 
    email: email || 'unknown@example.com',
    id: user || 'unknown-user'
  };
  
  next();
};

// Protected endpoint that requires authentication
app.get('/user', extractUserInfo, (req, res) => {
  // Log all headers for debugging
  console.log('Request headers:', req.headers);
  
  res.json({
    message: 'API received user information',
    user: req.user,
    timestamp: new Date().toISOString(),
    receivedHeaders: {
      'x-auth-email': req.headers['x-auth-email'],
      'x-auth-user': req.headers['x-auth-user']
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
