"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { createUserProfile, getUserProfile, updateLastSignInTime } from '@/lib/user-profile';
import { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (useRedirect?: boolean) => Promise<void>;
  logout: () => Promise<void>;
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
        console.warn('Auth state timeout - setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', { user: user ? 'logged in' : 'not logged in', uid: user?.uid });
      setUser(user);
      
      if (user) {
        try {
          // Check if user profile exists
          let profile = await getUserProfile(user.uid);
          
          if (!profile) {
            // Create new user profile
            console.log('Creating new user profile for:', user.uid);
            profile = await createUserProfile(user);
          } else {
            // Update last sign-in time
            console.log('Updating last sign-in time for:', user.uid);
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
      console.log('Auth state fallback timeout triggered');
      setLoading(false);
    }, 5000);

    // Handle redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Redirect sign-in successful:', result.user.uid);
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
    console.log('SignInWithGoogle called:', { useRedirect, loading });
    
    try {
      setLoading(true);
      console.log('Firebase auth object:', auth);
      console.log('Google provider:', googleProvider);
      
      if (useRedirect) {
        console.log('Using redirect method...');
        // Use redirect method as fallback
        await signInWithRedirect(auth, googleProvider);
        // Note: The page will redirect, so success toast will be shown after redirect
      } else {
        console.log('Using popup method...');
        // Try popup method first
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Popup sign-in successful:', result.user.uid);
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

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    logout
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
