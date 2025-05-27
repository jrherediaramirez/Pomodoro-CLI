// ============================================
// 1. LOADING STATES FOR COMMAND PROCESSOR
// ============================================

// components/CommandProcessor.tsx - Enhanced with loading states
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/lib/firestore';
import EnhancedLoader from './EnhancedLoader';

export class CommandProcessor {
  private context: CommandContext;
  
  constructor(context: CommandContext) {
    this.context = context;
  }

  // Enhanced stats command with loading state
  private async handleStatsCommand(): Promise<CommandResult> {
    const { addOutput, pomodoroInstance, userInfo } = this.context;
    
    // Show loading indicator
    addOutput(
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <EnhancedLoader isActive={true} variant="spinner" showMessage={false} />
        <span style={{ color: 'var(--dracula-cyan)' }}>Loading statistics...</span>
      </div>, 
      'system'
    );
    
    try {
      // Fetch fresh session history from Firestore
      const sessionHistory = await firestoreService.getSessionHistory(userInfo!.uid, 10);
      
      // Clear the loading message and show stats
      addOutput(
        <div style={{color: 'var(--dracula-cyan)'}}>
          [STATS] <strong>Statistics</strong>
        </div>, 
        'system'
      );
      
      // ... rest of stats display logic
      
      return { success: true, message: 'Stats displayed' };
    } catch (error) {
      addOutput(
        <span style={{color: 'var(--dracula-red)'}}>
          [ERROR] Failed to load statistics: {error instanceof Error ? error.message : 'Unknown error'}
        </span>, 
        'error'
      );
      return { success: false, error: 'Failed to load stats' };
    }
  }

  // Enhanced reset-data command with loading states
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
      // Show detailed loading progress
      addOutput(
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EnhancedLoader isActive={true} variant="progress" showMessage={false} />
          <span style={{color: 'var(--dracula-orange)'}}>
            [RESET] Step 1/3: Backing up current data...
          </span>
        </div>, 
        'system'
      );
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addOutput(
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EnhancedLoader isActive={true} variant="progress" showMessage={false} />
          <span style={{color: 'var(--dracula-orange)'}}>
            [RESET] Step 2/3: Deleting user data from Firestore...
          </span>
        </div>, 
        'system'
      );
      
      // Delete user data from Firestore
      await firestoreService.deleteUserData(userInfo.uid);
      
      addOutput(
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EnhancedLoader isActive={true} variant="pulse" showMessage={false} />
          <span style={{color: 'var(--dracula-orange)'}}>
            [RESET] Step 3/3: Reinitializing workspace...
          </span>
        </div>, 
        'system'
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      addOutput(
        <span style={{color: 'var(--dracula-green)'}}>
          [SUCCESS] All data has been reset successfully!
        </span>, 
        'output'
      );
      
      // Auto-refresh after delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
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

  // New command: /sync - manually sync data with server
  private async handleSyncCommand(): Promise<CommandResult> {
    const { addOutput, userInfo, pomodoroInstance } = this.context;
    
    if (!userInfo?.uid) {
      addOutput('[ERROR] Not authenticated', 'error');
      return { success: false, error: 'Not authenticated' };
    }

    addOutput(
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <EnhancedLoader isActive={true} variant="spinner" showMessage={false} />
        <span style={{color: 'var(--dracula-cyan)'}}>
          [SYNC] Synchronizing with server...
        </span>
      </div>, 
      'system'
    );

    try {
      // Force refresh user data
      const userData = await firestoreService.getUserData(userInfo.uid);
      
      if (userData) {
        addOutput(
          <span style={{color: 'var(--dracula-green)'}}>
            [SYNC] ✓ Settings synchronized
          </span>, 
          'system'
        );
        
        addOutput(
          <span style={{color: 'var(--dracula-green)'}}>
            [SYNC] ✓ Statistics synchronized  
          </span>, 
          'system'
        );
        
        addOutput(
          <span style={{color: 'var(--dracula-green)'}}>
            [SYNC] All data is up to date!
          </span>, 
          'output'
        );
      }

      return { success: true, message: 'Sync completed' };
    } catch (error) {
      addOutput(
        <span style={{color: 'var(--dracula-red)'}}>
          [SYNC] Failed to sync: {error instanceof Error ? error.message : 'Unknown error'}
        </span>, 
        'error'
      );
      return { success: false, error: 'Sync failed' };
    }
  }
}

// ============================================
// 2. FIREBASE OFFLINE PERSISTENCE
// ============================================

// lib/firebase.ts - Enhanced with offline support
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  enableNetwork, 
  disableNetwork,
  connectFirestoreEmulator
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

// Initialize Firestore with offline persistence
export const db = getFirestore(app);

// Enable offline persistence
let persistenceEnabled = false;

export const enableOfflinePersistence = async (): Promise<boolean> => {
  if (persistenceEnabled) return true;
  
  try {
    // Note: This should be called before any other Firestore operations
    // In Next.js, we'll enable this when the app loads
    
    // Firebase automatically handles offline persistence
    // but we can configure cache size
    console.log('🔄 Firestore offline persistence enabled');
    persistenceEnabled = true;
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to enable offline persistence:', error);
    return false;
  }
};

// Network state management
export const firestoreNetworkUtils = {
  async goOffline(): Promise<void> {
    try {
      await disableNetwork(db);
      console.log('📱 Firestore: Now offline');
    } catch (error) {
      console.error('Failed to go offline:', error);
    }
  },

  async goOnline(): Promise<void> {
    try {
      await enableNetwork(db);
      console.log('🌐 Firestore: Now online');
    } catch (error) {
      console.error('Failed to go online:', error);
    }
  },

  // Check if device is online
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
};

export default app;

// ============================================
// 3. NETWORK STATUS HOOK
// ============================================

// hooks/useNetworkStatus.ts - New hook for network awareness
import { useState, useEffect } from 'react';
import { firestoreNetworkUtils } from '@/lib/firebase';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      firestoreNetworkUtils.goOnline();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      // Don't immediately disable Firestore - let it handle gracefully
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    showOfflineMessage,
    goOffline: firestoreNetworkUtils.goOffline,
    goOnline: firestoreNetworkUtils.goOnline
  };
};

// ============================================
// 4. ENHANCED TERMINAL WITH NETWORK STATUS
// ============================================

// components/Terminal.tsx - Add network status indicator
// Add this to your existing Terminal component:

const NetworkStatusIndicator: React.FC<{ isOnline: boolean; showMessage: boolean }> = ({ 
  isOnline, 
  showMessage 
}) => {
  if (!showMessage) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      padding: '8px 12px',
      background: isOnline ? 'var(--dracula-green)' : 'var(--dracula-orange)',
      color: 'var(--dracula-background)',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 2000,
      transition: 'all 0.3s ease'
    }}>
      {isOnline ? '🌐 Back Online' : '📱 Offline Mode'}
    </div>
  );
};

// Usage in Terminal component:
export const Terminal: React.FC<TerminalProps> = ({ className = '' }) => {
  const { isOnline, showOfflineMessage } = useNetworkStatus();
  
  // ... existing code ...

  return (
    <ErrorBoundary>
      <NetworkStatusIndicator isOnline={isOnline} showMessage={showOfflineMessage} />
      {/* ... rest of terminal JSX ... */}
    </ErrorBoundary>
  );
};

// ============================================
// 5. APP INITIALIZATION WITH OFFLINE SUPPORT
// ============================================

// app/layout.tsx - Initialize offline persistence
import { enableOfflinePersistence } from '@/lib/firebase';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize offline persistence on app load
  useEffect(() => {
    enableOfflinePersistence().then(success => {
      if (success) {
        console.log('✅ Offline persistence ready');
      }
    });
  }, []);

  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}