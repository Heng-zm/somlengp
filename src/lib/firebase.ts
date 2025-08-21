
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

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

// Initialize Firebase with better error handling
let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  validateFirebaseConfig();
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  // Configure Google provider
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
  
} catch (error) {
  console.error('Firebase initialization error:', error);
  
  // During build time, we might not have access to environment variables
  // So we'll create null exports and handle this in the API routes
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
    console.warn('Firebase will be initialized at runtime when needed');
  }
}


export { db, auth, googleProvider };
