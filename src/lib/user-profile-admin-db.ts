import { 
  getFirestore, 
  FieldValue,
  Timestamp 
} from 'firebase-admin/firestore';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    // Check if we have service account credentials
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (clientEmail && privateKey) {
      // Initialize with service account credentials (production/local with service account)
      initializeApp({
        projectId: projectId,
        credential: cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      console.warn('⚠️ Firebase Admin SDK credentials not found. Some features may not work properly.');
      // Initialize with application default credentials or minimal config for development
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Running in development mode without Firebase Admin SDK credentials.');
        // Throw error to prevent build issues
        throw new Error('Firebase Admin SDK requires service account credentials. Please check your .env file.');
      } else {
        throw new Error('Firebase Admin SDK requires service account credentials');
      }
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}
const adminDb = getFirestore();
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
 * Gets a user profile from Firestore using Firebase Admin SDK
 */
export async function getUserProfileAdmin(uid: string): Promise<AdminUserProfile | null> {
  try {
    const userRef = adminDb.collection('userProfiles').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return null;
    }
    const data = userDoc.data()!;
    // Convert Firestore timestamps to Date objects
    return {
      uid: data.uid,
      userId: data.userId || 0,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.profilePicture || data.photoURL || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastSignInTime: data.lastLoginAt?.toDate() || data.lastSignInTime?.toDate() || null,
      profileCreatedAt: data.createdAt?.toDate(),
      profileUpdatedAt: data.updatedAt?.toDate(),
    };
  } catch (error) {
    console.error('Error getting user profile with Admin SDK:', error);
    throw error;
  }
}
/**
 * Creates a new user profile in Firestore using Firebase Admin SDK
 */
export async function createUserProfileAdmin(userData: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
}): Promise<AdminUserProfile> {
  try {
    const now = new Date();
    const timestamp = Timestamp.fromDate(now);
    const userProfile = {
      uid: userData.uid,
      email: userData.email || '',
      displayName: userData.displayName || 'Anonymous User',
      profilePicture: userData.photoURL || undefined,
      createdAt: timestamp,
      lastLoginAt: timestamp,
      updatedAt: timestamp,
      isPublic: true, // Default to public profile
      // Optional fields
      isEmailVerified: userData.emailVerified || false,
      role: 'user',
      status: 'active',
      loginCount: 1
    };
    const userRef = adminDb.collection('userProfiles').doc(userData.uid);
    // Create the user profile using Admin SDK (bypasses security rules)
    await userRef.set(userProfile);
    return {
      uid: userData.uid,
      userId: 0,
      email: userData.email,
      displayName: userData.displayName || 'Anonymous User',
      photoURL: userData.photoURL,
      createdAt: now,
      lastSignInTime: now,
      profileCreatedAt: now,
      profileUpdatedAt: now,
    };
  } catch (error) {
    console.error('Error creating user profile with Admin SDK:', error);
    throw error;
  }
}
/**
 * Updates user profile information using Firebase Admin SDK
 */
export async function updateUserProfileAdmin(
  uid: string, 
  updates: Partial<Pick<AdminUserProfile, 'email' | 'displayName' | 'photoURL'>>
): Promise<void> {
  try {
    const userRef = adminDb.collection('userProfiles').doc(uid);
    // Map field names to Firestore field names
    const mappedUpdates: any = {};
    if (updates.displayName !== undefined) mappedUpdates.displayName = updates.displayName;
    if (updates.email !== undefined) mappedUpdates.email = updates.email;
    if (updates.photoURL !== undefined) mappedUpdates.profilePicture = updates.photoURL;
    // Always update the timestamp
    mappedUpdates.updatedAt = FieldValue.serverTimestamp();
    mappedUpdates.lastLoginAt = FieldValue.serverTimestamp();
    // Update the document using Admin SDK (bypasses security rules)
    await userRef.update(mappedUpdates);
  } catch (error) {
    console.error('Error updating user profile with Admin SDK:', error);
    throw error;
  }
}
/**
 * Updates the last sign-in time for a user using Firebase Admin SDK
 */
export async function updateLastSignInTimeAdmin(uid: string): Promise<void> {
  try {
    const userRef = adminDb.collection('userProfiles').doc(uid);
    await userRef.update({
      lastLoginAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last sign-in time with Admin SDK:', error);
    throw error;
  }
}
/**
 * Deletes a user profile from Firestore using Firebase Admin SDK
 */
export async function deleteUserProfileAdmin(uid: string): Promise<void> {
  try {
    const userRef = adminDb.collection('userProfiles').doc(uid);
    await userRef.delete();
  } catch (error) {
    console.error('Error deleting user profile with Admin SDK:', error);
    throw error;
  }
}
/**
 * Gets the next available user ID by incrementing a counter using Firebase Admin SDK
 */
export async function getNextUserIdAdmin(): Promise<number> {
  return await adminDb.runTransaction(async (transaction) => {
    const counterRef = adminDb.collection('metadata').doc('userCounter');
    const counterDoc = await transaction.get(counterRef);
    let nextUserId = 1;
    if (counterDoc.exists) {
      const counterData = counterDoc.data()!;
      nextUserId = (counterData.lastUserId || 0) + 1;
    }
    // Update the counter
    transaction.set(counterRef, {
      lastUserId: nextUserId,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    return nextUserId;
  });
}