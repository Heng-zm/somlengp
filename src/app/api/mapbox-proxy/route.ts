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
      headers: {
        'accept': req.headers.get('accept') || '*/*',
        'accept-encoding': 'identity',
      },
    });

    if (!upstreamRes.ok) {
      return new NextResponse(`Upstream returned ${upstreamRes.status}`, { 
        status: upstreamRes.status 
      });
    }

    // Get the response as a stream to avoid memory issues and corruption
    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
    const body = upstreamRes.body;

    const resHeaders = new Headers();
    resHeaders.set('content-type', contentType);
    resHeaders.set('cache-control', 'public, max-age=3600, immutable');
    resHeaders.set('access-control-allow-origin', '*');
    
    // Don't set content-length - let the response handle it
    // Remove headers that might cause issues
    resHeaders.delete('content-encoding');
    resHeaders.delete('transfer-encoding');
    resHeaders.delete('set-cookie');

    return new NextResponse(body, {
      status: 200,
      headers: resHeaders,
    });
  } catch (e) {
    console.error('Mapbox proxy error:', e);
    return new NextResponse('Proxy error', { status: 502 });
  }
}
