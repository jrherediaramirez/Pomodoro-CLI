// lib/firestore.ts - Complete Firestore service
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
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { PomodoroSettings, PomodoroStats, PomodoroSessionData } from '@/types';

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

// Default settings for new users
const defaultSettings: PomodoroSettings = {
  workDuration: 25 * 60, // 25 minutes in seconds
  breakDuration: 5 * 60, // 5 minutes in seconds
  longBreakDuration: 15 * 60, // 15 minutes in seconds
  theme: 'dark',
  soundEnabled: true,
  sessionName: 'Focus Session',
};

// Default stats for new users
const defaultStats: PomodoroStats = {
  completedToday: 0,
  history: [],
  totalFocusTime: 0,
  longestStreak: 0,
  currentStreak: 0,
};

export const firestoreService = {
  // User document operations
  async getUserData(uid: string): Promise<FirestoreUserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as FirestoreUserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
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
      const now = new Date().toISOString();
      const docData: FirestoreUserData = {
        ...userData,
        settings: defaultSettings,
        stats: defaultStats,
        createdAt: now,
        updatedAt: now
      };
      
      await setDoc(doc(db, 'users', userData.uid), docData);
      return docData;
    } catch (error) {
      console.error('Error creating user data:', error);
      throw new Error('Failed to create user data');
    }
  },

  async updateUserSettings(uid: string, settings: PomodoroSettings): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        settings,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
  },

  async updateUserStats(uid: string, stats: PomodoroStats): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        stats,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating stats:', error);
      throw new Error('Failed to update stats');
    }
  },

  async deleteUserData(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw new Error('Failed to delete user data');
    }
  },

  // Real-time listener for user data
  subscribeToUserData(uid: string, callback: (userData: FirestoreUserData | null) => void): Unsubscribe {
    return onSnapshot(
      doc(db, 'users', uid),
      (doc) => {
        if (doc.exists()) {
          callback(doc.data() as FirestoreUserData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in user data subscription:', error);
        callback(null);
      }
    );
  },

  // Session history operations
  async addSessionToHistory(uid: string, session: PomodoroSessionData): Promise<void> {
    try {
      const sessionDoc = doc(collection(db, 'users', uid, 'sessions'));
      await setDoc(sessionDoc, {
        ...session,
        id: sessionDoc.id,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding session to history:', error);
      throw new Error('Failed to add session to history');
    }
  },

  async getSessionHistory(uid: string, limitCount = 50): Promise<PomodoroSessionData[]> {
    try {
      const sessionsQuery = query(
        collection(db, 'users', uid, 'sessions'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(sessionsQuery);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as PomodoroSessionData));
    } catch (error) {
      console.error('Error getting session history:', error);
      throw new Error('Failed to get session history');
    }
  },

  // Batch operations for better performance
  async initializeNewUser(userData: {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<FirestoreUserData> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserData(userData.uid);
      if (existingUser) {
        return existingUser;
      }

      // Create new user document
      return await this.createUserData(userData);
    } catch (error) {
      console.error('Error initializing new user:', error);
      throw new Error('Failed to initialize user');
    }
  },

  // Helper function to get or create user data
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
      console.error('Error getting or creating user data:', error);
      throw new Error('Failed to get or create user data');
    }
  }
};