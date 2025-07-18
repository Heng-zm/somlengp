
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Define the path to the file where the visitor count will be stored.
// Using path.join with process.cwd() ensures a correct, absolute path 
// that works reliably in different environments.
const countFilePath = path.join(process.cwd(), 'visitor_data.json');

interface VisitorData {
  count: number;
}

async function getCount(): Promise<number> {
  try {
    const data = await fs.readFile(countFilePath, 'utf-8');
    const jsonData: VisitorData = JSON.parse(data);
    return jsonData.count || 0;
  } catch (error: any) {
    // If the file doesn't exist or is invalid JSON, it's the first run.
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      return 0;
    }
    // For any other errors, re-throw them.
    throw error;
  }
}

async function setCount(count: number): Promise<void> {
  const data: VisitorData = { count };
  await fs.writeFile(countFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST() {
  try {
    let currentCount = await getCount();
    currentCount++;
    await setCount(currentCount);
    return NextResponse.json({ success: true, count: currentCount });
  } catch (error) {
    console.error('Error processing visitor count:', error);
    // If there's an error, we can't guarantee the count, so return an error response.
    return NextResponse.json(
      { success: false, message: 'An internal error occurred while updating the count.' },
      { status: 500 }
    );
  }
}

export async function GET() {
    try {
        const count = await getCount();
        return NextResponse.json({ success: true, count: count });
    } catch (error) {
        console.error('Error fetching visitor count:', error);
        return NextResponse.json(
            { success: false, message: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
