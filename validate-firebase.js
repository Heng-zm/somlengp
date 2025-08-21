const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

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

console.log('🔥 Firebase Configuration Validation');
console.log('=====================================');

// Check if all required fields are present
const requiredFields = ['apiKey', 'authDomain', 'projectId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('❌ Missing required fields:', missingFields);
  process.exit(1);
} else {
  console.log('✅ All required fields are present');
}

// Display configuration (masking sensitive data)
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (value) {
    if (key === 'apiKey') {
      console.log(`${key}: ${value.substring(0, 8)}...${value.substring(value.length - 4)}`);
    } else {
      console.log(`${key}: ${value}`);
    }
  } else {
    console.log(`${key}: ❌ Not set`);
  }
});

console.log('\n🧪 Testing Firebase initialization...');

try {
  const { initializeApp } = require('firebase/app');
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  console.log('App name:', app.name);
  console.log('App options project ID:', app.options.projectId);
  
  // Test Firestore initialization
  const { getFirestore } = require('firebase/firestore');
  const db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');
  
} catch (error) {
  console.error('❌ Firebase initialization failed:');
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  
  if (error.code === 'auth/invalid-api-key') {
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if your API key is correct in Firebase Console');
    console.log('2. Ensure your API key is not restricted or revoked');
    console.log('3. Verify your project ID is correct');
    console.log('4. Check if your Firebase project is active');
  }
  
  process.exit(1);
}

console.log('\n✅ Firebase validation completed successfully!');
