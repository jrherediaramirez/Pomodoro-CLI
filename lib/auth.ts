// lib/auth.ts
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<AuthUser> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update the user profile with display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      return {
        uid: user.uid,
        email: user.email!,
        firstName,
        lastName
      };
    } catch (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Parse name from displayName or use defaults
      const displayName = user.displayName || '';
      const [firstName = 'User', lastName = ''] = displayName.split(' ');

      return {
        uid: user.uid,
        email: user.email!,
        firstName,
        lastName
      };
    } catch (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  },

  // Convert Firebase User to AuthUser
  mapFirebaseUser(user: User): AuthUser {
    const displayName = user.displayName || '';
    const [firstName = 'User', lastName = ''] = displayName.split(' ');

    return {
      uid: user.uid,
      email: user.email!,
      firstName,
      lastName
    };
  }
};