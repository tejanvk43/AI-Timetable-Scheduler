// @ts-nocheck
import React, { createContext, useState, useContext, useEffect } from 'react';

// Import auth API - we'll handle the JS import properly
const api = require('../utils/api.js');
const auth = api.auth;

// Define types for better type safety
interface User {
  _id: string;
  name: string;
  username: string;
  role: 'admin' | 'faculty' | 'student';
  [key: string]: any; // For other properties
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: { username: string; password: string }) => Promise<any>;
  logout: () => void;
  changePassword: (passwordData: { currentPassword: string; newPassword: string }) => Promise<boolean>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
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
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err: any) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Login function - accepts username and password
  const login = async (credentials: { username: string; password: string }) => {
    try {
      setError(null);
      const response = await auth.login(credentials);
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.user);
      return response.data;
    } catch (err: any) {
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
  const changePassword = async (passwordData: { currentPassword: string; newPassword: string }) => {
    try {
      setError(null);
      await auth.changePassword(passwordData);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
      throw err;
    }
  };

  // Context value
  const value: AuthContextType = {
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

// Explicit named exports for clarity
export type { User, AuthContextType };
