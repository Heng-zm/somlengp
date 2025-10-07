import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { errorHandler, AuthError, NetworkError, ValidationError, validateInput, commonValidations, handleNetworkRequest, createRetryFunction } from './error-utils';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

/**
 * Determines if the user signed in with email/password
 */
export function isEmailPasswordUser(user: User): boolean {
  try {
    if (!user || typeof user !== 'object') {
      throw new ValidationError('Invalid user object provided');
    }
    // In Supabase, check app_metadata.provider or user_metadata for auth method
    const provider = user.app_metadata?.provider;
    return provider === 'email' || !provider; // Default to email if no provider specified
  } catch (error) {
    errorHandler.handle(error, { function: 'isEmailPasswordUser', userId: user?.id });
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
    // In Supabase, check app_metadata.provider for Google OAuth
    return user.app_metadata?.provider === 'google';
  } catch (error) {
    errorHandler.handle(error, { function: 'isGoogleUser', userId: user?.id });
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
    // In Supabase, get provider from app_metadata
    return user.app_metadata?.provider || 'email';
  } catch (error) {
    errorHandler.handle(error, { function: 'getPrimaryAuthProvider', userId: user?.id });
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
        condition: (u: unknown): u is object => {
          return u != null && typeof u === 'object' && 'id' in u && typeof (u as any).id === 'string';
        },
        message: 'Invalid user object',
        userMessage: 'Authentication failed due to invalid user data'
      }
    ], { function: 'reauthenticateWithPassword' });
    validateInput(password, [
      commonValidations.required('Password is required for reauthentication'),
      commonValidations.string('Password must be a string'),
      {
        condition: (val: unknown) => typeof val === 'string' && val.length >= 6,
        message: 'Password must be at least 6 characters',
        userMessage: 'Password must be at least 6 characters'
      }
    ], { function: 'reauthenticateWithPassword' });
    if (!user.email || typeof user.email !== 'string') {
      throw new AuthError('User email is required for password reauthentication', {
        userId: user.id,
        hasEmail: !!user.email
      });
    }
    // In Supabase, reauthentication is done by signing in again
    const reauthenticateWithRetry = createRetryFunction(
      async () => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Reauthentication timeout')), 30000)
        );
        const authPromise = supabase.auth.signInWithPassword({
          email: user.email!,
          password: password
        });
        const result = await Promise.race([authPromise, timeoutPromise]) as any;
        if (result && typeof result === 'object' && 'error' in result && result.error) {
          throw new Error(result.error.message);
        }
        return result;
      },
      {
        maxAttempts: 3,
        baseDelay: 1000
      }
    );
    await handleNetworkRequest(reauthenticateWithRetry, { 
      operation: 'reauthenticateWithPassword',
      userId: user.id 
    });
  } catch (error) {
    const authError = new AuthError(
      'Failed to reauthenticate with password',
      { 
        originalError: error instanceof Error ? error.message : 'Unknown error',
        userId: user?.id,
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
        condition: (u: unknown): u is object => {
          return u != null && typeof u === 'object' && 'id' in u && typeof (u as any).id === 'string';
        },
        message: 'Invalid user object',
        userMessage: 'Authentication failed due to invalid user data'
      }
    ], { function: 'reauthenticateWithGoogle' });
    
    // Check if popups are supported/allowed
    if (typeof window !== 'undefined' && !window.open) {
      throw new AuthError(
        'Popup functionality not supported',
        { userId: user.id },
        'Your browser does not support popup authentication. Please try a different browser.'
      );
    }
    
    // Execute with timeout and retry
    const reauthenticateWithRetry = createRetryFunction(
      async () => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Google reauthentication timeout')), 60000)
        );
        const authPromise = supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback`
          }
        });
        const result = await Promise.race([authPromise, timeoutPromise]) as any;
        if (result && typeof result === 'object' && 'error' in result && result.error) {
          throw new Error(result.error.message);
        }
        return result;
      },
      {
        maxAttempts: 2, // max attempts (fewer for popups)
        baseDelay: 2000
      }
    );
    
    await handleNetworkRequest(reauthenticateWithRetry, { 
      operation: 'reauthenticateWithGoogle',
      userId: user.id 
    });
  } catch (error: unknown) {
    // Enhanced error handling for Google auth
    const supabaseError = error as { message?: string };
    let userMessage: string;
    const message = supabaseError.message || '';
    
    if (message.toLowerCase().includes('popup')) {
      userMessage = 'Popup was blocked by your browser. Please allow popups for this site and try again.';
    } else if (message.toLowerCase().includes('network')) {
      userMessage = 'Network error occurred. Please check your internet connection and try again.';
    } else if (message.toLowerCase().includes('timeout')) {
      userMessage = 'Request timed out. Please try again.';
    } else {
      userMessage = 'Google authentication failed. Please try again or contact support.';
    }
    
    const authError = new AuthError(
      'Failed to reauthenticate with Google',
      {
        originalError: supabaseError.message || 'Unknown error',
        userId: user?.id,
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
        condition: (u: unknown): u is object => {
          return u != null && typeof u === 'object' && 'id' in u && typeof (u as any).id === 'string';
        },
        message: 'Invalid user object',
        userMessage: 'Authentication failed due to invalid user data'
      }
    ], { function: 'reauthenticateUser' });
    const primaryProvider = getPrimaryAuthProvider(user);
    if (isEmailPasswordUser(user)) {
      if (!password || typeof password !== 'string') {
        throw new AuthError(
          'Password is required for email/password users',
          { userId: user.id, provider: primaryProvider },
          'Please provide your password to continue with this operation.'
        );
      }
      await reauthenticateWithPassword(user, password);
    } else if (isGoogleUser(user)) {
      await reauthenticateWithGoogle(user);
    } else {
      throw new AuthError(
        `Unsupported authentication provider: ${primaryProvider}`,
        { userId: user.id, provider: primaryProvider },
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
        userId: user?.id,
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
 * Supabase requires recent authentication for operations like account deletion
 */
export function needsRecentAuth(user?: User, operationType?: string): boolean {
  try {
    // Supabase typically requires authentication within the last 5 minutes for sensitive operations
    // For extra safety, we always require reauthentication for sensitive operations
    // Log for monitoring purposes
    if (user && operationType) {
    }
    // Always require recent authentication for safety
    return true;
  } catch (error) {
    errorHandler.handle(error, { 
      function: 'needsRecentAuth', 
      userId: user?.id,
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
    const supabaseError = error as { message?: string };
    const message = supabaseError.message || (error instanceof Error ? error.message : '');
    
    // Handle common Supabase Auth error messages
    if (message.toLowerCase().includes('invalid login credentials')) {
      return 'Incorrect email or password. Please check your credentials and try again.';
    }
    if (message.toLowerCase().includes('user not found')) {
      return 'No account found with this email address. Please check the email or create a new account.';
    }
    if (message.toLowerCase().includes('invalid email')) {
      return 'Invalid email address format. Please enter a valid email address.';
    }
    if (message.toLowerCase().includes('email not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }
    if (message.toLowerCase().includes('too many requests')) {
      return 'Too many failed attempts. Please wait a few minutes before trying again.';
    }
    if (message.toLowerCase().includes('network')) {
      return 'Network connection failed. Please check your internet connection and try again.';
    }
    if (message.toLowerCase().includes('signup is disabled')) {
      return 'New account creation is temporarily disabled. Please contact support.';
    }
    if (message.toLowerCase().includes('email already registered')) {
      return 'An account with this email address already exists. Please use a different email or sign in.';
    }
    if (message.toLowerCase().includes('weak password')) {
      return 'Password is too weak. Please choose a stronger password.';
    }
    if (message.toLowerCase().includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    if (message.toLowerCase().includes('permission')) {
      return 'Permission denied. Please check your account permissions.';
    }
    if (message.toLowerCase().includes('popup')) {
      return 'Popup was blocked by your browser. Please allow popups for this site and try again.';
    }
    if (message.toLowerCase().includes('oauth')) {
      return 'OAuth authentication failed. Please try again or use a different sign-in method.';
    }
    
    return message || 'Authentication failed. Please try again or contact support if the problem persists.';
  } catch (processingError) {
    errorHandler.handle(processingError, { 
      function: 'getAuthErrorMessage',
      originalError: error 
    });
    return 'An error occurred while processing the authentication error. Please try again.';
  }
}
