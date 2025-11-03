import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const force = request.cookies.get('force_logout')?.value === '1';
  const role = request.cookies.get('role')?.value || null;
  return NextResponse.json({ forceLogout: force, role });
}
