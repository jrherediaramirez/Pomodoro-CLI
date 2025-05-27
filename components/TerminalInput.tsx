// components/TerminalInput.tsx
import React from 'react';
import { TerminalInputProps } from '@/types';
import Loader from './Loader';

const TerminalInput: React.FC<TerminalInputProps> = ({
  inputValue,
  onInputChange,
  onKeyDown,
  isProcessing,
  isDisabled,
  inputRef
}) => {
  return (
    <>
      {/* Terminal input line */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginTop: '8px',
        color: 'var(--dracula-green)'
      }}>
        {isProcessing ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Loader isActive={true} />
          </div>
        ) : (
          <span style={{ marginRight: '8px' }}>❯</span>
        )}
        <span style={{ position: 'relative' }}>
          {inputValue}
          <span
            style={{
              animation: 'blink 1s infinite',
              marginLeft: '2px',
              backgroundColor: 'var(--dracula-green)',
              width: '8px',
              height: '16px',
              display: 'inline-block'
            }}
          />
        </span>
      </div>
      
      {/* Hidden input for capturing keystrokes */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        disabled={isDisabled || isProcessing}
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
        }}
        autoFocus
      />
    </>
  );
};

export default TerminalInput;