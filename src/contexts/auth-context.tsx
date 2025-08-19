"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, deleteUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, reauthenticateWithCredential, EmailAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { 
  showSuccessToast, 
  showAuthSuccessToast, 
  showAuthErrorToast 
} from '@/lib/toast-utils';
import { createUserProfile, getUserProfile, updateLastSignInTime, deleteUserProfile } from '@/lib/user-profile';
import { isEmailPasswordUser, isGoogleUser } from '@/lib/auth-utils';
import { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (useRedirect?: boolean) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Check if user profile exists
          let profile = await getUserProfile(user.uid);
          
          if (!profile) {
            // Create new user profile
            profile = await createUserProfile(user);
          } else {
            // Update last sign-in time
            await updateLastSignInTime(user.uid);
          }
          
          setUserProfile(profile);
        } catch (error) {
          console.error('Error managing user profile:', error);
          // Don't block auth if profile creation fails
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });
    
    // Fallback in case auth state never changes
    const fallbackTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Handle redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          showAuthSuccessToast("signed in with Google");
        }
      })
      .catch((error) => {
        console.error('Redirect sign-in error:', {
          code: error.code,
          message: error.message,
          details: error
        });
        showAuthErrorToast("Failed to complete sign-in. Please try again.");
      })
      .finally(() => {
        // Ensure loading is set to false even if redirect result fails
        setTimeout(() => setLoading(false), 1000);
      });

    return () => {
      clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (useRedirect = false) => {
    try {
      setLoading(true);
      
      if (useRedirect) {
        // Use redirect method as fallback
        await signInWithRedirect(auth, googleProvider);
        // Note: The page will redirect, so success toast will be shown after redirect
      } else {
        // Try popup method first
        await signInWithPopup(auth, googleProvider);
        showAuthSuccessToast("signed in with Google");
      }
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      console.error('Error signing in with Google:', error);
      console.error('Error code:', authError.code);
      console.error('Error message:', authError.message);
      
      let errorMessage = "Failed to sign in with Google. Please try again.";
      let suggestRedirect = false;
      
      // Enhanced error handling for production issues
      if (authError.code === 'auth/popup-blocked') {
        errorMessage = "Popup blocked. Trying redirect method...";
        suggestRedirect = true;
      } else if (authError.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (authError.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
        errorMessage = `Domain '${currentDomain}' is not authorized. Please add it to Firebase Console > Authentication > Settings > Authorized domains.`;
        console.error('🚨 DOMAIN NOT AUTHORIZED:', {
          currentDomain,
          authDomain: auth.config.authDomain,
          instructions: 'Add this domain to Firebase Console > Authentication > Settings > Authorized domains'
        });
      } else if (authError.code === 'auth/invalid-api-key') {
        errorMessage = "Invalid API key. Please check Firebase configuration.";
        console.error('🚨 INVALID API KEY:', {
          message: 'Check environment variables in your deployment platform',
          currentKey: auth.config.apiKey?.substring(0, 10) + '...'
        });
      } else if (authError.code === 'auth/operation-not-allowed') {
        errorMessage = "Google sign-in is not enabled. Please enable it in Firebase Console.";
        console.error('🚨 GOOGLE SIGN-IN NOT ENABLED:', {
          instructions: 'Go to Firebase Console > Authentication > Sign-in method > Google'
        });
      } else if (authError.code === 'auth/invalid-oauth-client-id') {
        errorMessage = "OAuth client configuration error. Please check Google Cloud Console.";
        console.error('🚨 OAUTH CLIENT ERROR:', {
          instructions: 'Check Google Cloud Console > APIs & Services > Credentials'
        });
      } else if (authError.message && authError.message.includes('invalid')) {
        errorMessage = "OAuth configuration error. Please check Google Cloud Console settings.";
      }
      
      showAuthErrorToast(errorMessage);
      
      // Auto-retry with redirect if popup was blocked
      if (suggestRedirect && !useRedirect) {
        setTimeout(() => signInWithGoogle(true), 2000);
        return;
      }
    } finally {
      if (!useRedirect) {
        setLoading(false);
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      showAuthSuccessToast("signed in");
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      console.error('Error signing in with email:', error);
      
      let errorMessage = "Failed to sign in. Please check your credentials.";
      
      if (authError.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (authError.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format.";
      } else if (authError.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled.";
      } else if (authError.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (authError.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
      }
      
      showAuthErrorToast(errorMessage);
      
      throw error; // Re-throw for form handling
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      showAuthSuccessToast("created account");
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      console.error('Error signing up with email:', error);
      
      let errorMessage = "Failed to create account. Please try again.";
      
      if (authError.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email address already exists.";
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format.";
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please use at least 6 characters.";
      } else if (authError.code === 'auth/operation-not-allowed') {
        errorMessage = "Email/password sign-up is not enabled.";
      } else if (authError.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
      }
      
      showAuthErrorToast(errorMessage);
      
      throw error; // Re-throw for form handling
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showSuccessToast("Password Reset Sent", "Check your email for password reset instructions.");
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      console.error('Error sending password reset email:', error);
      
      let errorMessage = "Failed to send password reset email.";
      
      if (authError.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format.";
      } else if (authError.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again later.";
      }
      
      showAuthErrorToast(errorMessage);
      
      throw error; // Re-throw for form handling
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      showSuccessToast("Successfully signed out!", "You have been safely logged out of your account.");
    } catch (error) {
      console.error('Error signing out:', error);
      showAuthErrorToast("Failed to sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (password?: string) => {
    if (!user) {
      showAuthErrorToast("No user is currently signed in.");
      return;
    }

    try {
      setLoading(true);
      
      // If user is an email/password user, require password for reauthentication
      if (isEmailPasswordUser(user) && !password) {
        throw new Error("Password is required to delete your account.");
      }
      
      // Reauthenticate the user before deleting account
      try {
        if (isEmailPasswordUser(user)) {
          // For email/password users, reauthenticate with password
          if (!password) {
            throw new Error('Password is required to delete your account.');
          }
          if (user.email) {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
          }
        } else if (isGoogleUser(user)) {
          // For Google users, reauthenticate with popup
          await reauthenticateWithPopup(user, googleProvider);
        } else {
          // For other providers, still attempt basic reauthentication
          console.warn('Unsupported provider for reauthentication:', user.providerData[0]?.providerId);
        }
      } catch (reAuthError: unknown) {
        console.error('Reauthentication failed:', reAuthError);
        
        // Provide better error messages for different auth errors
        const authError = reAuthError as { code?: string; message?: string };
        if (authError.code === 'auth/popup-blocked') {
          throw new Error('Popup was blocked. Please allow popups and try again.');
        } else if (authError.code === 'auth/popup-closed-by-user') {
          throw new Error('Authentication popup was closed. Please try again.');
        } else if (authError.code === 'auth/wrong-password') {
          throw new Error('Incorrect password. Please try again.');
        }
        
        throw reAuthError; // Throw to be caught in outer catch block
      }
      
      // First delete the user profile from Firestore
      try {
        await deleteUserProfile(user.uid);
      } catch (firestoreError) {
        console.error('Error deleting user profile from Firestore:', firestoreError);
        // Continue with auth deletion even if Firestore deletion fails
      }
      
      // Then delete the user from Firebase Auth
      await deleteUser(user);
      
      showSuccessToast("Account Deleted", "Your account has been permanently deleted.");
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      console.error('Error deleting account:', error);
      
      let errorMessage = "Failed to delete account. Please try again.";
      
      if (authError.code === 'auth/requires-recent-login') {
        errorMessage = "For security reasons, please provide your password again to delete your account.";
      } else if (authError.code === 'auth/user-not-found') {
        errorMessage = "User account not found.";
      } else if (authError.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (authError.message) {
        errorMessage = authError.message;
      }
      
      showAuthErrorToast(errorMessage);
      throw error; // Re-throw to handle in the component
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logout,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
