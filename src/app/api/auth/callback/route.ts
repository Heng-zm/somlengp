import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  
  // Debug logging
  console.log('Auth callback received:', {
    url: requestUrl.toString(),
    searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
    code: code ? 'present' : 'missing',
    error: error || 'none'
  })

  // If there's an error in the callback, redirect to login with error
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin))
  }

  // If no code is provided, check if this is a direct access attempt
  if (!code) {
    // Check referer to see if this was a direct access
    const referer = request.headers.get('referer')
    const userAgent = request.headers.get('user-agent')
    
    console.warn('Auth callback accessed without code:', {
      referer,
      userAgent: userAgent?.substring(0, 100),
      searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
      timestamp: new Date().toISOString()
    })
    
    // If it's a direct browser access (no referer or same origin referer), 
    // just redirect silently without logging as error
    if (!referer || new URL(referer).origin === requestUrl.origin) {
      return NextResponse.redirect(new URL('/login?info=callback_direct_access', requestUrl.origin))
    }
    
    // Otherwise log as error
    console.error('No authorization code provided in callback')
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
  }

  try {
    // Create a Supabase client for server-side auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
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

    // Set the session cookies using Next.js standard approach
    response.cookies.set({
      name: 'sb-access-token',
      value: data.session.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in,
      path: '/'
    })

    response.cookies.set({
      name: 'sb-refresh-token',
      value: data.session.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Unexpected error during auth callback:', error)
    return NextResponse.redirect(new URL('/login?error=unexpected_error', requestUrl.origin))
  }
}