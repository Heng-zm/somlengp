import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  runTransaction 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { UserProfile, UserCounter } from '@/lib/types';

/**
 * Gets the next available user ID by incrementing a counter in Firestore
 */
async function getNextUserId(): Promise<number> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  return await runTransaction(db, async (transaction) => {
    const counterRef = doc(db!, 'metadata', 'userCounter');
    const counterDoc = await transaction.get(counterRef);
    
    let nextUserId = 1;
    
    if (counterDoc.exists()) {
      const counterData = counterDoc.data() as UserCounter;
      nextUserId = (counterData.lastUserId || 0) + 1;
    }
    
    // Update the counter
    transaction.set(counterRef, {
      lastUserId: nextUserId,
      updatedAt: new Date()
    }, { merge: true });
    
    return nextUserId;
  });
}

/**
 * Gets a user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  try {
    const userRef = doc(db, 'userProfiles', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    
    // Convert Firestore timestamps to Date objects
    return {
      uid: data.uid,
      userId: data.userId || 0, // Backward compatibility
      email: data.email,
      displayName: data.displayName,
      photoURL: data.profilePicture || data.photoURL,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastSignInTime: data.lastLoginAt?.toDate() || data.lastSignInTime?.toDate() || null,
      profileCreatedAt: data.createdAt?.toDate(),
      profileUpdatedAt: data.updatedAt?.toDate(),
    } as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Creates a new user profile in Firestore
 */
export async function createUserProfile(user: User): Promise<UserProfile> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  try {
    const now = new Date();
    
    const userProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Anonymous User',
      profilePicture: user.photoURL || undefined,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isPublic: true, // Default to public profile
      // Optional fields
      isEmailVerified: user.emailVerified || false,
      provider: user.providerData[0]?.providerId || 'email',
      role: 'user',
      status: 'active',
      loginCount: 1
    };
    const userRef = doc(db, 'userProfiles', user.uid);
    
    // Create the user profile
    await setDoc(userRef, userProfile);
    
    return {
      uid: user.uid,
      userId: 0, // Keep for backward compatibility
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: now,
      lastSignInTime: now,
      profileCreatedAt: now,
      profileUpdatedAt: now,
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
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  try {
    const userRef = doc(db, 'userProfiles', uid);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last sign-in time:', error);
    throw error;
  }
}

/**
 * Deletes a user profile from Firestore
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  try {
    const userRef = doc(db, 'userProfiles', uid);
    await deleteDoc(userRef);
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
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  try {
    const userRef = doc(db, 'userProfiles', uid);
    // Map old field names to new ones
    const mappedUpdates: any = {};
    if (updates.displayName !== undefined) mappedUpdates.displayName = updates.displayName;
    if (updates.email !== undefined) mappedUpdates.email = updates.email;
    if (updates.photoURL !== undefined) mappedUpdates.profilePicture = updates.photoURL;
    
    await updateDoc(userRef, {
      ...mappedUpdates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
