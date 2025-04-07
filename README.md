# Secure Authentication with Keycloak, React, and Node.js

This project demonstrates a secure authentication flow using Keycloak as the identity provider, with a React frontend and Node.js backend. The application implements industry best practices for authentication, including:

- OAuth 2.0 Authorization Code Flow
- JWKS token verification
- HTTP-only cookies for token storage
- Refresh token handling
- Secure token exchange via backend

## Architecture

The application consists of three main components:

1. **Keycloak Server**: External identity provider (IdP) that handles user authentication
2. **React Frontend**: Client application that initiates the authentication flow
3. **Node.js Backend**: API server that securely exchanges the authorization code for tokens

### Authentication Flow

1. User clicks "Login" in the frontend
2. User is redirected to Keycloak login page
3. After successful authentication, Keycloak redirects back to the application with an authorization code
4. The frontend sends this code to the backend
5. The backend exchanges the code for tokens using client credentials
6. The backend verifies the token signature using JWKS
7. The backend stores the access token in an HTTP-only cookie
8. The frontend receives user information and displays the dashboard
9. Subsequent API requests include the cookie automatically

## Project Structure

```
├── api/                  # Backend Node.js API
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # JWT verification middleware
│   │   └── cors.js       # CORS configuration
│   ├── services/         # Business logic
│   │   ├── jwksService.js # JWKS token verification
│   │   └── tokenService.js # Token handling and exchange
│   ├── .env              # Environment variables (not in repo)
│   ├── Dockerfile        # Docker configuration
│   ├── package.json      # Dependencies
│   └── server.js         # Express server
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   │   └── useAuth.jsx # Authentication context
│   │   ├── pages/        # Application pages
│   │   │   ├── Callback.jsx # OAuth callback handler
│   │   │   ├── Dashboard.jsx # Protected page
│   │   │   └── Home.jsx  # Landing page
│   │   ├── services/     # API services
│   │   │   └── authService.js # Authentication service
│   │   ├── App.jsx       # Main application component
│   │   └── main.jsx      # Application entry point
│   ├── Dockerfile        # Docker configuration
│   ├── package.json      # Dependencies
│   └── vite.config.js    # Vite configuration
│
└── docker-compose.yml    # Docker Compose configuration
```

## Setup and Running

### Prerequisites

- Docker and Docker Compose
- A Keycloak server (or use the provided configuration for the public demo server)

### Configuration

1. Create an `.env` file in the `api` directory with the following variables:

```
KEYCLOAK_URL=https://keycloak.berget.ai/realms/iteam
CLIENT_ID=demo
CLIENT_SECRET=your_client_secret_here
```

2. Configure your Keycloak client:
   - Create a client with ID matching your CLIENT_ID
   - Set Access Type to "confidential"
   - Enable "Standard Flow"
   - Add valid redirect URIs: `http://localhost:5173/callback`
   - Copy the client secret to your .env file

### Running the Application

Start the application using Docker Compose:

```bash
docker-compose up
```

Open your browser and navigate to:

```
http://localhost:5173
```

## Security Considerations

This application implements several security best practices:

1. **No tokens in browser storage**: Access tokens are stored in HTTP-only cookies
2. **Backend token exchange**: The client secret is never exposed to the frontend
3. **JWKS verification**: Tokens are cryptographically verified using Keycloak's public keys
4. **CORS configuration**: Properly configured to prevent cross-origin attacks
5. **Refresh token rotation**: Implemented for long-lived sessions

## License

MIT
