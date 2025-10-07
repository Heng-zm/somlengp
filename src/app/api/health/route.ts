import { NextResponse } from 'next/server';

// Health check endpoint for deployment testing
export async function GET() {
  const healthInfo = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || 'unknown',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    deployment: {
      vercel: !!process.env.VERCEL,
      netlify: !!process.env.NETLIFY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      docker: !!process.env.DOCKER_CONTAINER
    }
  };

  return NextResponse.json(healthInfo, { status: 200 });
}
