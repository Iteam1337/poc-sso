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
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  req.token = token;
  
  try {
    // In a real app, you would verify the token
    // Here we just decode it to extract user info
    const decoded = jwt.decode(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected endpoint that requires authentication
app.get('/user', extractToken, (req, res) => {
  res.json({
    message: 'Authenticated successfully',
    user: req.user,
    token: req.token
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});
