# Firebase Setup Guide - Fix Comments Voting Issue

The "Failed to load comments" error when liking/unliking comments is typically caused by Firebase configuration issues. This guide will help you fix it.

## Quick Fix Steps

### 1. Create Environment File

Create a `.env.local` file in your project root with these variables:

```bash
# Copy these from your Firebase project settings
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.region.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-your_measurement_id
```

### 2. Get Your Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Click the gear icon → Project settings
4. Scroll down to "Your apps" section
5. Click the web app icon `</>` 
6. Copy the config values to your `.env.local` file

### 3. Enable Authentication

1. In Firebase Console → Authentication
2. Click "Sign-in method" tab
3. Enable "Google" sign-in provider
4. Add your domain to authorized domains

### 4. Configure Firestore Security Rules

Make sure your `firestore.rules` file allows voting (it should already be configured correctly):

```javascript
// The rules are already set up correctly in your project
// But ensure the votes subcollection allows user access:
match /comments/{commentId} {
  match /votes/{userId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
    allow read: if true; // For vote counting
  }
}
```

### 5. Test the Fix

1. Restart your development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open browser console (F12) and look for Firebase status messages
3. Try voting on a comment - you should see debug logs

## Common Issues & Solutions

### Issue: "Firestore not initialized"
**Solution:** Check that all environment variables are set correctly in `.env.local`

### Issue: "Permission denied"
**Solution:** 
1. Sign in with Google first
2. Check Firestore security rules
3. Ensure your domain is authorized in Firebase Console

### Issue: "Authentication required"
**Solution:** The voting feature requires user authentication. Sign in first.

### Issue: "Network error"
**Solution:** 
1. Check internet connection
2. Verify Firebase project is active
3. Check browser console for specific error details

## Debug Information

The code now includes extensive logging. Open browser console and look for:

- 🔥 Firebase Status Check (shows initialization status)
- Vote transaction logs (shows voting process)
- Detailed error messages (shows specific failure reasons)

## Environment Variables Reference

Based on your `.env.example` file, use these values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBU_Q2F0zIMTrIyh5nXERtU3fEtlSX4SH0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mystical-slate-448113-c6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://mystical-slate-448113-c6-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mystical-slate-448113-c6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mystical-slate-448113-c6.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=681914071632
NEXT_PUBLIC_FIREBASE_APP_ID=1:681914071632:web:0aaa73e8b439b78251ef55
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-DCCC55ZVBG
```

⚠️ **Important:** If you're using these in production, make sure they're configured in your hosting platform's environment variables section.

## Testing the Fix

1. Sign in with Google
2. Try upvoting/downvoting a comment
3. Check browser console for logs
4. The comment vote counts should update without the "Failed to load comments" error

If you still encounter issues, check the browser console for the specific error messages - the improved error handling will show exactly what's wrong.
