import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// Initialize Supabase Admin client
let supabaseAdmin: ReturnType<typeof createClient> | null = null;
let initializationError: Error | null = null;

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
} catch (error) {
  initializationError = error as Error;
  console.error('Failed to initialize Supabase Admin client:', error);
}

// Export a function to check initialization status
export function getSupabaseInitializationError(): Error | null {
  return initializationError;
}
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
 * Middleware to verify Firebase ID tokens
 */
export async function verifyAuthToken(request: NextRequest): Promise<{
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  status?: number;
}> {
  try {
    // Check if Supabase initialization failed
    const initError = getSupabaseInitializationError();
    if (initError || !supabaseAdmin) {
      return {
        success: false,
        error: 'Supabase authentication is not properly configured',
        status: 503
      };
    }
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Authorization header missing or invalid format',
        status: 401
      };
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    if (!token || token.trim().length === 0) {
      return {
        success: false,
        error: 'Token is empty or invalid',
        status: 401
      };
    }
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return {
        success: false,
        error: 'Token verification failed',
        status: 401
      };
    }
    
    return {
      success: true,
      user: {
        uid: user.id,
        email: user.email,
        emailVerified: !!user.email_confirmed_at,
        customClaims: user.user_metadata || {}
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
 * Middleware to check for admin privileges
 */
export function requireAdmin(user: AuthenticatedUser): boolean {
  return !!(user.customClaims?.admin === true);
}
/**
 * Middleware to check for moderator privileges
 */
export function requireModerator(user: AuthenticatedUser): boolean {
  return !!(user.customClaims?.admin === true || user.customClaims?.moderator === true);
}
/**
 * Rate limiting helper (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();
export function checkRateLimit(userId: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userKey = userId;
  const userLimit = requestCounts.get(userKey);
  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(userKey, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (userLimit.count >= maxRequests) {
    return false;
  }
  userLimit.count++;
  return true;
}
/**
 * Input validation helper
 */
export function validateRequest(data: any, requiredFields: string[]): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object' };
  }
  for (const field of requiredFields) {
    if (!(field in data) || data[field] == null) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  return { valid: true };
}