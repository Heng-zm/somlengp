import type { User } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase';
import { UserProfile, UserCounter } from '@/lib/types';
import type { Database } from '@/types/supabase';

/**
 * Gets a user profile from Supabase
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    return {
      uid: data.id,
      userId: 0, // Backward compatibility
      email: data.email,
      displayName: data.full_name,
      photoURL: data.avatar_url,
      createdAt: new Date(data.created_at),
      lastSignInTime: data.updated_at ? new Date(data.updated_at) : null,
      profileCreatedAt: new Date(data.created_at),
      profileUpdatedAt: new Date(data.updated_at),
    } as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Creates a new user profile in Supabase
 */
export async function createUserProfile(user: User): Promise<UserProfile> {
  try {
    const now = new Date().toISOString();
    
    const userProfile = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Anonymous User',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      created_at: now,
      updated_at: now,
    };
    
    // Create the user profile in Supabase
    const { data, error } = await supabaseClient
      .from('profiles')
      .upsert(userProfile)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      uid: user.id,
      userId: 0, // Keep for backward compatibility
      email: user.email || null,
      displayName: userProfile.full_name,
      photoURL: userProfile.avatar_url,
      createdAt: new Date(now),
      lastSignInTime: new Date(now),
      profileCreatedAt: new Date(now),
      profileUpdatedAt: new Date(now),
    };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Updates the last sign-in time for a user
 */
export async function updateLastSignInTime(uid: string): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    const { error } = await supabaseClient
      .from('profiles')
      .update({ updated_at: now })
      .eq('id', uid);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating last sign-in time:', error);
    throw error;
  }
}

/**
 * Deletes a user profile from Supabase
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', uid);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
}

/**
 * Updates user profile information
 */
export async function updateUserProfile(
  uid: string, 
  updates: Partial<Pick<UserProfile, 'email' | 'displayName' | 'photoURL'>>
): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    // Map old field names to new ones
    const mappedUpdates: any = { updated_at: now };
    if (updates.displayName !== undefined) mappedUpdates.full_name = updates.displayName;
    if (updates.email !== undefined) mappedUpdates.email = updates.email;
    if (updates.photoURL !== undefined) mappedUpdates.avatar_url = updates.photoURL;
    
    const { error } = await supabaseClient
      .from('profiles')
      .update(mappedUpdates)
      .eq('id', uid);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
