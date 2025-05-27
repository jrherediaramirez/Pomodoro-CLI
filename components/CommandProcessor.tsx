// components/CommandProcessor.tsx - Updated for Firebase
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/lib/firestore';
import { CommandResult, CommandContext } from '@/types';
import { 
  validateCommand, 
  validateSetCommand, 
  validateSessionName, 
  validateCommitMessage, 
  validateTheme, 
  validateSound,
  sanitizeString 
} from '@/lib/validation';

export class CommandProcessor {
  private context: CommandContext;
  
  constructor(context: CommandContext) {
    this.context = context;
  }

  async processCommand(commandStr: string): Promise<CommandResult> {
    const { addOutput, pomodoroInstance } = this.context;
    
    // Add command to output with enhanced styling
    addOutput(
      <span>
        <span style={{color: 'var(--dracula-green)'}}>{'>'}</span> {commandStr}
      </span>, 
      'input'
    );

    // Validate command format
    const commandValidation = validateCommand(commandStr);
    if (!commandValidation.isValid) {
      addOutput(commandValidation.error!, 'error');
      return { success: false, error: commandValidation.error };
    }

    const [command, ...args] = commandStr.trim().split(' ');
    const argString = args.join(' ');

    try {
      switch (command.toLowerCase()) {
        case '/play':
          return this.handlePlayCommand();
        
        case '/pause':
          return this.handlePauseCommand();
        
        case '/reset':
          return this.handleResetCommand();
        
        case '/complete':
          return this.handleCompleteCommand();
        
        case '/commit':
          return this.handleCommitCommand(argString);
        
        case '/set':
          return this.handleSetCommand(args);
        
        case '/session':
          return this.handleSessionCommand(argString);
          case '/theme':
          return this.handleThemeCommand(args[0]);
        
        case '/sound':
          return this.handleSoundCommand(args[0]);
        
        case '/stats':
          return this.handleStatsCommand();
        
        case '/help':
          return this.handleHelpCommand();
          
        case '/clear':
          return this.handleClearCommand();
        
        case '/logout':
          return this.handleLogoutCommand();
        
        case '/reset-data':
          return this.handleResetDataCommand();
        
        case '/confirm-reset':
          return this.handleConfirmResetCommand();
        
        default:
          const errorMsg = `Unknown command: ${command}. Type '/help' for available commands.`;
          this.context.addOutput(
            <span>
              <span style={{color: 'var(--dracula-red)'}}>Error:</span> {errorMsg}
            </span>, 
            'error'
          );
          return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.context.addOutput(
        <span>
          <span style={{color: 'var(--dracula-red)'}}>Error:</span> {errorMsg}
        </span>, 
        'error'
      );
      return { success: false, error: errorMsg };
    }
  }
  private handleLogoutCommand(): CommandResult {
    const { addOutput, signOut } = this.context;
    
    addOutput(
      <span style={{color: 'var(--dracula-orange)'}}>
        [LOGOUT] Signing out...
      </span>, 
      'system'
    );

    // Use a timeout to allow the message to appear before logout
    setTimeout(async () => {
      try {
        await signOut();
        // Redirect will happen automatically via AuthProvider
      } catch (error) {
        console.error('Logout failed:', error);
        addOutput(
          <span style={{color: 'var(--dracula-red)'}}>
            [ERROR] Logout failed: {error instanceof Error ? error.message : 'Unknown error'}
          </span>, 
          'error'
        );
      }
    }, 500);
    
    return { success: true, message: 'Logging out...' };
  }

  private handlePlayCommand(): CommandResult {
    const { addOutput, pomodoroInstance } = this.context;
    
    if (pomodoroInstance.isRunning) {
      addOutput(
        <span style={{color: 'var(--dracula-orange)'}}>
          [WARNING] Timer is already running.
        </span>, 
        'system'
      );
      return { success: false, message: 'Timer already running' };
    }

    const isResuming = pomodoroInstance.currentTime > 0 && pomodoroInstance.currentTime < pomodoroInstance.totalTime;
    
    pomodoroInstance.startTimer();
    const message = isResuming 
      ? `[RESUMED] Timer resumed for "${pomodoroInstance.settings.sessionName}"`
      : `[STARTED] Timer started for "${pomodoroInstance.settings.sessionName}"`;
    
    addOutput(
      <span style={{color: 'var(--dracula-green)'}}>
        {message}
      </span>, 
      'output'
    );
    return { success: true, message };
  }

  private handlePauseCommand(): CommandResult {
    const { addOutput, pomodoroInstance } = this.context;
    
    if (!pomodoroInstance.isRunning) {
      addOutput(
        <span style={{color: 'var(--dracula-orange)'}}>
          [WARNING] Timer is not running.
        </span>, 
        'system'
      );
      return { success: false, message: 'Timer not running' };
    }
    
    pomodoroInstance.pauseTimer();
    addOutput(
      <span style={{color: 'var(--dracula-cyan)'}}>
        [PAUSED] Timer paused.
      </span>, 
      'output'
    );
    return { success: true, message: 'Timer paused' };
  }

  private handleResetCommand(): CommandResult {
    const { addOutput, pomodoroInstance } = this.context;
    
    pomodoroInstance.resetTimer();
    addOutput(
      <span style={{color: 'var(--dracula-purple)'}}>
        [RESET] Timer reset to {Math.floor(pomodoroInstance.totalTime / 60)} minutes.
      </span>, 
      'output'
    );
    return { success: true, message: 'Timer reset' };
  }

  private handleCompleteCommand(): CommandResult {
    const { addOutput, pomodoroInstance } = this.context;
    
    if (!pomodoroInstance.isRunning && pomodoroInstance.currentTime === pomodoroInstance.totalTime) {
      addOutput(
        <span style={{color: 'var(--dracula-orange)'}}>
          [WARNING] No active session to complete.
        </span>, 
        'error'
      );
      return { success: false, error: 'No active session' };
    }
    
    const currentType = pomodoroInstance.settings.sessionName.toLowerCase().includes('break') ? 'break' : 'work';
    
    const completed = pomodoroInstance.completeTimer();
    
    if (completed) {
      const message = `[COMPLETED] Session completed manually! ${currentType === 'work' ? 'Great focus session!' : 'Break finished!'}`;
      addOutput(
        <span style={{color: 'var(--dracula-green)'}}>
          {message}
        </span>, 
        'output'
      );
      return { success: true, message };
    } else {
      addOutput(
        <span style={{color: 'var(--dracula-red)'}}>
          [ERROR] Failed to complete session.
        </span>, 
        'error'
      );
      return { success: false, error: 'Failed to complete session' };
    }
  }

  private handleCommitCommand(argString: string): CommandResult {
    const { addOutput, pomodoroInstance } = this.context;
    
    const validation = validateCommitMessage(argString);
    if (!validation.isValid) {
      addOutput(
        <span style={{color: 'var(--dracula-red)'}}>
          ❌ {validation.error}
        </span>, 
        'error'
      );
      return { success: false, error: validation.error };
    }

    const commitMessage = sanitizeString(argString.replace(/^["']|["']$/g, ''));
    pomodoroInstance.commitSession(commitMessage);
    
    addOutput(
      <span>
        [COMMIT] Commit logged: "<span style={{color: 'var(--dracula-cyan)'}}>{commitMessage}</span>"
      </span>, 
      'output'
    );
    return { success: true, message: 'Commit logged' };
  }

  private handleSetCommand(args: string[]): CommandResult {
    const { addOutput, pomodoroInstance } = this.context;
    
    const validation = validateSetCommand(args);
    if (!validation.isValid) {
      addOutput(
        <span style={{color: 'var(--dracula-red)'}}>
          [ERROR] {validation.error}
        </span>, 
        'error'
      );
      return { success: false, error: validation.error };
    }

    const [type, minutesStr] = args;
    const minutes = parseInt(minutesStr, 10);
    
    pomodoroInstance.setDurations({ [type.toLowerCase()]: minutes });
    
    const typeText = type.toLowerCase() === 'work' ? '[WORK]' : 
                      type.toLowerCase() === 'break' ? '[BREAK]' : '[LONG]';
    const message = `${typeText} ${type.charAt(0).toUpperCase() + type.slice(1)} duration set to ${minutes} minutes.`;
    addOutput(
      <span style={{color: 'var(--dracula-green)'}}>
        {message}
      </span>, 
      'output'
    );
    return { success: true, message };
  }

  private handleSessionCommand(argString: string): CommandResult {
    const { addOutput, pomodoroInstance } = this.context;
    
    const validation = validateSessionName(argString);
    if (!validation.isValid) {
      addOutput(
        <span style={{color: 'var(--dracula-red)'}}>
          [ERROR] {validation.error}
        </span>, 
        'error'
      );
      return { success: false, error: validation.error };
    }

    const newName = sanitizeString(argString.replace(/^["']|["']$/g, ''));
    pomodoroInstance.updateSessionName(newName);
    
    if (!pomodoroInstance.isRunning) {
      pomodoroInstance.resetTimer();
    }
    
    addOutput(
      <span>
        [SESSION] Session name set to: "<span style={{color: 'var(--dracula-cyan)'}}>{newName}</span>". Timer reset.
      </span>, 
      'output'
    );
    return { success: true, message: 'Session name updated' };
  }

  private handleThemeCommand(themeArg?: string): CommandResult {
    const { addOutput, pomodoroInstance } = this.context;
    
    if (themeArg) {
      const validation = validateTheme(themeArg);
      if (!validation.isValid) {
        addOutput(
          <span style={{color: 'var(--dracula-red)'}}>
            [ERROR] {validation.error}
          </span>, 
          'error'
        );
        return { success: false, error: validation.error };
      }
    }
    
    pomodoroInstance.toggleTheme(themeArg?.toLowerCase());
    
    const currentTheme = pomodoroInstance.settings.theme;
    const themeText = currentTheme === 'dark' ? '[DARK]' : '[LIGHT]';
    const message = `${themeText} Theme set to ${currentTheme}.`;
    addOutput(
      <span style={{color: 'var(--dracula-purple)'}}>
        {message}
      </span>, 
      'output'
    );
    return { success: true, message };
  }

  private handleSoundCommand(soundArg?: string): CommandResult {
    const { addOutput, pomodoroInstance } = this.context;
    
    if (soundArg) {
      const validation = validateSound(soundArg);
      if (!validation.isValid) {
        addOutput(
          <span style={{color: 'var(--dracula-red)'}}>
            [ERROR] {validation.error}
          </span>, 
          'error'
        );
        return { success: false, error: validation.error };
      }
    }
    
    const enable = soundArg ? soundArg.toLowerCase() === 'on' : undefined;
    pomodoroInstance.toggleSound(enable);
    
    const soundText = pomodoroInstance.settings.soundEnabled ? '[ON]' : '[OFF]';
    const message = `${soundText} Sound ${pomodoroInstance.settings.soundEnabled ? 'enabled' : 'disabled'}.`;
    addOutput(
      <span style={{color: 'var(--dracula-orange)'}}>
        {message}
      </span>, 
      'output'
    );    return { success: true, message };
  }

  private handleStatsCommand(): CommandResult {
    const { addOutput, pomodoroInstance, userInfo } = this.context;
    
    addOutput(
      <div style={{color: 'var(--dracula-cyan)'}}>
        [STATS] <strong>Statistics</strong>
      </div>, 
      'system'
    );
    
    addOutput(
      <div style={{marginLeft: '10px'}}>
        <div>[USER] {userInfo?.firstName} {userInfo?.lastName} ({userInfo?.email})</div>
        <div>[SESSION] Current Session: <span style={{color: 'var(--dracula-cyan)'}}>{pomodoroInstance.settings.sessionName}</span></div>
        <div>[COUNT] Today's completed Pomodoros: <span style={{color: 'var(--dracula-green)'}}>{pomodoroInstance.stats.completedToday}</span></div>
        <div>[TIME] Total focus time today: <span style={{color: 'var(--dracula-purple)'}}>{Math.floor(pomodoroInstance.stats.totalFocusTime / 60)}h {pomodoroInstance.stats.totalFocusTime % 60}m</span></div>
        <div>[STREAK] Current streak: <span style={{color: 'var(--dracula-orange)'}}>{pomodoroInstance.stats.currentStreak}</span></div>
        <div>[BEST] Longest streak: <span style={{color: 'var(--dracula-yellow)'}}>{pomodoroInstance.stats.longestStreak}</span></div>
      </div>, 
      'output'
    );
    
    addOutput(      <div style={{marginLeft: '10px', marginTop: '10px'}}>
        <div>[SETTINGS] Settings:</div>
        <div style={{marginLeft: '10px', fontSize: '12px', color: 'var(--dracula-comment)'}}>
          [SOUND] Sound: {pomodoroInstance.settings.soundEnabled ? 'On' : 'Off'} | 
          [THEME] Theme: {pomodoroInstance.settings.theme}
        </div>
      </div>,
      'output'
    );
    
    if (pomodoroInstance.stats.history.length > 0) {
      addOutput(
        <div style={{marginTop: '10px', color: 'var(--dracula-purple)'}}>
          [HISTORY] Recent sessions:
        </div>, 
        'output'
      );
      
      pomodoroInstance.stats.history.slice(-5).forEach((session: any) => {
        const sessionType = session.isBreak ? '[BREAK]' : '[WORK]';
        const timeStr = new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        addOutput(
          <div style={{marginLeft: '20px', fontSize: '12px', color: 'var(--dracula-foreground)'}}>
            {sessionType} [{timeStr}] {session.sessionName}
            {session.commitMessage && (
              <span style={{color: 'var(--dracula-comment)'}}> - {session.commitMessage}</span>
            )}
          </div>, 
          'output'
        );
      });
    }
    
    return { success: true, message: 'Stats displayed' };
  }

  private handleHelpCommand(): CommandResult {
    const { addOutput } = this.context;
    
    addOutput(
      <div>
        <div style={{color: 'var(--dracula-green)', marginBottom: '15px', fontSize: '16px'}}>
          <strong>Pomodoro CLI - Available Commands</strong>
        </div>
        <div style={{display: 'grid', gap: '8px'}}>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/play</strong> - Start or resume the timer</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/pause</strong> - Pause the timer</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/reset</strong> - Reset the current timer segment</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/complete</strong> - Manually complete the current session early</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/commit "message"</strong> - Log a message for the current session</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/session "name"</strong> - Set a name for the current focus session</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/set [work|break|long] &lt;minutes&gt;</strong> - Set durations</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/theme [light|dark]</strong> - Switch color theme</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/sound [on|off]</strong> - Toggle completion sound</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/notify [on|off]</strong> - Toggle browser notifications</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/stats</strong> - Show current statistics</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/clear</strong> - Clear terminal output</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/logout</strong> - Sign out of your account</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/reset-data</strong> - Reset all saved data (requires confirmation)</div>
          <div><strong style={{color: 'var(--dracula-cyan)'}}>/help</strong> - Show this help message</div>
        </div>
        <div style={{marginTop: '15px', fontSize: '12px', color: 'var(--dracula-comment)'}}>
          Pro tip: Use Tab for auto-completion, ↑↓ arrows to navigate command history
        </div>
      </div>, 
      'help'
    );
    return { success: true, message: 'Help displayed' };
  }

  private handleResetDataCommand(): CommandResult {
    const { addOutput } = this.context;
    
    addOutput(
      <span style={{color: 'var(--dracula-orange)'}}>
        [WARNING] This will reset ALL your data including settings, statistics, and session history.
      </span>, 
      'system'
    );
    
    addOutput(
      <span style={{color: 'var(--dracula-red)'}}>
        This action cannot be undone and will affect your cloud-stored data.
      </span>, 
      'system'
    );
    
    addOutput(
      <span style={{color: 'var(--dracula-cyan)'}}>
        Type '/confirm-reset' to proceed or any other command to cancel.
      </span>, 
      'system'
    );
    
    return { success: true, message: 'Reset confirmation required' };
  }

  private async handleConfirmResetCommand(): Promise<CommandResult> {
    const { addOutput, userInfo } = this.context;
    
    if (!userInfo?.uid) {
      addOutput(
        <span style={{color: 'var(--dracula-red)'}}>
          [ERROR] User not authenticated. Cannot reset data.
        </span>, 
        'error'
      );
      return { success: false, error: 'User not authenticated' };
    }
    
    try {
      addOutput(
        <span style={{color: 'var(--dracula-orange)'}}>
          [RESET] Deleting all user data from Firestore...
        </span>, 
        'system'
      );
      
      // Delete user data from Firestore
      await firestoreService.deleteUserData(userInfo.uid);
      
      addOutput(
        <span style={{color: 'var(--dracula-green)'}}>
          [SUCCESS] All data has been reset successfully!
        </span>, 
        'output'
      );
      
      addOutput(
        <span style={{color: 'var(--dracula-cyan)'}}>
          [INFO] Please refresh the page to reinitialize your workspace.
        </span>, 
        'system'
      );
      
      // Optionally auto-refresh after a delay
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      return { success: true, message: 'Data reset completed' };
      
    } catch (error) {
      addOutput(
        <span style={{color: 'var(--dracula-red)'}}>
          [ERROR] Failed to reset data: {error instanceof Error ? error.message : 'Unknown error'}
        </span>, 
        'error'
      );
      return { success: false, error: 'Reset failed' };
    }
  }

  private handleClearCommand(): CommandResult {
    // This will be handled by the Terminal component directly
    return { success: true, message: 'Clear command' };
  }
}