/**
 * Back Camera Example Component
 * Demonstrates comprehensive back camera usage with all available features
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useBackCamera } from '@/hooks/use-camera-permission';
// Performance optimization needed: Consider memoizing inline styles, inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

export function BackCameraExample() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Using the dedicated back camera hook
  const {
    stream,
    isLoading,
    isSupported,
    hasPermission,
    devices,
    backCameras,
    frontCameras,
    currentFacingMode,
    error,
    requestBackCamera,
    requestBackCameraWithFallback,
    switchFacingMode,
    stopCamera,
    refreshDevices
  } = useBackCamera(false, 'high');

  // Set up video element when stream is available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleStartBackCamera = async () => {
    await requestBackCamera('high');
  };

  const handleStartBackCameraWithFallback = async () => {
    await requestBackCameraWithFallback('high');
  };

  const handleSwitchCamera = async () => {
    await switchFacingMode('high');
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
      }
    }
  };

  const handleDownloadPhoto = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `back-camera-photo-${Date.now()}.png`;
      link.href = capturedImage;
      link.click();
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Camera not supported!</strong>
        <p>Your browser or device doesn&apos;t support camera access.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📸 Back Camera Example
        </h1>
        <p className="text-gray-600">
          Comprehensive back camera functionality with device switching and photo capture
        </p>
      </div>

      {/* Camera Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Camera Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Permission:</span>
            <span className={`ml-2 px-2 py-1 rounded ${
              hasPermission ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {hasPermission ? 'Granted' : 'Denied'}
            </span>
          </div>
          <div>
            <span className="font-medium">Status:</span>
            <span className={`ml-2 px-2 py-1 rounded ${
              stream ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isLoading ? 'Loading...' : stream ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <span className="font-medium">Camera:</span>
            <span className="ml-2">
              {currentFacingMode === 'environment' ? '📷 Back' : 
               currentFacingMode === 'user' ? '🤳 Front' : '❌ None'}
            </span>
          </div>
          <div>
            <span className="font-medium">Devices:</span>
            <span className="ml-2">{devices.length} total</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error.message}
          <br />
          <small>Code: {error.code}</small>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleStartBackCamera}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📷 Start Back Camera
        </button>

        <button
          onClick={handleStartBackCameraWithFallback}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📷 Back Camera (with fallback)
        </button>

        <button
          onClick={handleSwitchCamera}
          disabled={isLoading || !stream}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔄 Switch Camera
        </button>

        <button
          onClick={handleCapturePhoto}
          disabled={!stream}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📸 Capture Photo
        </button>

        <button
          onClick={stopCamera}
          disabled={!stream}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⏹️ Stop Camera
        </button>

        <button
          onClick={refreshDevices}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          🔄 Refresh Devices
        </button>
      </div>

      {/* Device Lists */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Back Cameras */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">📷 Back Cameras ({backCameras.length})</h3>
          {backCameras.length === 0 ? (
            <p className="text-gray-600 text-sm">No back cameras detected</p>
          ) : (
            <ul className="space-y-2">
              {backCameras.map((camera, index) => (
                <li key={camera.deviceId} className="text-sm">
                  <span className="font-medium">Camera {index + 1}:</span>
                  <br />
                  <span className="text-gray-600">{camera.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Front Cameras */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">🤳 Front Cameras ({frontCameras.length})</h3>
          {frontCameras.length === 0 ? (
            <p className="text-gray-600 text-sm">No front cameras detected</p>
          ) : (
            <ul className="space-y-2">
              {frontCameras.map((camera, index) => (
                <li key={camera.deviceId} className="text-sm">
                  <span className="font-medium">Camera {index + 1}:</span>
                  <br />
                  <span className="text-gray-600">{camera.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Video Display */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">
          📹 Live Camera Feed
          {currentFacingMode && (
            <span className="ml-2 text-sm text-gray-300">
              ({currentFacingMode === 'environment' ? 'Back Camera' : 'Front Camera'})
            </span>
          )}
        </h3>
        
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-2xl mx-auto rounded-lg"
            style={{ transform: currentFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
        ) : (
          <div className="w-full max-w-2xl mx-auto h-64 bg-gray-800 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">No camera stream active</p>
          </div>
        )}
      </div>

      {/* Captured Photo */}
      {capturedImage && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">📸 Captured Photo</h3>
            <button
              onClick={handleDownloadPhoto}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              💾 Download
            </button>
          </div>
          <img
            src={capturedImage}
            alt="Captured photo"
            className="w-full max-w-md mx-auto rounded-lg border"
          />
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 How to Use</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
          <li>Click &quot;Start Back Camera&quot; to request access to the rear-facing camera</li>
          <li>Use &quot;Back Camera (with fallback)&quot; for better compatibility across devices</li>
          <li>Click &quot;Switch Camera&quot; to toggle between front and back cameras</li>
          <li>Use &quot;Capture Photo&quot; to take a picture from the current camera feed</li>
          <li>Download captured photos using the download button</li>
          <li>Click &quot;Stop Camera&quot; when you&apos;re done to release the camera</li>
        </ol>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
}

// Simple back camera component for quick usage
export function SimpleBackCameraExample() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, requestBackCamera, stopCamera, isLoading, error } = useBackCamera();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center">Simple Back Camera</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error.message}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => requestBackCamera('high')}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          📷 Start Back Camera
        </button>
        
        <button
          onClick={stopCamera}
          disabled={!stream}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          ⏹️ Stop Camera
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg"
          />
        ) : (
          <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Click &quot;Start Back Camera&quot; to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BackCameraExample;
