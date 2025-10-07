import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  customClaims?: Record<string, any>;
}

export interface AuthRequest extends NextRequest {
  user?: AuthenticatedUser;
}

/**
 * Middleware to verify Supabase JWT tokens
 */
export async function verifyAuthToken(request: NextRequest): Promise<{
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  status?: number;
}> {
  try {
    // Create Supabase client for server-side auth verification
    const supabase = createServerSupabaseClient();

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Authorization header missing or invalid format',
        status: 401
      };
    }

    const token = authHeader.substring(7);
    if (!token) {
      return {
        success: false,
        error: 'Invalid token',
        status: 401
      };
    }

    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        success: false,
        error: 'Invalid or expired token',
        status: 401
      };
    }

    return {
      success: true,
      user: {
        uid: user.id,
        email: user.email,
        emailVerified: !!user.email_confirmed_at,
        customClaims: user.user_metadata
      }
    };
  } catch (error: any) {
    console.error('Token verification error:', error);
    return {
      success: false,
      error: 'Authentication verification failed',
      status: 500
    };
  }
}

/**
 * Higher-order function to protect API routes with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await verifyAuthToken(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString()
        },
        { status: authResult.status || 401 }
      );
    }
    
    if (!authResult.user) {
      return NextResponse.json(
        { 
          error: 'User data not found',
          code: 'USER_DATA_MISSING',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
    return handler(request, authResult.user, ...args);
  };
}

/**
 * Simple rate limiting implementation
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string, 
  maxRequests: number, 
  windowMs: number
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}