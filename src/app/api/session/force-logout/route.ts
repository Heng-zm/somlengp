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
  const auth = request.headers.get('authorization') || '';
  const token = (process.env.ADMIN_API_TOKEN || '').trim();
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  // Set short-lived broadcast cookie; clients will read via /api/session/state
  res.headers.append('Set-Cookie', cookie('force_logout', '1', { maxAge: 120 }));
  return res;
}
