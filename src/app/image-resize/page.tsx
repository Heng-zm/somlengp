"use client";

import dynamic from 'next/dynamic';

// Dynamically import the heavy image resize component to reduce initial bundle size
const ImageResizeComponent = dynamic(() => import('@/components/ImageResizeComponent'), {
  loading: () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading image resize tool...</p>
      </div>
    </div>
  ),
  ssr: false // Disable SSR for this component to ensure it's treated as a client component
});

export default function ImageResizePage() {
  return <ImageResizeComponent />;
}