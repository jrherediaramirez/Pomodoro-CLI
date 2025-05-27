// components/EnhancedLoader.tsx
import React, { useState, useEffect } from 'react';
import { BRAILLE_SPINNER_CHARS } from '@/lib/constants';

interface EnhancedLoaderProps {
  isActive: boolean;
  message?: string;
  variant?: 'spinner' | 'dots' | 'progress' | 'pulse';
  className?: string;
  showMessage?: boolean;
}

const LOADING_MESSAGES = [
  'Processing command...',
  'Executing...',
  'Working...',
  'Please wait...',
  'Almost done...'
];

const DOTS_ANIMATION = ['', '.', '..', '...'];

const EnhancedLoader: React.FC<EnhancedLoaderProps> = ({ 
  isActive, 
  message,
  variant = 'spinner',
  className = '',
  showMessage = true
}) => {
  const [spinnerIndex, setSpinnerIndex] = useState<number>(0);
  const [dotsIndex, setDotsIndex] = useState<number>(0);
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!isActive) {
      setSpinnerIndex(0);
      setDotsIndex(0);
      setMessageIndex(0);
      setProgress(0);
      return;
    }

    let interval: NodeJS.Timeout;
    
    switch (variant) {
      case 'spinner':
        interval = setInterval(() => {
          setSpinnerIndex((prev) => (prev + 1) % BRAILLE_SPINNER_CHARS.length);
        }, 100);
        break;
        
      case 'dots':
        interval = setInterval(() => {
          setDotsIndex((prev) => (prev + 1) % DOTS_ANIMATION.length);
        }, 500);
        break;
        
      case 'progress':
        interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) return 0;
            return prev + Math.random() * 10;
          });
        }, 200);
        break;
        
      case 'pulse':
        // Pulse animation is handled via CSS
        break;
    }

    // Message rotation
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => {
      if (interval) clearInterval(interval);
      clearInterval(messageInterval);
    };
  }, [isActive, variant]);

  if (!isActive) return null;

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <span style={{ 
            color: 'var(--dracula-green)',
            fontSize: '16px',
            animation: 'spin 1s linear infinite'
          }}>
            {BRAILLE_SPINNER_CHARS[spinnerIndex]}
          </span>
        );
        
      case 'dots':
        return (
          <span style={{ color: 'var(--dracula-green)' }}>
            Loading{DOTS_ANIMATION[dotsIndex]}
          </span>
        );
        
      case 'progress':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '100px',
              height: '4px',
              background: 'var(--dracula-current-line)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(progress, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--dracula-green), var(--dracula-cyan))',
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <span style={{ 
              color: 'var(--dracula-green)',
              fontSize: '12px',
              minWidth: '35px'
            }}>
              {Math.round(Math.min(progress, 100))}%
            </span>
          </div>
        );
        
      case 'pulse':
        return (
          <div style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center'
          }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  background: 'var(--dracula-green)',
                  borderRadius: '50%',
                  animation: `pulse 1.4s ease-in-out ${i * 0.16}s infinite both`
                }}
              />
            ))}
          </div>
        );
        
      default:
        return <span style={{ color: 'var(--dracula-green)' }}>⏳</span>;
    }
  };

  const currentMessage = message || (showMessage ? LOADING_MESSAGES[messageIndex] : '');

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-family-mono)',
        fontSize: '14px'
      }}
    >
      {renderLoader()}
      {showMessage && currentMessage && (
        <span style={{ 
          color: 'var(--dracula-cyan)',
          opacity: 0.8
        }}>
          {currentMessage}
        </span>
      )}
      
      {/* CSS for animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 80%, 100% {
              transform: scale(0);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default EnhancedLoader;