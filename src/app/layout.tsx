// app/layout.tsx
import type {Metadata, Viewport} from 'next';
import {Toaster} from '@/components/ui/toaster';
import './globals.css';
import '../styles/performance-optimizations.css';
import '../styles/mobile-optimizations.css';
import { GoogleAnalytics } from '@next/third-parties/google'; // Keep this import
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AppLayout } from '@/layouts/app-layout';
import { DevelopmentPerformanceOverlay } from '@/components/dev/performance-overlay-loader';
import { LanguageProvider } from '@/components/providers/language-provider';
import { Kantumruy_Pro } from 'next/font/google';
import Script from 'next/script';

// Optimized font loading - only load commonly used weights
const kantumruy = Kantumruy_Pro({
  subsets: ['latin'], // Load khmer subset on-demand
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: true, // Enable for better CLS
  weight: ['400', '600'], // Only load essential weights
  style: ['normal'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Somleng - Audio Transcription & PDF Tools',
    template: '%s | Somleng',
  },
  description: 'An all-in-one toolkit for audio transcription, text-to-speech, and PDF utilities. Fast, accurate, and easy to use.',
  keywords: ['audio transcription', 'text-to-speech', 'PDF tools', 'voice recognition', 'speech to text'],
  authors: [{ name: 'Somleng Team' }],
  creator: 'Somleng',
  publisher: 'Somleng',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isVercelDeployment = process.env.VERCEL === '1';

  return (
    <html lang="en" className={`${kantumruy.variable}`} suppressHydrationWarning={true}>
      <head>
        {/* Theme is now handled by LanguageProvider to prevent hydration mismatch */}
      </head>
      <body className="min-h-dvh bg-slate-50 font-sans antialiased selection:bg-blue-100 selection:text-blue-950 dark:bg-slate-950 dark:selection:bg-blue-900 dark:selection:text-blue-50">
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to content
        </a>

        {/* REMOVE these manual script tags: */}
        {/* <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-GQPSM8WTZY"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-GQPSM8WTZY');
        </script> */}

        <LanguageProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </LanguageProvider>
        <Toaster />
        {isVercelDeployment ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
        {process.env.NODE_ENV === 'development' ? (
          <DevelopmentPerformanceOverlay />
        ) : null}

        {/* Performance optimization scripts */}
        <Script
          id="performance-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize performance optimizations
              if (typeof window !== 'undefined') {
                // Register service worker
                const registerServiceWorker = async function() {
                  if (
                    typeof window !== 'undefined' &&
                    'serviceWorker' in navigator &&
                    '${process.env.NODE_ENV}' === 'production'
                  ) {
                    try {
                      const registration = await navigator.serviceWorker.register('/sw.js');
                      
                    } catch (registrationError) {
                      
                    }
                  }
                };
                
                // Initialize optimizations
                registerServiceWorker();
              }
            `
          }}
        />

        {/* This is the correct way to add Google Analytics in Next.js App Router */}
        {/* Only render if GA_ID is set, for development environments or conditional loading */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
