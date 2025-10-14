import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
}

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Maximum requests per window
}

export function withCache(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000 } = options; // Default 5 minutes

  return function cacheMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      // Generate cache key
      const url = req.url;
      const method = req.method;
      const cacheKey = options.key || `${method}:${url}`;

      // Check if we have a cached response
      const cached = apiCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log(`📦 Cache hit for ${cacheKey}`);
        return NextResponse.json(cached.data, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': `public, max-age=${Math.floor((cached.ttl - (Date.now() - cached.timestamp)) / 1000)}`,
          },
        });
      }

      // Execute the handler
      const response = await handler(req);
      
      // Only cache successful GET responses
      if (method === 'GET' && response.status === 200) {
        try {
          const data = await response.json();
          apiCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl,
          });
          console.log(`💾 Cached response for ${cacheKey}`);
          
          return NextResponse.json(data, {
            headers: {
              'X-Cache': 'MISS',
              'Cache-Control': `public, max-age=${Math.floor(ttl / 1000)}`,
            },
          });
        } catch (error) {
          // If response is not JSON, return as is
          return response;
        }
      }

      return response;
    };
  };
}

export function withRateLimit(options: RateLimitOptions = {}) {
  const { windowMs = 15 * 60 * 1000, max = 100 } = options; // Default: 100 requests per 15 minutes

  return function rateLimitMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      // Get client identifier (IP address)
      const clientId = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetTime < windowStart) {
          rateLimitStore.delete(key);
        }
      }

      // Check current rate limit
      const current = rateLimitStore.get(clientId);
      if (current) {
        if (current.resetTime > windowStart) {
          current.count++;
          if (current.count > max) {
            return NextResponse.json(
              { error: 'Rate limit exceeded' },
              { 
                status: 429,
                headers: {
                  'Retry-After': Math.ceil(windowMs / 1000).toString(),
                  'X-RateLimit-Limit': max.toString(),
                  'X-RateLimit-Remaining': '0',
                  'X-RateLimit-Reset': (current.resetTime + windowMs).toString(),
                },
              }
            );
          }
        } else {
          current.count = 1;
          current.resetTime = now + windowMs;
        }
      } else {
        rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
      }

      const response = await handler(req);
      
      // Add rate limit headers
      const remaining = Math.max(0, max - (rateLimitStore.get(clientId)?.count || 0));
      response.headers.set('X-RateLimit-Limit', max.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());

      return response;
    };
  };
}

export function withCompression() {
  return function compressionMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const response = await handler(req);
      
      // Add compression headers for static assets
      const acceptEncoding = req.headers.get('accept-encoding');
      if (acceptEncoding?.includes('gzip')) {
        response.headers.set('Content-Encoding', 'gzip');
      }
      
      return response;
    };
  };
}

export function withPerformanceHeaders() {
  return function performanceMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const startTime = Date.now();
      const response = await handler(req);
      const duration = Date.now() - startTime;
      
      // Add performance timing header
      response.headers.set('Server-Timing', `api;dur=${duration}`);
      
      return response;
    };
  };
}

// Combine multiple middleware
export function withApiOptimizations(options: {
  cache?: CacheOptions;
  rateLimit?: RateLimitOptions;
  enableCompression?: boolean;
  enablePerformanceHeaders?: boolean;
} = {}) {
  return function combinedMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
    let wrappedHandler = handler;

    if (options.enablePerformanceHeaders !== false) {
      wrappedHandler = withPerformanceHeaders()(wrappedHandler);
    }

    if (options.enableCompression !== false) {
      wrappedHandler = withCompression()(wrappedHandler);
    }

    if (options.rateLimit) {
      wrappedHandler = withRateLimit(options.rateLimit)(wrappedHandler);
    }

    if (options.cache) {
      wrappedHandler = withCache(options.cache)(wrappedHandler);
    }

    return wrappedHandler;
  };
}

// Cleanup function to prevent memory leaks
export function cleanupApiCache(maxAge: number = 60 * 60 * 1000) {
  const now = Date.now();
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp > maxAge) {
      apiCache.delete(key);
    }
  }
}

// Auto cleanup every hour
if (typeof window === 'undefined') {
  setInterval(() => cleanupApiCache(), 60 * 60 * 1000);
}