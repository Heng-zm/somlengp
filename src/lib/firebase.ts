
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
// Validate Firebase configuration
function validateFirebaseConfig() {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  if (missingFields.length > 0) {
    const errorMsg = `Missing required Firebase configuration fields: ${missingFields.join(', ')}`;
    console.error(errorMsg);
    console.error('Please check your environment variables and ensure all required NEXT_PUBLIC_FIREBASE_* variables are set');
    if (typeof window !== 'undefined') {
      console.error('Current environment:', process.env.NODE_ENV);
      console.error('Current domain:', window.location.hostname);
      // Show deployment-specific instructions
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 PRODUCTION DEPLOYMENT ISSUE:');
        console.error('1. Set environment variables in your deployment platform (Vercel, Netlify, etc.)');
        console.error('2. Add this domain to Firebase Console > Authentication > Settings > Authorized domains');
        console.error('3. Add this domain to Google Cloud Console > APIs & Services > Credentials');
      }
    }
    throw new Error(errorMsg);
  }
}
// Initialize Firebase with better error handling and offline support
let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let googleProvider: GoogleAuthProvider | null = null;
async function initializeFirebaseWithRetry(maxRetries = 3): Promise<void> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      validateFirebaseConfig();
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      // Initialize Firestore with offline support
      db = getFirestore(app);
      // Initialize Auth
      auth = getAuth(app);
      // Configure Google provider
      googleProvider = new GoogleAuthProvider();
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
      return; // Success, exit retry loop
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  // All retries failed
  console.error('🚨 Firebase initialization failed after all retries:', lastError);
  // In development, we can continue without Firebase for some features
  if (process.env.NODE_ENV === 'development') {
  } else {
    console.error('🚨 Production app cannot function without Firebase');
  }
}
// Initialize Firebase immediately in browser environment
if (typeof window !== 'undefined') {
  initializeFirebaseWithRetry().catch(error => {
    console.error('Failed to initialize Firebase:', error);
  });
} else {
  // Server-side: try immediate initialization
  try {
    validateFirebaseConfig();
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
  } catch (error) {
  }
}
// Utility functions for Firebase connection management
export function isFirebaseInitialized(): boolean {
  return !!(app && db && auth);
}
export function getFirebaseStatus(): {
  initialized: boolean;
  hasApp: boolean;
  hasDb: boolean;
  hasAuth: boolean;
  hasGoogleProvider: boolean;
} {
  return {
    initialized: isFirebaseInitialized(),
    hasApp: !!app,
    hasDb: !!db,
    hasAuth: !!auth,
    hasGoogleProvider: !!googleProvider,
  };
}
// Retry Firebase initialization manually
export async function retryFirebaseInitialization(): Promise<boolean> {
  try {
    await initializeFirebaseWithRetry(1);
    return isFirebaseInitialized();
  } catch (error) {
    console.error('Manual Firebase retry failed:', error);
    return false;
  }
}
// Safe Firebase operations with fallback
export function withFirebaseRetry<T>(
  operation: () => Promise<T>,
  fallback?: () => T
): Promise<T> {
  return operation().catch(async (error) => {
    // If it's a network error, try to reinitialize
    if (error.message?.includes('network-request-failed')) {
      const success = await retryFirebaseInitialization();
      if (success) {
        return operation();
      }
    }
    // If we have a fallback, use it
    if (fallback) {
      return fallback();
    }
    // Otherwise, rethrow the error
    throw error;
  });
}
export { app, db, auth, googleProvider };
