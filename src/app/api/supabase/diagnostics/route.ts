import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      config: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      },
      tests: [] as any[]
    }

    // Test 1: Environment Variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      diagnostics.tests.push({
        name: 'Environment Variables',
        status: 'FAIL',
        error: 'Missing required environment variables',
        details: {
          missingVars: [
            !process.env.NEXT_PUBLIC_SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
            !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
          ].filter(Boolean)
        }
      })
      
      return NextResponse.json(diagnostics)
    }

    // Test 2: Client Creation
    let supabase
    try {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      diagnostics.tests.push({
        name: 'Client Creation',
        status: 'PASS',
        message: 'Supabase client created successfully'
      })
    } catch (error) {
      diagnostics.tests.push({
        name: 'Client Creation',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return NextResponse.json(diagnostics)
    }

    // Test 3: Auth Connection
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error && !error.message.includes('session_not_found')) {
        throw error
      }
      diagnostics.tests.push({
        name: 'Auth Connection',
        status: 'PASS',
        message: 'Auth service accessible',
        details: {
          hasSession: !!data.session,
          userId: data.session?.user?.id || null
        }
      })
    } catch (error) {
      diagnostics.tests.push({
        name: 'Auth Connection',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: Database Connection (simple test)
    try {
      // Try a simple query that doesn't depend on specific tables
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)
      
      if (error) {
        throw error
      }
      
      diagnostics.tests.push({
        name: 'Database Connection',
        status: 'PASS',
        message: 'Database is accessible',
        details: {
          canQuery: true
        }
      })
    } catch (error) {
      diagnostics.tests.push({
        name: 'Database Connection',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 5: Profiles Table Access (the failing query)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (error) {
        throw error
      }
      
      diagnostics.tests.push({
        name: 'Profiles Table Access',
        status: 'PASS',
        message: 'Profiles table accessible',
        details: {
          hasData: !!data && data.length > 0,
          rowCount: data?.length || 0
        }
      })
    } catch (error) {
      const err = error as any
      diagnostics.tests.push({
        name: 'Profiles Table Access',
        status: 'FAIL',
        error: err.message,
        details: {
          code: err.code,
          hint: err.hint,
          details: err.details
        }
      })
    }

    return NextResponse.json(diagnostics)
    
  } catch (error) {
    return NextResponse.json({
      error: 'Diagnostics failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}