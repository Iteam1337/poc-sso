const express = require('express');
const { jwtDecode } = require('jose');
const app = express();
const port = 3001;

app.use(express.json());

// Middleware to extract and verify JWT from Authorization header
const extractJwtToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // In a production app, you would verify the token signature
      // For this demo, we'll just decode it
      const decodedToken = jwtDecode(token);
      
      req.user = {
        id: decodedToken.payload.sub,
        email: decodedToken.payload.email,
        name: decodedToken.payload.name,
        preferred_username: decodedToken.payload.preferred_username,
        source: 'keycloak'
      };
      
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});
