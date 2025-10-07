-- =====================================================
-- Database Schema Verification Script
-- Run this in your Supabase SQL Editor to verify the profiles table
-- =====================================================

-- Check if profiles table exists and what columns it has
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Show sample data (if any exists)
-- SELECT id, email, display_name, created_at FROM public.profiles LIMIT 5;

-- If the table doesn't exist or has wrong columns, run one of these:

-- Option 1: If table doesn't exist, create it
/*
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
*/

-- Option 2: If table exists but has wrong columns, add missing column
/*
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
*/

-- Option 3: If table has 'full_name' but needs 'display_name'
/*
ALTER TABLE public.profiles RENAME COLUMN full_name TO display_name;
*/