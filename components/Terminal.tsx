// components/Terminal.tsx - Updated for Firebase integration
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePomodoro } from '@/hooks/usePomodora';
import StartupAnimation from './StartupAnimation';
import TimerHeader from './TimerHeader';
import EnhancedLoader from './EnhancedLoader';
import CommandSuggestions from './CommandSuggestions';
import { useUserSetup } from './UserSetup';
import { useCommandAutoComplete } from '@/hooks/useCommandAutoComplete';
import { CommandProcessor } from './CommandProcessor';
import ErrorBoundary from './ErrorBoundary';
import { 
  TerminalLine, 
  TerminalProps,
  CommandContext 
} from '@/types';

const Terminal: React.FC<TerminalProps> = ({ className = '' }) => {
  const { user, signOut } = useAuth();
  
  // State management
  const [outputLines, setOutputLines] = useState<TerminalLine[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showStartupAnimation, setShowStartupAnimation] = useState<boolean>(true);
  const [processingMessage, setProcessingMessage] = useState<string>('');

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalContentRef = useRef<HTMLDivElement>(null);
  const commandProcessorRef = useRef<CommandProcessor | null>(null);

  // Hooks
  const {
    suggestions,
    selectedSuggestionIndex,
    showSuggestions,
    updateSuggestions,
    selectNextSuggestion,
    selectPreviousSuggestion,
    getSelectedSuggestion,
    clearSuggestions,
    handleTabCompletion
  } = useCommandAutoComplete();

  // Add output helper - stable reference to avoid dependency array issues
  const addOutput = useCallback((content: React.ReactNode, type: TerminalLine['type'] = 'output') => {
    setOutputLines(prev => [...prev, { 
      id: Date.now().toString() + Math.random(), 
      content, 
      type 
    }]);
  }, []);

  // Enhanced timer completion handler
  const handleTimerCompletion = useCallback(async (type: 'work' | 'break') => {
    const message = type === 'work'
      ? "🍅 Work session complete! Time for a break."
      : "☕ Break's over! Ready to focus?";
    
    addOutput(message, 'system');

  }, [addOutput]);

  // Initialize Pomodoro hook with loading states
  const pomodoroInstance = usePomodoro(handleTimerCompletion);

  // Initialize user setup hook for authenticated users
  const { handleUserInput, isSetupComplete, isInitializing } = useUserSetup({
    addOutput,
    outputLines
  });

  // Initialize command processor for authenticated users
  useEffect(() => {
    if (user && isSetupComplete) {
      const context: CommandContext = {
        pomodoroInstance,
        userInfo: {
          uid: user.uid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        addOutput,
        signOut
      };
      commandProcessorRef.current = new CommandProcessor(context);
    }
  }, [user, isSetupComplete, pomodoroInstance, addOutput, signOut]);

  // Handle startup animation completion
  const handleAnimationComplete = useCallback(() => {
    setShowStartupAnimation(false);
  }, []);

  // Auto-scroll terminal and focus input
  useEffect(() => {
    if (terminalContentRef.current) {
      terminalContentRef.current.scrollTop = terminalContentRef.current.scrollHeight;
    }
    if (!showStartupAnimation && isSetupComplete) {
      inputRef.current?.focus();
    }
  }, [outputLines, showStartupAnimation, isSetupComplete]);

  // Input handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Update auto-complete suggestions only for authenticated, setup-complete users
    if (user && isSetupComplete) {
      updateSuggestions(value);
    }
  }, [user, isSetupComplete, updateSuggestions]);

  const handleInputKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle auto-complete navigation for authenticated users
    if (showSuggestions && user && isSetupComplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectNextSuggestion();
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectPreviousSuggestion();
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearSuggestions();
        return;
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const selected = getSelectedSuggestion();
        if (selected) {
          setInputValue(selected.command + ' ');
          clearSuggestions();
        } else {
          const completed = handleTabCompletion(inputValue);
          setInputValue(completed);
        }
        return;
      }
    }

    if (e.key === 'Enter' && inputValue.trim() !== '') {
      const command = inputValue.trim();
      setInputValue('');
      clearSuggestions();
      setIsProcessing(true);
      setProcessingMessage('Executing command...');

      try {
        if (!user) {
          addOutput('Please authenticate to use commands.', 'error');
          return;
        }

        if (isInitializing) {
          addOutput('Please wait while we initialize your workspace...', 'system');
          return;
        }

        if (!isSetupComplete) {
          // Handle user setup for authenticated users
          handleUserInput(command);
        } else {
          // Handle regular commands for authenticated users
          if (command === '/clear') {
            setOutputLines([]);
          } else if (command === '/logout') {
            // Handle logout - this will be handled by CommandProcessor
            if (commandProcessorRef.current) {
              await commandProcessorRef.current.processCommand(command);
            }
          } else if (commandProcessorRef.current) {
            await commandProcessorRef.current.processCommand(command);
          }

          // Update command history
          setCommandHistory(prev => [command, ...prev].slice(0, 50));
          setHistoryIndex(-1);
        }
      } catch (error) {
        console.error('Error processing input:', error);
        addOutput('An error occurred while processing your command.', 'error');
      } finally {
        setIsProcessing(false);
        setProcessingMessage('');
      }

      e.preventDefault();
    } else if (e.key === 'ArrowUp' && !showSuggestions) {
      e.preventDefault();
      if (commandHistory.length > 0 && user && isSetupComplete) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex] || '');
        clearSuggestions();
      }
    } else if (e.key === 'ArrowDown' && !showSuggestions) {
      e.preventDefault();
      if (user && isSetupComplete) {
        if (historyIndex > 0) {
          const newIndex = Math.max(historyIndex - 1, 0);
          setHistoryIndex(newIndex);
          setInputValue(commandHistory[newIndex] || '');
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setInputValue('');
        }
        clearSuggestions();
      }
    }
  }, [
    inputValue, 
    user,
    isSetupComplete,
    isInitializing,
    handleUserInput, 
    commandHistory, 
    historyIndex, 
    addOutput,
    showSuggestions,
    selectNextSuggestion,
    selectPreviousSuggestion,
    getSelectedSuggestion,
    clearSuggestions,
    handleTabCompletion,
    updateSuggestions
  ]);

  // Show loading screen while Pomodoro data is loading
  if (user && pomodoroInstance.isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--dracula-background)',
        color: 'var(--dracula-foreground)',
        fontFamily: 'var(--font-family-mono)'
      }}>
        <EnhancedLoader 
          isActive={true} 
          variant="progress" 
          message="Loading your workspace..."
        />
        <div style={{
          marginTop: '20px',
          fontSize: '14px',
          color: 'var(--dracula-comment)',
          textAlign: 'center'
        }}>
          Syncing settings and statistics...
        </div>
      </div>
    );
  }

  // Calculate margin for timer header
  const timerHeaderMargin = user && 
    isSetupComplete && 
    !showStartupAnimation && 
    pomodoroInstance && 
    (pomodoroInstance.currentTime > 0 || pomodoroInstance.isRunning) 
    ? '295px' : '0px';

  // Get input rect for suggestions positioning
  const getInputRect = (): DOMRect | undefined => {
    return inputRef.current?.getBoundingClientRect();
  };

  // Show authentication message if no user (shouldn't happen due to app structure)
  if (!user) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--dracula-background)',
        color: 'var(--dracula-foreground)',
        fontFamily: 'var(--font-family-mono)',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>
            🔒 Authentication Required
          </div>
          <div style={{ color: 'var(--dracula-comment)' }}>
            Please sign in to access Pomodoro CLI
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div 
        className={className}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh', 
          padding: '20px',
          position: 'relative'
        }}
      >
        {/* Fixed Timer Header - only shows when timer is active and user is set up */}
        <TimerHeader 
          userInfo={{
            uid: user.uid,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }}
          pomodoroInstance={pomodoroInstance}
          isVisible={isSetupComplete && !showStartupAnimation}
        />

        {/* Add top margin when timer header is visible */}
        <div style={{ marginTop: timerHeaderMargin }} />

        <div
          ref={terminalContentRef}
          onClick={() => inputRef.current?.focus()}
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--terminal-bg-current)',
            border: '1px solid var(--terminal-border-current)',
            borderRadius: '4px',
            padding: '15px',
            fontFamily: 'var(--font-family-mono)',
            position: 'relative',
            cursor: showStartupAnimation ? 'default' : 'text',
          }}
        >
          {showStartupAnimation ? (
            <StartupAnimation onComplete={handleAnimationComplete} />
          ) : (
            <>
              {outputLines.map(line => (
                <div key={line.id} className={`terminal-line ${line.type}`} style={{
                    marginBottom: '8px',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    color: line.type === 'error' ? 'var(--dracula-red)' :
                           line.type === 'input' ? 'var(--dracula-green)' :
                           line.type === 'help' ? 'var(--dracula-foreground)' :
                           line.type === 'system' ? 'var(--dracula-cyan)' :
                           'var(--dracula-foreground)'
                }}>
                  {line.content}
                </div>
              ))}
            </>
          )}
          
          {/* Terminal input line */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '8px',
            color: 'var(--dracula-green)'
          }}>
            {isProcessing ? (
              <EnhancedLoader 
                isActive={true} 
                message={processingMessage}
                variant="spinner"
                showMessage={true}
              />
            ) : (
              !showStartupAnimation && <span style={{ marginRight: '8px' }}>{'>'}</span>
            )}
            {!showStartupAnimation && (
              <span style={{ position: 'relative' }}>
                {inputValue}
                <span
                  style={{
                    animation: 'blink 1s infinite',
                    marginLeft: '2px',
                    marginBottom: '-2px',
                    backgroundColor: 'var(--dracula-green)',
                    width: '8px',
                    height: '16px',
                    display: 'inline-block'
                  }}
                />
              </span>
            )}
          </div>
          
          {/* Hidden input for capturing keystrokes */}
          {!showStartupAnimation && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              disabled={isProcessing || isInitializing}
              style={{
                position: 'absolute',
                left: '-9999px',
                opacity: 0,
              }}
              autoFocus
            />
          )}
        </div>

        {/* Command Suggestions Panel - only for authenticated, setup-complete users */}
        <CommandSuggestions
          suggestions={suggestions}
          selectedIndex={selectedSuggestionIndex}
          show={showSuggestions && user && isSetupComplete}
          inputRect={getInputRect()}
        />

        {/* User indicator in bottom right */}
        {user && isSetupComplete && !showStartupAnimation && (
          <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '20px',
            fontSize: '10px',
            color: 'var(--dracula-comment)',
            opacity: 0.6
          }}>
            {user.firstName} • {user.email}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Terminal;