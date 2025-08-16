"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, deleteUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { createUserProfile, getUserProfile, updateLastSignInTime, deleteUserProfile } from '@/lib/user-profile';
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
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
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
          toast({
            title: "Success",
            description: "Successfully signed in with Google!",
          });
        }
      })
      .catch((error) => {
        console.error('Redirect sign-in error:', {
          code: error.code,
          message: error.message,
          details: error
        });
        toast({
          title: "Error",
          description: "Failed to complete sign-in. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        // Ensure loading is set to false even if redirect result fails
        setTimeout(() => setLoading(false), 1000);
      });

    return () => {
      clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, [toast]);

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
        toast({
          title: "Success",
          description: "Successfully signed in with Google!",
        });
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
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      
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
      toast({
        title: "Success",
        description: "Successfully signed in!",
      });
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
      
      toast({
        title: "Sign In Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error; // Re-throw for form handling
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
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
      
      toast({
        title: "Sign Up Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error; // Re-throw for form handling
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Sent",
        description: "Check your email for password reset instructions.",
      });
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
      
      toast({
        title: "Reset Password Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error; // Re-throw for form handling
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      toast({
        title: "Success",
        description: "Successfully signed out!",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user is currently signed in.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // First delete the user profile from Firestore
      try {
        await deleteUserProfile(user.uid);
      } catch (firestoreError) {
        console.error('Error deleting user profile from Firestore:', firestoreError);
        // Continue with auth deletion even if Firestore deletion fails
      }
      
      // Then delete the user from Firebase Auth
      await deleteUser(user);
      
      toast({
        title: "Success",
        description: "Your account has been permanently deleted.",
      });
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      console.error('Error deleting account:', error);
      
      let errorMessage = "Failed to delete account. Please try again.";
      
      if (authError.code === 'auth/requires-recent-login') {
        errorMessage = "For security reasons, please sign out and sign in again before deleting your account.";
      } else if (authError.code === 'auth/user-not-found') {
        errorMessage = "User account not found.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
