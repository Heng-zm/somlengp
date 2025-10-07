/**
 * Supabase User Utility Helpers
 * 
 * This file provides utility functions to safely access Supabase User properties
 * and maintain compatibility with the existing codebase that was using Firebase.
 */

import type { User } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase';

/**
 * Get display name from Supabase User
 */
export function getDisplayName(user: User | null): string {
  if (!user) return 'User';
  return user.user_metadata?.full_name || 
         user.user_metadata?.name || 
         user.email?.split('@')[0] || 
         'User';
}

/**
 * Get user photo URL from Supabase User
 */
export function getPhotoURL(user: User | null): string | null {
  if (!user) return null;
  return user.user_metadata?.avatar_url || 
         user.user_metadata?.picture || 
         null;
}

/**
 * Get user initial for avatar fallback
 */
export function getUserInitial(user: User | null): string {
  if (!user) return 'U';
  const displayName = getDisplayName(user);
  return displayName.charAt(0).toUpperCase();
}

/**
 * Get user initials (first + last name)
 */
export function getUserInitials(user: User | null): string {
  if (!user) return 'U';
  const displayName = getDisplayName(user);
  const parts = displayName.split(' ');
  if (parts.length >= 2) {
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
  }
  return displayName.charAt(0).toUpperCase();
}

/**
 * Check if user email is verified
 */
export function isEmailVerified(user: User | null): boolean {
  return !!user?.email_confirmed_at;
}

/**
 * Get user creation time
 */
export function getCreationTime(user: User | null): Date | null {
  if (!user?.created_at) return null;
  return new Date(user.created_at);
}

/**
 * Get account creation date (alias for getCreationTime for backwards compatibility)
 */
export function getAccountCreationDate(user: User | null): Date | null {
  return getCreationTime(user);
}

/**
 * Get last sign in time
 */
export function getLastSignInTime(user: User | null): Date | null {
  if (!user?.last_sign_in_at) return null;
  return new Date(user.last_sign_in_at);
}

/**
 * Get user ID (Supabase uses 'id' instead of 'uid')
 */
export function getUserId(user: User | null): string | null {
  return user?.id || null;
}

/**
 * Get user provider (google, email, etc.)
 */
export function getProvider(user: User | null): string | null {
  return user?.app_metadata?.provider || null;
}

/**
 * Check if user signed in with Google
 */
export function isGoogleProvider(user: User | null): boolean {
  return getProvider(user) === 'google';
}

/**
 * Get user's access token from current session
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Legacy compatibility layer - provides Firebase-like properties
 * Use this sparingly and prefer the individual utility functions above
 */
export function createLegacyUserAdapter(user: User | null): {
  uid: string | null;
  displayName: string;
  photoURL: string | null;
  email: string | null;
  emailVerified: boolean;
  metadata: {
    creationTime: string | null;
    lastSignInTime: string | null;
  };
  providerData: Array<{
    providerId: string;
  }>;
} {
  const creationTime = getCreationTime(user);
  const lastSignInTime = getLastSignInTime(user);
  const provider = getProvider(user);

  return {
    uid: getUserId(user),
    displayName: getDisplayName(user),
    photoURL: getPhotoURL(user),
    email: user?.email || null,
    emailVerified: isEmailVerified(user),
    metadata: {
      creationTime: creationTime?.toISOString() || null,
      lastSignInTime: lastSignInTime?.toISOString() || null,
    },
    providerData: provider ? [{ providerId: provider === 'google' ? 'google.com' : provider }] : [],
  };
}

/**
 * Helper to safely access user email
 */
export function getUserEmail(user: User | null): string | null {
  return user?.email || null;
}