// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  enableNetwork, 
  disableNetwork,
  enableMultiTabIndexedDbPersistence // Corrected import for persistence
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence
let persistenceEnabled = false;

export const enableOfflinePersistence = async (): Promise<boolean> => {
  if (persistenceEnabled) return true;
  
  try {
    // Use enableMultiTabIndexedDbPersistence for explicit multi-tab support
    await enableMultiTabIndexedDbPersistence(db);
    console.log('🔄 Firestore offline persistence with multi-tab support enabled');
    persistenceEnabled = true;
    return true;
  } catch (error: any) {
    if (error.code == 'failed-precondition') {
      console.warn('⚠️ Firestore offline persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a a time. Or, browser does not support all features.');
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
  enableNetwork: () => enableNetwork(db),
  disableNetwork: () => disableNetwork(db),
};

export default app;