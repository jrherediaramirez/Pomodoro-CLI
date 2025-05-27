// lib/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  enableNetwork, 
  disableNetwork,
  enableMultiTabIndexedDbPersistence
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase App
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firebase Auth - only on client side
let auth: Auth | null = null;

export const initializeFirebaseAuth = (): Auth => {
  if (auth) return auth;
  
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be initialized on the client side');
  }
  
  try {
    auth = getAuth(app);
    return auth;
  } catch (error) {
    console.error('Failed to initialize Firebase Auth:', error);
    throw error;
  }
};

// Export auth getter that ensures client-side initialization
export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    return initializeFirebaseAuth();
  }
  return auth;
};

// Initialize Firestore - only on client side
let db: Firestore | null = null;

export const initializeFirestore = (): Firestore => {
  if (db) return db;
  
  if (typeof window === 'undefined') {
    throw new Error('Firestore can only be initialized on the client side');
  }
  
  try {
    db = getFirestore(app);
    return db;
  } catch (error) {
    console.error('Failed to initialize Firestore:', error);
    throw error;
  }
};

// Export Firestore getter that ensures client-side initialization
export const getFirebaseFirestore = (): Firestore => {
  if (!db) {
    return initializeFirestore();
  }
  return db;
};

// For backward compatibility, export auth but only initialize on client
export { auth };

// Enable offline persistence
let persistenceEnabled = false;

export const enableOfflinePersistence = async (): Promise<boolean> => {
  if (persistenceEnabled) return true;
  
  if (typeof window === 'undefined') {
    console.warn('⚠️ Offline persistence can only be enabled on the client side');
    return false;
  }
  
  try {
    const firestoreInstance = getFirebaseFirestore();
    await enableMultiTabIndexedDbPersistence(firestoreInstance);
    console.log('🔄 Firestore offline persistence with multi-tab support enabled');
    persistenceEnabled = true;
    return true;
  } catch (error: any) {
    if (error.code == 'failed-precondition') {
      console.warn('⚠️ Firestore offline persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time. Or, browser does not support all features.');
    } else if (error.code == 'unimplemented') {
      console.warn('⚠️ Firestore offline persistence failed: The current browser does not support all of the features required to enable persistence.');
    } else {
      console.warn('⚠️ Failed to enable offline persistence:', error);
    }
    return false;
  }
};

// Network state management
export const firestoreNetworkUtils = {
  enableNetwork: () => {
    if (typeof window === 'undefined') return Promise.resolve();
    return enableNetwork(getFirebaseFirestore());
  },
  disableNetwork: () => {
    if (typeof window === 'undefined') return Promise.resolve();
    return disableNetwork(getFirebaseFirestore());
  },
};

export default app;