import { db, auth } from './firebase';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

export interface FirebaseStatus {
  isInitialized: boolean;
  dbConnected: boolean;
  authConnected: boolean;
  errors: string[];
  warnings: string[];
}
export function checkFirebaseStatus(): FirebaseStatus {
  const status: FirebaseStatus = {
    isInitialized: false,
    dbConnected: false,
    authConnected: false,
    errors: [],
    warnings: []
  };
  // Check if Firebase services are initialized
  try {
    if (db) {
      status.dbConnected = true;
    } else {
      status.errors.push('Firestore is not initialized - check environment variables');
      console.error('❌ Firestore is not initialized');
    }
    if (auth) {
      status.authConnected = true;
    } else {
      status.errors.push('Firebase Auth is not initialized - check environment variables');
      console.error('❌ Firebase Auth is not initialized');
    }
    status.isInitialized = status.dbConnected && status.authConnected;
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
    ];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
      status.errors.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
      console.error('❌ Missing environment variables:', missingEnvVars);
    }
    // Additional checks
    if (typeof window !== 'undefined') {
      const currentDomain = window.location.hostname;
      if (currentDomain === 'localhost' || currentDomain.includes('localhost')) {
        status.warnings.push('Running on localhost - ensure Firebase configuration allows local development');
      }
    }
  } catch (error) {
    status.errors.push(`Firebase initialization error: ${error}`);
    console.error('❌ Firebase check failed:', error);
  }
  return status;
}
export function logFirebaseStatus(): void {
  const status = checkFirebaseStatus();
  console.group('🔥 Firebase Status Check');
  if (status.errors.length > 0) {
    console.error('Errors:', status.errors);
  }
  if (status.warnings.length > 0) {
  }
  console.groupEnd();
}
// Auto-run status check in development
if (process.env.NODE_ENV === 'development') {
  // Run check after a short delay to ensure Firebase has initialized
  setTimeout(() => {
    logFirebaseStatus();
  }, 1000);
}
