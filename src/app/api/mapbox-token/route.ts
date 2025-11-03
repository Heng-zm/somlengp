import { NextResponse } from 'next/server';

// Disabled endpoint to avoid exposing Mapbox tokens; always returns 404
export async function GET() {
  return NextResponse.json({ error: 'Not Found' }, {
    status: 404,
    headers: {
      'cache-control': 'no-store',
    },
  });
}
