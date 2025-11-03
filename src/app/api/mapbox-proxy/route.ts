import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_PREFIX = [/^\/styles\//, /^\/sprites\//, /^\/fonts\//, /^\/tiles\//, /^\/v4\//];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.searchParams.get('path') || '';

  // Basic validation to prevent SSRF
  if (!ALLOWED_PREFIX.some((re) => re.test(path))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const token = process.env.MAPBOX_PUBLIC_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 });
  }

  const upstream = new URL(`https://api.mapbox.com${path}`);
  // Ensure token is present and override any provided one
  upstream.searchParams.set('access_token', token);

  try {
    const upstreamRes = await fetch(upstream.toString(), {
      // Forward method headers if needed later; currently GET only
      headers: {
        // Forward basic content negotiators as needed
        'accept': req.headers.get('accept') || '*/*',
      },
      cache: 'no-store',
    });

    const resHeaders = new Headers(upstreamRes.headers);
    resHeaders.set('cache-control', 'public, max-age=300, s-maxage=600');
    resHeaders.delete('set-cookie');

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: resHeaders,
    });
  } catch (e) {
    return new NextResponse('Upstream error', { status: 502 });
  }
}
