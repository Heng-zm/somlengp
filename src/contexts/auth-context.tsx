"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase';
import { 
  showSuccessToast, 
  showAuthSuccessToast, 
  showAuthErrorToast 
} from '@/lib/toast-utils';
import { createUserProfile, getUserProfile, updateLastSignInTime, deleteUserProfile } from '@/lib/user-profile-db';
import { UserProfile } from '@/lib/types';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
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
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await handleUserProfile(session.user);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          await handleUserProfile(session.user);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Fallback timeout
    const fallbackTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleUserProfile = async (user: User) => {
    try {
      // Check if user profile exists
      let profile = await getUserProfile(user.id);
      if (!profile) {
        // Create new user profile
        profile = await createUserProfile(user);
      } else {
        // Update last sign-in time
        await updateLastSignInTime(user.id);
      }
      setUserProfile(profile);
    } catch (error) {
      console.error('Error managing user profile:', error);
      setUserProfile(null);
    }
  };
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Note: with OAuth, the user will be redirected
      // Success handling will happen after redirect
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Error signing in with Google:', error);
      
      let errorMessage = "Failed to sign in with Google. Please try again.";
      
      if (authError.message?.includes('popup')) {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (authError.message?.includes('unauthorized')) {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
        errorMessage = `Domain '${currentDomain}' is not authorized. Please add it to your Supabase project settings.`;
      }
      
      showAuthErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      showAuthSuccessToast("signed in");
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Error signing in with email:', error);
      
      let errorMessage = "Failed to sign in. Please check your credentials.";
      
      if (authError.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (authError.message?.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the confirmation link.";
      } else if (authError.message?.includes('Too many requests')) {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (authError.message?.includes('Invalid email')) {
        errorMessage = "Invalid email address format.";
      }
      
      showAuthErrorToast(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      // Create user profile after successful signup
      if (data.user) {
        try {
          await createUserProfile(data.user);
        } catch (profileError) {
          console.error('Error creating user profile during signup:', profileError);
          // Don't fail signup if profile creation fails
        }
      }
      
      showAuthSuccessToast("account created successfully");
      showSuccessToast("Check your email", "Please check your email to confirm your account.");
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Error signing up with email:', error);
      
      let errorMessage = "Failed to create account. Please try again.";
      
      if (authError.message?.includes('User already registered')) {
        errorMessage = "An account with this email address already exists.";
      } else if (authError.message?.includes('Invalid email')) {
        errorMessage = "Invalid email address format.";
      } else if (authError.message?.includes('Password should be')) {
        errorMessage = "Password is too weak. Please use at least 6 characters.";
      } else if (authError.message?.includes('Signup is disabled')) {
        errorMessage = "Account creation is currently disabled.";
      }
      
      showAuthErrorToast(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (error) {
        throw error;
      }
      
      showSuccessToast("Password Reset Sent", "Check your email for password reset instructions.");
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Error sending password reset email:', error);
      
      let errorMessage = "Failed to send password reset email.";
      
      if (authError.message?.includes('Invalid email')) {
        errorMessage = "Invalid email address format.";
      } else if (authError.message?.includes('rate limit')) {
        errorMessage = "Too many requests. Please try again later.";
      }
      
      showAuthErrorToast(errorMessage);
      throw error;
    }
  };
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      showSuccessToast("Successfully signed out!", "You have been safely logged out of your account.");
    } catch (error) {
      console.error('Error signing out:', error);
      showAuthErrorToast("Failed to sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const deleteAccount = async () => {
    if (!user) {
      showAuthErrorToast("No user is currently signed in.");
      return;
    }
    
    try {
      setLoading(true);
      
      // First delete the user profile from the database
      try {
        await deleteUserProfile(user.id);
      } catch (profileError) {
        console.error('Error deleting user profile from database:', profileError);
        // Continue with auth deletion even if profile deletion fails
      }
      
      // Delete the user from Supabase Auth
      // Note: This requires admin privileges, so we'll need to call an API route
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user account');
      }
      
      // Sign out the user
      await supabaseClient.auth.signOut();
      
      showSuccessToast("Account Deleted", "Your account has been permanently deleted.");
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Error deleting account:', error);
      
      let errorMessage = "Failed to delete account. Please try again.";
      
      if (authError.message?.includes('not found')) {
        errorMessage = "User account not found.";
      } else if (authError.message) {
        errorMessage = authError.message;
      }
      
      showAuthErrorToast(errorMessage);
      throw error;
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
