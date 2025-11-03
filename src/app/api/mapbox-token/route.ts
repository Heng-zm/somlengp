import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.MAPBOX_PUBLIC_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
  // Do not cache in any layer
  const headers = {
    'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'pragma': 'no-cache',
    'surrogate-control': 'no-store',
  } as Record<string, string>;

  if (!token) {
    return NextResponse.json({ token: null }, { headers });
  }
  // Return token only when requested at runtime; still public but not bundled in payload
  return NextResponse.json({ token }, { headers });
}
