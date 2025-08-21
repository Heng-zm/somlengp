import { 
  User, 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  reauthenticateWithPopup
} from 'firebase/auth';
import { googleProvider } from './firebase';

/**
 * Determines if the user signed in with email/password
 */
export function isEmailPasswordUser(user: User): boolean {
  return user.providerData.some(provider => provider.providerId === 'password');
}

/**
 * Determines if the user signed in with Google
 */
export function isGoogleUser(user: User): boolean {
  return user.providerData.some(provider => provider.providerId === 'google.com');
}

/**
 * Gets the primary authentication provider for the user
 */
export function getPrimaryAuthProvider(user: User): string {
  if (user.providerData.length > 0) {
    return user.providerData[0].providerId;
  }
  return 'unknown';
}

/**
 * Reauthenticates a user with their email and password
 */
export async function reauthenticateWithPassword(user: User, password: string): Promise<void> {
  if (!user.email) {
    throw new Error('User email is required for password reauthentication');
  }

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

/**
 * Reauthenticates a user with Google
 */
export async function reauthenticateWithGoogle(user: User): Promise<void> {
  try {
    // Try popup first
    if (!googleProvider) {
      throw new Error('Google provider not initialized.');
    }
    await reauthenticateWithPopup(user, googleProvider);
  } catch (error: unknown) {
    // If popup fails, provide more context
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups and try again.');
    } else if (firebaseError.code === 'auth/popup-closed-by-user') {
      throw new Error('Authentication popup was closed. Please try again.');
    }
    throw error;
  }
}

/**
 * Reauthenticates a user based on their authentication provider
 */
export async function reauthenticateUser(user: User, password?: string): Promise<void> {
  if (isEmailPasswordUser(user)) {
    if (!password) {
      throw new Error('Password is required for email/password users');
    }
    await reauthenticateWithPassword(user, password);
  } else if (isGoogleUser(user)) {
    await reauthenticateWithGoogle(user);
  } else {
    throw new Error(`Unsupported authentication provider: ${getPrimaryAuthProvider(user)}`);
  }
}

/**
 * Checks if a user needs recent authentication for sensitive operations
 * Firebase requires recent authentication for operations like account deletion
 */
export function needsRecentAuth(): boolean {
  // Firebase typically requires authentication within the last 5 minutes for sensitive operations
  // However, since we can't directly check this, we'll always require reauthentication for safety
  return true;
}

/**
 * Gets user-friendly error messages for authentication errors
 */
export function getAuthErrorMessage(error: unknown): string {
  const firebaseError = error as { code?: string; message?: string };
  switch (firebaseError.code) {
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/user-not-found':
      return 'User account not found.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/requires-recent-login':
      return 'For security reasons, please sign in again to continue.';
    case 'auth/popup-blocked':
      return 'Popup was blocked. Please allow popups and try again.';
    case 'auth/popup-closed-by-user':
      return 'Authentication popup was closed. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Authentication was cancelled. Please try again.';
    default:
      return firebaseError.message || 'Authentication failed. Please try again.';
  }
}
