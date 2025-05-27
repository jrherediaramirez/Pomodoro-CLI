// hooks/useNetworkStatus.ts - New hook for network awareness
import { useState, useEffect } from 'react';
import { firestoreNetworkUtils } from '@/lib/firebase';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false); // Hide message immediately when back online
      firestoreNetworkUtils.enableNetwork();
      console.log('Network status: Online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true); // Show message when offline
      // Don't immediately disable Firestore - let it handle gracefully
      // firestoreNetworkUtils.goOffline(); // Decided against this based on patch notes
      console.log('Network status: Offline');
    };

    // Set initial state
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        // If initially offline, show the message
        setShowOfflineMessage(true);
      }
    }


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
    goOffline: firestoreNetworkUtils.disableNetwork, // Expose for manual control if needed
    goOnline: firestoreNetworkUtils.enableNetwork   // Expose for manual control if needed
  };
};
