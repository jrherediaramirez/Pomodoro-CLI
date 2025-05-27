// components/StartupAnimation.tsx
import React, { useState, useEffect } from 'react';
import ResponsiveLogo from './ResponsiveLogo';
import EnhancedLoader from './EnhancedLoader';
import { StartupAnimationProps } from '@/types';

interface LoadingPhase {
  message: string;
  duration: number;
}

const LOADING_PHASES: LoadingPhase[] = [
  { message: 'Initializing terminal...', duration: 900 },
  { message: 'Loading Pomodoro engine...', duration: 800 },
  { message: 'Setting up workspace...', duration: 1000 },
  { message: 'Ready!', duration: 700 }
];

const StartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete }) => {
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    const phaseTimeouts: NodeJS.Timeout[] = [];
    // Show loader after a brief delay to let the logo appear first
    const loaderTimeout = setTimeout(() => {
      setShowLoader(true);
    }, 500);

    // Progress through loading phases
    let totalTime = 500; // Initial delay before first phase
    
    LOADING_PHASES.forEach((phase, index) => {
      const timeoutId = setTimeout(() => {
        setCurrentPhase(index);
      }, totalTime);
      phaseTimeouts.push(timeoutId);
      totalTime += phase.duration;
    });

    // Complete animation
    const completeTimeout = setTimeout(() => {
      setIsComplete(true);
      setTimeout(() => {
        onComplete?.();
      }, 300); // Brief delay for final fade
    }, totalTime);

    return () => {
      clearTimeout(loaderTimeout);
      clearTimeout(completeTimeout);
      phaseTimeouts.forEach(clearTimeout); // Clear all phase timeouts
    };
  }, [onComplete]);

  return (
    <div 
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#282A36',
        color: '#F8F8F2',
        position: 'relative',
        overflow: 'hidden',
        animation: isComplete ? 'fadeOut 0.3s ease-out' : 'fadeIn 0.5s ease-in',
        padding: '20px'
      }}
    >
      {/* Animated background effect */}
      <div
        style={{
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
          animation: 'scanlines 2s linear infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Main content container */}
      <div
        style={{
          position: 'relative',
          padding: '30px',
          border: '2px solid #50FA7B',
          borderRadius: '8px',
          backgroundColor: 'rgba(40, 42, 54, 0.8)',
          boxShadow: '0 0 20px rgba(80, 250, 123, 0.3)',
          minHeight: '250px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'logoAppear 0.8s ease-out',
          maxWidth: '90vw',
          textAlign: 'center'
        }}
      >
        {/* Responsive Logo */}
        <div
          style={{
            marginBottom: '20px',
            animation: 'glow 2s ease-in-out infinite alternate'
          }}
        >
          <ResponsiveLogo 
            variant="startup"
          />
        </div>

        {/* Loading section */}
        {showLoader && (
          <div
            style={{
              marginTop: '30px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px',
              minHeight: '60px'
            }}
          >
            <EnhancedLoader
              isActive={!isComplete}
              variant="progress"
              showMessage={false}
            />
            
            <div
              style={{
                fontSize: '14px',
                color: '#8BE9FD',
                animation: 'pulse 2s infinite',
                minHeight: '20px'
              }}
            >
              {currentPhase < LOADING_PHASES.length 
                ? LOADING_PHASES[currentPhase].message 
                : 'Welcome to Pomodoro Terminal!'
              }
            </div>

            {/* Progress indicators */}
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              {LOADING_PHASES.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: index <= currentPhase 
                      ? 'var(--dracula-green)' 
                      : 'var(--dracula-current-line)',
                    transition: 'background-color 0.3s ease',
                    boxShadow: index === currentPhase 
                      ? '0 0 8px var(--dracula-green)' 
                      : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Version info for larger screens */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '15px',
            fontSize: '10px',
            color: 'var(--dracula-comment)',
            opacity: 0.6
          }}
        >
          v1.0.0
        </div>
      </div>

      {/* Subtitle for mobile */}
      <div
        style={{
          marginTop: '20px',
          fontSize: '12px',
          color: 'var(--dracula-comment)',
          textAlign: 'center',
          maxWidth: '80vw'
        }}
      >
        Terminal-based productivity timer
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes logoAppear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes glow {
          from {
            filter: drop-shadow(0 0 5px rgba(80, 250, 123, 0.3));
          }
          to {
            filter: drop-shadow(0 0 15px rgba(80, 250, 123, 0.6));
          }
        }

        @keyframes scanlines {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .startup-container {
            padding: 15px;
            min-height: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default StartupAnimation;