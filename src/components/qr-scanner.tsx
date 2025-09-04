'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Camera, 
  X, 
  Upload, 
  Square, 
  Play,
  AlertCircle,
  CheckCircle,
  ScanLine,
  RotateCcw,
  FlipHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { detectQRCodeAdvanced, QRDetectionResult } from '@/utils/advanced-qr-detection';
import { debugQRDetection, generateQRDetectionReport } from '@/utils/qr-debug';
import { parseQRData, ParsedQRData, getQRTypeColor } from '@/utils/qr-data-parser';
import { useBackCamera } from '@/hooks/use-camera-permission';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

export interface QRScannerProps {
  onClose?: () => void;
  onScanSuccess?: (result: QRDetectionResult, parsedData: ParsedQRData) => void;
  onScanError?: (error: string) => void;
  autoStart?: boolean;
  showResults?: boolean;
}

export interface ScanResult {
  id: string;
  timestamp: Date;
  detectionResult: QRDetectionResult;
  parsedData: ParsedQRData;
}

export function QRScanner({ 
  onClose,
  onScanSuccess,
  onScanError,
  autoStart = false,
  showResults = true
}: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastScan, setLastScan] = useState<string>('');
  const [scanAttempts, setScanAttempts] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef<boolean>(true);
  
  const { toast } = useToast();
  
  const {
    stream,
    isLoading,
    isSupported,
    hasPermission,
    error,
    requestBackCameraWithFallback,
    stopCamera
  } = useBackCamera(autoStart, 'high');

  // Component mount/unmount tracking
  useEffect(() => {
    mountedRef.current = true;
    setIsMounted(true);
    return () => {
      mountedRef.current = false;
      if (scanningRef.current) {
        clearTimeout(scanningRef.current);
      }
      stopCamera();
    };
  }, [stopCamera]);

  // QR code scanning with enhanced detection
  const scanQRCode = useCallback(async () => {
    if (!isScanning || !videoRef.current || !mountedRef.current) {
      return;
    }

    try {
      const startTime = performance.now();
      setScanAttempts(prev => prev + 1);
      
      const result = await detectQRCodeAdvanced(videoRef.current, {
        enablePreprocessing: true,
        enableRotationCorrection: true,
        enableContrastEnhancement: true,
        enableBlurReduction: true,
        minQuality: 0.5,
        maxRetries: 2,
        timeoutMs: 1000
      });
      
      if (result && result.data !== lastScan) {
        try {
          const parsedData = parseQRData(result.data);
          const scanResult: ScanResult = {
            id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            detectionResult: result,
            parsedData,
          };
          
          setLastScan(result.data);
          setScanResult(scanResult);
          setIsScanning(false);
          
          if (showResults) {
            setShowResult(true);
          }
          
          // Draw detection overlay
          drawDetectionOverlay(result);
          
          // Success callback
          onScanSuccess?.(result, parsedData);
          
          toast({
            title: "QR Code Detected!",
            description: `${parsedData.type}: ${parsedData.label}`,
          });
          
        } catch (parseError) {
          console.warn('Failed to parse QR data:', parseError);
          onScanError?.('Failed to parse QR code data');
        }
      }

    } catch (error) {
      console.warn('QR scanning error:', error);
      if (scanAttempts % 10 === 0) { // Show error every 10 attempts to avoid spam
        onScanError?.('QR code scanning failed');
      }
    }

    // Schedule next scan if still scanning
    if (isScanning && mountedRef.current) {
      scanningRef.current = setTimeout(() => {
        if (mountedRef.current) {
          requestAnimationFrame(scanQRCode);
        }
      }, 100); // 10 FPS
    }
  }, [isScanning, lastScan, scanAttempts, onScanSuccess, onScanError, showResults, toast]);

  // Draw detection overlay on canvas
  const drawDetectionOverlay = useCallback((result: QRDetectionResult) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !result.location) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = result.location;
    
    // Draw detection box
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(topLeftCorner.x, topLeftCorner.y);
    ctx.lineTo(topRightCorner.x, topRightCorner.y);
    ctx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
    ctx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
    ctx.closePath();
    ctx.stroke();
    
    // Draw corner markers
    const drawCornerMarker = (x: number, y: number) => {
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x - 6, y - 6, 12, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 3, y - 3, 6, 6);
    };
    
    drawCornerMarker(topLeftCorner.x, topLeftCorner.y);
    drawCornerMarker(topRightCorner.x, topRightCorner.y);
    drawCornerMarker(bottomLeftCorner.x, bottomLeftCorner.y);
    drawCornerMarker(bottomRightCorner.x, bottomRightCorner.y);
    
    // Draw success indicator
    const centerX = (topLeftCorner.x + bottomRightCorner.x) / 2;
    const centerY = topLeftCorner.y - 20;
    
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✓ DETECTED', centerX, centerY);
    
    // Auto-clear after 3 seconds
    setTimeout(() => {
      if (mountedRef.current && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 3000);
  }, []);

  // Start scanning
  const startScanning = useCallback(async () => {
    try {
      const result = await requestBackCameraWithFallback('high');
      
      if (result.success) {
        setIsScanning(true);
        setScanAttempts(0);
        setLastScan('');
        toast({
          title: "Scanner Started",
          description: "Point your camera at a QR code",
        });
      } else if (result.error) {
        toast({
          title: "Camera Error",
          description: result.error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting scanner:', error);
      onScanError?.('Failed to start camera');
    }
  }, [requestBackCameraWithFallback, toast, onScanError]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    stopCamera();
    
    toast({
      title: "Scanner Stopped",
      description: scanResult ? "QR code detected successfully" : "Scanning stopped",
    });
  }, [stopCamera, scanResult, toast]);

  // Reset scanner
  const resetScanner = useCallback(() => {
    setScanResult(null);
    setShowResult(false);
    setLastScan('');
    setScanAttempts(0);
    
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }
  }, []);

  // Start scanning when video is ready
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;

      const handleLoadedMetadata = () => {
        if (mountedRef.current && autoStart) {
          console.log('Video metadata loaded, starting scan...');
          setTimeout(() => {
            if (mountedRef.current && !isScanning) {
              setIsScanning(true);
              requestAnimationFrame(scanQRCode);
            }
          }, 500);
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [stream, autoStart, scanQRCode, isScanning]);

  // Handle file upload for QR scanning
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const processFile = async () => {
      try {
        const imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = imageData;
        });
        
        console.log('Processing image for QR detection...', {
          imageWidth: img.width,
          imageHeight: img.height,
          fileSize: file.size,
          fileType: file.type
        });
        
        // Use debug utility for comprehensive detection attempt
        const debugResult = await debugQRDetection(file);
        
        console.log('QR detection debug result:', debugResult);
        
        if (process.env.NODE_ENV === 'development') {
          const report = generateQRDetectionReport(debugResult);
          console.log('QR Detection Report:\n' + report);
        }
        
        const result = debugResult.success ? debugResult.result : null;
        
        if (result) {
          const parsedData = parseQRData(result.data);
          const scanResult: ScanResult = {
            id: `upload-${Date.now()}`,
            timestamp: new Date(),
            detectionResult: result,
            parsedData,
          };
          
          setScanResult(scanResult);
          if (showResults) {
            setShowResult(true);
          }
          
          onScanSuccess?.(result, parsedData);
          
          toast({
            title: "QR Code Found!",
            description: `${parsedData.type}: ${parsedData.label}`,
          });
          
        } else {
          console.warn('No QR code found in uploaded image:', debugResult);
          
          // Get specific suggestions from debug result
          const suggestions = debugResult.debug?.suggestions || [];
          const primarySuggestion = suggestions[0] || 'Please ensure the image contains a clear, well-lit QR code.';
          
          toast({
            title: "No QR Code Found",
            description: primarySuggestion,
            variant: "destructive",
          });
          onScanError?.(`No QR code found in image: ${primarySuggestion}`);
        }
        
      } catch (error) {
        console.error('Failed to process uploaded file:', error);
        toast({
          title: "Processing Failed",
          description: "Could not process the uploaded image",
          variant: "destructive",
        });
        onScanError?.('Failed to process uploaded image');
      }
    };

    processFile();
  }, [onScanSuccess, onScanError, showResults, toast]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* Camera View */}
      <div className="relative w-full h-full overflow-hidden">
        {stream && (isScanning || scanResult) ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover bg-black"
            />
            
            {/* Detection overlay */}
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ mixBlendMode: 'screen' }}
            />
            
            {/* Scanning UI overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Scanner frame */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Scanning animation */}
                    <div className="w-64 h-64 border-4 border-blue-500/50 rounded-2xl relative">
                      {/* Corner brackets */}
                      <div className="absolute -inset-2">
                        {/* Top-left */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-400"></div>
                        {/* Top-right */}
                        <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-400"></div>
                        {/* Bottom-left */}
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-400"></div>
                        {/* Bottom-right */}
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-400"></div>
                      </div>
                      
                      {/* Scanning line */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                {/* Status display */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/80 backdrop-blur-md rounded-2xl px-6 py-3 border border-blue-500/30">
                    <div className="flex items-center gap-3 text-white">
                      <ScanLine className="h-5 w-5 text-blue-400 animate-pulse" />
                      <div>
                        <p className="text-sm font-semibold">Scanning for QR Code</p>
                        <p className="text-xs text-blue-300">
                          {scanAttempts > 0 && `${scanAttempts} attempts`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6">
              {isLoading ? (
                <>
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Camera className="h-12 w-12 text-white animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-white text-2xl font-bold">Starting Scanner...</h3>
                    <p className="text-gray-400 text-lg">Preparing camera for QR detection</p>
                  </div>
                </>
              ) : error ? (
                <>
                  <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-2xl font-bold">Camera Error</h3>
                    <p className="text-red-400 text-lg max-w-md mx-auto">{error.message}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-28 h-28 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto border border-gray-600">
                    <ScanLine className="h-14 w-14 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white text-3xl font-bold">QR Scanner Ready</h3>
                    <p className="text-gray-400 text-lg max-w-sm mx-auto leading-relaxed">
                      Scan QR codes using your camera or upload an image
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
        {stream && isScanning ? (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={stopScanning}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-8 py-4 text-lg font-bold rounded-2xl"
            >
              <Square className="h-6 w-6 mr-3" />
              Stop Scanning
            </Button>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 px-6 py-4 text-lg rounded-2xl"
            >
              <Upload className="h-6 w-6 mr-3" />
              Upload Image
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isMounted && isSupported && (
              <Button
                onClick={startScanning}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 py-6 text-xl font-bold rounded-2xl"
              >
                <Camera className="h-7 w-7 mr-3" />
                {isLoading ? 'Starting Scanner...' : 'Start Camera Scan'}
              </Button>
            )}
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full border-2 border-white/30 text-white hover:bg-white/10 py-5 text-lg font-bold rounded-2xl"
            >
              <Upload className="h-6 w-6 mr-3" />
              Upload QR Code Image
            </Button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {onClose && (
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}
      
      {scanResult && (
        <div className="absolute top-4 left-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetScanner}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Scan Again
          </Button>
        </div>
      )}

      {/* Result Sheet */}
      {showResults && (
        <Sheet open={showResult} onOpenChange={setShowResult}>
          <SheetContent side="bottom" className="flex flex-col h-auto max-h-[85vh] rounded-t-3xl border-0 bg-gradient-to-b from-white via-white to-gray-50/80 backdrop-blur-xl shadow-2xl">
            <SheetHeader className="pb-4 pt-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 opacity-60" />
              <SheetTitle className="text-center text-2xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎉 QR Code Scanned!
              </SheetTitle>
            </SheetHeader>
            
            {scanResult && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Result info */}
                  <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/60 backdrop-blur-sm rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge 
                        variant="secondary" 
                        className={`bg-${getQRTypeColor(scanResult.parsedData.type)}-600/20 text-${getQRTypeColor(scanResult.parsedData.type)}-700 border-${getQRTypeColor(scanResult.parsedData.type)}-600/30`}
                      >
                        {scanResult.parsedData.icon} {scanResult.parsedData.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {scanResult.detectionResult.processingTime.toFixed(0)}ms
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-gray-800 mb-2">{scanResult.parsedData.label}</h4>
                    <p className="text-sm text-gray-600 break-all mb-4 bg-white/60 p-3 rounded-xl">
                      {scanResult.detectionResult.data}
                    </p>
                    
                    {/* Action buttons */}
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(scanResult.detectionResult.data);
                          toast({ title: "Copied to clipboard" });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Copy Data
                      </Button>
                      
                      {scanResult.parsedData.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="sm"
                          onClick={action.action}
                          variant="outline"
                          className="border-gray-300 hover:bg-gray-100"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
