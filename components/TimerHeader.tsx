// components/TimerHeader.tsx
import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import ResponsiveLogo from './ResponsiveLogo';
import { TimerHeaderProps } from '@/types';

const TimerHeader: React.FC<TimerHeaderProps> = ({ 
  userInfo, 
  pomodoroInstance, 
  isVisible 
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isVisible || !pomodoroInstance || !userInfo) {
    return null;
  }

  const hasActiveTimer = pomodoroInstance.currentTime > 0 || pomodoroInstance.isRunning;
  
  if (!hasActiveTimer) {
    return null;
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '10px' : '20px',
      left: isMobile ? '10px' : '20px',
      right: isMobile ? '10px' : '20px',
      zIndex: 1000,
      background: 'var(--terminal-bg-current)',
      border: '2px solid var(--dracula-green)',
      borderRadius: '8px',
      fontFamily: 'var(--font-family-mono)',
      fontSize: isMobile ? '12px' : '14px',
      color: 'var(--dracula-foreground)',
      boxShadow: '0 4px 12px rgba(80, 250, 123, 0.2)',
      transition: 'all 0.3s ease',
      maxHeight: isCollapsed ? '50px' : '300px',
      overflow: 'hidden'
    }}>
      {/* Header section - always visible */}
      <div 
        style={{
          padding: isMobile ? '8px 12px' : '8px 15px',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--dracula-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center', // Changed from 'space-between'
          position: 'relative',    // Added
          cursor: isMobile ? 'pointer' : 'default',
          minHeight: isMobile ? '34px' : '40px'
        }}
        onClick={isMobile ? toggleCollapse : undefined}
      >
        {/* Logo and title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          // flex: 1, // Removed
          minWidth: 0
        }}>
          {/* Always use ResponsiveLogo, variant will be handled by the component itself */}
          <ResponsiveLogo variant="header" />
        </div>

        {/* Status and user info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: isMobile ? '10px' : '12px',
          color: 'var(--dracula-cyan)',
          whiteSpace: 'nowrap',
          position: 'absolute', // Added
          right: isMobile ? '12px' : '15px', // Added
          top: '50%', // Added
          transform: 'translateY(-50%)' // Added
        }}>
          {!isMobile && (
            <span>Welcome, {userInfo.firstName}</span>
          )}
          
          {/* Mobile toggle indicator */}
          {isMobile && (
            <span style={{
              color: 'var(--dracula-comment)',
              fontSize: '14px',
              transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease'
            }}>
              ▲
            </span>
          )}
        </div>
      </div>

      {/* Timer content - collapsible on mobile */}
      {(!isMobile || !isCollapsed) && (
        <div style={{
          padding: isMobile ? '10px 12px' : '15px 20px',
          fontFamily: 'monospace',
          fontSize: isMobile ? '14px' : '16px'
        }}>
          {/* Timer border - responsive */}
          <div style={{ 
            color: 'var(--dracula-green)',
            fontSize: isMobile ? '16px' : '20px',
            textAlign: 'center',
            marginBottom: '8px'
          }}>
            {isMobile 
              ? '────────────────────────────────' 
              : '╭────────────────────────────────────────────────╮'
            }
          </div>
          
          {/* Progress bar container */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            color: 'var(--dracula-green)',
            minHeight: isMobile ? '40px' : '50px',
            fontSize: isMobile ? '12px' : '14px'
          }}>
            <div style={{ 
              flex: 1, 
              color: 'var(--dracula-foreground)',
              overflow: 'visible',
              padding: '0 10px'
            }}>
              <ProgressBar
                currentTime={pomodoroInstance.currentTime}
                totalTime={pomodoroInstance.totalTime}
                isBreak={pomodoroInstance.isBreak}
                length={isMobile ? 20 : 35}
              />
            </div>
          </div>
          
          {/* Bottom border */}
          <div style={{ 
            color: 'var(--dracula-green)',
            fontSize: isMobile ? '16px' : '20px',
            textAlign: 'center',
            marginTop: '8px'
          }}>
            {isMobile 
              ? '────────────────────────────────' 
              : '╰────────────────────────────────────────────────╯'
            }
          </div>
          
          {/* Session info */}
          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            fontSize: isMobile ? '11px' : '12px',
            color: 'var(--dracula-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              maxWidth: isMobile ? '120px' : 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {pomodoroInstance.settings.sessionName}
            </span>
            <span style={{ color: 'var(--dracula-comment)' }}>•</span>
            <span style={{
              color: pomodoroInstance.isRunning ? 'var(--dracula-green)' : 'var(--dracula-orange)'
            }}>
              {pomodoroInstance.isRunning ? 'Running' : 'Paused'}
            </span>
            {isMobile && userInfo && (
              <>
                <span style={{ color: 'var(--dracula-comment)' }}>•</span>
                <span style={{ fontSize: '10px' }}>
                  {userInfo.firstName}
                </span>
              </>
            )}
          </div>

          {/* Quick actions for mobile */}
          {isMobile && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginTop: '10px',
              fontSize: '10px',
              color: 'var(--dracula-comment)'
            }}>
              <span>/play</span>
              <span>/pause</span>
              <span>/reset</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimerHeader;