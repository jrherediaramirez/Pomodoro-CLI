// components/ResponsiveLogo.tsx
import React, { useState, useEffect } from 'react';

interface ResponsiveLogoProps {
  variant?: 'startup' | 'header' | 'compact';
  className?: string;
}

// Full ASCII art for desktop
const FULL_ASCII_LOGO = `
 ██████   ██████  ███    ███  ██████  ██████   ██████  ██████   ██████      ██████ ██      ██ 
 ██   ██ ██    ██ ████  ████ ██    ██ ██   ██ ██    ██ ██   ██ ██    ██    ██      ██      ██ 
 ██████  ██    ██ ██ ████ ██ ██    ██ ██   ██ ██    ██ ██████  ██    ██    ██      ██      ██ 
 ██      ██    ██ ██  ██  ██ ██    ██ ██   ██ ██    ██ ██   ██ ██    ██    ██      ██      ██ 
 ██       ██████  ██      ██  ██████  ██████   ██████  ██   ██  ██████      ██████ ███████ ██ 
`;

// Medium ASCII art for tablets
const MEDIUM_ASCII_LOGO = `
 ██████   ██████  ███    ███  ██████  ██████   ██████  ██████   ██████      ██████ ██      ██ 
 ██   ██ ██    ██ ████  ████ ██    ██ ██   ██ ██    ██ ██   ██ ██    ██    ██      ██      ██ 
 ██████  ██    ██ ██ ████ ██ ██    ██ ██   ██ ██    ██ ██████  ██    ██    ██      ██      ██ 
 ██      ██    ██ ██  ██  ██ ██    ██ ██   ██ ██    ██ ██   ██ ██    ██    ██      ██      ██ 
 ██       ██████  ██      ██  ██████  ██████   ██████  ██   ██  ██████      ██████ ███████ ██ 
`;

// Compact ASCII for small screens
const COMPACT_ASCII_LOGO = `
 ██████   ██████  ███    ███  ██████  ██████   ██████  ██████   ██████      ██████ ██      ██ 
 ██   ██ ██    ██ ████  ████ ██    ██ ██   ██ ██    ██ ██   ██ ██    ██    ██      ██      ██ 
 ██████  ██    ██ ██ ████ ██ ██    ██ ██   ██ ██    ██ ██████  ██    ██    ██      ██      ██ 
 ██      ██    ██ ██  ██  ██ ██    ██ ██   ██ ██    ██ ██   ██ ██    ██    ██      ██      ██ 
 ██       ██████  ██      ██  ██████  ██████   ██████  ██   ██  ██████      ██████ ███████ ██ 
`;

const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenSize;
};

const ResponsiveLogo: React.FC<ResponsiveLogoProps> = ({ 
  variant = 'startup', 
  className = '' 
}) => {
  const screenSize = useScreenSize();

  const getLogoForScreen = () => {
    if (variant === 'compact') {
      return COMPACT_ASCII_LOGO;
    }

    switch (screenSize) {
      case 'mobile':
        return COMPACT_ASCII_LOGO;
      case 'tablet':
        return variant === 'header' ? COMPACT_ASCII_LOGO : MEDIUM_ASCII_LOGO;
      case 'desktop':
      default:
        return FULL_ASCII_LOGO;
    }
  };

  const getFontSize = () => {
    if (screenSize === 'mobile') {
      return '5px'; // Unified smaller font size for mobile to ensure ASCII logo fits
    }

    if (variant === 'header') {
      switch (screenSize) {
        // case 'mobile': // Handled above
        case 'tablet':
          return '7px';
        case 'desktop':
        default:
          return '8px';
      }
    }

    // Applies to 'startup' variant and others not 'header', for tablet/desktop
    switch (screenSize) {
      // case 'mobile': // Handled above
      case 'tablet':
        return '10px';
      case 'desktop':
      default:
        return '14px';
    }
    return '14px'; // Fallback
  };

  const getStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      fontFamily: 'monospace',
      whiteSpace: 'pre',
      color: 'var(--dracula-green)',
      fontSize: getFontSize(),
      lineHeight: '1',
      textAlign: 'center',
      userSelect: 'none'
    };

    if (variant === 'header') {
      return {
        ...baseStyles,
        overflow: 'hidden',
        maxWidth: '100%'
      };
    }

    return baseStyles;
  };

  const getMobileAlternative = () => {
    // Always return null to use ASCII logo rendering for mobile
    return null;
    /*
    if (screenSize === 'mobile' && variant === 'startup') {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}>
          {/* Icon-style representation *\/}
          <div style={{
            width: '80px',
            height: '80px',
            border: '3px solid var(--dracula-green)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: 'var(--dracula-green)',
            background: 'rgba(80, 250, 123, 0.1)'
          }}>
            
          </div>
          
          {/* Text logo *\/}
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--dracula-green)',
            textAlign: 'center',
            fontFamily: 'var(--font-family-mono)'
          }}>
            POMODORO CLI
          </div>
          
          {/* Subtitle *\/}
          <div style={{
            fontSize: '12px',
            color: 'var(--dracula-cyan)',
            textAlign: 'center',
            opacity: 0.8
          }}>
            Terminal-Style Timer
          </div>
        </div>
      );
    }

    if (screenSize === 'mobile' && variant === 'header') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '16px' }}>🍅</span>
          <span style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'var(--dracula-green)',
            fontFamily: 'var(--font-family-mono)'
          }}>
            POMODORO CLI
          </span>
        </div>
      );
    }

    return null;
    */
  };

  const mobileAlternative = getMobileAlternative();
  
  if (mobileAlternative) {
    return (
      <div className={className}>
        {mobileAlternative}
      </div>
    );
  }

  return (
    <div className={className} style={getStyles()}>
      {getLogoForScreen()}
    </div>
  );
};

export default ResponsiveLogo;