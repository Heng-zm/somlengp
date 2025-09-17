/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Performance-optimized Next.js configuration
const performanceConfig = {
  // Production optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Enhanced output configuration for better performance
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Advanced compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    // Remove React development tools in production
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-testid$', '^data-test$']
    } : false,
  },

  // Image optimization with WebP/AVIF support
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Enhanced experimental features for performance
  experimental: {
    // Modern bundling optimizations
    esmExternals: true,
    serverComponentsExternalPackages: ['lodash', 'moment'],
    optimizeCss: true,
    
    // Server actions optimization
    serverActions: {
      bodySizeLimit: '2mb',
    },
    
    // Advanced package import optimization
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons', 
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      'date-fns',
      'recharts',
      'framer-motion'
    ],
    
    // Turbo optimizations
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Advanced webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production-only optimizations
    if (!dev && !isServer) {
      // Advanced bundle splitting strategy
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 200000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 15,
        maxInitialRequests: 10,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          
          // Core React chunk
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 30,
            chunks: 'all',
            enforce: true,
          },
          
          // Next.js framework chunk
          next: {
            test: /[\\/]node_modules[\\/]next[\\/]/,
            name: 'next',
            priority: 25,
            chunks: 'all',
            enforce: true,
          },
          
          // UI libraries chunk
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: 'ui-libs',
            priority: 20,
            chunks: 'all',
            maxSize: 150000,
            enforce: true,
          },
          
          // Utility libraries chunk
          utils: {
            test: /[\\/]node_modules[\\/](date-fns|lodash|clsx|class-variance-authority)[\\/]/,
            name: 'utils',
            priority: 15,
            chunks: 'all',
            enforce: true,
          },
          
          // Chart libraries chunk  
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            name: 'charts',
            priority: 10,
            chunks: 'all',
            enforce: true,
          },
          
          // Animation libraries chunk
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|lottie-react)[\\/]/,
            name: 'animations',
            priority: 10,
            chunks: 'all',
            enforce: true,
          },
          
          // Firebase chunk
          firebase: {
            test: /[\\/]node_modules[\\/]firebase[\\/]/,
            name: 'firebase',
            priority: 20,
            chunks: 'all',
            maxSize: 200000,
            enforce: true,
          },
          
          // Large vendor libraries
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 5,
            chunks: 'all',
            maxSize: 200000,
            enforce: true,
          },
        },
      };

      // Advanced module concatenation
      config.optimization.concatenateModules = true;
      
      // Tree shaking optimization
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Performance hints
      config.performance = {
        hints: 'warning',
        maxEntrypointSize: 512000, // 500KB
        maxAssetSize: 512000, // 500KB
      };
    }

    // Advanced module resolution for better tree shaking
    config.resolve.alias = {
      ...config.resolve.alias,
      // Optimize lodash imports
      'lodash': 'lodash-es',
      // Use ES modules version of date-fns
      'date-fns': 'date-fns/esm',
    };

    // Ignore moment.js locale files to reduce bundle size
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    // Optimize CSS
    config.module.rules.push({
      test: /\.css$/,
      use: [
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1,
          },
        },
      ],
    });

    return config;
  },

  // Headers for better caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // Performance headers
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for better SEO and performance
  async redirects() {
    return [
      // Remove trailing slashes
      {
        source: '/(.*)//',
        destination: '/$1',
        permanent: true,
      },
    ];
  },

  // Environment variables optimization
  env: {
    // Disable Next.js telemetry
    NEXT_TELEMETRY_DISABLED: '1',
  },

  // TypeScript configuration for better tree shaking
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint optimization
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = withBundleAnalyzer(performanceConfig);