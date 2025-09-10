/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Remove standalone output for Vercel deployment
  // output: 'standalone', // Only needed for self-hosted deployments
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Performance optimizations
  compiler: {
    removeConsole: true, // Remove console logs in all environments
  },
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    // Ensure all routes work with Firebase App Hosting
    serverActions: {
      bodySizeLimit: '50mb', // Increase to 50mb for large image files
    },
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      'framer-motion',
      'recharts'
    ],
    // Enable turbopack for faster builds (replaces deprecated turbo)
    // Moved to config.turbopack as per Next.js warning
  },
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Optimize bundle
  poweredByHeader: false,
  compress: true,
  
  webpack: (config, { isServer, dev }) => {
    // Handle handlebars and other Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      
      // Web Workers are handled via fallback in use-qr-worker.ts
      // Next.js can load workers with new URL(..., import.meta.url) in development
      // For production, we use a blob URL fallback with embedded jsQR
    }
    
    // Fix CSS loading issues in development
    if (dev && !isServer) {
      // Ensure proper CSS handling in development mode
      config.cache = false;
    }
    
    // Ignore handlebars warnings for require.extensions
    config.ignoreWarnings = [
      /require\.extensions is not supported by webpack/,
    ];
    
    // Enhanced bundle splitting for better performance - simplified to fix text-tools lambda issue
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 30000,
        maxSize: 400000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 15, // Reduced from 30
        maxInitialRequests: 15, // Reduced from 30
        enforceSizeThreshold: 100000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
            maxSize: 400000, // Reduced from 500000
            enforce: true, // Force creation even if minSize is not met
          },
          // Separate React and React-DOM
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 20,
            chunks: 'all',
            enforce: true,
          },
          // Separate UI libraries
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: 'ui',
            priority: 15,
            chunks: 'all',
            enforce: true,
          },
          // Charts library
          charts: {
            test: /[\\/]node_modules[\\/](recharts)[\\/]/,
            name: 'charts',
            priority: 10,
            chunks: 'all',
            enforce: true,
          },
          // AI and Firebase libraries
          ai: {
            test: /[\\/]node_modules[\\/](@genkit-ai|firebase)[\\/]/,
            name: 'ai',
            priority: 5,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    };
    
    return config;
  },
};

module.exports = nextConfig;
