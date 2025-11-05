/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'react-syntax-highlighter',
      'recharts'
    ],
    // Enable optimized page loading
    scrollRestoration: true,
  },
  
  // Server external packages
  serverExternalPackages: ['pdf-lib', 'jszip', 'qrcode', 'sharp'],

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        pathname: '/**',
      },
    ],
  },

  // Enhanced bundle optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Disable source maps for smaller bundles
      config.devtool = false;
      
      // Enhanced chunk splitting
      if (!isServer && config.optimization) {
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            // Framework core (React/Next)
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler)[\\/]/,
              name: 'framework',
              priority: 50,
              enforce: true,
              reuseExistingChunk: true,
            },
            
            // Radix UI components (common UI library)
            radixUI: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              priority: 40,
              minChunks: 2,
            },
            
            // Icons and visual libraries
            icons: {
              test: /[\\/]node_modules[\\/](lucide-react|@radix-ui\/react-icons)[\\/]/,
              name: 'icons',
              priority: 35,
            },
            
            // Heavy file processing libs (lazy load these)
            fileProcessing: {
              test: /[\\/]node_modules[\\/](pdf-lib|jszip|docx|qrcode|jsqr)[\\/]/,
              name: 'file-processing',
              priority: 30,
              enforce: true,
            },
            
            // AI and analytics
            aiAnalytics: {
              test: /[\\/]node_modules[\\/](@genkit-ai|@google\/generative-ai|@vercel\/(analytics|speed-insights))[\\/]/,
              name: 'ai-analytics',
              priority: 25,
            },
            
            // Supabase
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              priority: 23,
            },
            
            // Markdown and syntax highlighting
            markdown: {
              test: /[\\/]node_modules[\\/](react-markdown|react-syntax-highlighter|rehype-|remark-)[\\/]/,
              name: 'markdown',
              priority: 20,
            },
            
            // Animation libraries
            animations: {
              test: /[\\/]node_modules[\\/](framer-motion|embla-carousel)[\\/]/,
              name: 'animations',
              priority: 18,
            },
            
            // Other vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              minChunks: 2,
            },
            
            // Common modules
            commons: {
              name: 'commons',
              minChunks: 3,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
          // Optimize chunk sizes
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          minSize: 20000,
          maxSize: 244000,
        };
        
        // Enable module concatenation (scope hoisting)
        config.optimization.concatenateModules = true;
        
        // Minimize duplicate code
        config.optimization.usedExports = true;
        config.optimization.sideEffects = true;
      }
    }

    // Handle polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Ignore warnings
    config.ignoreWarnings = [
      /require.extensions is not supported by webpack/,
      /Module not found: Can't resolve '@genkit-ai\/firebase'/,
    ];

    return config;
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  
  // Output configuration
  output: 'standalone',

  // ESLint configuration
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: false,
      },
    ];
  },

  // Enhanced headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
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
      // API routes - no caching
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

// Enable bundle analyzer
let finalConfig = nextConfig;

if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = (await import('@next/bundle-analyzer')).default({
    enabled: true,
  });
  finalConfig = withBundleAnalyzer(nextConfig);
}

export default finalConfig;
