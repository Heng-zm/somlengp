/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Optimize CSS handling
    optimizeCss: true,
  },

  // Turbopack configuration (modern approach)
  turbopack: {
    rules: {
      '*.svg': ['@svgr/webpack'],
    },
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization
  images: {
    // Enable image optimization for better performance
    domains: ['localhost', 'encrypted-tbn0.gstatic.com'],
    formats: ['image/webp', 'image/avif'],
    // Minimize layout shift
    minimumCacheTTL: 86400, // 1 day
    // Allow external images from specific hosts
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Bundle optimization (simplified for memory efficiency)
  webpack: (config, { dev, isServer }) => {
    // Reduce memory usage during build
    if (!dev) {
      // Disable source maps to save memory
      config.devtool = false;
      
      // Simplify chunk splitting
      if (!isServer && config.optimization) {
        config.optimization.splitChunks = {
          chunks: 'all',
          maxInitialRequests: 20,
          maxAsyncRequests: 20,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        };
      }
    }

    // Handle handlebars issue with Genkit
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // Ignore specific warnings
    config.ignoreWarnings = [
      /require.extensions is not supported by webpack/,
      /Module not found: Can't resolve '@genkit-ai\/firebase'/,
    ];

    return config;
  },

  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression

  // ESLint configuration
  eslint: {
    // Only run ESLint on these directories during build
    dirs: ['src'],
    // Don't fail build on ESLint warnings in production
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // TypeScript configuration
  typescript: {
    // Don't fail build on TypeScript errors in production
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // Redirects and rewrites for better UX
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: false,
      },
    ];
  },

  // Enhanced headers for security and performance optimization
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Performance headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      // API routes - no caching
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Static assets - aggressive caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Images - optimized caching
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400',
          },
        ],
      },
      // Fonts - aggressive caching
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // HTML pages - short cache with revalidation
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

// Enable bundle analyzer in development
module.exports = process.env.ANALYZE === 'true' 
  ? require('@next/bundle-analyzer')({ enabled: true })(nextConfig)
  : nextConfig;
