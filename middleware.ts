import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Apply security and CORS headers globally
export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const isProd = process.env.NODE_ENV === 'production';
  const pathname = request.nextUrl.pathname || '/';
  const isApi = pathname.startsWith('/api');

  // Content Security Policy (keep permissive to avoid breaking; tighten later)
  const cspDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' https: data:",
    "connect-src 'self' https: blob:",
    "media-src 'self' https: blob:",
    "frame-src 'self' https:",
    "worker-src 'self' blob:",
    "form-action 'self'",
  ];
  if (isProd) cspDirectives.push('upgrade-insecure-requests');
  const csp = cspDirectives.join('; ');

  const cspHeaderName = isProd ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
  res.headers.set(cspHeaderName, csp);

  // Security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=(self)',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=(self)',
    'midi=()',
    'payment=()',
    'picture-in-picture=(self)',
    'publickey-credentials-get=(self)',
    'screen-wake-lock=()',
    'sync-xhr=(self)',
    'usb=()',
    'xr-spatial-tracking=()'
  ].join(', '));
  if (isProd) {
    res.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'off');

  // Basic CORS for API routes (override per-route as needed)
  if (isApi) {
    const origin = request.headers.get('origin') || '';
    const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const allowOrigin = allowed.length === 0 ? '*' : (allowed.includes('*') || allowed.includes(origin) ? origin : 'null');
    res.headers.set('Access-Control-Allow-Origin', allowOrigin);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return res;
}

export const config = {
  matcher: [
    // Exclude Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png|sw.js).*)',
  ],
};
