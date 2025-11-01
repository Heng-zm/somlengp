import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Apply security headers globally
export function middleware(request: NextRequest) {
  const res = NextResponse.next();

  // Content Security Policy (permissive enough to not break existing inline scripts; tighten over time)
  const csp = [
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
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'payment=()',
    'picture-in-picture=(self)',
    'publickey-credentials-get=(self)',
    'screen-wake-lock=()',
    'sync-xhr=(self)',
    'usb=()',
    'xr-spatial-tracking=()'
  ].join(', '));
  res.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return res;
}

export const config = {
  matcher: [
    // Exclude Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png|sw.js).*)',
  ],
};
