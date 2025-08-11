"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: (useRedirect?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', { user: user ? 'logged in' : 'not logged in', uid: user?.uid });
      setUser(user);
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
      
      if (authError.code === 'auth/popup-blocked') {
        errorMessage = "Popup blocked. Trying redirect method...";
        suggestRedirect = true;
      } else if (authError.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (authError.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized. Please check Firebase configuration.";
      } else if (authError.code === 'auth/invalid-api-key') {
        errorMessage = "Invalid API key. Please check Firebase configuration.";
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
