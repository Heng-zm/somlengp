import { NextResponse } from 'next/server';

function cookie(name: string, value: string, opts: { maxAge?: number; path?: string; httpOnly?: boolean; sameSite?: 'lax'|'strict'|'none'; secure?: boolean } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push(`Path=${opts.path || '/'}`);
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  parts.push(`SameSite=${(opts.sameSite || 'lax').toString().charAt(0).toUpperCase() + (opts.sameSite || 'lax').toString().slice(1)}`);
  if (opts.secure !== false) parts.push('Secure');
  return parts.join('; ');
}

export async function POST() {
  const ttl = Number(process.env.NEXT_PUBLIC_SESSION_TTL_SECONDS || 900); // default 15 minutes
  const expiresIn = ttl;
  const res = NextResponse.json({ ok: true, expiresIn });
  res.headers.append('Set-Cookie', cookie('sid', 'active', { maxAge: ttl, sameSite: 'lax', secure: true }));
  return res;
}
