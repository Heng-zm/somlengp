import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp, runTransaction } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { UserProfile, UserCounter } from './types';

/**
 * Generates the next available numeric user ID
 */
export async function generateNextUserId(): Promise<number> {
  const counterRef = doc(db, 'counters', 'userCounter');
  
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    
    let nextUserId: number;
    
    if (!counterDoc.exists()) {
      // Initialize counter starting from 1000 (4-digit minimum)
      nextUserId = 1000;
      transaction.set(counterRef, {
        lastUserId: nextUserId,
        updatedAt: serverTimestamp(),
      });
    } else {
      const currentCounter = counterDoc.data() as UserCounter;
      nextUserId = currentCounter.lastUserId + 1;
      transaction.update(counterRef, {
        lastUserId: nextUserId,
        updatedAt: serverTimestamp(),
      });
    }
    
    return nextUserId;
  });
}

/**
 * Gets a user profile by numeric user ID
 */
export async function getUserProfileByUserId(userId: number): Promise<UserProfile | null> {
  // Note: This requires a compound query or maintaining a separate index
  // For now, we'll need to implement this differently since Firestore doesn't have efficient reverse lookups
  // The userId parameter will be used when this function is implemented
  console.warn(`getUserProfileByUserId called with userId: ${userId} - not yet implemented`);
  throw new Error('getUserProfileByUserId not implemented - requires indexing strategy');
}

/**
 * Creates a user profile document in Firestore with numeric user ID
 */
export async function createUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  
  // Generate a numeric user ID
  const userId = await generateNextUserId();
  
  const profileData = {
    uid: user.uid,
    userId: userId,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: serverTimestamp(),
    lastSignInTime: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null,
    profileCreatedAt: serverTimestamp(),
    profileUpdatedAt: serverTimestamp(),
  };

  await setDoc(userRef, profileData, { merge: true });
  
  // Return the profile with current timestamps
  return {
    uid: user.uid,
    userId: userId,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
    lastSignInTime: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null,
    profileCreatedAt: new Date(),
    profileUpdatedAt: new Date(),
  };
}

/**
 * Gets a user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return null;
  }
  
  const data = userDoc.data();
  
  return {
    uid: data.uid,
    userId: data.userId || 0, // Fallback for existing profiles without userId
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    lastSignInTime: data.lastSignInTime ? (data.lastSignInTime instanceof Timestamp ? data.lastSignInTime.toDate() : new Date(data.lastSignInTime)) : null,
    profileCreatedAt: data.profileCreatedAt ? (data.profileCreatedAt instanceof Timestamp ? data.profileCreatedAt.toDate() : new Date(data.profileCreatedAt)) : undefined,
    profileUpdatedAt: data.profileUpdatedAt ? (data.profileUpdatedAt instanceof Timestamp ? data.profileUpdatedAt.toDate() : new Date(data.profileUpdatedAt)) : undefined,
  };
}

/**
 * Updates a user profile in Firestore
 */
export async function updateUserProfile(uid: string, updates: Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'profileCreatedAt'>>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  
  const updateData = {
    ...updates,
    profileUpdatedAt: serverTimestamp(),
  };
  
  await updateDoc(userRef, updateData);
}

/**
 * Updates the last sign-in time for a user
 */
export async function updateLastSignInTime(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  
  await updateDoc(userRef, {
    lastSignInTime: serverTimestamp(),
    profileUpdatedAt: serverTimestamp(),
  });
}

/**
 * Formats a date for display
 */
export function formatDate(date: Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'Not available';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date);
}

/**
 * Formats a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

/**
 * Formats account age in a more user-friendly way
 */
export function formatAccountAge(date: Date | null | undefined): string {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);
  
  if (diffInDays < 1) {
    return 'Today';
  } else if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''}`;
  } else {
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''}`;
  }
}

/**
 * Generates a user ID (this is already provided by Firebase Auth, but included for completeness)
 */
export function getUserId(user: User): string {
  return user.uid;
}

/**
 * Gets user creation timestamp
 */
export function getUserCreationTime(user: User): Date | null {
  return user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
}

/**
 * Gets user last sign-in timestamp  
 */
export function getUserLastSignInTime(user: User): Date | null {
  return user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;
}

/**
 * Deletes a user profile from Firestore
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(userRef);
}
