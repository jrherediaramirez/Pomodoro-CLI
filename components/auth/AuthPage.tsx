// components/auth/AuthPage.tsx
"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ResponsiveLogo from '../ResponsiveLogo';
import EnhancedLoader from '../EnhancedLoader';

interface AuthPageProps {
  onAuthComplete?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthComplete }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const { signIn, signUp } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Validation for sign up
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          throw new Error('First name and last name are required');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        await signUp(formData.email, formData.password, formData.firstName, formData.lastName);
      } else {
        await signIn(formData.email, formData.password);
      }
      
      onAuthComplete?.();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    });
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--dracula-background)',
      color: 'var(--dracula-foreground)',
      fontFamily: 'var(--font-family-mono)',
      padding: '20px'
    }}>
      {/* Background effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(80, 250, 123, 0.02) 2px,
            rgba(80, 250, 123, 0.02) 4px
          )
        `,
        animation: 'scanlines 3s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Main auth container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        padding: '30px',
        border: '2px solid var(--dracula-green)',
        borderRadius: '8px',
        background: 'rgba(40, 42, 54, 0.9)',
        boxShadow: '0 0 20px rgba(80, 250, 123, 0.3)'
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <ResponsiveLogo variant="compact" />
          <div style={{
            marginTop: '15px',
            fontSize: '14px',
            color: 'var(--dracula-cyan)',
            opacity: 0.8
          }}>
            Terminal-based Pomodoro Timer
          </div>
        </div>

        {/* Auth form */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '18px',
            color: 'var(--dracula-green)',
            fontWeight: 'bold'
          }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              padding: '10px',
              marginBottom: '20px',
              background: 'rgba(255, 85, 85, 0.1)',
              border: '1px solid var(--dracula-red)',
              borderRadius: '4px',
              color: 'var(--dracula-red)',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Name fields (sign up only) */}
          {isSignUp && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--dracula-current-line)',
                  border: '1px solid var(--dracula-comment)',
                  borderRadius: '4px',
                  color: 'var(--dracula-foreground)',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--dracula-current-line)',
                  border: '1px solid var(--dracula-comment)',
                  borderRadius: '4px',
                  color: 'var(--dracula-foreground)',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          )}

          {/* Email field */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '15px',
              background: 'var(--dracula-current-line)',
              border: '1px solid var(--dracula-comment)',
              borderRadius: '4px',
              color: 'var(--dracula-foreground)',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />

          {/* Password field */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '15px',
              background: 'var(--dracula-current-line)',
              border: '1px solid var(--dracula-comment)',
              borderRadius: '4px',
              color: 'var(--dracula-foreground)',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />

          {/* Confirm password (sign up only) */}
          {isSignUp && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                background: 'var(--dracula-current-line)',
                border: '1px solid var(--dracula-comment)',
                borderRadius: '4px',
                color: 'var(--dracula-foreground)',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              background: isLoading ? 'var(--dracula-comment)' : 'var(--dracula-green)',
              color: 'var(--dracula-background)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {isLoading && <EnhancedLoader isActive={true} variant="spinner" showMessage={false} />}
            {isLoading 
              ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
              : (isSignUp ? 'Create Account' : 'Sign In')
            }
          </button>

          {/* Toggle mode */}
          <div style={{
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--dracula-comment)'
          }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--dracula-cyan)',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline',
                fontFamily: 'inherit'
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        fontSize: '12px',
        color: 'var(--dracula-comment)',
        textAlign: 'center'
      }}>
        Secure authentication powered by Firebase
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes scanlines {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        
        input:focus {
          outline: none;
          border-color: var(--dracula-cyan) !important;
          box-shadow: 0 0 0 2px rgba(139, 233, 253, 0.2);
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(80, 250, 123, 0.3);
        }
      `}</style>
    </div>
  );
};

export default AuthPage;