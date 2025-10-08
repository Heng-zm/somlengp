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
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    // Minimize layout shift
    minimumCacheTTL: 86400, // 1 day
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      // Split chunks more efficiently
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
            ui: {
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              name: 'ui',
              priority: 20,
              chunks: 'all',
            },
            features: {
              test: /[\\/]src[\\/](features|components\/features)[\\/]/,
              name: 'features',
              priority: 15,
              chunks: 'all',
            },
          },
        },
      };
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

  // Headers for better security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;