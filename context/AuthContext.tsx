// context/AuthContext.tsx - Simple fallback version
"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { authService, AuthUser } from '../lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isEmailVerified: () => boolean;
  resendEmailVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(true);

  const signUp = useCallback(async (email: string, password: string, firstName: string, lastName: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      const authUser = await authService.signUp(email, password, firstName, lastName);
      setUser(authUser);
      return authUser;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      const authUser = await authService.signIn(email, password);
      setUser(authUser);
      return authUser;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser]);

  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    return authService.changePassword(currentPassword, newPassword);
  }, []);

  const isEmailVerified = useCallback((): boolean => {
    return authService.isEmailVerified();
  }, []);

  const resendEmailVerification = useCallback(async (): Promise<void> => {
    return authService.resendEmailVerification();
  }, []);

  console.log('🔍 Simple AuthProvider render - user:', user, 'loading:', loading, 'initialized:', initialized);

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    changePassword,
    isEmailVerified,
    resendEmailVerification
  }), [user, loading, initialized, signUp, signIn, signOut, changePassword, isEmailVerified, resendEmailVerification]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};