# Application Setup Guide

This guide will help you set up the Somleng application properly with all required dependencies and database tables.

## 🚀 Quick Start

### 1. Environment Variables

Copy the example environment file and fill in your actual values:

```bash
cp .env.example .env.local
```

**Required Environment Variables:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Telegram Configuration (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Firebase Configuration (Legacy - for compatibility)
NEXT_PUBLIC_FIREBASE_API_KEY=placeholder-not-used
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=placeholder-not-used  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=placeholder-not-used
```

### 2. Database Setup

#### Supabase Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `supabase-schema.sql`:

```sql
-- This creates all necessary tables, functions, and policies
-- See supabase-schema.sql for the complete setup
```

**Key tables created:**
- `profiles` - User profile data
- `visitor_count` - Analytics data
- Functions: `increment_visitor_count()`, `handle_new_user()`

### 3. API Keys Setup

#### Google AI (Gemini) API

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or select existing one
3. Generate API key
4. Add to `GEMINI_API_KEY` in your `.env.local`

**Important:** The free tier has very limited quota. Consider upgrading for production use.

#### Supabase Setup

1. Create a new project at [Supabase](https://supabase.com/)
2. Get your project URL and anon key from Settings > API
3. Get service role key (keep this secret!)
4. Run the database schema setup (step 2 above)

### 4. OAuth Setup (Optional)

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Enable Google provider in Supabase Authentication settings

### 5. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 6. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Troubleshooting

### Common Issues

#### 1. "visitor_count table not found"
**Solution:** Run the Supabase schema setup (step 2 above)

#### 2. "AI service quota exceeded" 
**Solution:** 
- Check your Google AI API quota in Google Cloud Console
- Upgrade to paid tier if needed
- Wait for quota reset (usually daily)

#### 3. Authentication issues
**Solution:**
- Verify Supabase keys are correct
- Check OAuth provider configuration
- Ensure RLS policies are properly set

#### 4. Profile page crashes with "creationTime" error
**Solution:** This has been fixed in the latest version. The app now properly uses Supabase user object structure.

#### 5. Missing environment variables
**Solution:** Ensure all required environment variables are set in `.env.local`

### Performance Tips

1. **Enable gzip compression** in your deployment platform
2. **Use CDN** for static assets
3. **Monitor bundle size** - framer-motion is included for animations
4. **Database indexing** - Supabase handles most indexing automatically

### Security Checklist

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Service role key kept secret (server-side only)
- ✅ Anon key is safe to use client-side
- ✅ OAuth redirect URIs properly configured
- ✅ CORS settings configured in Supabase

### Production Deployment

1. **Environment Variables:** Set all production values
2. **Domain Configuration:** Update OAuth redirect URIs
3. **Database:** Ensure production database is properly set up
4. **API Quotas:** Upgrade Google AI API quota for production traffic
5. **Analytics:** Configure Google Analytics for production domain

### Database Migrations

If you need to modify the database schema:

1. Make changes in Supabase dashboard
2. Update `supabase-schema.sql` file
3. Test migrations in development first
4. Apply to production during maintenance window

## 📊 Monitoring

The application includes built-in monitoring for:
- Visitor count analytics
- Authentication status
- API error rates
- Performance metrics

## 🔄 Updates

To update the application:
1. Pull latest changes
2. Run `npm install` for new dependencies
3. Check for database schema updates
4. Update environment variables if needed
5. Test in development before deploying

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Framer Motion](https://www.framer.com/motion/)

## 🚨 Important Notes

1. **Firebase Migration:** The app has been fully migrated from Firebase to Supabase. Firebase environment variables are included for compatibility but not used.

2. **API Quotas:** Google AI API has strict quotas on free tier. Monitor usage and upgrade as needed.

3. **Security:** Never commit `.env.local` to version control. Use your deployment platform's environment variable settings.

4. **Performance:** The app uses modern React patterns (hooks, context) and performance optimizations are already in place.