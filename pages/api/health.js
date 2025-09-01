// Health check endpoint for deployment testing
export default function handler(req, res) {
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
      firebase: !!process.env.FIREBASE_CONFIG,
      docker: !!process.env.DOCKER_CONTAINER
    }
  };

  res.status(200).json(healthInfo);
}
