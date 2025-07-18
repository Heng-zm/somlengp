import { NextResponse } from 'next/server';

// This is an in-memory counter. It will reset whenever the server instance restarts.
// In a serverless environment, this means the count is not persistent or shared
// across different instances. It's used here only to provide a base number
// for the client-side counting logic.
let visitorCount = 0; 

export async function GET() {
    try {
        // The count is not incremented here. The GET endpoint's only job is to
        // provide a starting number to new clients.
        return NextResponse.json({ success: true, count: visitorCount });
    } catch (error) {
        console.error('Error fetching visitor count:', error);
        return NextResponse.json(
            { success: false, message: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
