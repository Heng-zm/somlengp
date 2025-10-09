// Font optimization utilities for better performance
import { Kantumruy_Pro, Inter } from 'next/font/google';

// Optimized primary font with better fallbacks and display strategy
export const kantumruyPro = Kantumruy_Pro({
  subsets: ['khmer', 'latin'],
  variable: '--font-kantumruy',
  display: 'swap', // Ensures text is visible during font load
  preload: true,
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Arial',
    'sans-serif'
  ],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  adjustFontFallback: false, // Better size matching with fallbacks
});

// Secondary font for better performance
export const interFont = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false, // Only preload primary font
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Arial',
    'sans-serif'
  ],
  weight: ['300', '400', '500', '600'],
  style: ['normal'],
});

// Font preload links for critical fonts
export const getFontPreloadLinks = () => [
  {
    rel: 'preload',
    href: '/_next/static/media/kantumruy-pro-latin-400-normal.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous'
  },
  {
    rel: 'preload',
    href: '/_next/static/media/kantumruy-pro-latin-600-normal.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous'
  }
];

// CSS for font-display optimization
export const fontDisplayCSS = `
  /* Ensure fast font loading */
  @font-face {
    font-family: 'Kantumruy Pro';
    font-display: swap;
  }
  
  /* Minimize layout shift */
  .font-loading {
    font-size: 16px;
    line-height: 1.5;
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  .font-loaded {
    font-family: var(--font-kantumruy), system-ui, -apple-system, sans-serif;
  }
`;

// Font loading optimization hook
export const useFontLoadingOptimization = () => {
  if (typeof window !== 'undefined') {
    // Add font-loaded class when fonts are ready
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        document.documentElement.classList.add('fonts-loaded');
      });
    }

    // Fallback timeout for older browsers
    setTimeout(() => {
      document.documentElement.classList.add('fonts-loaded');
    }, 3000);
  }
};