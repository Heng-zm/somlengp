
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// In-memory cache for visitor count
interface CacheEntry {
  count: number;
  timestamp: number;
}

let visitorCountCache: CacheEntry | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAP = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 100; // Max requests per hour per IP
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

interface VisitorData {
  count: number;
}

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const clientRate = RATE_LIMIT_MAP.get(ip);
  
  if (!clientRate) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (now > clientRate.resetTime) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (clientRate.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  clientRate.count++;
  return true;
}

// Cache management
function getCachedCount(): number | null {
  if (!visitorCountCache) return null;
  
  const now = Date.now();
  if (now - visitorCountCache.timestamp > CACHE_DURATION) {
    visitorCountCache = null;
    return null;
  }
  
  return visitorCountCache.count;
}

function setCachedCount(count: number): void {
  visitorCountCache = {
    count,
    timestamp: Date.now()
  };
}

// Get client IP address
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

async function getCount(): Promise<number> {
  // Placeholder implementation - visitor_count table not configured
  // Return a mock count for now
  return Math.floor(Math.random() * 1000) + 100; // Random count between 100-1099
}

async function incrementCount(): Promise<number> {
  // Placeholder implementation - just return a slightly higher mock count
  const currentCount = await getCount();
  return currentCount + Math.floor(Math.random() * 5) + 1; // Increment by 1-5
}


export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '3600',
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }
    
    const newCount = await incrementCount();
    
    // Update cache after successful increment
    setCachedCount(newCount);
    
    return NextResponse.json(
      { success: true, count: newCount },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Error in POST /api/visit:', error);
    return NextResponse.json(
      { success: false, message: 'An internal error occurred while updating the count.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const ip = getClientIP(request);
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '3600',
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }
    
    // Try to get from cache first
    let count = getCachedCount();
    
    if (count === null) {
      // Cache miss, fetch from database
      count = await getCount();
      setCachedCount(count);
    }
    
    return NextResponse.json(
      { success: true, count: count },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutes
          'ETag': `"${count}-${Date.now()}"`,
          'X-Cache': count === getCachedCount() ? 'HIT' : 'MISS'
        }
      }
    );
  } catch (error) {
    console.error('Error in GET /api/visit:', error);
    return NextResponse.json(
      { success: false, message: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
