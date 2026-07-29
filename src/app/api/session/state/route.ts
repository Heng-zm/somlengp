import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const force = request.cookies.get('force_logout')?.value === '1';
  const role = request.cookies.get('role')?.value || null;
  const response = NextResponse.json({ forceLogout: force, role });

  // Treat the broadcast flag as a one-shot signal. Leaving it set would force
  // every subsequent poll and page load to sign out again for two minutes.
  if (force) {
    response.cookies.set('force_logout', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}
