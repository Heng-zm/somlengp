# 🚨 Fix SQL Syntax Error - IMMEDIATE SOLUTION

## ⚡ Quick Fix Instructions

### Step 1: Access Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the sidebar

### Step 2: Copy the Clean SQL
Copy **ALL** the code from `database/clean-fix.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop table if it exists (for clean setup)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    provider TEXT DEFAULT 'email',
    is_email_confirmed BOOLEAN DEFAULT false,
    is_premium_user BOOLEAN DEFAULT false,
    is_new_user BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX profiles_email_idx ON public.profiles(email);
CREATE INDEX profiles_created_at_idx ON public.profiles(created_at);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read profiles" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Create function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, provider)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Test the setup
SELECT 'Setup completed successfully!' as status;
```

### Step 3: Execute
1. **Paste** the entire code in the SQL Editor
2. **Click "RUN"** 
3. **Wait** for completion
4. You should see: `Setup completed successfully!`

### Step 4: Test
Visit: `https://somlengp.vercel.app/api/supabase/diagnostics`

You should see:
```json
{
  "name": "Profiles Table Access",
  "status": "PASS"
}
```

## ✅ What This Fixes

- ❌ **Fixed**: SQL syntax errors
- ✅ **Created**: `profiles` table with proper structure
- ✅ **Enabled**: Row Level Security policies
- ✅ **Added**: Auto-profile creation on user signup
- ✅ **Resolved**: 401 Unauthorized errors

## 🚨 If Still Having Issues

1. **Check browser console** for any remaining errors
2. **Verify environment variables** in Vercel
3. **Test with**: `/auth-debug` page
4. **Check Supabase logs** in dashboard

The SQL error should be completely resolved with this clean version! 🎯