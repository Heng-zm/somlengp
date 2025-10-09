// app/layout.tsx
import type {Metadata, Viewport} from 'next';
import {Toaster} from '@/components/ui/toaster';
import './globals.css';
import '../styles/performance-optimizations.css';
import { GoogleAnalytics } from '@next/third-parties/google'; // Keep this import
import { Analytics } from '@vercel/analytics/next';
import { AppLayout } from '@/layouts/app-layout';
import { PerformanceOverlay } from '@/components/shared/performance-dashboard';
import { LanguageProvider } from '@/components/providers/language-provider';
import { Kantumruy_Pro } from 'next/font/google';
import Script from 'next/script';

// Firebase has been fully migrated to Supabase - no need for status checks anymore

const kantumruy = Kantumruy_Pro({
  subsets: ['khmer', 'latin'],
  variable: '--font-sans',
  display: 'swap',
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
  adjustFontFallback: false,
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevent zoom to avoid input focus zoom
  userScalable: false, // Disable user zoom to prevent input focus zoom
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(240 10% 99%)' },
    { media: '(prefers-color-scheme: dark)', color: 'hsl(224 71% 4%)' },
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
  return (
    <html lang="en" className={`${kantumruy.variable}`} suppressHydrationWarning={true}>
      <head>
        {/* Theme is now handled by LanguageProvider to prevent hydration mismatch */}
      </head>
      <body className={`antialiased font-sans`}>
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
        <Analytics />
        <PerformanceOverlay />

        {/* This is the correct way to add Google Analytics in Next.js App Router */}
        {/* Only render if GA_ID is set, for development environments or conditional loading */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
