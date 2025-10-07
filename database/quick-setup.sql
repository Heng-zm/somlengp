-- =====================================================
-- QUICK SETUP - Essential Tables Only
-- Run this first if you want to get started quickly
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE (Essential)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    full_name TEXT, -- Keep both for compatibility
    avatar_url TEXT,
    provider TEXT DEFAULT 'email',
    is_email_confirmed BOOLEAN DEFAULT false,
    is_premium_user BOOLEAN DEFAULT false,
    is_new_user BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sign_in_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- =====================================================
-- ESSENTIAL FUNCTIONS
-- =====================================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        display_name,
        full_name,
        provider,
        is_email_confirmed
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VISITS TABLE (For your existing app)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_path TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    referrer TEXT,
    duration INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for visits
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert visits" ON public.visits
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own visits" ON public.visits
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

GRANT ALL ON public.visits TO authenticated;
GRANT INSERT ON public.visits TO anon;

SELECT 'Quick setup complete! ✅' as status;