'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { useBackCamera } from '@/hooks/use-camera-permission';
import { Upload } from 'lucide-react';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline styles, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

interface QRScannerProps {
  onScanSuccess?: (data: string) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
  className?: string;
}
export function QRScanner({ onScanSuccess, onScanError, onClose, className = '' }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string>('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const {
    stream,
    isLoading,
    isSupported,
    hasPermission,
    error,
    requestBackCameraWithFallback,
    stopCamera
  } = useBackCamera(false, 'high'); // Don't auto-start, we'll control it manually
  // Auto-start camera when component mounts
  useEffect(() => {
    if (isSupported && !stream && !isLoading && !error) {
      requestBackCameraWithFallback();
    }
  }, [isSupported, stream, isLoading, error, requestBackCameraWithFallback]);
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);
  const scanQRCode = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    // Check if video is actually playing and has loaded metadata
    if (video.readyState < 2) {
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
    // Scan for QR codes with better options
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth', // Try both normal and inverted
      });
      if (code && code.data && code.data.trim() !== '' && code.data !== lastScannedData) {
        setLastScannedData(code.data);
        stopScanning();
        onScanSuccess?.(code.data);
      }
    } catch (error) {
      console.error('QR scanning error:', error);
      // Don't call onScanError for every failed scan attempt, only for critical errors
    }
  }, [lastScannedData, onScanSuccess, onScanError, stopScanning]);
  const startScanning = useCallback(() => {
    if (!isScanning) {
      setIsScanning(true);
      scanIntervalRef.current = setInterval(() => {
        scanQRCode();
      }, 100); // Scan every 100ms for better responsiveness
    }
  }, [isScanning, scanQRCode]);
  // Set up video element when stream is available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Wait for video to be ready before starting scanning
      const video = videoRef.current;
      video.onloadedmetadata = () => {
        // Small delay to ensure video is fully ready
        setTimeout(() => {
          startScanning();
        }, 500);
      };
      // Fallback: start scanning after a delay even if metadata doesn't load
      setTimeout(() => {
        if (!isScanning && video.videoWidth > 0 && video.videoHeight > 0) {
          startScanning();
        }
      }, 2000);
    }
  }, [stream, startScanning, isScanning]);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
      stopCamera();
    };
  }, [stopScanning, stopCamera]);
  const handleStopScanning = () => {
    stopScanning();
    stopCamera();
    onClose?.();
  };
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onScanError?.('Please select a valid image file');
      return;
    }
    setIsProcessingUpload(true);
    try {
      // Create an image element to load the uploaded file
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = canvasRef.current;
          if (!canvas) {
            onScanError?.('Canvas not available for image processing');
            return;
          }
          const context = canvas.getContext('2d');
          if (!context) {
            onScanError?.('Unable to get canvas context');
            return;
          }
          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;
          // Draw image to canvas
          context.drawImage(img, 0, 0);
          // Get image data
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          // Scan for QR codes with better options
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data) {
            setLastScannedData(code.data);
            onScanSuccess?.(code.data);
          } else {
            onScanError?.('No QR code found in the uploaded image');
          }
        } catch (error) {
          console.error('QR code processing error:', error);
          onScanError?.('Failed to process the uploaded image');
        } finally {
          setIsProcessingUpload(false);
        }
      };
      img.onerror = () => {
        onScanError?.('Failed to load the uploaded image');
        setIsProcessingUpload(false);
      };
      // Load the image
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      onScanError?.('Failed to process the uploaded file');
      setIsProcessingUpload(false);
    }
    // Clear the input value to allow re-uploading the same file
    if (event.target) {
      event.target.value = '';
    }
  }, [onScanSuccess, onScanError]);
  if (!isSupported) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg border border-gray-300 ${className}`}>
        <h3 className="text-gray-800 font-semibold text-lg mb-2">Camera Not Supported</h3>
        <p className="text-gray-700 text-center text-sm mb-4">
          Camera access is not supported in this browser or requires HTTPS. You can still upload an image to scan for QR codes.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={handleUploadClick}
            disabled={isProcessingUpload}
            className="bg-transparent hover:bg-white/20 text-white p-3 rounded-xl shadow-lg border border-white/30 backdrop-blur-sm"
            size="icon"
          >
            {isProcessingUpload ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </Button>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
        {/* Hidden file input for upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          aria-label="Upload QR code image"
        />
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
              <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-gray-300 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-gray-300 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-gray-300 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-gray-300 rounded-br-lg"></div>
              {/* Scanning animation */}
              {isScanning && (
                <div className="absolute inset-0 border-2 border-white rounded-xl animate-pulse">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white animate-pulse opacity-80"></div>
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
        {stream && (
          <>
            {/* Upload button - bottom right */}
            <div className="absolute bottom-4 right-4">
              <Button
                onClick={handleUploadClick}
                disabled={isProcessingUpload}
                className="bg-transparent hover:bg-white/20 text-white p-3 rounded-xl shadow-lg border border-white/30 backdrop-blur-sm"
                size="icon"
              >
                {isProcessingUpload ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </Button>
            </div>
            {/* Close button - top right */}
            <div className="absolute top-4 right-4">
              <Button
                onClick={handleStopScanning}
                className="bg-transparent hover:bg-white/20 text-white p-3 rounded-xl shadow-lg border border-white/30 backdrop-blur-sm"
                size="icon"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </>
        )}
      </div>
      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-black/80 text-white p-3 rounded-lg">
          <p className="text-sm font-medium">Camera Error:</p>
          <p className="text-xs">{error.message}</p>
        </div>
      )}
      {/* Loading State */}
      {(isLoading || isProcessingUpload) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-3"></div>
            <p className="text-white text-sm">
              {isProcessingUpload ? 'Processing uploaded image...' : 'Requesting camera access...'}
            </p>
          </div>
        </div>
      )}
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        aria-label="Upload QR code image"
      />
    </div>
  );
}

// Default export for lazy loading
export default QRScanner;
