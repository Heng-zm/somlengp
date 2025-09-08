"use client";

import dynamic from 'next/dynamic';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the TextToolsPage to reduce initial bundle size
const TextToolsPage = dynamic(
  () => import('@/features/text-tools/components/text-tools-page').then(mod => ({ default: mod.TextToolsPage })),
  {
    loading: () => (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function TextTools() {
  return (
    <FeaturePageLayout title="Text Tools" showModelSelector={false}>
      <TextToolsPage />
    </FeaturePageLayout>
  );
}
