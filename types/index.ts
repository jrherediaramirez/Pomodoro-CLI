// types/index.ts - Updated with Firebase integration
import React from 'react';

export interface UserInfo {
  uid: string;        // Firebase UID
  email: string;      // Email from Firebase Auth
  firstName: string;
  lastName: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

export interface TerminalLine {
  id: string;
  content: React.ReactNode;
  type: 'input' | 'output' | 'error' | 'help' | 'system';
}

export type UserSetupStep = 'idle' | 'promptFirstName' | 'promptLastName' | 'complete';

export interface CommandResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CommandContext {
  pomodoroInstance: any; // Will be properly typed from the hook
  userInfo: UserInfo | null;
  addOutput: (content: React.ReactNode, type?: TerminalLine['type']) => void;
  signOut: () => Promise<void>;
}

export interface TerminalProps {
  className?: string;
}

export interface LoaderProps {
  isActive: boolean;
  className?: string;
}

export interface ProgressBarProps {
  currentTime: number;
  totalTime: number;
  isBreak: boolean;
  length?: number;
}

export interface StartupAnimationProps {
  onComplete?: () => void;
}

export interface TimerHeaderProps {
  userInfo: UserInfo | null;
  pomodoroInstance: any; // Will be properly typed from the hook
  isVisible: boolean;
}

export interface TerminalOutputProps {
  lines: TerminalLine[];
  terminalContentRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
}

export interface TerminalInputProps {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
  isDisabled: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}

export interface UserSetupProps {
  userSetupStep: UserSetupStep;
  userInfo: UserInfo | null;
  onUserInput: (value: string) => void;
}

export interface CommandProcessorProps {
  pomodoroInstance: any;
  addOutput: (content: React.ReactNode, type?: TerminalLine['type']) => void;
  userInfo: UserInfo | null;
}

// Enhanced features types
export interface CommandSuggestion {
  command: string;
  description: string;
  usage?: string;
}

export interface CommandSuggestionsProps {
  suggestions: CommandSuggestion[];
  selectedIndex: number;
  show: boolean;
  inputRect?: DOMRect;
}

export interface EnhancedLoaderProps {
  isActive: boolean;
  message?: string;
  variant?: 'spinner' | 'dots' | 'progress' | 'pulse';
  className?: string;
  showMessage?: boolean;
}

export interface ResponsiveLogoProps {
  variant?: 'startup' | 'header' | 'compact';
  className?: string;
  style?: React.CSSProperties;
}

export interface UseCommandAutoCompleteReturn {
  suggestions: CommandSuggestion[];
  selectedSuggestionIndex: number;
  showSuggestions: boolean;
  updateSuggestions: (input: string) => void;
  selectNextSuggestion: () => void;
  selectPreviousSuggestion: () => void;
  getSelectedSuggestion: () => CommandSuggestion | null;
  clearSuggestions: () => void;
  handleTabCompletion: (input: string) => string;
}

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Pomodoro types with Firebase integration
export interface PomodoroSessionData {
  id?: string;        // Firestore document ID
  sessionName: string;
  isBreak: boolean;
  timestamp: string;
  durationMinutes: number;
  commitMessage?: string;
  createdAt?: string; // Firestore timestamp
}

export interface PomodoroSettings {
  workDuration: number; // seconds
  breakDuration: number; // seconds
  longBreakDuration: number; // seconds
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  sessionName: string;
}

export interface PomodoroStats {
  completedToday: number;
  history: PomodoroSessionData[];
  totalFocusTime: number; // in minutes
  longestStreak: number;
  currentStreak: number;
}

export interface UsePomodoroReturn {
  currentTime: number;
  totalTime: number;
  isRunning: boolean;
  isBreak: boolean;
  settings: PomodoroSettings;
  stats: PomodoroStats;
  isLoading: boolean;      // Added for Firebase loading states
  isDataLoaded: boolean;   // Added for Firebase data loading
  startTimer: () => void;  pauseTimer: () => void;
  resetTimer: () => void;
  completeTimer: () => boolean;
  setDurations: (durations: { work?: number, break?: number, long?: number }) => void;
  updateSessionName: (name: string) => void;
  toggleTheme: (newTheme?: 'light' | 'dark') => void;
  toggleSound: (enable?: boolean) => void;
  commitSession: (message: string) => void;
  pomodoroCount: number;
}

// Firebase-specific types
export interface FirestoreUserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  settings: PomodoroSettings;
  stats: PomodoroStats;
  createdAt: string;
  updatedAt: string;
}

// Auth page props
export interface AuthPageProps {
  onAuthComplete?: () => void;
}

// Error boundary props
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Migration types
export interface MigrationData {
  hasLocalData: boolean;
  settings?: PomodoroSettings;
  stats?: PomodoroStats;
  userInfo?: UserInfo;
}