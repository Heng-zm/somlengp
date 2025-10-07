import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  // Only allow this in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoint not available in production' }, { status: 403 })
  }

  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
    currentUrl: requestUrl.origin,
    recommendedCallbackUrl: `${requestUrl.origin}/api/auth/callback`,
    environment: process.env.NODE_ENV,
  }

  return NextResponse.json({
    message: 'Supabase OAuth Configuration Debug',
    config,
    instructions: {
      step1: 'Go to your Supabase project dashboard',
      step2: 'Navigate to Authentication > URL Configuration',
      step3: `Add this URL to Site URL: ${requestUrl.origin}`,
      step4: `Add this URL to Redirect URLs: ${requestUrl.origin}/api/auth/callback`,
      step5: 'Make sure Google OAuth is enabled in Authentication > Providers',
    }
  })
}