// Firebase Auth Configuration Checker
// Run this script to verify your Firebase auth setup

console.log('🔥 Firebase Authentication Configuration Check\n');

// Check environment variables
console.log('📋 Environment Variables:');
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let allEnvVarsPresent = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? (varName.includes('API_KEY') ? value.substring(0, 10) + '...' : value) : 'MISSING';
  console.log(`  ${status} ${varName}: ${displayValue}`);
  if (!value) allEnvVarsPresent = false;
});

console.log('\n🌐 Configuration Analysis:');
console.log(`  Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
console.log(`  Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);

console.log('\n🔗 Required URLs to Add to Firebase Console:');
console.log('  Go to: https://console.firebase.google.com');
console.log('  Navigate to: Authentication > Settings > Authorized domains');
console.log('  Add these domains:');
console.log('    - localhost (for development)');
console.log('    - your-app-name.vercel.app (replace with your actual Vercel domain)');
console.log('    - your-custom-domain.com (if you have one)');

console.log('\n🔗 Required URLs to Add to Google Cloud Console:');
console.log('  Go to: https://console.cloud.google.com');
console.log('  Navigate to: APIs & Services > Credentials > OAuth 2.0 Client IDs');
console.log('  Add these to Authorized JavaScript origins:');
console.log('    - https://your-app-name.vercel.app');
console.log('    - https://your-custom-domain.com');
console.log('  Add these to Authorized redirect URIs:');
console.log('    - https://your-app-name.vercel.app/__/auth/handler');
console.log('    - https://your-custom-domain.com/__/auth/handler');

if (!allEnvVarsPresent) {
  console.log('\n❌ Missing environment variables detected!');
  console.log('   Make sure to set all required NEXT_PUBLIC_FIREBASE_* variables');
  console.log('   In production, set these in your deployment platform (Vercel, Netlify, etc.)');
} else {
  console.log('\n✅ All environment variables are present');
}

console.log('\n🚀 Production Deployment Checklist:');
console.log('  1. ✅ Set all environment variables in your deployment platform');
console.log('  2. ⚠️  Add production domain to Firebase authorized domains');
console.log('  3. ⚠️  Add production domain to Google Cloud OAuth settings'); 
console.log('  4. ⚠️  Test Google login in production environment');
console.log('  5. ⚠️  Check browser console for any Firebase errors');

console.log('\n📱 Testing Tips:');
console.log('  - Open browser dev tools before testing login');
console.log('  - Check Console tab for Firebase/Auth errors');
console.log('  - Look for CORS or domain authorization errors');
console.log('  - Try in incognito mode to rule out cache issues');
