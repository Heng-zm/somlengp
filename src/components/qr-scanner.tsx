'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { useBackCamera } from '@/hooks/use-camera-permission';

interface QRScannerProps {
  onScanSuccess?: (data: string) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
  className?: string;
}

export function QRScanner({ onScanSuccess, onScanError, onClose, className = '' }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string>('');
  const scanIntervalRef = useRef<NodeJS.Timeout>();

  const {
    stream,
    isLoading,
    isSupported,
    hasPermission,
    error,
    requestBackCameraWithFallback,
    stopCamera
  } = useBackCamera(true, 'high'); // Auto-start camera immediately

  // Set up video element when stream is available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      startScanning();
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      stopCamera();
    };
  }, [stopCamera]);

  const startScanning = useCallback(() => {
    if (!isScanning) {
      setIsScanning(true);
      scanIntervalRef.current = setInterval(() => {
        scanQRCode();
      }, 300); // Scan every 300ms
    }
  }, [isScanning]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = undefined;
    }
  }, []);

  const scanQRCode = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data from canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR codes
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && code.data !== lastScannedData) {
        setLastScannedData(code.data);
        stopScanning();
        onScanSuccess?.(code.data);
      }
    } catch (error) {
      console.error('QR scanning error:', error);
      onScanError?.('Failed to scan QR code');
    }
  }, [lastScannedData, onScanSuccess, onScanError, stopScanning]);

  const handleStopScanning = () => {
    stopScanning();
    stopCamera();
    onClose?.();
  };

  if (!isSupported) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <h3 className="text-red-800 font-semibold text-lg mb-2">Camera Not Supported</h3>
        <p className="text-red-700 text-center text-sm mb-4">
          Camera access is not supported in this browser or requires HTTPS.
        </p>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-2xl overflow-hidden ${className}`}>
      {/* Video Preview */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ minHeight: '400px', maxHeight: '600px' }}
        />
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Scanning Frame */}
            <div className="w-64 h-64 border-2 border-white/50 rounded-xl relative">
              {/* Corner indicators */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-500 rounded-br-lg"></div>
              
              {/* Scanning animation */}
              {isScanning && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-xl animate-pulse">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500 animate-pulse opacity-80"></div>
                </div>
              )}
            </div>
            
            {/* Scanning status */}
            <div className="mt-4 text-center">
              <p className="text-white text-sm">
                {isScanning ? 'Scanning for QR codes...' : 'Position QR code within the frame'}
              </p>
            </div>
          </div>
        </div>

        {/* Control buttons overlay */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
          {stream && (
            <>
              <Button
                onClick={isScanning ? stopScanning : startScanning}
                className={`px-6 py-2 rounded-xl shadow-lg ${
                  isScanning 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isScanning ? '⏸️ Pause' : '▶️ Scan'}
              </Button>
              
              <Button
                onClick={handleStopScanning}
                variant="destructive"
                className="px-6 py-2 rounded-xl shadow-lg"
              >
                ❌ Stop
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg">
          <p className="text-sm font-medium">Camera Error:</p>
          <p className="text-xs">{error.message}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-3"></div>
            <p className="text-white text-sm">Requesting camera access...</p>
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
