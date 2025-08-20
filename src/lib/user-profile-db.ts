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
  return await runTransaction(db, async (transaction) => {
    const counterRef = doc(db, 'metadata', 'userCounter');
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
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    
    // Convert Firestore timestamps to Date objects
    return {
      uid: data.uid,
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastSignInTime: data.lastSignInTime?.toDate() || null,
      profileCreatedAt: data.profileCreatedAt?.toDate(),
      profileUpdatedAt: data.profileUpdatedAt?.toDate(),
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
  try {
    const userId = await getNextUserId();
    const now = new Date();
    
    const userProfile: Omit<UserProfile, 'profileCreatedAt' | 'profileUpdatedAt'> = {
      uid: user.uid,
      userId,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: now,
      lastSignInTime: now,
    };
    
    const userRef = doc(db, 'users', user.uid);
    
    // Use serverTimestamp for profile metadata
    await setDoc(userRef, {
      ...userProfile,
      profileCreatedAt: serverTimestamp(),
      profileUpdatedAt: serverTimestamp(),
    });
    
    return {
      ...userProfile,
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
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastSignInTime: serverTimestamp(),
      profileUpdatedAt: serverTimestamp(),
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
  try {
    const userRef = doc(db, 'users', uid);
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
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      profileUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
