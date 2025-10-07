import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // If there's an error in the callback, redirect to login with error
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin))
  }

  // If no code is provided, redirect to login
  if (!code) {
    console.error('No authorization code provided in callback')
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
  }

  try {
    // Create a Supabase client for server-side auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin))
    }

    if (!data.session) {
      console.error('No session returned after code exchange')
      return NextResponse.redirect(new URL('/login?error=no_session', requestUrl.origin))
    }

    // Create response to redirect to profile page
    const response = NextResponse.redirect(new URL('/profile?auth=success', requestUrl.origin))

    // Set the session cookies
    response.cookies.set('supabase-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in
    })

    response.cookies.set('supabase-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return response

  } catch (error) {
    console.error('Unexpected error during auth callback:', error)
    return NextResponse.redirect(new URL('/login?error=unexpected_error', requestUrl.origin))
  }
}