# Database Setup Guide

## 🚨 Quick Fix for 401 Error

If you're getting `POST /rest/v1/profiles 401 (Unauthorized)` errors in production:

### Step 1: Access Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the sidebar

### Step 2: Run the Quick Fix
Copy and paste the contents of `quick-fix.sql` into the SQL Editor and run it.

```sql
-- This will create the profiles table with proper RLS policies
-- See quick-fix.sql for the complete code
```

### Step 3: Test the Fix
1. Visit: `https://somlengp.vercel.app/api/supabase/diagnostics`
2. Look for the "Profiles Table Access" test result
3. It should now show `status: "PASS"`

## 📊 Complete Database Schema

For the full production setup, use `schema.sql` which includes:

### Features:
- ✅ **Profiles Table** with comprehensive user data
- ✅ **Row Level Security** policies
- ✅ **Automatic Profile Creation** on user signup
- ✅ **Triggers** for data consistency
- ✅ **Indexes** for performance
- ✅ **User Sessions** tracking (optional)

### Tables Created:
1. **`public.profiles`** - User profile data
2. **`public.user_sessions`** - Session tracking (optional)

### Functions Created:
1. **`handle_new_user()`** - Auto-creates profile on signup
2. **`handle_user_signin()`** - Updates last sign-in time
3. **`handle_updated_at()`** - Auto-updates timestamps

## 🔧 Deployment Steps

### Option A: Quick Fix (Recommended for immediate fix)
```bash
# 1. Copy the quick-fix.sql content
# 2. Go to Supabase Dashboard → SQL Editor
# 3. Paste and execute the SQL
# 4. Test with /api/supabase/diagnostics
```

### Option B: Complete Schema
```bash
# 1. Copy the schema.sql content
# 2. Go to Supabase Dashboard → SQL Editor
# 3. Paste and execute the SQL
# 4. Verify all tables and functions are created
```

## 🧪 Testing

### Local Testing
```bash
# Visit these URLs to test:
http://localhost:3000/api/supabase/diagnostics
http://localhost:3000/test-firebase
http://localhost:3000/auth-debug
```

### Production Testing
```bash
# Visit these URLs to test:
https://somlengp.vercel.app/api/supabase/diagnostics
https://somlengp.vercel.app/test-firebase
```

## 🔍 Debugging Queries

### Check if table exists:
```sql
SELECT COUNT(*) as profile_count FROM public.profiles;
```

### View RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Check user can access their profile:
```sql
SELECT * FROM public.profiles WHERE id = auth.uid();
```

### View all profiles (as admin):
```sql
-- This requires RLS bypass or admin privileges
SELECT id, email, display_name, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔐 Security Notes

### Row Level Security (RLS)
- **Enabled** by default on all tables
- **Policies** ensure users can only access their own data
- **Authentication** required for all operations

### Permissions
- **`authenticated`** role has necessary permissions
- **`anon`** role has limited access
- **Service role** can bypass RLS (use carefully)

## 🚨 Troubleshooting

### Still getting 401 errors?
1. **Check environment variables** in Vercel
2. **Verify RLS policies** are not too restrictive
3. **Test with diagnostics endpoint**
4. **Check Supabase logs** for detailed errors

### Need to reset?
```sql
-- WARNING: This deletes all data!
-- Uncomment the cleanup section in schema.sql
```

### Common Issues:
- **Missing table**: Run `quick-fix.sql`
- **RLS too strict**: Adjust policies in SQL
- **Wrong permissions**: Check GRANT statements
- **Environment vars**: Verify in Vercel settings

## 📞 Need Help?

1. **Check diagnostics**: `/api/supabase/diagnostics`
2. **View console logs**: Browser developer tools
3. **Check Supabase logs**: Dashboard → Logs
4. **Test auth flow**: `/auth-debug` page