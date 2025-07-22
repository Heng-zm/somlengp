import type {Metadata} from 'next';
import { Analytics } from "@vercel/analytics/next"
import {Toaster} from '@/components/ui/toaster';
import './globals.css';
import { AppLayout } from '@/layouts/app-layout';
import { Kantumruy_Pro } from 'next/font/google';

const kantumruy = Kantumruy_Pro({
  subsets: ['khmer', 'latin'],
  variable: '--font-sans',
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
    <html lang="en" className={`${kantumruy.variable}`}>
      <body className={`antialiased font-sans`}>
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
