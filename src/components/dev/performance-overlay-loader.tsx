'use client';

import dynamic from 'next/dynamic';

const PerformanceOverlay = dynamic(
  () =>
    import('@/components/shared/performance-dashboard').then(
      (module) => module.PerformanceOverlay
    ),
  { ssr: false }
);

export function DevelopmentPerformanceOverlay() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <PerformanceOverlay />;
}
