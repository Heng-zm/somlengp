import 'server-only';

import { NextRequest, NextResponse } from 'next/server';

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function getAllowedOrigins(request: NextRequest): Set<string> {
  const origins = new Set<string>([normalizeOrigin(request.nextUrl.origin)]);
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProtocol =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';

  if (forwardedHost) {
    origins.add(normalizeOrigin(`${forwardedProtocol}://${forwardedHost}`));
  }

  for (const origin of (process.env.ALLOWED_ORIGINS || '').split(',')) {
    if (origin.trim()) {
      origins.add(normalizeOrigin(origin));
    }
  }

  return origins;
}

export function isRequestOriginAllowed(request: NextRequest): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  if (origin) {
    const allowedOrigins = getAllowedOrigins(request);
    return allowedOrigins.has('*') || allowedOrigins.has(normalizeOrigin(origin));
  }

  return fetchSite !== 'cross-site';
}

export function createPreflightResponse(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  const allowed = isRequestOriginAllowed(request);
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  });

  if (allowed && origin) {
    headers.set('Access-Control-Allow-Origin', normalizeOrigin(origin));
  }

  return new NextResponse(null, { status: allowed ? 204 : 403, headers });
}
