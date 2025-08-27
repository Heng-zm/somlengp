import { 
  User, 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  reauthenticateWithPopup
} from 'firebase/auth';
import { googleProvider } from './firebase';
import { errorHandler, AuthError, NetworkError, ValidationError, validateInput, commonValidations, handleNetworkRequest, createRetryFunction } from './error-utils';

/**
 * Determines if the user signed in with email/password
 */
export function isEmailPasswordUser(user: User): boolean {
  try {
    if (!user || typeof user !== 'object') {
      throw new ValidationError('Invalid user object provided');
    }
    
    if (!Array.isArray(user.providerData)) {
      console.warn('User providerData is not an array, assuming false');
      return false;
    }
    
    return user.providerData.some(provider => 
      provider && provider.providerId === 'password'
    );
  } catch (error) {
    errorHandler.handle(error, { function: 'isEmailPasswordUser', userId: user?.uid });
    return false;
  }
}

/**
 * Determines if the user signed in with Google
 */
export function isGoogleUser(user: User): boolean {
  try {
    if (!user || typeof user !== 'object') {
      throw new ValidationError('Invalid user object provided');
    }
    
    if (!Array.isArray(user.providerData)) {
      console.warn('User providerData is not an array, assuming false');
      return false;
    }
    
    return user.providerData.some(provider => 
      provider && provider.providerId === 'google.com'
    );
  } catch (error) {
    errorHandler.handle(error, { function: 'isGoogleUser', userId: user?.uid });
    return false;
  }
}

/**
 * Gets the primary authentication provider for the user
 */
export function getPrimaryAuthProvider(user: User): string {
  try {
    if (!user || typeof user !== 'object') {
      throw new ValidationError('Invalid user object provided');
    }
    
    if (!Array.isArray(user.providerData)) {
      console.warn('User providerData is not an array, returning unknown');
      return 'unknown';
    }
    
    if (user.providerData.length > 0 && user.providerData[0]?.providerId) {
      return user.providerData[0].providerId;
    }
    
    return 'unknown';
  } catch (error) {
    errorHandler.handle(error, { function: 'getPrimaryAuthProvider', userId: user?.uid });
    return 'unknown';
  }
}

/**
 * Reauthenticates a user with their email and password
 */
export async function reauthenticateWithPassword(user: User, password: string): Promise<void> {
  try {
    // Validate inputs
    validateInput(user, [
      {
        condition: (u) => u && typeof u === 'object' && typeof u.uid === 'string',
        message: 'Invalid user object',
        userMessage: 'Authentication failed due to invalid user data'
      }
    ], { function: 'reauthenticateWithPassword' });
    
    validateInput(password, [
      commonValidations.required('Password is required for reauthentication'),
      commonValidations.string('Password must be a string'),
      commonValidations.minLength(6, 'Password must be at least 6 characters')
    ], { function: 'reauthenticateWithPassword' });
    
    if (!user.email || typeof user.email !== 'string') {
      throw new AuthError('User email is required for password reauthentication', {
        userId: user.uid,
        hasEmail: !!user.email
      });
    }
    
    // Create credential with timeout
    const credential = EmailAuthProvider.credential(user.email, password);
    
    // Execute with retry and timeout
    const reauthenticateWithRetry = createRetryFunction(
      async () => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Reauthentication timeout')), 30000)
        );
        
        const authPromise = reauthenticateWithCredential(user, credential);
        
        return Promise.race([authPromise, timeoutPromise]);
      },
      3, // max attempts
      1000 // base delay
    );
    
    await handleNetworkRequest(reauthenticateWithRetry, { 
      operation: 'reauthenticateWithPassword',
      userId: user.uid 
    });
  } catch (error) {
    const authError = new AuthError(
      'Failed to reauthenticate with password',
      { 
        originalError: error instanceof Error ? error.message : 'Unknown error',
        userId: user?.uid,
        operation: 'reauthenticateWithPassword'
      },
      getAuthErrorMessage(error)
    );
    errorHandler.handle(authError);
    throw authError;
  }
}

/**
 * Reauthenticates a user with Google
 */
export async function reauthenticateWithGoogle(user: User): Promise<void> {
  try {
    // Validate user input
    validateInput(user, [
      {
        condition: (u) => u && typeof u === 'object' && typeof u.uid === 'string',
        message: 'Invalid user object',
        userMessage: 'Authentication failed due to invalid user data'
      }
    ], { function: 'reauthenticateWithGoogle' });
    
    // Check if Google provider is available
    if (!googleProvider) {
      throw new AuthError(
        'Google provider not initialized',
        { userId: user.uid },
        'Google authentication is not properly configured. Please contact support.'
      );
    }
    
    // Check if popups are supported/allowed
    if (typeof window !== 'undefined' && !window.open) {
      throw new AuthError(
        'Popup functionality not supported',
        { userId: user.uid },
        'Your browser does not support popup authentication. Please try a different browser.'
      );
    }
    
    // Execute with timeout and retry
    const reauthenticateWithRetry = createRetryFunction(
      async () => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Google reauthentication timeout')), 60000)
        );
        
        const authPromise = reauthenticateWithPopup(user, googleProvider!);
        
        return Promise.race([authPromise, timeoutPromise]);
      },
      2, // max attempts (fewer for popups)
      2000 // base delay
    );
    
    await handleNetworkRequest(reauthenticateWithRetry, { 
      operation: 'reauthenticateWithGoogle',
      userId: user.uid 
    });
  } catch (error: unknown) {
    // Enhanced error handling for Google auth
    const firebaseError = error as { code?: string; message?: string };
    let userMessage: string;
    
    switch (firebaseError.code) {
      case 'auth/popup-blocked':
        userMessage = 'Popup was blocked by your browser. Please allow popups for this site and try again.';
        break;
      case 'auth/popup-closed-by-user':
        userMessage = 'Authentication popup was closed. Please try again and complete the Google sign-in process.';
        break;
      case 'auth/cancelled-popup-request':
        userMessage = 'Authentication was cancelled. Please try again.';
        break;
      case 'auth/network-request-failed':
        userMessage = 'Network error occurred. Please check your internet connection and try again.';
        break;
      case 'auth/too-many-requests':
        userMessage = 'Too many authentication attempts. Please wait a moment and try again.';
        break;
      default:
        userMessage = 'Google authentication failed. Please try again or contact support.';
    }
    
    const authError = new AuthError(
      'Failed to reauthenticate with Google',
      {
        originalError: firebaseError.message || 'Unknown error',
        errorCode: firebaseError.code,
        userId: user?.uid,
        operation: 'reauthenticateWithGoogle'
      },
      userMessage
    );
    
    errorHandler.handle(authError);
    throw authError;
  }
}

/**
 * Reauthenticates a user based on their authentication provider
 */
export async function reauthenticateUser(user: User, password?: string): Promise<void> {
  try {
    // Validate user input
    validateInput(user, [
      {
        condition: (u) => u && typeof u === 'object' && typeof u.uid === 'string',
        message: 'Invalid user object',
        userMessage: 'Authentication failed due to invalid user data'
      }
    ], { function: 'reauthenticateUser' });
    
    const primaryProvider = getPrimaryAuthProvider(user);
    
    if (isEmailPasswordUser(user)) {
      if (!password || typeof password !== 'string') {
        throw new AuthError(
          'Password is required for email/password users',
          { userId: user.uid, provider: primaryProvider },
          'Please provide your password to continue with this operation.'
        );
      }
      await reauthenticateWithPassword(user, password);
    } else if (isGoogleUser(user)) {
      await reauthenticateWithGoogle(user);
    } else {
      throw new AuthError(
        `Unsupported authentication provider: ${primaryProvider}`,
        { userId: user.uid, provider: primaryProvider },
        `Authentication with ${primaryProvider} is not supported for this operation. Please contact support.`
      );
    }
  } catch (error) {
    // If it's already an AuthError, re-throw it
    if (error instanceof AuthError) {
      throw error;
    }
    
    const authError = new AuthError(
      'Failed to reauthenticate user',
      {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        userId: user?.uid,
        operation: 'reauthenticateUser'
      },
      'Authentication failed. Please try again or contact support if the problem persists.'
    );
    
    errorHandler.handle(authError);
    throw authError;
  }
}

/**
 * Checks if a user needs recent authentication for sensitive operations
 * Firebase requires recent authentication for operations like account deletion
 */
export function needsRecentAuth(user?: User, operationType?: string): boolean {
  try {
    // Firebase typically requires authentication within the last 5 minutes for sensitive operations
    // For extra safety, we always require reauthentication for sensitive operations
    
    // Log for monitoring purposes
    if (user && operationType) {
      console.log(`Auth check for operation: ${operationType}, user: ${user.uid}`);
    }
    
    // Always require recent authentication for safety
    return true;
  } catch (error) {
    errorHandler.handle(error, { 
      function: 'needsRecentAuth', 
      userId: user?.uid,
      operationType 
    });
    
    // Default to requiring authentication on error
    return true;
  }
}

/**
 * Gets user-friendly error messages for authentication errors
 */
export function getAuthErrorMessage(error: unknown): string {
  try {
    if (!error) {
      return 'An unknown authentication error occurred.';
    }
    
    const firebaseError = error as { code?: string; message?: string };
    
    // Handle common Firebase Auth error codes with enhanced messages
    switch (firebaseError.code) {
      case 'auth/wrong-password':
        return 'Incorrect password. Please check your password and try again.';
      case 'auth/user-not-found':
        return 'No account found with this email address. Please check the email or create a new account.';
      case 'auth/invalid-email':
        return 'Invalid email address format. Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been temporarily disabled. Please contact support for assistance.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a few minutes before trying again.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Please check your internet connection and try again.';
      case 'auth/requires-recent-login':
        return 'For security reasons, please sign in again to continue with this action.';
      case 'auth/popup-blocked':
        return 'Popup was blocked by your browser. Please allow popups for this site and try again.';
      case 'auth/popup-closed-by-user':
        return 'Authentication popup was closed before completion. Please try again.';
      case 'auth/cancelled-popup-request':
        return 'Authentication was cancelled. Please try again when ready.';
      case 'auth/credential-already-in-use':
        return 'This account is already linked to another user. Please use a different account.';
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please use a different email or sign in.';
      case 'auth/operation-not-allowed':
        return 'This authentication method is not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/expired-action-code':
        return 'The action code has expired. Please request a new one.';
      case 'auth/invalid-action-code':
        return 'The action code is invalid. Please check the link and try again.';
      case 'auth/missing-android-pkg-name':
      case 'auth/missing-continue-uri':
      case 'auth/missing-ios-bundle-id':
      case 'auth/invalid-continue-uri':
        return 'Configuration error occurred. Please contact support.';
      case 'auth/quota-exceeded':
        return 'Service temporarily unavailable due to high demand. Please try again later.';
      case 'auth/timeout':
        return 'Request timed out. Please check your connection and try again.';
      case 'auth/internal-error':
        return 'An internal error occurred. Please try again or contact support.';
      default:
        // Try to extract meaningful message from the error
        const message = firebaseError.message || (error instanceof Error ? error.message : '');
        
        if (message.toLowerCase().includes('network')) {
          return 'Network connection error. Please check your internet connection and try again.';
        }
        if (message.toLowerCase().includes('timeout')) {
          return 'Request timed out. Please try again.';
        }
        if (message.toLowerCase().includes('permission')) {
          return 'Permission denied. Please check your account permissions.';
        }
        
        return message || 'Authentication failed. Please try again or contact support if the problem persists.';
    }
  } catch (processingError) {
    errorHandler.handle(processingError, { 
      function: 'getAuthErrorMessage',
      originalError: error 
    });
    
    return 'An error occurred while processing the authentication error. Please try again.';
  }
}
