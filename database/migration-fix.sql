-- =====================================================
-- DATABASE MIGRATION FIX
-- Adds missing columns and fixes schema issues
-- Run this if you get "column does not exist" errors
-- =====================================================

-- First, let's check what columns exist in profiles table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- ADD MISSING COLUMNS TO PROFILES TABLE
-- =====================================================

-- Add is_active column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add other potentially missing columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS provider_id TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_phone_confirmed BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Ensure both display_name and full_name exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- =====================================================
-- DROP PROBLEMATIC POLICIES
-- =====================================================

-- Drop the policy that's causing the error
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;

-- =====================================================
-- CREATE SAFE POLICIES
-- =====================================================

-- Create a simple public viewable policy without is_active check
CREATE POLICY "Public profiles viewable" ON public.profiles
    FOR SELECT USING (display_name IS NOT NULL);

-- =====================================================
-- UPDATE EXISTING DATA
-- =====================================================

-- Update is_active for all existing profiles
UPDATE public.profiles 
SET is_active = true 
WHERE is_active IS NULL;

-- Copy display_name to full_name if full_name is null
UPDATE public.profiles 
SET full_name = display_name 
WHERE full_name IS NULL AND display_name IS NOT NULL;

-- Copy full_name to display_name if display_name is null
UPDATE public.profiles 
SET display_name = full_name 
WHERE display_name IS NULL AND full_name IS NOT NULL;

-- Set default display_name from email if both are null
UPDATE public.profiles 
SET display_name = split_part(email, '@', 1)
WHERE display_name IS NULL AND full_name IS NULL AND email IS NOT NULL;

-- =====================================================
-- ADD CONSTRAINTS (SAFE)
-- =====================================================

-- Add constraints only if they don't exist
DO $$
BEGIN
    -- Add email constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_email_check' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_email_check 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);
    END IF;

    -- Add display_name length constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_display_name_length' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_display_name_length 
        CHECK (length(display_name) >= 1 AND length(display_name) <= 100);
    END IF;

    -- Add phone format constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_phone_format' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_phone_format 
        CHECK (phone ~ '^[\+]?[0-9\-\s\(\)]*$' OR phone IS NULL);
    END IF;
END $$;

-- =====================================================
-- ADD INDEXES (SAFE)
-- =====================================================

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_provider_idx ON public.profiles(provider);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx ON public.profiles(updated_at);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles(is_active);

-- =====================================================
-- VERIFY THE FIX
-- =====================================================

-- Check the updated table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Test the policy
SELECT COUNT(*) as profile_count 
FROM public.profiles 
WHERE display_name IS NOT NULL;

SELECT 'Migration completed successfully! ✅' as status,
       'All missing columns have been added.' as message,
       NOW() as completed_at;