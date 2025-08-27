'use client';

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSimpleCamera } from '@/hooks/use-camera-permission';

/**
 * Simple example component showing how to use the camera permission utilities
 */
export function CameraExample() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const {
    stream,
    isLoading,
    isSupported,
    hasPermission,
    error,
    requestPermission,
    stopCamera
  } = useSimpleCamera();

  // Connect stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    } else if (videoRef.current && !stream) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const handleStartCamera = async () => {
    await requestPermission();
  };

  if (!isSupported) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-2">Camera Not Supported</h3>
        <p className="text-red-700 text-sm">
          Camera access is not supported in this browser or requires HTTPS.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg space-y-4">
      <h3 className="text-lg font-semibold text-center">📷 Simple Camera Example</h3>
      
      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {!stream ? (
          <Button 
            onClick={handleStartCamera} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? '⏳' : '📹'} Start Camera
          </Button>
        ) : (
          <Button 
            onClick={stopCamera} 
            variant="destructive"
            className="flex items-center gap-2"
          >
            ⏹️ Stop Camera
          </Button>
        )}
      </div>

      {/* Video Preview */}
      {stream && (
        <div className="bg-black rounded-lg p-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 className="text-red-800 font-medium text-sm mb-1">Error:</h4>
          <p className="text-red-700 text-sm">{error.message}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 text-sm">Requesting camera access...</span>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="text-center text-sm text-gray-600">
        Status: {hasPermission ? '✅ Permission granted' : '❌ Permission needed'}
      </div>
    </div>
  );
}
