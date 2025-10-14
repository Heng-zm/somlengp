'use client';

import { Metadata } from 'next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  siteName?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  canonical?: string;
  alternateUrls?: { [key: string]: string };
}

const DEFAULT_SEO = {
  title: 'Somleng - Audio Transcription & PDF Tools',
  description: 'An all-in-one toolkit for audio transcription, text-to-speech, and PDF utilities. Fast, accurate, and easy to use.',
  keywords: ['audio transcription', 'text-to-speech', 'PDF tools', 'voice recognition', 'speech to text', 'QR code generator'],
  siteName: 'Somleng',
  author: 'Somleng Team',
  type: 'website' as const,
  image: '/images/og-image.png'
};

// Utility function to generate page-specific metadata
export const generatePageSEO = {
  homepage: (): Metadata => ({
    title: 'Home | Somleng',
    description: 'Transform your audio and documents with Somleng\'s powerful tools. Audio transcription, text-to-speech, PDF utilities, and QR code generation.',
    keywords: ['audio transcription', 'text-to-speech', 'PDF tools', 'QR generator', 'voice recognition'],
    openGraph: {
      title: 'Home | Somleng',
      description: 'Transform your audio and documents with Somleng\'s powerful tools.',
      type: 'website'
    }
  }),
  
  qrGenerator: (): Metadata => ({
    title: 'QR Code Generator | Somleng',
    description: 'Generate custom QR codes for URLs, text, WiFi, and more. Fast, free, and easy to use QR code generator with logo support.',
    keywords: ['QR code generator', 'QR codes', 'barcode generator', 'custom QR codes', 'QR with logo'],
    openGraph: {
      title: 'QR Code Generator | Somleng',
      description: 'Generate custom QR codes for URLs, text, WiFi, and more.',
      type: 'website'
    }
  }),
  
  aiAssistant: (): Metadata => ({
    title: 'AI Assistant | Somleng',
    description: 'Get intelligent help with your tasks using our advanced AI assistant. Powered by the latest language models.',
    keywords: ['AI assistant', 'artificial intelligence', 'chatbot', 'language model', 'AI help'],
    openGraph: {
      title: 'AI Assistant | Somleng',
      description: 'Get intelligent help with your tasks using our advanced AI assistant.',
      type: 'website'
    }
  }),
  
  transcription: (): Metadata => ({
    title: 'Audio Transcription | Somleng',
    description: 'Convert audio to text with high accuracy. Support for multiple formats and languages.',
    keywords: ['audio transcription', 'speech to text', 'voice recognition', 'audio to text'],
    openGraph: {
      title: 'Audio Transcription | Somleng',
      description: 'Convert audio to text with high accuracy.',
      type: 'website'
    }
  }),
  
  pdfTools: (): Metadata => ({
    title: 'PDF Tools | Somleng',
    description: 'Comprehensive PDF utilities including merge, split, convert, and compress.',
    keywords: ['PDF tools', 'PDF merger', 'PDF converter', 'PDF utilities'],
    openGraph: {
      title: 'PDF Tools | Somleng',
      description: 'Comprehensive PDF utilities including merge, split, convert, and compress.',
      type: 'website'
    }
  })
};
