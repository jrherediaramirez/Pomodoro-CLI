// hooks/useCommandAutoComplete.ts - Updated with logout command
import { useState, useCallback } from 'react';

export interface CommandSuggestion {
  command: string;
  description: string;
  usage?: string;
}

const AVAILABLE_COMMANDS: CommandSuggestion[] = [
  { command: '/play', description: 'Start or resume the timer' },
  { command: '/pause', description: 'Pause the timer' },
  { command: '/reset', description: 'Reset the current timer segment' },
  { command: '/complete', description: 'Manually complete the current session early' },
  { command: '/commit', description: 'Log a message for the current session', usage: '/commit "message"' },
  { command: '/session', description: 'Set a name for the current focus session', usage: '/session "name"' },
  { command: '/set', description: 'Set durations', usage: '/set [work|break|long] <minutes>' },
  { command: '/theme', description: 'Switch color theme', usage: '/theme [light|dark]' },
  { command: '/sound', description: 'Toggle completion sound', usage: '/sound [on|off]' },
  { command: '/notify', description: 'Toggle browser notifications', usage: '/notify [on|off]' },
  { command: '/stats', description: 'Show current statistics' },
  { command: '/clear', description: 'Clear terminal output' },
  { command: '/logout', description: 'Sign out of your account' },
  { command: '/help', description: 'Show help message' }
];

export const useCommandAutoComplete = () => {
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const getSuggestions = useCallback((input: string): CommandSuggestion[] => {
    if (!input.startsWith('/') || input.includes(' ')) {
      return [];
    }

    const searchTerm = input.toLowerCase();
    return AVAILABLE_COMMANDS.filter(cmd => 
      cmd.command.toLowerCase().startsWith(searchTerm)
    );
  }, []);

  const updateSuggestions = useCallback((input: string) => {
    const newSuggestions = getSuggestions(input);
    setSuggestions(newSuggestions);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(newSuggestions.length > 0 && input.length > 1);
  }, [getSuggestions]);

  const selectNextSuggestion = useCallback(() => {
    setSelectedSuggestionIndex(prev => 
      prev < suggestions.length - 1 ? prev + 1 : 0
    );
  }, [suggestions.length]);

  const selectPreviousSuggestion = useCallback(() => {
    setSelectedSuggestionIndex(prev => 
      prev > 0 ? prev - 1 : suggestions.length - 1
    );
  }, [suggestions.length]);

  const getSelectedSuggestion = useCallback((): CommandSuggestion | null => {
    if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
      return suggestions[selectedSuggestionIndex];
    }
    return null;
  }, [suggestions, selectedSuggestionIndex]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(false);
  }, []);

  const handleTabCompletion = useCallback((input: string): string => {
    const currentSuggestions = getSuggestions(input);
    
    if (currentSuggestions.length === 1) {
      // Auto-complete if only one suggestion
      return currentSuggestions[0].command + ' ';
    } else if (currentSuggestions.length > 1) {
      // Find common prefix
      let commonPrefix = currentSuggestions[0].command;
      for (let i = 1; i < currentSuggestions.length; i++) {
        let j = 0;
        while (j < commonPrefix.length && 
               j < currentSuggestions[i].command.length && 
               commonPrefix[j] === currentSuggestions[i].command[j]) {
          j++;
        }
        commonPrefix = commonPrefix.substring(0, j);
      }
      
      if (commonPrefix.length > input.length) {
        return commonPrefix;
      }
    }
    
    return input;
  }, [getSuggestions]);

  return {
    suggestions,
    selectedSuggestionIndex,
    showSuggestions,
    updateSuggestions,
    selectNextSuggestion,
    selectPreviousSuggestion,
    getSelectedSuggestion,
    clearSuggestions,
    handleTabCompletion
  };
};