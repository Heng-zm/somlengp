import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Test API is working',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      GEMINI_API_KEY_STATUS: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test API POST is working',
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('❌ Test API POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
