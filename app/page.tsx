// app/page.tsx - Updated with authentication flow
"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Terminal from '@/components/Terminal';
import AuthPage from '@/components/auth/AuthPage';
import EnhancedLoader from '@/components/EnhancedLoader';

const HomePage: React.FC = () => {
  const { user, loading } = useAuth();
  const [authCompleted, setAuthCompleted] = useState(false);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--dracula-background)',
        color: 'var(--dracula-foreground)',
        fontFamily: 'var(--font-family-mono)'
      }}>
        <EnhancedLoader 
          isActive={true} 
          variant="spinner" 
          message="Initializing Pomodoro CLI..."
        />
      </div>
    );
  }

  // Show authentication page if user is not logged in
  if (!user) {
    return (
      <AuthPage 
        onAuthComplete={() => setAuthCompleted(true)}
      />
    );
  }

  // Show terminal if user is authenticated
  return <Terminal />;
};

export default HomePage;