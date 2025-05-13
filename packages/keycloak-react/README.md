# keycloak-react

A simple Keycloak integration for React applications.

## Installation

```bash
npm install keycloak-react
```

## Usage

### Setup AuthProvider

```jsx
// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from 'keycloak-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Callback from './pages/Callback';

const App = () => {
  const authConfig = {
    keycloakUrl: 'https://auth.example.com/realms/my-realm',
    clientId: 'my-client',
    apiUrl: '/api' // Optional, defaults to '/api'
  };

  return (
    <AuthProvider config={authConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<Callback />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
```

### Home Page

```jsx
// pages/Home.jsx
import React from 'react';
import { useAuth } from 'keycloak-react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div>
      <h1>Welcome</h1>
      <button onClick={login}>Login</button>
    </div>
  );
}

export default Home;
```

### Callback Page

```jsx
// pages/Callback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from 'keycloak-react';

function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleCallback } = useAuth();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      setIsProcessing(true);
      
      // Check for error in URL
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        setError(`${errorParam}: ${errorDescription || 'Unknown error'}`);
        setIsProcessing(false);
        return;
      }

      const code = searchParams.get('code');
      if (!code) {
        setError('No authorization code found in the URL');
        setIsProcessing(false);
        return;
      }

      try {
        // Exchange code for token
        await handleCallback(code);
        navigate('/dashboard');
      } catch (error) {
        setError(`Authentication failed: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, handleCallback, navigate]);

  if (isProcessing) {
    return <div>Processing authentication...</div>;
  }

  if (error) {
    return (
      <div>
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Return to Home</button>
      </div>
    );
  }

  return <div>Completing authentication...</div>;
}

export default Callback;
```

### Dashboard Page

```jsx
// pages/Dashboard.jsx
import React from 'react';
import { useAuth } from 'keycloak-react';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name || user.preferred_username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Dashboard;
```

## API

### AuthProvider

Context provider that manages authentication state.

Props:
- `config`: Configuration object
  - `keycloakUrl`: Keycloak server URL with realm (required)
  - `clientId`: Client ID (required)
  - `apiUrl`: API base URL (optional, defaults to '/api')
  - `redirectUri`: Redirect URI for OAuth flow (optional, defaults to `${window.location.origin}/callback`)

### useAuth()

Hook to access authentication context.

Returns:
- `user`: Current user object or null if not authenticated
- `loading`: Boolean indicating if auth state is being loaded
- `login()`: Function to initiate login
- `logout()`: Function to log out
- `handleCallback(code, redirectUri)`: Function to handle OAuth callback

### ProtectedRoute

Component to protect routes from unauthenticated access.

Props:
- `children`: Components to render when authenticated
- `redirectTo`: Path to redirect to when not authenticated (optional, defaults to '/')

## License

MIT
