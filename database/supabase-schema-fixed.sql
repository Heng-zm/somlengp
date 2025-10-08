-- Supabase Database Schema - Fixed Version
-- Run these queries one by one in your Supabase SQL Editor

-- STEP 1: Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- STEP 4: Create visitor_count table
CREATE TABLE IF NOT EXISTS public.visitor_count (
  id TEXT PRIMARY KEY,
  count BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 5: Insert initial visitor count record (separate query)
INSERT INTO public.visitor_count (id, count) 
SELECT 'global', 0
WHERE NOT EXISTS (SELECT 1 FROM public.visitor_count WHERE id = 'global');

-- STEP 6: Enable RLS on visitor_count
ALTER TABLE public.visitor_count ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create policies for visitor_count
CREATE POLICY "Anyone can view visitor count" ON public.visitor_count
  FOR SELECT TO authenticated;

-- STEP 8: Create helper functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 9: Create triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER visitor_count_updated_at
  BEFORE UPDATE ON public.visitor_count
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- STEP 10: Create increment function
CREATE OR REPLACE FUNCTION public.increment_visitor_count(row_id TEXT DEFAULT 'global')
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE public.visitor_count 
  SET count = count + 1, updated_at = NOW()
  WHERE id = row_id
  RETURNING count INTO new_count;
  
  -- If no row was updated, try to insert
  IF new_count IS NULL THEN
    BEGIN
      INSERT INTO public.visitor_count (id, count) VALUES (row_id, 1);
      new_count := 1;
    EXCEPTION WHEN unique_violation THEN
      -- If insert fails due to race condition, try update again
      UPDATE public.visitor_count 
      SET count = count + 1, updated_at = NOW()
      WHERE id = row_id
      RETURNING count INTO new_count;
    END;
  END IF;
  
  RETURN COALESCE(new_count, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 11: Create new user handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Log error but don't fail the user creation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 12: Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();