import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter per IP for API routes
const RATE_LIMIT = Number(process.env.API_RATE_LIMIT_REQUESTS || 60); // requests
const RATE_WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000); // 60s

const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const rec = buckets.get(key);
  if (!rec || now > rec.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true };
  }
  if (rec.count < RATE_LIMIT) {
    rec.count += 1;
    return { ok: true };
  }
  return { ok: false, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/api/')) return NextResponse.next();

  const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { ok, retryAfter } = rateLimit(ip);
  if (!ok) {
    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter || 60),
      },
    });
  }

  const res = NextResponse.next();

  // Add strict security headers for API responses
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'no-referrer');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // CORS: restrict to allowlist if provided
  const origin = req.headers.get('origin') || '';
  if (allowedOrigins.length > 0) {
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      res.headers.set('Access-Control-Allow-Origin', origin || '*');
    } else {
      res.headers.set('Access-Control-Allow-Origin', 'null');
    }
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};