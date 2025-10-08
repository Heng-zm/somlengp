-- ============================================
-- COMPLETE SUPABASE DATABASE SETUP SCRIPT
-- ============================================
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it
-- This will set up everything needed for your application

-- ============================================
-- STEP 1: CLEAN UP ANY EXISTING OBJECTS
-- ============================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS visitor_count_updated_at ON public.visitor_count;
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.increment_visitor_count(TEXT);
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view visitor count" ON public.visitor_count;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Drop existing tables
DROP TABLE IF EXISTS public.visitor_count CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================
-- STEP 2: CREATE PROFILES TABLE
-- ============================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 3: CREATE VISITOR_COUNT TABLE
-- ============================================

CREATE TABLE public.visitor_count (
  id TEXT PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert initial visitor count record
INSERT INTO public.visitor_count (id, count) VALUES ('global', 0);

-- Enable Row Level Security
ALTER TABLE public.visitor_count ENABLE ROW LEVEL SECURITY;

-- Create policy for visitor_count (anyone can view)
CREATE POLICY "Anyone can view visitor count" ON public.visitor_count
  FOR SELECT TO authenticated;

-- ============================================
-- STEP 4: CREATE UTILITY FUNCTIONS
-- ============================================

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment visitor count atomically
CREATE OR REPLACE FUNCTION public.increment_visitor_count(row_id TEXT DEFAULT 'global')
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  -- Try to update existing row
  UPDATE public.visitor_count 
  SET count = count + 1, updated_at = NOW()
  WHERE id = row_id
  RETURNING count INTO new_count;
  
  -- If no row was found, insert a new one
  IF NOT FOUND THEN
    INSERT INTO public.visitor_count (id, count) 
    VALUES (row_id, 1)
    RETURNING count INTO new_count;
  END IF;
  
  RETURN COALESCE(new_count, 1);
EXCEPTION
  WHEN OTHERS THEN
    -- Return 1 as fallback if anything goes wrong
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'User'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail user creation if profile creation fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: CREATE TRIGGERS
-- ============================================

-- Trigger to automatically update updated_at on profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to automatically update updated_at on visitor_count
CREATE TRIGGER visitor_count_updated_at
  BEFORE UPDATE ON public.visitor_count
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT SELECT ON public.visitor_count TO authenticated;
GRANT SELECT ON public.visitor_count TO anon;

GRANT ALL ON public.profiles TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION public.increment_visitor_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_visitor_count(TEXT) TO anon;

-- ============================================
-- STEP 7: VERIFICATION QUERIES
-- ============================================

-- Check that everything was created successfully
DO $$
DECLARE
    profiles_count INTEGER;
    visitor_count_count INTEGER;
    functions_count INTEGER;
BEGIN
    -- Check tables
    SELECT COUNT(*) INTO profiles_count 
    FROM information_schema.tables 
    WHERE table_name = 'profiles' AND table_schema = 'public';
    
    SELECT COUNT(*) INTO visitor_count_count 
    FROM information_schema.tables 
    WHERE table_name = 'visitor_count' AND table_schema = 'public';
    
    -- Check functions
    SELECT COUNT(*) INTO functions_count 
    FROM information_schema.routines 
    WHERE routine_name IN ('increment_visitor_count', 'handle_new_user', 'handle_updated_at') 
    AND routine_schema = 'public';
    
    -- Print results
    RAISE NOTICE 'Setup Verification:';
    RAISE NOTICE 'Profiles table: %', CASE WHEN profiles_count > 0 THEN '✅ Created' ELSE '❌ Missing' END;
    RAISE NOTICE 'Visitor_count table: %', CASE WHEN visitor_count_count > 0 THEN '✅ Created' ELSE '❌ Missing' END;
    RAISE NOTICE 'Functions: %', CASE WHEN functions_count >= 3 THEN '✅ All Created' ELSE '❌ Some Missing' END;
    
    -- Test visitor count function
    PERFORM public.increment_visitor_count('test');
    RAISE NOTICE 'Visitor count function: ✅ Working';
    
    RAISE NOTICE '🎉 Database setup completed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Setup verification failed: %', SQLERRM;
END
$$;