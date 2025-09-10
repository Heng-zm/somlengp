'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useQRCamera } from '@/hooks/use-camera-permission';
import { useQRScannerWorker } from '@/hooks/use-qr-worker';
import { qrPerformanceMonitor } from '@/utils/qr-performance';
import { Upload } from 'lucide-react';

interface OptimizedQRScannerProps {
  onScanSuccess?: (data: string, location?: any, confidence?: number) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
  className?: string;
  enableVibration?: boolean;
  enableSound?: boolean;
  scanRegion?: 'full' | 'center' | 'auto';
  scanQuality?: 'fast' | 'balanced' | 'accurate';
}

interface ScanStats {
  scanAttempts: number;
  successfulScans: number;
  averageProcessingTime: number;
  lastScanTime: number;
}

export function OptimizedQRScanner({ 
  onScanSuccess, 
  onScanError, 
  onClose, 
  className = '',
  enableVibration = true,
  enableSound = false,
  scanRegion = 'auto',
  scanQuality = 'balanced'
}: OptimizedQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasPoolRef = useRef<HTMLCanvasElement[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number>();
  const lastScanTimeRef = useRef<number>(0);
  
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string>('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [scanConfidence, setScanConfidence] = useState<number>(0);
  const [detectionZone, setDetectionZone] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [scanStats, setScanStats] = useState<ScanStats>({
    scanAttempts: 0,
    successfulScans: 0,
    averageProcessingTime: 0,
    lastScanTime: 0
  });

  // Use optimized camera hook - auto-request camera on mount
  const {
    stream,
    isLoading,
    isSupported,
    hasPermission,
    error: cameraError,
    requestCamera,
    stopCamera
  } = useQRCamera();

  // Auto-start camera when component mounts
  useEffect(() => {
    if (isSupported && !stream && !isLoading && !cameraError) {
      requestCamera();
    }
  }, [isSupported, stream, isLoading, cameraError, requestCamera]);

  // Use Web Worker for enhanced performance
  const {
    isReady: workerReady,
    scanQR,
    stats: workerStats,
    error: workerError
  } = useQRScannerWorker();

  // Get or create canvas from pool for better memory management
  const getCanvas = useCallback(() => {
    if (canvasPoolRef.current.length > 0) {
      return canvasPoolRef.current.pop()!;
    }
    return document.createElement('canvas');
  }, []);

  // Return canvas to pool
  const returnCanvas = useCallback((canvas: HTMLCanvasElement) => {
    if (canvasPoolRef.current.length < 3) { // Keep max 3 canvases
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvasPoolRef.current.push(canvas);
    }
  }, []);

  // Calculate optimal scan region based on video dimensions
  const calculateScanRegion = useCallback((videoWidth: number, videoHeight: number) => {
    switch (scanRegion) {
      case 'center':
        const centerSize = Math.min(videoWidth, videoHeight) * 0.6;
        return {
          x: (videoWidth - centerSize) / 2,
          y: (videoHeight - centerSize) / 2,
          width: centerSize,
          height: centerSize
        };
      case 'full':
        return { x: 0, y: 0, width: videoWidth, height: videoHeight };
      case 'auto':
      default:
        // Smart region based on common QR code positions
        const margin = Math.min(videoWidth, videoHeight) * 0.1;
        return {
          x: margin,
          y: margin,
          width: videoWidth - 2 * margin,
          height: videoHeight - 2 * margin
        };
    }
  }, [scanRegion]);

  // Adaptive scan interval based on device performance
  const getScanInterval = useCallback(() => {
    const baseInterval = scanQuality === 'fast' ? 150 : scanQuality === 'accurate' ? 500 : 300;
    
    // Adjust based on processing times
    if (workerStats.averageProcessingTime > 100) {
      return baseInterval + 100; // Slower for heavy processing
    } else if (workerStats.averageProcessingTime < 50) {
      return Math.max(100, baseInterval - 50); // Faster for light processing
    }
    
    return baseInterval;
  }, [scanQuality, workerStats.averageProcessingTime]);

  // Trigger haptic feedback
  const triggerVibration = useCallback((pattern: number | number[] = 200) => {
    if (enableVibration && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [enableVibration]);

  // Trigger audio feedback
  const triggerSound = useCallback(() => {
    if (enableSound) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.warn('Audio feedback failed:', error);
      }
    }
  }, [enableSound]);

  // Enhanced QR scanning with worker
  const scanQRCode = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !workerReady || !isScanning || 
        video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    // Throttle scans based on adaptive interval
    const now = performance.now();
    const interval = getScanInterval();
    if (now - lastScanTimeRef.current < interval) {
      return;
    }
    lastScanTimeRef.current = now;

    try {
      qrPerformanceMonitor.recordScanAttempt();
      
      // Get canvas from pool
      const canvas = getCanvas();
      const context = canvas.getContext('2d');
      if (!context) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Calculate scan region
      const region = calculateScanRegion(canvas.width, canvas.height);
      setDetectionZone(region);

      // Get image data for the scan region
      const imageData = context.getImageData(region.x, region.y, region.width, region.height);

      // Scan using Web Worker
      const result = await scanQR(imageData, {
        inversionAttempts: scanQuality === 'fast' ? 'dontInvert' : 
                          scanQuality === 'accurate' ? 'attemptBoth' : 'attemptBoth'
      });

      // Update scan statistics
      setScanStats(prev => ({
        scanAttempts: prev.scanAttempts + 1,
        successfulScans: result.qrCode ? prev.successfulScans + 1 : prev.successfulScans,
        averageProcessingTime: result.processingTime,
        lastScanTime: now
      }));

      // Calculate confidence based on various factors
      let confidence = 0;
      if (result.qrCode) {
        confidence = Math.min(100, 
          50 + // Base confidence
          (result.processingTime < 50 ? 20 : 10) + // Speed bonus
          (result.qrCode.data.length > 10 ? 15 : 5) + // Content complexity
          15 // Completion bonus
        );
        setScanConfidence(confidence);

        // Check if this is a new scan result
        if (result.qrCode.data !== lastScannedData) {
          setLastScannedData(result.qrCode.data);
          setIsScanning(false);
          
          // Record successful scan
          qrPerformanceMonitor.recordSuccessfulScan(result.qrCode.data);
          
          // Provide feedback
          triggerVibration([50, 50, 50]);
          triggerSound();
          
          onScanSuccess?.(result.qrCode.data, result.qrCode.location, confidence);
        }
      } else {
        setScanConfidence(Math.max(0, scanConfidence - 5)); // Gradually decrease confidence
      }

      // Return canvas to pool
      returnCanvas(canvas);

    } catch (error) {
      console.error('QR scanning error:', error);
      qrPerformanceMonitor.recordFailedScan(error instanceof Error ? error.message : 'Unknown error');
      onScanError?.('Failed to scan QR code');
    }
  }, [
    isScanning, workerReady, scanQuality, lastScannedData, scanConfidence,
    onScanSuccess, onScanError, scanQR, getCanvas, returnCanvas,
    calculateScanRegion, getScanInterval, triggerVibration, triggerSound
  ]);

  // Start continuous scanning loop
  const startScanning = useCallback(() => {
    if (!isScanning) {
      setIsScanning(true);
      qrPerformanceMonitor.startScanning();
      
      // Use requestAnimationFrame for smooth performance
      const scanLoop = () => {
        if (isScanning) {
          scanQRCode();
          animationFrameRef.current = requestAnimationFrame(scanLoop);
        }
      };
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    }
  }, [isScanning, scanQRCode]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setScanConfidence(0);
  }, []);

  // Set up video element when stream is available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // Auto-start scanning when video loads
      videoRef.current.onloadedmetadata = () => {
        if (workerReady) {
          startScanning();
        }
      };
    }
  }, [stream, workerReady, startScanning]);

  // Start scanning when worker becomes ready
  useEffect(() => {
    if (stream && workerReady && !isScanning) {
      startScanning();
    }
  }, [stream, workerReady, isScanning, startScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
      stopCamera();
      canvasPoolRef.current.forEach(canvas => {
        // Canvas cleanup is handled by garbage collection
      });
      canvasPoolRef.current = [];
    };
  }, [stopScanning, stopCamera]);

  // Initialize camera
  const handleInitialize = useCallback(async () => {
    try {
      await requestCamera();
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      onScanError?.('Failed to initialize camera');
    }
  }, [requestCamera, onScanError]);

  // Handle stop scanning
  const handleStopScanning = () => {
    stopScanning();
    stopCamera();
    onClose?.();
  };

  // File upload handling
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !workerReady) return;

    if (!file.type.startsWith('image/')) {
      onScanError?.('Please select a valid image file');
      return;
    }

    setIsProcessingUpload(true);

    try {
      const img = new Image();
      
      img.onload = async () => {
        try {
          const canvas = getCanvas();
          const context = canvas.getContext('2d');
          if (!context || !canvas) {
            onScanError?.('Canvas not available for image processing');
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          const result = await scanQR(imageData, { inversionAttempts: 'attemptBoth' });

          if (result.qrCode) {
            setLastScannedData(result.qrCode.data);
            triggerVibration();
            triggerSound();
            onScanSuccess?.(result.qrCode.data, result.qrCode.location, 95);
          } else {
            onScanError?.('No QR code found in the uploaded image');
          }

          returnCanvas(canvas);
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

    if (event.target) {
      event.target.value = '';
    }
  }, [workerReady, onScanSuccess, onScanError, scanQR, getCanvas, returnCanvas, triggerVibration, triggerSound]);

  if (!isSupported) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg border border-gray-300 ${className}`}>
        <h3 className="text-gray-800 font-semibold text-lg mb-2">Camera Not Supported</h3>
        <p className="text-gray-700 text-center text-sm mb-4">
          Camera access is not supported in this browser or requires HTTPS. You can still upload an image to scan for QR codes.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingUpload || !workerReady}
            className="bg-transparent hover:bg-white/20 text-white p-3 rounded-xl shadow-lg border border-white/30 backdrop-blur-sm"
            size="icon"
          >
            {isProcessingUpload ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </Button>
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
        
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
        
        {/* Enhanced Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Transparent scanning frame */}
            <div 
              className="relative transition-all duration-500 ease-in-out"
              style={{
                width: '300px',
                height: '300px',
              }}
            >
              {/* Subtle background overlay */}
              <div className="absolute inset-0 border border-white/20 rounded-3xl"></div>
              
              {/* Corner brackets - transparent with white borders */}
              <div className="absolute -top-2 -left-2 w-12 h-12 border-l-2 border-t-2 border-gray-300 rounded-tl-3xl transition-all duration-500"></div>
              <div className="absolute -top-2 -right-2 w-12 h-12 border-r-2 border-t-2 border-gray-300 rounded-tr-3xl transition-all duration-500"></div>
              <div className="absolute -bottom-2 -left-2 w-12 h-12 border-l-2 border-b-2 border-gray-300 rounded-bl-3xl transition-all duration-500"></div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 border-r-2 border-b-2 border-gray-300 rounded-br-3xl transition-all duration-500"></div>
              
              {/* Center crosshair - transparent */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-6 h-0.5 bg-gray-400/70"></div>
                <div className="w-0.5 h-6 mt-[-12px] ml-[11px] bg-gray-400/70"></div>
              </div>
              
              {/* Confidence indicator - transparent background */}
              {scanConfidence > 0 && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg border border-gray-300/30">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                      {scanConfidence}% match
                    </span>
                  </div>
                </div>
              )}
              
              {/* Scanning beam - transparent */}
              {isScanning && (
                <div className="absolute inset-4">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <div 
                      className="absolute left-0 right-0 h-0.5 opacity-60 animate-bounce"
                      style={{ 
                        top: '50%',
                        background: 'linear-gradient(90deg, transparent, rgba(156,163,175,0.8), transparent)',
                        boxShadow: '0 0 10px rgba(156,163,175,0.3)'
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Status and statistics */}
            <div className="mt-4 text-center space-y-1">
              <p className="text-white text-sm font-medium">
                {isScanning ? 'Scanning for QR codes...' : 'Position QR code within the frame'}
              </p>
              {workerStats.totalScans > 0 && (
                <p className="text-white/70 text-xs">
                  Scanned: {workerStats.successfulScans}/{workerStats.totalScans} • 
                  Avg: {workerStats.averageProcessingTime.toFixed(0)}ms
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Control buttons overlay - Only show when camera stream is available */}
        {stream && (
          <div className="absolute bottom-4 right-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingUpload || !workerReady}
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
        )}
      </div>

      {/* Error Display */}
      {(cameraError || workerError) && (
        <div className="absolute top-4 left-4 right-4 bg-black/80 text-white p-3 rounded-lg">
          <p className="text-sm font-medium">Error:</p>
          <p className="text-xs">{cameraError?.message || workerError}</p>
        </div>
      )}

      {/* Loading State */}
      {(isLoading || !workerReady || isProcessingUpload) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-3"></div>
            <p className="text-white text-sm">
              {isProcessingUpload ? 'Processing uploaded image...' : 
               !workerReady ? 'Initializing scanner...' : 
               'Requesting camera access...'}
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
