// Temporary compatibility shim for Firebase to Supabase migration
// This prevents build errors while we complete the full migration

export const app = null;
export const auth = null;  
export const db = null;
export const googleProvider = null;

export function isFirebaseInitialized(): boolean {
  return false;
}

export function getFirebaseStatus() {
  return {
    initialized: false,
    errors: ['Firebase has been replaced with Supabase'],
    warnings: []
  };
}

export async function retryFirebaseInitialization(): Promise<boolean> {
  return false;
}

export function withFirebaseRetry<T>(operation: () => Promise<T>): Promise<T> {
  throw new Error('Firebase has been replaced with Supabase');
}