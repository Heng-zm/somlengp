# Production Troubleshooting Guide

This guide helps fix the production deployment issues you're experiencing.

## 🚨 Current Issues

1. **404 Error**: `GET /terms?_rsc=1nmd2 404 (Not Found)` ✅ **FIXED**
2. **401 Unauthorized**: `POST /rest/v1/profiles 401 (Unauthorized)` ❌ **NEEDS FIX**

## ✅ Issue 1: Missing Terms Page (FIXED)

**Problem**: The `/terms` page was missing, causing 404 errors.

**Solution**: Created `src/app/terms/page.tsx` with a complete Terms of Service page.

## ❌ Issue 2: Supabase Unauthorized Error (NEEDS FIX)

**Problem**: Getting 401 errors when trying to access the `profiles` table in Supabase.

### Step 1: Check Your Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`somlengp`)
3. Go to **Settings** → **Environment Variables**
4. Ensure these variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional, but recommended)

### Step 2: Verify Your Supabase Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Check these settings:

#### Authentication Settings
- **Authentication** → **URL Configuration**
  - **Site URL**: `https://somlengp.vercel.app`
  - **Redirect URLs**: `https://somlengp.vercel.app/api/auth/callback`

#### Database Settings
- **Table Editor** → Check if `profiles` table exists
- **Authentication** → **Policies** → Check Row Level Security (RLS) on `profiles` table

### Step 3: Fix the Profiles Table Issue

The most likely causes of the 401 error:

#### Option A: Profiles Table Doesn't Exist
If the `profiles` table doesn't exist, create it:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

#### Option B: RLS Policies Are Too Restrictive
If the table exists but RLS is blocking access:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Update policies to be more permissive (adjust as needed)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR auth.uid() IS NOT NULL);
```

### Step 4: Test the Fix

#### Production Testing
1. Visit: `https://somlengp.vercel.app/api/supabase/diagnostics`
2. Check the JSON response for any failing tests
3. Look for the "Profiles Table Access" test result

#### Local Testing
1. Run: `http://localhost:3000/api/supabase/diagnostics`
2. Compare results between local and production

### Step 5: Common Solutions

#### If Environment Variables Are Missing:
```bash
# In Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### If OAuth Is Not Working:
1. **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. Make sure it's enabled and configured
3. Check that the redirect URL is correct

#### If RLS Is Too Strict:
```sql
-- Temporarily disable RLS for testing (NOT recommended for production)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable with proper policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## 🔍 Diagnostic Tools

### Production Diagnostics
- **URL**: `https://somlengp.vercel.app/api/supabase/diagnostics`
- **Purpose**: Checks all Supabase connections and configurations

### Local Diagnostics
- **URL**: `http://localhost:3000/api/supabase/diagnostics`
- **Purpose**: Compare with production to identify differences

### Test Firebase Page (Legacy)
- **URL**: `https://somlengp.vercel.app/test-firebase`
- **Purpose**: Visual testing of Supabase connections

## 📋 Deployment Checklist

Before deploying to production:

- [ ] Environment variables are set in Vercel
- [ ] Supabase project has correct URL configuration
- [ ] Database tables exist with proper RLS policies
- [ ] OAuth providers are configured correctly
- [ ] Test the `/api/supabase/diagnostics` endpoint

## 🆘 Still Having Issues?

1. **Check Vercel Deployment Logs**: Look for build/runtime errors
2. **Check Browser Network Tab**: Look for specific error messages
3. **Check Supabase Logs**: Go to Supabase Dashboard → Logs
4. **Use the diagnostics endpoint**: `/api/supabase/diagnostics`

## 📞 Quick Fix Commands

```bash
# Redeploy with updated environment variables
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs your-deployment-url
```

Remember: After making changes to Supabase configuration or Vercel environment variables, you may need to redeploy your application for changes to take effect.