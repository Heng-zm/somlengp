
"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

// Dynamic import with loading component to reduce initial bundle size
const ConvertImageFormatPage = dynamic(
  () => import('@/features/convert-image-format/components/convert-image-format-page').then(mod => ({ default: mod.ConvertImageFormatPage })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    )
  }
);

export default function ConvertImageFormat() {
  return (
    <FeaturePageLayout title="Convert Image Format" showModelSelector={false}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <ConvertImageFormatPage />
      </Suspense>
    </FeaturePageLayout>
  );
}
