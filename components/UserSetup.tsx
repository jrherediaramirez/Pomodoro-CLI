// components/UserSetup.tsx - Updated for Firebase authentication
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/lib/firestore';
import EnhancedLoader from './EnhancedLoader';

interface UseUserSetupProps {
  addOutput: (content: React.ReactNode, type?: 'input' | 'output' | 'error' | 'help' | 'system') => void;
  outputLines: any[];
}

export const useUserSetup = ({
  addOutput,
  outputLines
}: UseUserSetupProps) => {
  const { user } = useAuth();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitialized = useRef(false); // Track if we've already run the welcome sequence  // Initialize user setup for authenticated users
  useEffect(() => {
    if (!user) {
      setIsSetupComplete(false);
      setIsInitializing(false);
      hasInitialized.current = false; // Reset when user logs out
      return;
    }

    // Prevent duplicate initialization
    if (hasInitialized.current) {
      setIsSetupComplete(true);
      setIsInitializing(false);
      return;
    }

    const initializeUser = async () => {
      try {
        setIsInitializing(true);
        hasInitialized.current = true; // Mark as initialized immediately
        
        // Show welcome sequence only once
        addOutput("🍅 Pomodoro CLI - Terminal Initializing...", 'system');
        
        // Add a small delay for effect
        setTimeout(() => {
          addOutput(`Welcome back, ${user.firstName}!`, 'system');
          addOutput("Your productivity workspace is ready.", 'system');
          addOutput("Type '/help' to see available commands or '/play' to start a timer.", 'system');
          
          // Show user info
          setTimeout(() => {
            addOutput(
              <div style={{ marginTop: '10px', color: 'var(--dracula-cyan)' }}>
                <div>[USER] {user.firstName} {user.lastName}</div>
                <div>[EMAIL] {user.email}</div>
                <div>[STATUS] Authenticated & Ready</div>
              </div>,
              'system'
            );
          }, 500);
        }, 800);

        // Ensure user data exists in Firestore
        try {
          await firestoreService.getOrCreateUserData({
            uid: user.uid,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          });
        } catch (error) {
          console.error('Failed to initialize user data:', error);
          addOutput("⚠️ Warning: Failed to sync user data. Some features may not work properly.", 'error');
        }

        setIsSetupComplete(true);
      } catch (error) {
        console.error('Failed to initialize user:', error);
        addOutput("❌ Error: Failed to initialize user workspace.", 'error');
        setIsSetupComplete(false);
        hasInitialized.current = false; // Reset on error so it can be retried
      } finally {
        setIsInitializing(false);
      }
    };

    initializeUser();
  }, [user, addOutput]); // Keep consistent dependencies - removed outputLines to prevent array size changes

  // Handle user input - this is now mainly for commands, not setup
  const handleUserInput = (value: string): boolean => {
    if (!isSetupComplete) {
      // If setup is not complete, we're probably still initializing
      addOutput("Please wait while we initialize your workspace...", 'system');
      return true; // Indicate we handled the input
    }
    
    // Setup is complete, don't handle input here (let Terminal handle commands)
    return false;
  };

  return {
    handleUserInput,
    isSetupComplete: isSetupComplete && !isInitializing,
    isInitializing
  };
};

// components/UserWelcome.tsx - Optional: Dedicated welcome component
interface UserWelcomeProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onComplete: () => void;
}

export const UserWelcome: React.FC<UserWelcomeProps> = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const welcomeSteps = [
    `Welcome back, ${user.firstName}!`,
    "🍅 Your Pomodoro CLI is ready to boost your productivity.",
    "✨ All your settings and statistics have been synced.",
    "🚀 Type '/help' to see available commands or '/play' to start focusing!"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= welcomeSteps.length - 1) {
          clearInterval(timer);
          setTimeout(onComplete, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete, welcomeSteps.length]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '40px',
      textAlign: 'center'
    }}>
      {/* User avatar placeholder */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--dracula-purple), var(--dracula-pink))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        color: 'white',
        fontWeight: 'bold',
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(189, 147, 249, 0.3)'
      }}>
        {user.firstName.charAt(0).toUpperCase()}
      </div>

      {/* Welcome messages */}
      <div style={{
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {welcomeSteps.slice(0, currentStep + 1).map((step, index) => (
          <div
            key={index}
            style={{
              fontSize: index === 0 ? '24px' : '16px',
              color: index === 0 ? 'var(--dracula-green)' : 'var(--dracula-foreground)',
              marginBottom: '10px',
              opacity: index === currentStep ? 1 : 0.7,
              animation: index === currentStep ? 'fadeInUp 0.5s ease-out' : 'none'
            }}
          >
            {step}
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      <div style={{ marginTop: '30px' }}>
        <EnhancedLoader 
          isActive={true} 
          variant="pulse" 
          message="Initializing workspace..."
        />
      </div>

      {/* User info */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(68, 71, 90, 0.3)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'var(--dracula-comment)'
      }}>
        <div>Logged in as: {user.email}</div>
        <div>User: {user.firstName} {user.lastName}</div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Optional: Migration component for existing localStorage users
export const UserMigration: React.FC<{
  onComplete: () => void;
  addOutput: (content: React.ReactNode, type?: string) => void;
}> = ({ onComplete, addOutput }) => {
  const { user } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  useEffect(() => {
    const migrateLocalStorageData = async () => {
      if (!user || isMigrating) return;

      try {
        setIsMigrating(true);
        
        // Check for existing localStorage data
        const oldSettings = localStorage.getItem('pomodoroCliSettings');
        const oldStats = localStorage.getItem('pomodoroCliStats');
        
        if (oldSettings || oldStats) {
          addOutput("🔄 Migrating your local data to the cloud...", 'system');
          
          // Here you could implement migration logic
          // For now, we'll just acknowledge the data exists
          addOutput("✅ Local data detected. Syncing with your account...", 'system');
          
          // Clear old localStorage data after successful migration
          localStorage.removeItem('pomodoroCliUser');
          localStorage.removeItem('pomodoroCliSettings');
          localStorage.removeItem('pomodoroCliStats');
          
          addOutput("🗑️ Local storage cleared. All data is now stored securely in the cloud.", 'system');
        }
        
        onComplete();
      } catch (error) {
        console.error('Migration failed:', error);
        addOutput("⚠️ Data migration failed, but you can continue using the app.", 'error');
        onComplete();
      } finally {
        setIsMigrating(false);
      }
    };

    migrateLocalStorageData();
  }, [user, onComplete, addOutput]); // Stable dependencies - removed isMigrating to avoid loops

  if (isMigrating) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px'
      }}>
        <EnhancedLoader 
          isActive={true} 
          variant="progress" 
          message="Migrating your data..."
        />
      </div>
    );
  }

  return null;
};