import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('foodlens_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('foodlens_token'));
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('foodlens_token');
      localStorage.removeItem('foodlens_user');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const initAuth = async () => {
      const token = localStorage.getItem('foodlens_token');

      if (token) {
        try {
          const res = await authService.getCurrentUser();
          if (res.success && res.data.user) {
            setUser(res.data.user);
            setIsAuthenticated(true);
            localStorage.setItem('foodlens_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          // If token was rejected as invalid or expired (401), clear authentication
          if (error?.status === 401) {
            handleUnauthorized();
          }
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    initAuth();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setIsAuthenticated(true);
      }
      return res;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const res = await authService.register(userData);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setIsAuthenticated(true);
      }
      return res;
    } catch (error) {
      throw error;
    }
  };


  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('foodlens_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
