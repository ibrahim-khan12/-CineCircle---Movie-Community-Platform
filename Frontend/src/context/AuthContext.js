import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';
import {jwtDecode} from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    
    // Check if user is admin from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.isAdmin === true);
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsAdmin(false);
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    
    // Check admin status from new token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.isAdmin === true);
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsAdmin(false);
      }
    }
    
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAdmin(false);
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const value = {
    user,
    login,
    logout,
    register,
    isAuthenticated: authService.isAuthenticated(),
    isAdmin,
    loading,
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
