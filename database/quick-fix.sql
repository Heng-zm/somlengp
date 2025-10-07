-- =====================================================
-- QUICK FIX for Supabase 401 Error
-- Run this in your Supabase SQL Editor
-- Copy and paste this ENTIRE file, then click RUN
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the profiles table (simple version)
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive policies (you can make these more restrictive later)
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- 5. Test query (should work without 401 error now)
-- SELECT COUNT(*) FROM public.profiles;

-- =====================================================
-- OPTIONAL: Auto-create profiles for new users
-- =====================================================

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();