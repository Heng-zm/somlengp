'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline styles, inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

interface SimpleQRScannerProps {
  onScanSuccess?: (data: string) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
  className?: string;
}
export function SimpleQRScanner({ onScanSuccess, onScanError, onClose, className = '' }: SimpleQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout>();
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastScannedData, setLastScannedData] = useState<string>('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ attempts: 0, lastAttempt: 0 });
  // Check if camera is supported
  const isCameraSupported = useCallback(() => {
    return !!(navigator?.mediaDevices?.getUserMedia);
  }, []);
  // Request camera access
  const requestCamera = useCallback(async () => {
    if (!isCameraSupported()) {
      setError('Camera is not supported in this browser');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
    } catch (err) {
      console.error('Camera access error:', err);
      const message = err instanceof Error ? err.message : 'Failed to access camera';
      setError(message);
      onScanError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [isCameraSupported, onScanError]);
  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  }, [stream]);
  // Scan QR code from video
  const scanQRCode = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    // Check if video is ready
    if (video.readyState < 2) {
      return;
    }
    const context = canvas.getContext('2d');
    if (!context) return;
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    // Update debug info
    setDebugInfo(prev => ({
      attempts: prev.attempts + 1,
      lastAttempt: Date.now()
    }));
    try {
      // Scan for QR codes with optimal settings
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (code && code.data && code.data.trim() !== '' && code.data !== lastScannedData) {
        setLastScannedData(code.data);
        setIsScanning(false);
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
        }
        // Trigger vibration if available
        if (navigator?.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        onScanSuccess?.(code.data);
      }
    } catch (error) {
      console.error('QR scanning error:', error);
    }
  }, [lastScannedData, onScanSuccess]);
  // Start scanning
  const startScanning = useCallback(() => {
    if (!isScanning && stream) {
      setIsScanning(true);
      scanIntervalRef.current = setInterval(scanQRCode, 100); // Scan every 100ms
    }
  }, [isScanning, stream, scanQRCode]);
  // Set up video when stream is available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        setTimeout(startScanning, 500); // Small delay to ensure video is ready
      };
    }
  }, [stream, startScanning]);
  // Auto-request camera on mount
  useEffect(() => {
    requestCamera();
    return () => {
      stopCamera();
    };
  }, [requestCamera, stopCamera]);
  // File upload handler
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onScanError?.('Please select a valid image file');
      return;
    }
    setIsProcessingUpload(true);
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data) {
            onScanSuccess?.(code.data);
          } else {
            onScanError?.('No QR code found in the uploaded image');
          }
        } catch (error) {
          onScanError?.('Failed to process the uploaded image');
        } finally {
          setIsProcessingUpload(false);
        }
      };
      img.onerror = () => {
        onScanError?.('Failed to load the uploaded image');
        setIsProcessingUpload(false);
      };
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      onScanError?.('Failed to process the uploaded file');
      setIsProcessingUpload(false);
    }
    if (event.target) {
      event.target.value = '';
    }
  }, [onScanSuccess, onScanError]);
  const handleClose = () => {
    stopCamera();
    onClose?.();
  };
  if (!isCameraSupported()) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg border border-gray-300 ${className}`}>
        <h3 className="text-gray-800 font-semibold text-lg mb-2">Camera Not Supported</h3>
        <p className="text-gray-700 text-center text-sm mb-4">
          Camera access is not supported in this browser. You can upload an image to scan for QR codes.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingUpload}
            className="flex items-center gap-2"
          >
            {isProcessingUpload ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload Image
          </Button>
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
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
            <div className="w-64 h-64 border-2 border-white/50 rounded-xl relative">
              {/* Corner indicators */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-400 rounded-br-lg"></div>
              {/* Scanning animation */}
              {isScanning && (
                <div className="absolute inset-0 border-2 border-green-400 rounded-xl animate-pulse">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-400 animate-pulse"></div>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <p className="text-white text-sm">
                {isScanning ? 'Scanning for QR codes...' : 'Position QR code within the frame'}
              </p>
              {debugInfo.attempts > 0 && (
                <p className="text-white/60 text-xs mt-1">
                  Scan attempts: {debugInfo.attempts}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Controls */}
        {stream && (
          <>
            <div className="absolute bottom-4 right-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingUpload}
                className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl backdrop-blur-sm"
                size="icon"
              >
                {isProcessingUpload ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </Button>
            </div>
            <div className="absolute top-4 right-4">
              <Button
                onClick={handleClose}
                className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl backdrop-blur-sm"
                size="icon"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}
      </div>
      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg">
          <p className="text-sm font-medium">Camera Error:</p>
          <p className="text-xs">{error}</p>
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
      {/* Hidden canvas and file input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}

// Default export for lazy loading
export default SimpleQRScanner;
