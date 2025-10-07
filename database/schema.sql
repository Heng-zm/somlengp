-- =====================================================
-- SomLeng Database Schema
-- Updated: 2025-10-07
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    full_name TEXT,
    phone TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    
    -- Provider information
    provider TEXT DEFAULT 'email',
    provider_id TEXT,
    
    -- Status flags
    is_email_confirmed BOOLEAN DEFAULT false,
    is_phone_confirmed BOOLEAN DEFAULT false,
    is_premium_user BOOLEAN DEFAULT false,
    is_new_user BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL),
    CONSTRAINT profiles_display_name_length CHECK (length(display_name) >= 1 AND length(display_name) <= 50)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_provider_idx ON public.profiles(provider);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx ON public.profiles(updated_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.uid() IS NOT NULL -- Allow authenticated users to query (adjust as needed)
    );

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (
        auth.uid() = id AND
        auth.uid() IS NOT NULL
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        display_name,
        provider,
        is_email_confirmed,
        created_at,
        updated_at,
        last_sign_in_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        NOW(),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_sign_in_at
CREATE OR REPLACE FUNCTION public.handle_user_signin()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last sign in time when last_sign_in_at changes
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        UPDATE public.profiles 
        SET 
            last_sign_in_at = NEW.last_sign_in_at,
            updated_at = NOW(),
            is_new_user = false  -- User has signed in, no longer "new"
        WHERE id = NEW.id;
    END IF;
    
    -- Update email confirmation status
    IF OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at THEN
        UPDATE public.profiles 
        SET 
            is_email_confirmed = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update profile on auth changes
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_signin();

-- =====================================================
-- ADDITIONAL TABLES (Optional - for future features)
-- =====================================================

-- User sessions log (optional - for analytics)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for user_sessions table
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_created_at_idx ON public.user_sessions(created_at);

-- Enable RLS on sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Sessions RLS policy
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- HELPFUL QUERIES FOR DEBUGGING
-- =====================================================

-- Check if profiles table exists and has data
-- SELECT COUNT(*) as profile_count FROM public.profiles;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- View all profiles (admin only)
-- SELECT id, email, display_name, provider, created_at FROM public.profiles ORDER BY created_at DESC;

-- Check auth users
-- SELECT id, email, email_confirmed_at, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Test profile access for current user
-- SELECT * FROM public.profiles WHERE id = auth.uid();

-- =====================================================
-- GRANTS (if needed)
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;

-- =====================================================
-- CLEANUP COMMANDS (for development/testing)
-- =====================================================

-- Uncomment these lines if you need to reset the tables
-- WARNING: This will delete all data!

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
-- DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP FUNCTION IF EXISTS public.handle_user_signin();
-- DROP FUNCTION IF EXISTS public.handle_updated_at();
-- DROP TABLE IF EXISTS public.user_sessions CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;