
'use client';

import { useEffect, Suspense, memo } from 'react';
import { useRouter } from 'next/navigation';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function


function LoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <ThreeDotsLoader />
        <p className="text-muted-foreground text-sm">Loading Somleng...</p>
      </div>
    </div>
  );
}

const RootPageComponent = function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Use a small delay to prevent flash
    const timer = setTimeout(() => {
      router.replace('/home');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoadingFallback />
    </Suspense>
  );
}


export default memo(RootPageComponent);