// hooks/usePomodoro.ts - Improved with better state management and error handling
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { firestoreService, FirestoreUserData } from '@/lib/firestore';
import { CHIME_SOUND_BASE64, DEFAULT_WORK_MINUTES, DEFAULT_BREAK_MINUTES, DEFAULT_LONG_BREAK_MINUTES } from '@/lib/constants';
import { PomodoroSettings, PomodoroStats, PomodoroSessionData } from '@/types';

export type Theme = 'light' | 'dark';

const initialSettings: PomodoroSettings = {
  workDuration: DEFAULT_WORK_MINUTES * 60,
  breakDuration: DEFAULT_BREAK_MINUTES * 60,
  longBreakDuration: DEFAULT_LONG_BREAK_MINUTES * 60,
  theme: 'dark',
  soundEnabled: true,
  sessionName: 'Focus Session',
};

const initialStats: PomodoroStats = {
  completedToday: 0,
  history: [],
  totalFocusTime: 0,
  longestStreak: 0,
  currentStreak: 0,
};

export const usePomodoro = (onTimerCompleteCallback?: (type: 'work' | 'break') => void) => {
  const { user } = useAuth();
  
  // State management
  const [settings, setSettings] = useState<PomodoroSettings>(initialSettings);
  const [stats, setStats] = useState<PomodoroStats>(initialStats);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [currentTime, setCurrentTime] = useState(settings.workDuration);
  const [totalTime, setTotalTime] = useState(settings.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Initialize audio - client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(CHIME_SOUND_BASE64);
      audioRef.current.preload = 'auto';
    }
    return cleanup;
  }, [cleanup]);

  // Enhanced save with optimistic updates and rollback
  const saveSettings = useCallback(async (newSettings: PomodoroSettings, rollbackSettings?: PomodoroSettings) => {
    if (!user) return false;

    try {
      setSaveError(null);
      await firestoreService.updateUserSettings(user.uid, newSettings);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveError('Failed to save settings');
      
      // Rollback on failure
      if (rollbackSettings) {
        setSettings(rollbackSettings);
      }
      return false;
    }
  }, [user]);

  const saveStats = useCallback(async (newStats: PomodoroStats, rollbackStats?: PomodoroStats) => {
    if (!user) return false;

    try {
      setSaveError(null);
      await firestoreService.updateUserStats(user.uid, newStats);
      return true;
    } catch (error) {
      console.error('Failed to save stats:', error);
      setSaveError('Failed to save stats');
      
      // Rollback on failure
      if (rollbackStats) {
        setStats(rollbackStats);
      }
      return false;
    }
  }, [user]);

  // Initialize user data and subscription
  useEffect(() => {
    if (!user) {
      // Reset everything when user logs out
      cleanup();
      setSettings(initialSettings);
      setStats(initialStats);
      setIsDataLoaded(false);
      setIsLoading(false);
      isInitializedRef.current = false;
      return;
    }

    if (isInitializedRef.current) return; // Prevent duplicate initialization
    isInitializedRef.current = true;

    const initializeUserData = async () => {
      try {
        setIsLoading(true);
        setSaveError(null);

        // Subscribe to real-time updates first
        const unsubscribe = firestoreService.subscribeToUserData(user.uid, (userData) => {
          if (userData) {
            setSettings(userData.settings);
            setStats(userData.stats);
            setIsDataLoaded(true);
          } else {
            // User data doesn't exist, create it
            firestoreService.getOrCreateUserData({
              uid: user.uid,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            }).catch(error => {
              console.error('Failed to create user data:', error);
              setSaveError('Failed to initialize user data');
            });
          }
          setIsLoading(false);
        });

        unsubscribeRef.current = unsubscribe;

      } catch (error) {
        console.error('Failed to initialize user data:', error);
        setSaveError('Failed to load user data');
        setIsLoading(false);
        // Fallback to default values
        setSettings(initialSettings);
        setStats(initialStats);
      }
    };

    initializeUserData();

    return cleanup;
  }, [user, cleanup]);

  // Apply theme and update timer when settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.classList.toggle('light-theme', settings.theme === 'light');
    }
    
    // Reset timer when settings change (but not while running)
    if (!isRunning) {
      const newCurrentTime = isBreak 
        ? (pomodoroCount > 0 && pomodoroCount % 4 === 0 ? settings.longBreakDuration : settings.breakDuration)
        : settings.workDuration;
      setCurrentTime(newCurrentTime);
      setTotalTime(newCurrentTime);
    }
  }, [settings, isBreak, pomodoroCount, isRunning]);

  const playChime = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(err => 
        console.warn("Could not play chime (this is normal if user hasn't interacted with page):", err)
      );
    }
  }, [settings.soundEnabled]);

  const updateStats = useCallback(async (type: 'work' | 'break') => {
    const oldStats = stats;
    const newStats = { ...stats };
    
    if (type === 'work') {
      newStats.completedToday += 1;
      newStats.totalFocusTime += Math.floor(settings.workDuration / 60);
      newStats.currentStreak += 1;
      newStats.longestStreak = Math.max(newStats.longestStreak, newStats.currentStreak);
    }

    // Add to history (local cache)
    const sessionData: PomodoroSessionData = {
      sessionName: settings.sessionName,
      isBreak: type === 'break',
      timestamp: new Date().toISOString(),
      durationMinutes: Math.floor((type === 'work' ? settings.workDuration : 
        (pomodoroCount % 4 === 0 ? settings.longBreakDuration : settings.breakDuration)) / 60),
    };
    
    newStats.history = [...newStats.history, sessionData].slice(-50);
    
    // Optimistic update
    setStats(newStats);
    
    // Save to Firestore
    const success = await saveStats(newStats, oldStats);
    
    // Save session to history collection (separate operation)
    if (user && success) {
      try {
        await firestoreService.addSessionToHistory(user.uid, sessionData);
      } catch (error) {
        console.error('Failed to add session to history:', error);
        // Don't rollback stats for this secondary operation failure
      }
    }
  }, [stats, settings, pomodoroCount, saveStats, user]);

  // Memoized timer completion handler to prevent recreation
  const handleTimerComplete = useCallback(() => {
    playChime();
    setIsRunning(false);
    
    let completedType: 'work' | 'break' = 'work';

    if (!isBreak) {
      updateStats('work');
      setPomodoroCount(prev => prev + 1);
      
      // Calculate next session
      let nextDuration;
      let nextSessionName;
      if ((pomodoroCount + 1) % 4 === 0) {
        nextDuration = settings.longBreakDuration;
        nextSessionName = "Long Break";
      } else {
        nextDuration = settings.breakDuration;
        nextSessionName = "Short Break";
      }
      
      // Update state immediately
      setCurrentTime(nextDuration);
      setTotalTime(nextDuration);
      setIsBreak(true);
      
      // Update settings with optimistic update
      const oldSettings = settings;
      const newSettings = { ...settings, sessionName: nextSessionName };
      setSettings(newSettings);
      saveSettings(newSettings, oldSettings);
      
      completedType = 'work';
    } else {
      updateStats('break');
      
      // Switch back to work session
      setCurrentTime(settings.workDuration);
      setTotalTime(settings.workDuration);
      setIsBreak(false);
      
      // Update settings with optimistic update
      const oldSettings = settings;
      const newSettings = { ...settings, sessionName: "Focus Session" };
      setSettings(newSettings);
      saveSettings(newSettings, oldSettings);
      
      completedType = 'break';
    }

    onTimerCompleteCallback?.(completedType);
  }, [
    isBreak, 
    pomodoroCount, 
    settings, 
    playChime, 
    onTimerCompleteCallback, 
    updateStats,
    saveSettings
  ]);

  // Timer interval effect
  useEffect(() => {
    if (isRunning && currentTime > 0) {
      timerIntervalRef.current = setInterval(() => {
        setCurrentTime(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerIntervalRef.current!);
            timerIntervalRef.current = null;
            // Use setTimeout to avoid calling during render
            setTimeout(handleTimerComplete, 0);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRunning, currentTime, handleTimerComplete]);

  // Timer control functions
  const startTimer = useCallback(() => {
    if (currentTime === 0) {
      const newCurrentTime = isBreak 
        ? (pomodoroCount > 0 && pomodoroCount % 4 === 0 ? settings.longBreakDuration : settings.breakDuration)
        : settings.workDuration;
      setCurrentTime(newCurrentTime);
      setTotalTime(newCurrentTime);
    }
    setIsRunning(true);
  }, [currentTime, isBreak, pomodoroCount, settings]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    const newTime = isBreak 
      ? (pomodoroCount > 0 && pomodoroCount % 4 === 0 ? settings.longBreakDuration : settings.breakDuration)
      : settings.workDuration;
    setCurrentTime(newTime);
    setTotalTime(newTime);
  }, [isBreak, pomodoroCount, settings]);

  const completeTimer = useCallback(() => {
    if (!isRunning && currentTime === totalTime) {
      return false; // Timer hasn't started
    }
    
    if (isRunning) {
      pauseTimer();
    }
    
    const currentType = isBreak ? 'break' : 'work';
    updateStats(currentType);
    
    resetTimer();
    return true;
  }, [isRunning, currentTime, totalTime, isBreak, pauseTimer, updateStats, resetTimer]);

  const setDurations = useCallback(async (durations: { work?: number, break?: number, long?: number }) => {
    const oldSettings = settings;
    const newSettings = {
      ...settings,
      workDuration: durations.work ? durations.work * 60 : settings.workDuration,
      breakDuration: durations.break ? durations.break * 60 : settings.breakDuration,
      longBreakDuration: durations.long ? durations.long * 60 : settings.longBreakDuration,
    };
    
    // Optimistic update
    setSettings(newSettings);
    await saveSettings(newSettings, oldSettings);
    
    // Reset timer if not running
    if (!isRunning) {
      const newTime = isBreak 
        ? (pomodoroCount > 0 && pomodoroCount % 4 === 0 ? newSettings.longBreakDuration : newSettings.breakDuration)
        : newSettings.workDuration;
      setCurrentTime(newTime);
      setTotalTime(newTime);
    }
  }, [settings, saveSettings, isRunning, isBreak, pomodoroCount]);

  const updateSessionName = useCallback(async (name: string) => {
    const oldSettings = settings;
    const newSettings = { ...settings, sessionName: name };
    setSettings(newSettings);
    await saveSettings(newSettings, oldSettings);
  }, [settings, saveSettings]);

  const toggleTheme = useCallback(async (newTheme?: Theme) => {
    const oldSettings = settings;
    const newSettings = { 
      ...settings, 
      theme: newTheme || (settings.theme === 'dark' ? 'light' : 'dark') 
    };
    setSettings(newSettings);
    await saveSettings(newSettings, oldSettings);
  }, [settings, saveSettings]);

  const toggleSound = useCallback(async (enable?: boolean) => {
    const oldSettings = settings;
    const newSettings = { 
      ...settings, 
      soundEnabled: enable === undefined ? !settings.soundEnabled : enable 
    };
    setSettings(newSettings);
    await saveSettings(newSettings, oldSettings);
  }, [settings, saveSettings]);

  const commitSession = useCallback(async (message: string) => {
    const sessionData: PomodoroSessionData = {
      sessionName: settings.sessionName,
      isBreak,
      timestamp: new Date().toISOString(),
      durationMinutes: Math.floor((totalTime - currentTime) / 60),
      commitMessage: message,
    };
    
    // Add to local history
    const oldStats = stats;
    const newStats = { ...stats, history: [...stats.history, sessionData].slice(-50) };
    setStats(newStats);
    
    // Save to Firestore
    const success = await saveStats(newStats, oldStats);
    
    // Save to session history collection
    if (user && success) {
      try {
        await firestoreService.addSessionToHistory(user.uid, sessionData);
      } catch (error) {
        console.error('Failed to commit session:', error);
      }
    }
  }, [settings, isBreak, totalTime, currentTime, stats, saveStats, user]);

  const clearSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  return {
    // Timer state
    currentTime,
    totalTime,
    isRunning,
    isBreak,
    pomodoroCount,
    
    // Data state
    settings,
    stats,
    isLoading,
    isDataLoaded,
    saveError,
    
    // Timer controls
    startTimer,
    pauseTimer,
    resetTimer,
    completeTimer,
    
    // Settings controls
    setDurations,
    updateSessionName,
    toggleTheme,
    toggleSound,
    
    // Session controls
    commitSession,
    
    // Error handling
    clearSaveError,
  };
};