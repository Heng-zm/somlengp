-- =====================================================
-- COMPLETE SUPABASE DATABASE SCHEMA
-- SomLeng Project - Full Database Setup
-- Run this entire script in your Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- DROP EXISTING TABLES (for clean setup)
-- =====================================================

-- Uncomment these lines if you want to start fresh
-- WARNING: This will delete all existing data!
/*
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.visits CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
DROP TRIGGER IF EXISTS on_comment_updated ON public.comments;
DROP TRIGGER IF EXISTS on_feedback_updated ON public.feedback;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_signin();
DROP FUNCTION IF EXISTS public.handle_updated_at();
*/

-- =====================================================
-- PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    full_name TEXT, -- Keep both for compatibility
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
    is_active BOOLEAN DEFAULT true,
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL),
    CONSTRAINT profiles_display_name_length CHECK (length(display_name) >= 1 AND length(display_name) <= 100),
    CONSTRAINT profiles_phone_format CHECK (phone ~ '^[\+]?[0-9\-\s\(\)]*$' OR phone IS NULL)
);

-- Add indexes for profiles table
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_provider_idx ON public.profiles(provider);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx ON public.profiles(updated_at);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles(is_active);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    page_path TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    
    -- Status and moderation
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
    
    -- Engagement metrics
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT comments_content_length CHECK (length(content) >= 1 AND length(content) <= 5000),
    CONSTRAINT comments_likes_positive CHECK (likes >= 0),
    CONSTRAINT comments_dislikes_positive CHECK (dislikes >= 0),
    CONSTRAINT comments_replies_count_positive CHECK (replies_count >= 0)
);

-- Add indexes for comments table
CREATE INDEX IF NOT EXISTS comments_author_id_idx ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS comments_page_path_idx ON public.comments(page_path);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_status_idx ON public.comments(status);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at);

-- =====================================================
-- FEEDBACK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general', 'complaint', 'suggestion')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed', 'rejected')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Assignment
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    attachments JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT feedback_subject_length CHECK (length(subject) >= 1 AND length(subject) <= 200),
    CONSTRAINT feedback_message_length CHECK (length(message) >= 1 AND length(message) <= 10000),
    CONSTRAINT feedback_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Add indexes for feedback table
CREATE INDEX IF NOT EXISTS feedback_type_idx ON public.feedback(type);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON public.feedback(status);
CREATE INDEX IF NOT EXISTS feedback_priority_idx ON public.feedback(priority);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at);
CREATE INDEX IF NOT EXISTS feedback_assigned_to_idx ON public.feedback(assigned_to);

-- =====================================================
-- VISITS TABLE (Analytics)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_path TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    
    -- Request information
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    
    -- Geographic information
    country TEXT,
    city TEXT,
    region TEXT,
    timezone TEXT,
    
    -- Visit metrics
    duration INTEGER DEFAULT 0, -- in seconds
    page_views INTEGER DEFAULT 1,
    bounce_rate DECIMAL(5,4),
    
    -- Device information
    device_type TEXT, -- desktop, mobile, tablet
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT visits_duration_positive CHECK (duration >= 0),
    CONSTRAINT visits_page_views_positive CHECK (page_views >= 1),
    CONSTRAINT visits_bounce_rate_valid CHECK (bounce_rate >= 0 AND bounce_rate <= 1)
);

-- Add indexes for visits table
CREATE INDEX IF NOT EXISTS visits_page_path_idx ON public.visits(page_path);
CREATE INDEX IF NOT EXISTS visits_user_id_idx ON public.visits(user_id);
CREATE INDEX IF NOT EXISTS visits_session_id_idx ON public.visits(session_id);
CREATE INDEX IF NOT EXISTS visits_created_at_idx ON public.visits(created_at);
CREATE INDEX IF NOT EXISTS visits_country_idx ON public.visits(country);
CREATE INDEX IF NOT EXISTS visits_device_type_idx ON public.visits(device_type);

-- =====================================================
-- USER SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE,
    
    -- Session information
    provider TEXT,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    
    -- Session status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT user_sessions_expires_future CHECK (expires_at > created_at)
);

-- Add indexes for user_sessions table
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_token_idx ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS user_sessions_active_idx ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS user_sessions_expires_idx ON public.user_sessions(expires_at);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Notification content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'announcement')),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    
    -- Action (optional)
    action_url TEXT,
    action_text TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT notifications_title_length CHECK (length(title) >= 1 AND length(title) <= 200),
    CONSTRAINT notifications_message_length CHECK (length(message) >= 1 AND length(message) <= 1000)
);

-- Add indexes for notifications table
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON public.notifications(type);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- Public read access for basic profile info (optional)
CREATE POLICY "Public profiles viewable" ON public.profiles
    FOR SELECT USING (is_active = true AND display_name IS NOT NULL);

-- COMMENTS POLICIES
CREATE POLICY "Anyone can view approved comments" ON public.comments
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can insert comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (auth.uid() = author_id);

-- FEEDBACK POLICIES
CREATE POLICY "Users can insert feedback" ON public.feedback
    FOR INSERT WITH CHECK (true); -- Allow anonymous feedback

CREATE POLICY "Users can view own feedback" ON public.feedback
    FOR SELECT USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- VISITS POLICIES
CREATE POLICY "Allow insert visits" ON public.visits
    FOR INSERT WITH CHECK (true); -- Allow anonymous visits tracking

CREATE POLICY "Users can view own visits" ON public.visits
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- USER SESSIONS POLICIES
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

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

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        display_name,
        full_name,
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
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        NOW(),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user signin updates
CREATE OR REPLACE FUNCTION public.handle_user_signin()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last sign in time when last_sign_in_at changes
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        UPDATE public.profiles 
        SET 
            last_sign_in_at = NEW.last_sign_in_at,
            updated_at = NOW(),
            is_new_user = false
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

-- Function to update comment reply count
CREATE OR REPLACE FUNCTION public.update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        UPDATE public.comments 
        SET replies_count = replies_count + 1 
        WHERE id = NEW.parent_id;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
        UPDATE public.comments 
        SET replies_count = GREATEST(replies_count - 1, 0) 
        WHERE id = OLD.parent_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Triggers for updated_at
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_comment_updated ON public.comments;
CREATE TRIGGER on_comment_updated
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_feedback_updated ON public.feedback;
CREATE TRIGGER on_feedback_updated
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Triggers for user management
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_signin();

-- Trigger for comment replies count
DROP TRIGGER IF EXISTS on_comment_reply_change ON public.comments;
CREATE TRIGGER on_comment_reply_change
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_comment_replies_count();

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Tables permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.feedback TO authenticated;
GRANT ALL ON public.visits TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- Anonymous permissions (limited)
GRANT INSERT ON public.feedback TO anon;
GRANT INSERT ON public.visits TO anon;
GRANT SELECT ON public.comments TO anon;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions 
    WHERE expires_at < NOW() OR (last_accessed_at < NOW() - INTERVAL '30 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'comments_count', COALESCE(c.count, 0),
        'feedback_count', COALESCE(f.count, 0),
        'visits_count', COALESCE(v.count, 0),
        'last_visit', v.last_visit,
        'member_since', p.created_at
    ) INTO stats
    FROM public.profiles p
    LEFT JOIN (
        SELECT author_id, COUNT(*) as count 
        FROM public.comments 
        WHERE author_id = user_uuid 
        GROUP BY author_id
    ) c ON c.author_id = p.id
    LEFT JOIN (
        SELECT COUNT(*) as count 
        FROM public.feedback 
        WHERE email = (SELECT email FROM public.profiles WHERE id = user_uuid)
    ) f ON true
    LEFT JOIN (
        SELECT user_id, COUNT(*) as count, MAX(created_at) as last_visit
        FROM public.visits 
        WHERE user_id = user_uuid 
        GROUP BY user_id
    ) v ON v.user_id = p.id
    WHERE p.id = user_uuid;
    
    RETURN COALESCE(stats, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INITIAL DATA SETUP (Optional)
-- =====================================================

-- Insert sample notification types (optional)
-- INSERT INTO public.notifications (user_id, title, message, type) VALUES
-- (null, 'Welcome!', 'Welcome to SomLeng. Thanks for joining us!', 'announcement');

-- =====================================================
-- HELPFUL QUERIES FOR DEBUGGING
-- =====================================================

-- Check all tables
-- SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public';

-- Check functions
-- SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public';

-- Check triggers
-- SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Test profile access
-- SELECT * FROM public.profiles WHERE id = auth.uid();

-- Check table sizes
-- SELECT 
--     schemaname,
--     tablename,
--     attname,
--     n_distinct,
--     most_common_vals
-- FROM pg_stats 
-- WHERE schemaname = 'public';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Database schema created successfully! 🎉' as status,
       'All tables, policies, functions, and triggers are ready.' as message,
       NOW() as created_at;