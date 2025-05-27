// components/ErrorBoundary.tsx
"use client";
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--dracula-background)',
          color: 'var(--dracula-foreground)',
          fontFamily: 'var(--font-family-mono)',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            border: '2px solid var(--dracula-red)',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            backgroundColor: 'rgba(40, 42, 54, 0.9)'
          }}>
            <h2 style={{ 
              color: 'var(--dracula-red)', 
              marginBottom: '20px',
              fontSize: '24px'
            }}>
              Terminal Crashed
            </h2>
            <p style={{ 
              color: 'var(--dracula-cyan)', 
              marginBottom: '15px',
              fontSize: '16px'
            }}>
              Something went wrong with the Pomodoro CLI.
            </p>
            <details style={{ 
              color: 'var(--dracula-comment)', 
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                Error Details
              </summary>
              <pre style={{ 
                background: 'var(--dracula-current-line)',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error?.stack || this.state.error?.message || 'Unknown error'}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'var(--dracula-green)',
                color: 'var(--dracula-background)',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontFamily: 'inherit'
              }}
            >
              Restart Terminal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;