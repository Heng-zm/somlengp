import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
  };
  
  return NextResponse.json({
    message: 'Debug API is working',
    timestamp: new Date().toISOString(),
    environment: envVars,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'Debug POST is working',
      receivedBody: body,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    return NextResponse.json({
      error: 'Debug POST error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
