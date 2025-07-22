import type {Metadata} from 'next';
import { Analytics } from "@vercel/analytics/next"
import {Toaster} from '@/components/ui/toaster';
import './globals.css';
import { AppLayout } from '@/layouts/app-layout';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
