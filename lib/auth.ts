// lib/auth.ts - Enhanced with security features
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
  updateProfile,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { getFirebaseFirestore, getFirebaseAuth } from './firebase';
import { commandRateLimiter } from './validation';

export interface AuthUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
}

// Password strength validation
export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Password should be at least 8 characters long');

  if (password.length >= 12) score++;
  else feedback.push('Consider using 12+ characters for better security');

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('Use both uppercase and lowercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Include at least one number');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('Include at least one special character');

  // Check against common patterns
  const commonPatterns = [
    /^(.)\1+$/, // All same character
    /123456|abcdef|qwerty/i, // Common sequences
    /password|admin|user|test/i // Common words
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common patterns and words');
  }

  return { score, feedback };
};

// Secure user name validation
const validateUserName = (name: string): boolean => {
  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']{1,50}$/;
  return nameRegex.test(name.trim());
};

export const authService = {
  // Enhanced sign up with email verification
  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<AuthUser> {
    try {
      // Rate limiting
      if (!commandRateLimiter.isAllowed(`signup:${email}`)) {
        throw new Error('Too many signup attempts. Please try again later.');
      }

      // Validate input
      if (!validateUserName(firstName) || !validateUserName(lastName)) {
        throw new Error('Invalid name format. Only letters, spaces, hyphens, and apostrophes allowed.');
      }

      // Validate password strength
      const passwordStrength = validatePasswordStrength(password);
      if (passwordStrength.score < 2) {
        throw new Error(`Password too weak: ${passwordStrength.feedback.join(', ')}`);
      }

      const userCredential: UserCredential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      const user = userCredential.user;
      
      // Update profile
      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`
      });

      // Send email verification
      await sendEmailVerification(user);

      return {
        uid: user.uid,
        email: user.email!,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailVerified: user.emailVerified
      };
    } catch (error) {
      if (error instanceof Error) {
        // Don't expose internal Firebase errors
        if (error.message.includes('email-already-in-use')) {
          throw new Error('An account with this email already exists.');
        }
        if (error.message.includes('invalid-email')) {
          throw new Error('Please enter a valid email address.');
        }
        if (error.message.includes('weak-password')) {
          throw new Error('Password is too weak. Please choose a stronger password.');
        }
        throw error; // Re-throw our custom errors
      }
      throw new Error('Sign up failed. Please try again.');
    }
  },

  // Enhanced sign in with rate limiting
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      // Rate limiting
      if (!commandRateLimiter.isAllowed(`signin:${email}`)) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      const userCredential: UserCredential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      const user = userCredential.user;
      
      const displayName = user.displayName || '';
      const [firstName = 'User', lastName = ''] = displayName.split(' ');

      return {
        uid: user.uid,
        email: user.email!,
        firstName,
        lastName,
        emailVerified: user.emailVerified
      };
    } catch (error) {
      if (error instanceof Error) {
        // Generic error message to prevent user enumeration
        if (error.message.includes('user-not-found') || 
            error.message.includes('wrong-password') ||
            error.message.includes('invalid-credential')) {
          throw new Error('Invalid email or password.');
        }
        if (error.message.includes('too-many-requests')) {
          throw new Error('Too many failed attempts. Please try again later.');
        }
        throw error;
      }
      throw new Error('Sign in failed. Please try again.');
    }
  },

  // Secure password change
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const auth = getFirebaseAuth(); // Get the auth instance
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user found.');
      }

      // Validate new password strength
      const passwordStrength = validatePasswordStrength(newPassword);
      if (passwordStrength.score < 2) {
        throw new Error(`New password too weak: ${passwordStrength.feedback.join(', ')}`);
      }

      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('wrong-password')) {
          throw new Error('Current password is incorrect.');
        }
        throw error;
      }
      throw new Error('Failed to change password.');
    }
  },

  // Sign out with cleanup
  async signOut(): Promise<void> {
    try {
      await signOut(getFirebaseAuth());
      // Clear any sensitive data from memory/storage
      if (typeof window !== 'undefined') {
        // Clear any cached data
        localStorage.removeItem('pomodoro-cache');
        sessionStorage.clear();
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Sign out failed.');
    }
  },

  // Convert Firebase User to AuthUser with security checks
  mapFirebaseUser(user: User): AuthUser {
    const displayName = user.displayName || '';
    const [firstName = 'User', lastName = ''] = displayName.split(' ');

    return {
      uid: user.uid,
      email: user.email!,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emailVerified: user.emailVerified
    };
  },

  // Check if user email is verified
  isEmailVerified(): boolean {
    const auth = getFirebaseAuth(); // Get the auth instance
    return auth.currentUser?.emailVerified ?? false;
  },

  // Resend email verification
  async resendEmailVerification(): Promise<void> {
    try {
      const auth = getFirebaseAuth(); // Get the auth instance
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found.');
      }
      await sendEmailVerification(user);
    } catch (error) {
      throw new Error('Failed to send verification email.');
    }
  }
};