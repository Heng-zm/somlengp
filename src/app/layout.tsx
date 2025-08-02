import type {Metadata, Viewport} from 'next';
import {Toaster} from '@/components/ui/toaster';
import './globals.css';
 import { GoogleAnalytics } from '@next/third-parties/google';
import { AppLayout } from '@/layouts/app-layout';
import { Kantumruy_Pro } from 'next/font/google';

const kantumruy = Kantumruy_Pro({
  subsets: ['khmer', 'latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(240 10% 99%)' },
    { media: '(prefers-color-scheme: dark)', color: 'hsl(224 71% 4%)' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'VoiceScribe - Audio Transcription & PDF Tools',
    template: '%s | VoiceScribe',
  },
  description: 'An all-in-one toolkit for audio transcription, text-to-speech, and PDF utilities. Fast, accurate, and easy to use.',
  keywords: ['audio transcription', 'text-to-speech', 'PDF tools', 'voice recognition', 'speech to text'],
  authors: [{ name: 'VoiceScribe Team' }],
  creator: 'VoiceScribe',
  publisher: 'VoiceScribe',
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
    <html lang="en" className={`${kantumruy.variable}`}>
      <body className={`antialiased font-sans`}>
        <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-GQPSM8WTZY"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-GQPSM8WTZY');
</script>
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
