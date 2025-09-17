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
    removeConsole: process.env.NODE_ENV === 'production', // Only remove console logs in production
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
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Optimize bundle
  poweredByHeader: false,
  compress: true,
  
  // Security headers
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://va.vercel-scripts.com https://apis.google.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.google.com https://firebase.googleapis.com https://*.firebaseio.com https://www.google-analytics.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://firebasestorage.googleapis.com https://*.googleapis.com https://vercel.live https://va.vercel-scripts.com; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  
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
      config.cache = {
        type: 'memory'
      };
    }
    
    // Ignore handlebars warnings for require.extensions
    config.ignoreWarnings = [
      /require\.extensions is not supported by webpack/,
    ];
    
    // Enhanced bundle splitting for better performance
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
            maxSize: 300000, // Further reduced to break large chunks
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
          // Firebase Core
          firebase: {
            test: /[\\/]node_modules[\\/]firebase[\\/]/,
            name: 'firebase',
            priority: 15,
            chunks: 'all',
            maxSize: 250000,
            enforce: true,
          },
          // Firebase Firestore (separate chunk)
          firestore: {
            test: /[\\/]node_modules[\\/]firebase[\\/]firestore/,
            name: 'firestore',
            priority: 20,
            chunks: 'all',
            maxSize: 200000,
            enforce: true,
          },
          // AI libraries
          ai: {
            test: /[\\/]node_modules[\\/](@genkit-ai|@google)[\\/]/,
            name: 'ai',
            priority: 5,
            chunks: 'all',
            maxSize: 200000,
            enforce: true,
          },
        },
      },
    };
    
    return config;
  },
};

module.exports = nextConfig;
