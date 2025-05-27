// components/CommandSuggestions.tsx
import React from 'react';
import { CommandSuggestion } from '@/hooks/useCommandAutoComplete';

interface CommandSuggestionsProps {
  suggestions: CommandSuggestion[];
  selectedIndex: number;
  show: boolean;
  inputRect?: DOMRect;
}

const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({
  suggestions,
  selectedIndex,
  show,
  inputRect
}) => {
  if (!show || suggestions.length === 0) {
    return null;
  }

  const style: React.CSSProperties = {
    position: 'fixed',
    bottom: inputRect ? `${window.innerHeight - inputRect.top + 10}px` : '60px',
    left: inputRect ? `${inputRect.left}px` : '35px',
    zIndex: 1000,
    background: 'var(--dracula-current-line)',
    border: '1px solid var(--dracula-green)',
    borderRadius: '4px',
    minWidth: '300px',
    maxWidth: '500px',
    maxHeight: '200px',
    overflowY: 'auto',
    fontFamily: 'var(--font-family-mono)',
    fontSize: '12px',
    boxShadow: '0 4px 12px rgba(80, 250, 123, 0.2)',
  };

  return (
    <div style={style}>
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.command}
          style={{
            padding: '8px 12px',
            backgroundColor: index === selectedIndex 
              ? 'var(--dracula-green)' 
              : 'transparent',
            color: index === selectedIndex 
              ? 'var(--dracula-background)' 
              : 'var(--dracula-foreground)',
            cursor: 'pointer',
            borderBottom: index < suggestions.length - 1 
              ? '1px solid var(--dracula-comment)' 
              : 'none'
          }}
        >
          <div style={{ 
            fontWeight: 'bold',
            color: index === selectedIndex 
              ? 'var(--dracula-background)' 
              : 'var(--dracula-cyan)'
          }}>
            {suggestion.command}
          </div>
          <div style={{ 
            fontSize: '11px', 
            opacity: 0.8,
            marginTop: '2px'
          }}>
            {suggestion.description}
          </div>
          {suggestion.usage && (
            <div style={{ 
              fontSize: '10px', 
              opacity: 0.6,
              marginTop: '2px',
              fontStyle: 'italic'
            }}>
              Usage: {suggestion.usage}
            </div>
          )}
        </div>
      ))}
      <div style={{
        padding: '4px 12px',
        fontSize: '10px',
        color: 'var(--dracula-comment)',
        borderTop: '1px solid var(--dracula-comment)',
        backgroundColor: 'var(--dracula-background)'
      }}>
        Press Tab to complete • ↑↓ to navigate • Esc to close
      </div>
    </div>
  );
};

export default CommandSuggestions;