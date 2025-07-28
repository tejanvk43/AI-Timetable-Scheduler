import React from 'react';
import { Navigate } from 'react-router-dom';
// @ts-ignore
import { useAuth } from '../context/AuthContext.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  
  // If authentication is still loading, show nothing or a spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If role restriction is provided and user role is not allowed
  if (allowedRoles.length > 0 && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" />;
  }
  
  // If authenticated and authorized, render children
  return <>{children}</>;
};

export default ProtectedRoute;
