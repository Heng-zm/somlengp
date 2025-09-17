import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
// Initialize Firebase Admin SDK if not already initialized
let initializationError: Error | null = null;
if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    // Check if we have service account credentials
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId) {
      throw new Error('Firebase project ID is required. Set FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID.');
    }
    if (clientEmail && privateKey) {
      // Validate credentials format
      if (!clientEmail.includes('@') || !privateKey.includes('BEGIN PRIVATE KEY')) {
        throw new Error('Invalid Firebase service account credentials format');
      }
      // Initialize with service account credentials (production/local with service account)
      initializeApp({
        projectId: projectId,
        credential: cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      if (process.env.NODE_ENV === 'development') {
      }
    } else {
      const missingVars = [];
      if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
      if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
      console.warn(`Firebase Admin SDK missing credentials: ${missingVars.join(', ')}`);
      const error = new Error(`Firebase Admin SDK requires service account credentials for token verification. Missing: ${missingVars.join(', ')}`);
      initializationError = error;
      throw error;
    }
  } catch (error) {
    initializationError = error as Error;
    console.error('Failed to initialize Firebase Admin SDK:', error);
    // Don't throw here to allow the module to load, but store the error for later handling
  }
}
// Export a function to check initialization status
export function getFirebaseInitializationError(): Error | null {
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
    // Check if Firebase initialization failed
    const initError = getFirebaseInitializationError();
    if (initError) {
      return {
        success: false,
        error: 'Firebase authentication is not properly configured',
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
    // Verify the token with Firebase Admin SDK
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token, true); // checkRevoked = true
    if (!decodedToken) {
      return {
        success: false,
        error: 'Token verification failed',
        status: 401
      };
    }
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decodedToken.exp < now) {
      return {
        success: false,
        error: 'Token has expired',
        status: 401
      };
    }
    // Check if token was issued too far in the past (optional security measure)
    const maxTokenAge = 24 * 60 * 60; // 24 hours in seconds
    if (now - decodedToken.iat > maxTokenAge) {
      return {
        success: false,
        error: 'Token is too old, please re-authenticate',
        status: 401
      };
    }
    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified || false,
        customClaims: decodedToken
      }
    };
  } catch (error: any) {
    console.error('Token verification error:', error);
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return {
        success: false,
        error: 'Token has expired, please re-authenticate',
        status: 401
      };
    }
    if (error.code === 'auth/id-token-revoked') {
      return {
        success: false,
        error: 'Token has been revoked, please re-authenticate',
        status: 401
      };
    }
    if (error.code === 'auth/invalid-id-token') {
      return {
        success: false,
        error: 'Invalid token format or signature',
        status: 401
      };
    }
    if (error.code === 'auth/project-not-found') {
      return {
        success: false,
        error: 'Firebase project configuration error',
        status: 500
      };
    }
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