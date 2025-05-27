// components/ProgressBar.tsx
import React from 'react';
import { ProgressBarProps } from '@/types';

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  totalTime,
  isBreak,
  length = 30,
}) => {
  if (totalTime === 0) {
    return (
      <div style={{ fontSize: '14px', color: 'var(--dracula-comment)' }}>
        [--:--]
      </div>
    );
  }

  const elapsedRatio = Math.max(0, Math.min(1, (totalTime - currentTime) / totalTime));
  const filledCount = Math.max(0, Math.min(length, Math.floor(elapsedRatio * length)));
  const emptyCount = length - filledCount;

  const bar = '█'.repeat(filledCount) + '░'.repeat(emptyCount);
  
  // Current time display
  const now = new Date();
  const currentTimeDisplay = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  }).replace(' ', '').toLowerCase();
  
  // Time remaining
  const remainingMinutes = Math.floor(currentTime / 60);
  const remainingSeconds = currentTime % 60;
  const timeRemaining = `${remainingMinutes}m${remainingSeconds.toString().padStart(2, '0')}s`;
  
  // Percentage
  const percentage = Math.round(elapsedRatio * 100);

  const color = isBreak ? 'var(--dracula-green)' : 'var(--dracula-pink)';

  return (
    <div style={{
      fontFamily: 'monospace', 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    }}>
      {/* Time display on top - larger and more prominent */}
      <div style={{
        color: 'var(--dracula-cyan)',
        fontSize: '16px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}>
        <span style={{ color: 'var(--dracula-cyan)' }}>{currentTimeDisplay}</span>
        <span style={{ color: 'var(--dracula-comment)' }}>•</span>
        <span style={{ color: color }}>{timeRemaining}</span>
      </div>
      
      {/* Progress bar with percentage */}
      <div style={{
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        width: '100%',
        justifyContent: 'center'
      }}>
        <div style={{
          color: 'var(--dracula-green)',
          fontSize: '18px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          letterSpacing: '1px',
          minWidth: 0
        }}>
          {bar}
        </div>
        <div style={{ 
          color: 'var(--dracula-green)', 
          minWidth: '3.5rem', 
          textAlign: 'left', 
          fontSize: '18px',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          {percentage}%
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;