import { NextResponse } from 'next/server';

// Returns Mapbox public token from environment variable
// This is safe because it's a public token restricted to specific domains
export async function GET() {
  const token = process.env.MAPBOX_PUBLIC_TOKEN;
  
  if (!token) {
    return NextResponse.json(
      { error: 'Mapbox token not configured' },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { token },
    {
      headers: {
        'cache-control': 'public, max-age=3600', // Cache for 1 hour
      },
    }
  );
}
