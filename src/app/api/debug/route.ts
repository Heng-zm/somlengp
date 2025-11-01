import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
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
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  try {
    const body = await request.json();
    // Redact potentially sensitive fields
    const redacted = (() => {
      try {
        const copy = JSON.parse(JSON.stringify(body || {}));
        if (Array.isArray(copy?.messages)) copy.messages = `[${copy.messages.length}] messages`;
        if (copy?.file) copy.file = '[redacted]';
        return copy;
      } catch {
        return '[unserializable]';
      }
    })();
    return NextResponse.json({
      message: 'Debug POST is working',
      receivedBody: redacted,
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
