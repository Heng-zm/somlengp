
'use client';

import { useEffect, Suspense, memo } from 'react';
import { useRouter } from 'next/navigation';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';
import { useFontLoadingOptimization } from '@/lib/font-optimization';
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
  
  // Initialize font loading optimization
  useFontLoadingOptimization();

  useEffect(() => {
    // Preload critical route
    router.prefetch('/home');
    
    // Use a small delay to prevent flash and allow fonts to load
    const timer = setTimeout(() => {
      router.replace('/home');
    }, 150);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoadingFallback />
    </Suspense>
  );
}


export default memo(RootPageComponent);