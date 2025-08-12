# Google Authentication Production Setup Guide

## 🚨 **Current Issue**: Google Login Not Working in Production

Your Google authentication works in development but fails in production. This is a common issue with specific solutions.

## 🔍 **Your Current Firebase Configuration**

Based on your `.env` file:
- Project ID: `mystical-slate-448113-c6`
- Auth Domain: `mystical-slate-448113-c6.firebaseapp.com`
- API Key: `AIzaSyBU_Q2F0zIMTrIyh5nXERtU3fEtlSX4SH0`

## ✅ **Required Fixes (Step-by-Step)**

### 1. **Environment Variables in Production**

First, ensure all environment variables are set in your production environment:

#### For Vercel:
```bash
# In your Vercel dashboard or CLI
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

Or via Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all `NEXT_PUBLIC_FIREBASE_*` variables from your `.env` file

### 2. **Firebase Console Setup**

#### Add Production Domain to Authorized Domains:
1. Go to [Firebase Console](https://console.firebase.google.com/project/mystical-slate-448113-c6)
2. Navigate to **Authentication** → **Settings** → **Authorized domains**
3. Click **Add domain**
4. Add your production domain(s):
   - `your-app-name.vercel.app`
   - Your custom domain (if any)
   - Keep `localhost` for development

#### Enable Google Sign-in (if not already done):
1. Go to **Authentication** → **Sign-in method**
2. Click on **Google**
3. Enable it and save

### 3. **Google Cloud Console Setup**

#### Configure OAuth Consent Screen:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=mystical-slate-448113-c6)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Add your production domain to **Authorized domains**

#### Update OAuth 2.0 Client ID:
1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID (Web application)
3. Click the edit button (pencil icon)
4. Add to **Authorized JavaScript origins**:
   ```
   https://your-app-name.vercel.app
   https://your-custom-domain.com (if applicable)
   ```
5. Add to **Authorized redirect URIs**:
   ```
   https://your-app-name.vercel.app/__/auth/handler
   https://your-custom-domain.com/__/auth/handler (if applicable)
   ```
6. Click **Save**

## 🧪 **Testing Your Setup**

### 1. **Verify Environment Variables**
After deployment, check the browser console in production:
- Look for Firebase config validation logs
- Ensure all required fields show as present

### 2. **Common Error Messages & Solutions**

| Error | Cause | Solution |
|-------|-------|----------|
| `auth/unauthorized-domain` | Domain not in Firebase authorized domains | Add domain to Firebase Console |
| `auth/invalid-api-key` | Missing/incorrect API key | Check environment variables |
| `auth/popup-blocked` | Browser blocking popup | Use redirect method |
| `auth/operation-not-allowed` | Google sign-in not enabled | Enable in Firebase Console |

### 3. **Debug Steps**
1. Open browser dev tools in production
2. Go to Console tab
3. Look for Firebase-related errors
4. Check Network tab for failed requests

## 📋 **Deployment Checklist**

- [ ] ✅ Environment variables set in production platform
- [ ] ⚠️  Production domain added to Firebase authorized domains
- [ ] ⚠️  Production domain added to Google Cloud OAuth settings
- [ ] ⚠️  OAuth consent screen configured
- [ ] ⚠️  Test Google login in production
- [ ] ⚠️  Verify no console errors in production

## 🔧 **Quick Fix Commands**

If you're using Vercel CLI:

```bash
# Set all environment variables at once
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY "AIzaSyBU_Q2F0zIMTrIyh5nXERtU3fEtlSX4SH0"
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "mystical-slate-448113-c6.firebaseapp.com"
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID "mystical-slate-448113-c6"
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET "mystical-slate-448113-c6.firebasestorage.app"
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "681914071632"
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID "1:681914071632:web:0aaa73e8b439b78251ef55"
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID "G-DCCC55ZVBG"

# Redeploy
vercel --prod
```

## 🚀 **After Making Changes**

1. **Redeploy your application**
2. **Clear browser cache** or use incognito mode
3. **Test authentication flow**
4. **Check console for errors**

## 💡 **Pro Tips**

1. **Always test in incognito mode** to avoid cache issues
2. **Keep localhost in Firebase authorized domains** for development
3. **Monitor Firebase Console logs** for authentication attempts
4. **Use redirect method** if popup is consistently blocked
5. **Double-check all URLs** - even small typos will cause failures

## 🆘 **Still Having Issues?**

If authentication still doesn't work after following these steps:

1. Check your production domain in the browser console logs
2. Verify the exact error message in the console
3. Ensure your Firebase project is on the correct billing plan
4. Try the redirect authentication method instead of popup

## 📞 **Need Help?**

Common debugging questions:
- What's your production domain?
- What error appears in the browser console?
- Are all environment variables showing up in the production logs?
- Is Google sign-in enabled in Firebase Console?

---

**Remember**: Firebase authentication requires HTTPS in production, which Vercel provides automatically.
