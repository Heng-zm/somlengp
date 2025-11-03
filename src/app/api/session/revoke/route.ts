import { NextRequest, NextResponse } from 'next/server';

function cookie(name: string, value: string, opts: { maxAge?: number; path?: string; httpOnly?: boolean; sameSite?: 'lax'|'strict'|'none'; secure?: boolean } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push(`Path=${opts.path || '/'}`);
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  parts.push(`SameSite=${(opts.sameSite || 'lax').toString().charAt(0).toUpperCase() + (opts.sameSite || 'lax').toString().slice(1)}`);
  if (opts.secure !== false) parts.push('Secure');
  return parts.join('; ');
}

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ ok: true });
  // Clear session + broadcast flag
  res.headers.append('Set-Cookie', cookie('sid', '', { maxAge: 0 }));
  // Optional broadcast cookie that clients poll in /api/session/state
  const broadcast = request.headers.get('x-broadcast-logout') === '1';
  if (broadcast) {
    res.headers.append('Set-Cookie', cookie('force_logout', '1', { maxAge: 120 }));
  }
  return res;
}
