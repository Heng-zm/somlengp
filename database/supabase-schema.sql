-- Supabase Database Schema
-- Run this in your Supabase SQL Editor to create missing tables

-- 1. Create profiles table for user profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create visitor_count table for analytics
CREATE TABLE IF NOT EXISTS public.visitor_count (
  id TEXT PRIMARY KEY DEFAULT 'global',
  count BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial visitor count record
INSERT INTO public.visitor_count (id, count) VALUES ('global', 0)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for visitor_count
ALTER TABLE public.visitor_count ENABLE ROW LEVEL SECURITY;

-- Create policies for visitor_count (read-only for authenticated users, admin for updates)
CREATE POLICY "Anyone can view visitor count" ON public.visitor_count
  FOR SELECT TO authenticated;

-- 3. Create the increment function for atomic visitor count updates
CREATE OR REPLACE FUNCTION public.increment_visitor_count(row_id TEXT DEFAULT 'global')
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE public.visitor_count 
  SET count = count + 1, updated_at = NOW()
  WHERE id = row_id
  RETURNING count INTO new_count;
  
  -- If no row was updated, insert a new one
  IF new_count IS NULL THEN
    INSERT INTO public.visitor_count (id, count) 
    VALUES (row_id, 1)
    ON CONFLICT (id) DO UPDATE SET count = visitor_count.count + 1, updated_at = NOW()
    RETURNING count INTO new_count;
  END IF;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to automatically update profiles updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER visitor_count_updated_at
  BEFORE UPDATE ON public.visitor_count
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Create function to handle new user profile creation
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();