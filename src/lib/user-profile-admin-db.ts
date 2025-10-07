import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
} catch (error) {
  console.error('Failed to initialize Supabase Admin client:', error);
  throw error;
}
export interface AdminUserProfile {
  uid: string;
  userId?: number;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  createdAt: Date;
  lastSignInTime: Date | null;
  profileCreatedAt?: Date;
  profileUpdatedAt?: Date;
}
/**
 * Gets a user profile from Supabase using admin client
 */
export async function getUserProfileAdmin(uid: string): Promise<AdminUserProfile | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized');
  }
  
  try {
    const { data, error } = await (supabaseAdmin as any)
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
      uid: (data as any).id,
      userId: 0, // Backward compatibility
      email: (data as any).email,
      displayName: (data as any).full_name || 'Anonymous User',
      photoURL: (data as any).avatar_url,
      createdAt: new Date((data as any).created_at),
      lastSignInTime: (data as any).updated_at ? new Date((data as any).updated_at) : null,
      profileCreatedAt: new Date((data as any).created_at),
      profileUpdatedAt: new Date((data as any).updated_at),
    } as AdminUserProfile;
  } catch (error) {
    console.error('Error getting admin user profile:', error);
    throw error;
  }
}
/**
 * Creates a new user profile using admin client
 */
export async function createUserProfileAdmin(userData: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
}): Promise<AdminUserProfile> {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized');
  }
  
  try {
    const now = new Date().toISOString();
    
    const userProfile = {
      id: userData.uid,
      email: userData.email || '',
      full_name: userData.displayName || 'Anonymous User',
      avatar_url: userData.photoURL,
      created_at: now,
      updated_at: now,
    };
    
    // Create the user profile in Supabase
    const { data, error } = await (supabaseAdmin as any)
      .from('profiles')
      .upsert(userProfile)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      uid: userData.uid,
      userId: 0,
      email: userData.email,
      displayName: userData.displayName || 'Anonymous User',
      photoURL: userData.photoURL,
      createdAt: new Date(now),
      lastSignInTime: new Date(now),
      profileCreatedAt: new Date(now),
      profileUpdatedAt: new Date(now),
    };
  } catch (error) {
    console.error('Error creating admin user profile:', error);
    throw error;
  }
}
/**
 * Updates user profile information using admin client
 */
export async function updateUserProfileAdmin(
  uid: string, 
  updates: Partial<Pick<AdminUserProfile, 'email' | 'displayName' | 'photoURL'>>
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized');
  }
  
  try {
    const now = new Date().toISOString();
    
    // Map old field names to new ones
    const mappedUpdates: any = { updated_at: now };
    if (updates.displayName !== undefined) mappedUpdates.full_name = updates.displayName;
    if (updates.email !== undefined) mappedUpdates.email = updates.email;
    if (updates.photoURL !== undefined) mappedUpdates.avatar_url = updates.photoURL;
    
    const { error } = await (supabaseAdmin as any)
      .from('profiles')
      .update(mappedUpdates)
      .eq('id', uid);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating admin user profile:', error);
    throw error;
  }
}

/**
 * Updates the last sign-in time for a user (placeholder implementation)
 */
export async function updateLastSignInTimeAdmin(uid: string): Promise<void> {
  console.warn('updateLastSignInTimeAdmin not implemented - would update last sign-in in Supabase');
}

/**
 * Deletes a user profile (placeholder implementation)
 */
export async function deleteUserProfileAdmin(uid: string): Promise<void> {
  console.warn('deleteUserProfileAdmin not implemented - would delete profile from Supabase');
}

/**
 * Gets the next available user ID (placeholder implementation)
 */
export async function getNextUserIdAdmin(): Promise<number> {
  console.warn('getNextUserIdAdmin not implemented - would use Supabase sequence');
  return 1;
}
