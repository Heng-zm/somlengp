import { NextRequest, NextResponse } from 'next/server';

// API route for QR code scanning functionality
// This handles backend QR code processing if needed
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'QR Code Scanner API endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle QR code scanning data if sent from frontend
    if (body.qrData) {
      // Process QR code data here if needed
      return NextResponse.json({
        success: true,
        data: body.qrData,
        processed: true,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }
    
    return NextResponse.json({
      error: 'No QR data provided'
    }, { status: 400 });
    
  } catch (error) {
    console.error('QR Scan API Error:', error);
    return NextResponse.json({
      error: 'Invalid request'
    }, { status: 400 });
  }
}
