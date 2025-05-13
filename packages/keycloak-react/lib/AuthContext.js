import React, { createContext, useState, useContext, useEffect } from 'react';
import { initKeycloakAuth } from './authService';

const AuthContext = createContext(null);

export function AuthProvider({ children, config }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authService = initKeycloakAuth(config);

  // Check for existing session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get user info from API using the cookie
        const userInfo = await authService.getUserInfo();
        setUser(userInfo);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    authService.initiateLogin();
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  };

  const handleCallback = async (code, redirectUri) => {
    try {
      const userInfo = await authService.handleCallback(code, redirectUri);
      setUser(userInfo);
      return userInfo;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    handleCallback,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
