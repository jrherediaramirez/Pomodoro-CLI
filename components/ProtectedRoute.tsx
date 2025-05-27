// components/ProtectedRoute.tsx - Optional: For future route protection
"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthPage from './auth/AuthPage';
import EnhancedLoader from './EnhancedLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--dracula-background)'
      }}>
        <EnhancedLoader 
          isActive={true} 
          variant="spinner" 
          message="Loading..."
        />
      </div>
    );
  }

  if (!user) {
    return fallback || <AuthPage />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;