// hooks/usePomodoro.ts - Updated with Firestore integration
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
  
  const [currentTime, setCurrentTime] = useState(settings.workDuration);
  const [totalTime, setTotalTime] = useState(settings.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load user data from Firestore
  const loadUserData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get or create user data
      const userData = await firestoreService.getOrCreateUserData({
        uid: user.uid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });

      if (userData) {
        setSettings(userData.settings);
        setStats(userData.stats);
        setIsDataLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Fallback to default values on error
      setSettings(initialSettings);
      setStats(initialStats);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) {
      // Clean up subscription if user logs out
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setSettings(initialSettings);
      setStats(initialStats);
      setIsDataLoaded(false);
      setIsLoading(false);
      return;
    }

    // Subscribe to real-time user data updates
    const unsubscribe = firestoreService.subscribeToUserData(user.uid, (userData) => {
      if (userData) {
        setSettings(userData.settings);
        setStats(userData.stats);
        setIsDataLoaded(true);
      }
      setIsLoading(false);
    });

    unsubscribeRef.current = unsubscribe;

    // Initial load if not already loaded
    if (!isDataLoaded) {
      loadUserData();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, loadUserData, isDataLoaded]);

  // Save settings to Firestore
  const saveSettings = useCallback(async (newSettings: PomodoroSettings) => {
    if (!user) return;

    try {
      await firestoreService.updateUserSettings(user.uid, newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Note: Real-time listener will revert changes if save fails
    }
  }, [user]);

  // Save stats to Firestore
  const saveStats = useCallback(async (newStats: PomodoroStats) => {
    if (!user) return;

    try {
      await firestoreService.updateUserStats(user.uid, newStats);
    } catch (error) {
      console.error('Failed to save stats:', error);
      // Note: Real-time listener will revert changes if save fails
    }
  }, [user]);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(CHIME_SOUND_BASE64);
    }
  }, []);

  // Apply theme and reset timer when settings change
  useEffect(() => {
    document.body.classList.toggle('light-theme', settings.theme === 'light');
    
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
      audioRef.current.play().catch(err => console.error("Error playing chime:", err));
    }
  }, [settings.soundEnabled]);
  const updateStats = useCallback(async (type: 'work' | 'break') => {
    const newStats = { ...stats };
    
    if (type === 'work') {
      newStats.completedToday += 1;
      newStats.totalFocusTime += Math.floor(settings.workDuration / 60);
      newStats.currentStreak += 1;
      newStats.longestStreak = Math.max(newStats.longestStreak, newStats.currentStreak);
    }

    // Add to history
    const sessionData: PomodoroSessionData = {
      sessionName: settings.sessionName,
      isBreak: type === 'break',
      timestamp: new Date().toISOString(),
      durationMinutes: Math.floor((type === 'work' ? settings.workDuration : 
        (pomodoroCount % 4 === 0 ? settings.longBreakDuration : settings.breakDuration)) / 60),
    };
    
    newStats.history = [...newStats.history, sessionData].slice(-50);
    
    setStats(newStats);
    await saveStats(newStats);
    
    // Also save to session history collection
    if (user) {
      try {
        await firestoreService.addSessionToHistory(user.uid, sessionData);
      } catch (error) {
        console.error('Failed to add session to history:', error);
      }
    }
  }, [stats, settings, pomodoroCount, saveStats, user]);

  const onTimerComplete = useCallback(() => {
    playChime();
    setIsRunning(false);
    
    let completedType: 'work' | 'break' = 'work';

    if (!isBreak) {
      updateStats('work');
      setPomodoroCount(prev => prev + 1);
      
      let nextDuration;
      let nextSessionName;      if ((pomodoroCount + 1) % 4 === 0) {
        nextDuration = settings.longBreakDuration;
        nextSessionName = "Long Break";
      } else {
        nextDuration = settings.breakDuration;
        nextSessionName = "Short Break";
      }
      
      const newSettings = { ...settings, sessionName: nextSessionName };
      setSettings(newSettings);
      saveSettings(newSettings);
        setCurrentTime(nextDuration);
      setTotalTime(nextDuration);
      setIsBreak(true);
      completedType = 'work';
    } else {
      updateStats('break');
      setCurrentTime(settings.workDuration);
      setTotalTime(settings.workDuration);
      
      const newSettings = { ...settings, sessionName: "Focus Session" };
      setSettings(newSettings);
      saveSettings(newSettings);
      
      setIsBreak(false);
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
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setCurrentTime(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerIntervalRef.current!);
            onTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRunning, onTimerComplete]);

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

  const pauseTimer = useCallback(() => setIsRunning(false), []);

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
      return false;
    }
      if (isRunning) {
      pauseTimer();
    }
    
    const currentType = isBreak ? 'break' : 'work';
    updateStats(currentType);
    
    resetTimer();
    return true;
  }, [isRunning, currentTime, totalTime, isBreak, pauseTimer, updateStats, resetTimer, settings]);

  const setDurations = useCallback(async (durations: { work?: number, break?: number, long?: number }) => {
    const newSettings = {
      ...settings,
      workDuration: durations.work ? durations.work * 60 : settings.workDuration,
      breakDuration: durations.break ? durations.break * 60 : settings.breakDuration,
      longBreakDuration: durations.long ? durations.long * 60 : settings.longBreakDuration,
    };
    
    setSettings(newSettings);
    await saveSettings(newSettings);
    
    if (!isRunning) {
      resetTimer();
    }
  }, [settings, saveSettings, isRunning, resetTimer]);

  const updateSessionName = useCallback(async (name: string) => {
    const newSettings = { ...settings, sessionName: name };
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const toggleTheme = useCallback(async (newTheme?: Theme) => {
    const newSettings = { 
      ...settings, 
      theme: newTheme || (settings.theme === 'dark' ? 'light' : 'dark') 
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, [settings, saveSettings]);
    const toggleSound = useCallback(async (enable?: boolean) => {
    const newSettings = { 
      ...settings, 
      soundEnabled: enable === undefined ? !settings.soundEnabled : enable 
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const commitSession = useCallback(async (message: string) => {
    const sessionData: PomodoroSessionData = {
      sessionName: settings.sessionName,
      isBreak,
      timestamp: new Date().toISOString(),
      durationMinutes: Math.floor((totalTime - currentTime) / 60),
      commitMessage: message,
    };
    
    const newStats = { ...stats, history: [...stats.history, sessionData] };
    setStats(newStats);
    await saveStats(newStats);
    
    if (user) {
      try {
        await firestoreService.addSessionToHistory(user.uid, sessionData);
      } catch (error) {
        console.error('Failed to commit session:', error);
      }
    }
  }, [settings, isBreak, totalTime, currentTime, stats, saveStats, user]);

  return {
    currentTime,
    totalTime,
    isRunning,
    isBreak,
    settings,
    stats,
    isLoading,
    isDataLoaded,    startTimer,
    pauseTimer,
    resetTimer,
    completeTimer,
    setDurations,
    updateSessionName,
    toggleTheme,
    toggleSound,
    commitSession,
    pomodoroCount
  };
};