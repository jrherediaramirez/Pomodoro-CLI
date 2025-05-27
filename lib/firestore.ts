// lib/firestore.ts - Enhanced with security features
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseFirestore, getFirebaseAuth } from './firebase'; // Updated import
import { PomodoroSettings, PomodoroStats, PomodoroSessionData } from '@/types';
import { securityLogger, sanitizeError, validateUserInput } from './security';
import { sanitizeString } from './validation';

export interface FirestoreUserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  settings: PomodoroSettings;
  stats: PomodoroStats;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
}

// Input validation schemas
const USER_DATA_SCHEMA = {
  uid: 'string',
  email: 'string',
  firstName: 'string',
  lastName: 'string',
  settings: 'object',
  stats: 'object'
};

const SETTINGS_SCHEMA = {
  workDuration: 'number',
  breakDuration: 'number',
  longBreakDuration: 'number',
  theme: 'string',
  soundEnabled: 'boolean',
  sessionName: 'string'
};

const STATS_SCHEMA = {
  completedToday: 'number',
  history: 'object',
  totalFocusTime: 'number',
  longestStreak: 'number',
  currentStreak: 'number'
};

// Enhanced security checks
const validateUserAccess = (uid: string): boolean => {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    securityLogger.log({
      type: 'unauthorized_access',
      details: 'No authenticated user'
    });
    return false;
  }
  
  if (currentUser.uid !== uid) {
    securityLogger.log({
      type: 'unauthorized_access',
      userId: currentUser.uid,
      details: `Attempted to access data for user ${uid}`
    });
    return false;
  }
  
  return true;
};

// Sanitize user data
const sanitizeUserData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  // Sanitize string fields
  if (sanitized.firstName) sanitized.firstName = sanitizeString(sanitized.firstName);
  if (sanitized.lastName) sanitized.lastName = sanitizeString(sanitized.lastName);
  if (sanitized.settings?.sessionName) {
    sanitized.settings.sessionName = sanitizeString(sanitized.settings.sessionName);
  }
  
  return sanitized;
};

// Validate settings bounds
const validateSettings = (settings: PomodoroSettings): boolean => {
  return (
    settings.workDuration > 0 && settings.workDuration <= 7200 && // Max 2 hours
    settings.breakDuration > 0 && settings.breakDuration <= 3600 && // Max 1 hour
    settings.longBreakDuration > 0 && settings.longBreakDuration <= 3600 &&
    ['light', 'dark'].includes(settings.theme) &&
    typeof settings.soundEnabled === 'boolean' &&
    settings.sessionName.length <= 100
  );
};

// Validate stats bounds
const validateStats = (stats: PomodoroStats): boolean => {
  return (
    stats.completedToday >= 0 && stats.completedToday <= 1000 && // Reasonable daily limit
    Array.isArray(stats.history) && stats.history.length <= 100 &&
    stats.totalFocusTime >= 0 &&
    stats.longestStreak >= 0 &&
    stats.currentStreak >= 0
  );
};

export const secureFirestoreService = {
  async getUserData(uid: string): Promise<FirestoreUserData | null> {
    try {
      if (!validateUserAccess(uid)) {
        throw new Error('Unauthorized access attempt');
      }

      const db = getFirebaseFirestore(); // Get Firestore instance
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as FirestoreUserData;
        
        // Update last activity
        await this.updateLastActivity(uid);
        
        return sanitizeUserData(data);
      }
      return null;
    } catch (error) {
      securityLogger.log({
        type: 'unauthorized_access',
        userId: uid,
        details: `Failed to get user data: ${sanitizeError(error)}`
      });
      throw new Error('Failed to get user data');
    }
  },

  async createUserData(userData: {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<FirestoreUserData> {
    try {
      if (!validateUserAccess(userData.uid)) {
        throw new Error('Unauthorized access attempt');
      }

      // Validate input
      if (!validateUserInput(userData, USER_DATA_SCHEMA)) {
        throw new Error('Invalid user data format');
      }

      const sanitizedData = sanitizeUserData(userData);
      const now = new Date().toISOString();
      
      const docData: FirestoreUserData = {
        ...sanitizedData,
        settings: {
          workDuration: 25 * 60,
          breakDuration: 5 * 60,
          longBreakDuration: 15 * 60,
          theme: 'dark',
          soundEnabled: true,
          sessionName: 'Focus Session',
        },
        stats: {
          completedToday: 0,
          history: [],
          totalFocusTime: 0,
          longestStreak: 0,
          currentStreak: 0,
        },
        createdAt: now,
        updatedAt: now,
        lastActivity: now
      };
      
      const db = getFirebaseFirestore(); // Get Firestore instance
      await setDoc(doc(db, 'users', userData.uid), docData);
      return docData;
    } catch (error) {
      securityLogger.log({
        type: 'unauthorized_access',
        userId: userData.uid,
        details: `Failed to create user data: ${sanitizeError(error)}`
      });
      throw new Error('Failed to create user data');
    }
  },

  async updateUserSettings(uid: string, settings: PomodoroSettings): Promise<void> {
    try {
      if (!validateUserAccess(uid)) {
        throw new Error('Unauthorized access attempt');
      }

      // Validate settings
      if (!validateUserInput(settings, SETTINGS_SCHEMA) || !validateSettings(settings)) {
        throw new Error('Invalid settings data');
      }

      const sanitizedSettings = sanitizeUserData({ settings }).settings;

      const db = getFirebaseFirestore(); // Get Firestore instance
      await updateDoc(doc(db, 'users', uid), {
        settings: sanitizedSettings,
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });
    } catch (error) {
      securityLogger.log({
        type: 'unauthorized_access',
        userId: uid,
        details: `Failed to update settings: ${sanitizeError(error)}`
      });
      throw new Error('Failed to update settings');
    }
  },

  async updateUserStats(uid: string, stats: PomodoroStats): Promise<void> {
    try {
      if (!validateUserAccess(uid)) {
        throw new Error('Unauthorized access attempt');
      }

      // Validate stats
      if (!validateUserInput(stats, STATS_SCHEMA) || !validateStats(stats)) {
        throw new Error('Invalid stats data');
      }

      const db = getFirebaseFirestore(); // Get Firestore instance
      await updateDoc(doc(db, 'users', uid), {
        stats,
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });
    } catch (error) {
      securityLogger.log({
        type: 'unauthorized_access',
        userId: uid,
        details: `Failed to update stats: ${sanitizeError(error)}`
      });
      throw new Error('Failed to update stats');
    }
  },

  async updateLastActivity(uid: string): Promise<void> {
    try {
      if (!validateUserAccess(uid)) {
        return; // Silently fail for activity updates
      }

      const db = getFirebaseFirestore(); // Get Firestore instance
      await updateDoc(doc(db, 'users', uid), {
        lastActivity: new Date().toISOString()
      });
    } catch (error) {
      // Log but don't throw for activity updates
      console.warn('Failed to update last activity:', sanitizeError(error));
    }
  },

  async deleteUserData(uid: string): Promise<void> {
    try {
      if (!validateUserAccess(uid)) {
        throw new Error('Unauthorized access attempt');
      }

      const db = getFirebaseFirestore(); // Get Firestore instance
      // Use batch operation for atomic deletion
      const batch = writeBatch(db);
      
      // Delete user document
      batch.delete(doc(db, 'users', uid));
      
      // Delete sessions subcollection (get first, then delete)
      const sessionsQuery = query(
        collection(db, 'users', uid, 'sessions'),
        limit(500) // Limit for safety
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      sessionsSnapshot.docs.forEach(sessionDoc => {
        batch.delete(sessionDoc.ref);
      });

      await batch.commit();

      securityLogger.log({
        type: 'auth_failure', // This is actually a legitimate action, but worth logging
        userId: uid,
        details: 'User data deleted'
      });
    } catch (error) {
      securityLogger.log({
        type: 'unauthorized_access',
        userId: uid,
        details: `Failed to delete user data: ${sanitizeError(error)}`
      });
      throw new Error('Failed to delete user data');
    }
  },

  subscribeToUserData(uid: string, callback: (userData: FirestoreUserData | null) => void): Unsubscribe {
    if (!validateUserAccess(uid)) {
      callback(null);
      return () => {}; // Return empty unsubscribe function
    }

    const db = getFirebaseFirestore(); // Get Firestore instance
    return onSnapshot(
      doc(db, 'users', uid),
      (doc) => {
        if (doc.exists()) {
          const data = sanitizeUserData(doc.data()) as FirestoreUserData;
          callback(data);
        } else {
          callback(null);
        }
      },
      (error) => {
        securityLogger.log({
          type: 'unauthorized_access',
          userId: uid,
          details: `Subscription error: ${sanitizeError(error)}`
        });
        callback(null);
      }
    );
  },

  async addSessionToHistory(uid: string, session: PomodoroSessionData): Promise<void> {
    try {
      if (!validateUserAccess(uid)) {
        throw new Error('Unauthorized access attempt');
      }

      // Validate session data
      const sanitizedSession = {
        ...session,
        sessionName: sanitizeString(session.sessionName),
        commitMessage: session.commitMessage ? sanitizeString(session.commitMessage) : undefined
      };

      // Additional validation
      if (sanitizedSession.sessionName.length > 100 ||
          (sanitizedSession.commitMessage && sanitizedSession.commitMessage.length > 500) ||
          sanitizedSession.durationMinutes < 0 || sanitizedSession.durationMinutes > 480) {
        throw new Error('Invalid session data');
      }

      const db = getFirebaseFirestore(); // Get Firestore instance
      const sessionDoc = doc(collection(db, 'users', uid, 'sessions'));
      await setDoc(sessionDoc, {
        ...sanitizedSession,
        id: sessionDoc.id,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      securityLogger.log({
        type: 'unauthorized_access',
        userId: uid,
        details: `Failed to add session: ${sanitizeError(error)}`
      });
      throw new Error('Failed to add session to history');
    }
  },

  async getSessionHistory(uid: string, limitCount = 50): Promise<PomodoroSessionData[]> {
    try {
      if (!validateUserAccess(uid)) {
        throw new Error('Unauthorized access attempt');
      }

      // Limit the query size for security
      const actualLimit = Math.min(limitCount, 100);
      
      const db = getFirebaseFirestore(); // Get Firestore instance
      const sessionsQuery = query(
        collection(db, 'users', uid, 'sessions'),
        orderBy('createdAt', 'desc'),
        limit(actualLimit)
      );
      
      const querySnapshot = await getDocs(sessionsQuery);
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as PomodoroSessionData;
        return {
          ...data,
          sessionName: sanitizeString(data.sessionName || ''),
          commitMessage: data.commitMessage ? sanitizeString(data.commitMessage) : undefined
        };
      });
    } catch (error) {
      securityLogger.log({
        type: 'unauthorized_access',
        userId: uid,
        details: `Failed to get session history: ${sanitizeError(error)}`
      });
      throw new Error('Failed to get session history');
    }
  },

  async getOrCreateUserData(userData: {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<FirestoreUserData> {
    try {
      let existingUser = await this.getUserData(userData.uid);
      
      if (!existingUser) {
        existingUser = await this.createUserData(userData);
      }
      
      return existingUser;
    } catch (error) {
      securityLogger.log({
        type: 'unauthorized_access',
        userId: userData.uid,
        details: `Failed to get or create user data: ${sanitizeError(error)}`
      });
      throw new Error('Failed to get or create user data');
    }
  }
};

export const firestoreService = secureFirestoreService;