import type {Metadata} from 'next';
import { Analytics } from "@vercel/analytics/next"
import {Toaster} from '@/components/ui/toaster';
import './globals.css';
import { AppLayout } from '@/layouts/app-layout';
import { Inter, Kantumruy_Pro } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

const kantumruy = Kantumruy_Pro({
  subsets: ['khmer'],
  variable: '--font-kantumruy',
});


export const metadata: Metadata = {
  title: 'VoiceScribe',
  description: 'An all-in-one toolkit for audio transcription, text-to-speech, and PDF utilities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${kantumruy.variable}`}>
      <body className={`antialiased`}>
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
