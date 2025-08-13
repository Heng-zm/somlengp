
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
if (typeof window !== 'undefined') {
  if (process.env.NODE_ENV === 'development') {
    console.log('Firebase config validation:', {
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain,
      hasProjectId: !!firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      environment: process.env.NODE_ENV,
      currentDomain: window.location.hostname,
      currentOrigin: window.location.origin
    });
  }
  
  // Check for missing required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error('Missing required Firebase configuration fields:', missingFields);
    console.error('Please check your environment variables and ensure all required NEXT_PUBLIC_FIREBASE_* variables are set');
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
  
  // Production-specific domain validation (errors only)
  if (process.env.NODE_ENV === 'production') {
    // Only log in development for production troubleshooting
    console.log('🚀 Production deployment detected');
    console.log('Current domain:', window.location.hostname);
    console.log('Make sure this domain is added to:');
    console.log('1. Firebase Console > Authentication > Settings > Authorized domains');
    console.log('2. Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs');
  }
}

// Initialize Firebase
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  if (process.env.NODE_ENV === 'development') {
    console.log('Firebase app initialized successfully');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Add additional debug logging for auth
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Firebase Auth initialized:', {
    authDomain: auth.config.authDomain,
    apiKey: auth.config.apiKey?.substring(0, 10) + '...',
    currentUser: auth.currentUser?.uid || 'none'
  });
}

export { db, auth, googleProvider };
