// components/TerminalOutput.tsx
import React from 'react';
import { TerminalOutputProps } from '@/types';

const TerminalOutput: React.FC<TerminalOutputProps> = ({ 
  lines, 
  terminalContentRef, 
  inputRef 
}) => {
  const handleClick = () => {
    inputRef.current?.focus();
  };

  const getLineColor = (type: string): string => {
    switch (type) {
      case 'error':
        return 'var(--dracula-red)';
      case 'input':
        return 'var(--dracula-green)';
      case 'help':
        return 'var(--dracula-foreground)';
      case 'system':
        return 'var(--dracula-cyan)';
      default:
        return 'var(--dracula-foreground)';
    }
  };

  return (
    <div
      ref={terminalContentRef}
      onClick={handleClick}
      style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--terminal-bg-current)',
        border: '1px solid var(--terminal-border-current)',
        borderRadius: '4px',
        padding: '15px',
        fontFamily: 'var(--font-family-mono)',
        position: 'relative',
        cursor: 'text',
      }}
    >
      {lines.map(line => (
        <div 
          key={line.id} 
          className={`terminal-line ${line.type}`} 
          style={{
            marginBottom: '8px',
            fontSize: '14px',
            lineHeight: '1.4',
            color: getLineColor(line.type)
          }}
        >
          {line.content}
        </div>
      ))}
    </div>
  );
};

export default TerminalOutput;