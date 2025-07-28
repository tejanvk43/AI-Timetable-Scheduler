import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../utils/api';

// Create context
const AuthContext = createContext({
  currentUser: null,
  loading: true,
  error: null,
  login: async () => ({}),
  logout: () => {},
  changePassword: async () => false,
  isAuthenticated: false,
  isAdmin: false,
  isFaculty: false,
  isStudent: false,
});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        const response = await auth.getProfile();
        setCurrentUser(response.data.data);
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Login function - accepts username and password
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await auth.login(credentials);
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      setError(null);
      await auth.changePassword(passwordData);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      throw err;
    }
  };
  
  // Context value
  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    changePassword,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isFaculty: currentUser?.role === 'faculty',
    isStudent: currentUser?.role === 'student'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;