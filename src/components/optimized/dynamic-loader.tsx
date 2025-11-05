'use client';

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';

// Loading skeleton component
const LoadingSkeleton = ({ height = '400px' }: { height?: string }) => (
  <div 
    className="w-full bg-muted animate-pulse rounded-lg"
    style={{ height }}
    role="status"
    aria-label="Loading content"
  />
);

// Generic dynamic loader with optimized settings
export function createDynamicComponent<P = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
    height?: string;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || (() => <LoadingSkeleton height={options?.height} />),
    ssr: options?.ssr ?? false,
  });
}

// Pre-configured heavy component loaders
export const DynamicPDFViewer = createDynamicComponent(
  () => import('@/components/features/pdf/pdf-viewer'),
  { height: '600px', ssr: false }
);

export const DynamicQRScanner = createDynamicComponent(
  () => import('@/components/features/qr/qr-scanner'),
  { height: '400px', ssr: false }
);

export const DynamicImageEditor = createDynamicComponent(
  () => import('@/components/features/image/image-editor'),
  { height: '500px', ssr: false }
);

export const DynamicAIChat = createDynamicComponent(
  () => import('@/components/features/ai/ai-chat'),
  { height: '600px', ssr: false }
);

export const DynamicMarkdownRenderer = createDynamicComponent(
  () => import('@/components/features/markdown/markdown-renderer'),
  { height: '300px', ssr: false }
);

// Preload component when user hovers or focuses
export function preloadComponent(importFn: () => Promise<any>) {
  return () => {
    importFn();
  };
}
