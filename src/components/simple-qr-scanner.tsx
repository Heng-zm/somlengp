'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Upload, Square, Zap, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCameraPermission } from '@/hooks/use-camera-permission';
import { useToast } from '@/hooks/use-toast';

// QR code scanning library
declare global {
  interface Window {
    jsQR: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
  }
}

interface SimpleQRScannerProps {
  onScanResult: (data: string) => void;
  onClose: () => void;
}

export function SimpleQRScanner({ onScanResult, onClose }: SimpleQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [jsQRLoaded, setJsQRLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scanningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const {
    stream,
    isLoading,
    isSupported,
    error,
    requestWithQuality,
    stopCamera,
  } = useCameraPermission({ autoStop: true });

  // Load jsQR library
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.jsQR) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.async = true;
      
      script.onload = () => {
        console.log('jsQR library loaded successfully');
        setJsQRLoaded(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load jsQR library');
        toast({
          title: "Scanner Error",
          description: "Failed to load QR scanning library",
          variant: "destructive",
        });
      };
      
      document.head.appendChild(script);
      
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
} else if (typeof window.jsQR === 'function') {
      setJsQRLoaded(true);
    }
  }, [toast]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        setIsScanning(true);
      };
    } else if (videoRef.current && !stream) {
      videoRef.current.srcObject = null;
      setIsScanning(false);
    }
  }, [stream]);

  // Fullscreen functionality
  const enterFullscreen = async () => {
    if (containerRef.current && document.fullscreenEnabled) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error('Failed to exit fullscreen:', error);
      }
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const startCamera = async () => {
    if (!isSupported || !jsQRLoaded) {
      toast({
        title: "Camera Error",
        description: !isSupported ? "Camera not supported" : "QR library not loaded",
        variant: "destructive",
      });
      return;
    }

    try {
      // Enter fullscreen when starting camera
      await enterFullscreen();
      
      const result = await requestWithQuality('high');
      if (result.success) {
        toast({
          title: "Camera Started",
          description: "Point your camera at a QR code to scan",
        });
      } else if (result.error) {
        toast({
          title: "Camera Error",
          description: result.error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera",
        variant: "destructive",
      });
    }
  };

  const scanQRCode = useCallback(() => {
    if (!isScanning || !videoRef.current || !canvasRef.current || !window.jsQR) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          // Stop scanning and camera
          setIsScanning(false);
          stopCamera();
          
          // Call success callback
          onScanResult(code.data);
          
          toast({
            title: "QR Code Detected!",
            description: "Successfully scanned QR code",
          });
          return;
        }
      } catch (error) {
        console.error('Error during QR scanning:', error);
      }
    }

    if (isScanning) {
      scanningRef.current = setTimeout(() => {
        requestAnimationFrame(scanQRCode);
      }, 100);
    }
  }, [isScanning, onScanResult, stopCamera, toast]);

  // Start scanning when video is ready
  useEffect(() => {
    if (isScanning && jsQRLoaded) {
      scanningRef.current = setTimeout(() => {
        requestAnimationFrame(scanQRCode);
      }, 500);
    }

    return () => {
      if (scanningRef.current) {
        clearTimeout(scanningRef.current);
        scanningRef.current = null;
      }
    };
  }, [isScanning, jsQRLoaded, scanQRCode]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !jsQRLoaded) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        if (!canvasRef.current || !window.jsQR) return;
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            onScanResult(code.data);
            toast({
              title: "QR Code Found!",
              description: "Successfully extracted QR code from image",
            });
          } else {
            toast({
              title: "No QR Code Found",
              description: "Could not detect a QR code in this image",
              variant: "destructive",
            });
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleStop = () => {
    setIsScanning(false);
    stopCamera();
    // Exit fullscreen when stopping camera
    if (isFullscreen) {
      exitFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 flex flex-col z-50 transition-all duration-300 ${
        isFullscreen 
          ? 'bg-black' 
          : 'bg-gradient-to-br from-gray-900 via-black to-gray-800'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b border-white/10 backdrop-blur-sm ${
        isFullscreen ? 'bg-black/50' : 'bg-black/30'
      }`}>
        <h2 className="text-white text-xl font-bold flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            QR Scanner
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {document.fullscreenEnabled && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/10 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {stream && isScanning ? (
          <>
            {/* Background with blur effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-blue-900" />
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-all duration-500 ${
                isFullscreen ? 'scale-105' : 'scale-100'
              }`}
            />
            
            {/* Enhanced Scanning Overlay */}
            <div className="absolute inset-0">
              {/* Darkened overlay with cutout */}
              <div className="absolute inset-0 bg-black/60">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`relative ${
                    isFullscreen ? 'w-80 h-80' : 'w-72 h-72'
                  } transition-all duration-500`}>
                    {/* Clear scanning area */}
                    <div className="absolute inset-0 bg-transparent border-2 border-white/20 rounded-3xl" 
                         style={{
                           boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
                         }} />
                  </div>
                </div>
              </div>
              
              {/* Scanning frame and effects */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Main Scanning Frame */}
                  <div className={`relative transition-all duration-500 ${
                    isFullscreen ? 'w-80 h-80' : 'w-72 h-72'
                  }`}>
                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 p-0.5">
                      <div className="w-full h-full rounded-3xl bg-transparent" />
                    </div>
                    
                    {/* Corner indicators */}
                    <div className="absolute -top-3 -left-3 w-12 h-12">
                      <div className="w-full h-full border-t-4 border-l-4 border-cyan-400 rounded-tl-2xl animate-pulse" 
                           style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' }} />
                    </div>
                    <div className="absolute -top-3 -right-3 w-12 h-12">
                      <div className="w-full h-full border-t-4 border-r-4 border-cyan-400 rounded-tr-2xl animate-pulse" 
                           style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' }} />
                    </div>
                    <div className="absolute -bottom-3 -left-3 w-12 h-12">
                      <div className="w-full h-full border-b-4 border-l-4 border-cyan-400 rounded-bl-2xl animate-pulse" 
                           style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' }} />
                    </div>
                    <div className="absolute -bottom-3 -right-3 w-12 h-12">
                      <div className="w-full h-full border-b-4 border-r-4 border-cyan-400 rounded-br-2xl animate-pulse" 
                           style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' }} />
                    </div>
                    
                    {/* Animated scanning line */}
                    <div className="absolute inset-6 overflow-hidden rounded-2xl">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"
                          style={{
                            filter: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.8))',
                            animation: 'scanning-line 2s linear infinite'
                          }} 
                        />
                      </div>
                    </div>
                    
                    {/* Pulse effect */}
                    <div className="absolute inset-0 rounded-3xl border border-cyan-400/30 animate-ping" />
                  </div>
                  
                  {/* Enhanced Instructions */}
                  <div className="text-center mt-8 space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/50 rounded-full backdrop-blur-sm">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                      <p className="text-white text-lg font-semibold">Scanning Active</p>
                    </div>
                    <p className="text-gray-300 text-sm">Position QR code within the frame</p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span>Detecting...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }} />
            </div>
            
            <div className="text-center space-y-8 relative z-10">
              {isLoading ? (
                <>
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                      <Camera className="h-12 w-12 text-white animate-bounce" />
                    </div>
                    <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-blue-400 animate-ping" />
                    <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border border-cyan-400 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-white text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      Starting Camera...
                    </h3>
                    <p className="text-gray-400 text-lg">Preparing fullscreen experience</p>
                    <div className="flex justify-center">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </>
              ) : error ? (
                <>
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                      <X className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-red-400 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-white text-2xl font-bold">Camera Error</h3>
                    <p className="text-red-400 text-lg max-w-md mx-auto">{error.message}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <div className="w-28 h-28 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800 rounded-full flex items-center justify-center mx-auto shadow-2xl border border-gray-600">
                      <Camera className="h-14 w-14 text-gray-300" />
                    </div>
                    <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full border border-gray-500 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-white text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      Ready to Scan
                    </h3>
                    <p className="text-gray-400 text-lg max-w-sm mx-auto leading-relaxed">
                      Start camera for fullscreen scanning experience or upload an image
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={`p-6 border-t border-white/10 backdrop-blur-sm ${
        isFullscreen ? 'bg-black/50' : 'bg-black/30'
      }`}>
        {stream && isScanning ? (
          <div className="flex items-center justify-center gap-6">
            <Button
              onClick={handleStop}
              variant="destructive"
              className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <Square className="h-5 w-5 mr-3" />
              Stop Camera
            </Button>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="px-8 py-4 text-lg font-semibold border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 shadow-lg transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              <Upload className="h-5 w-5 mr-3" />
              Upload Image
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isSupported && jsQRLoaded && (
              <Button
                onClick={startCamera}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 py-6 text-xl font-bold shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 animate-pulse" />
                <div className="relative flex items-center justify-center">
                  {isFullscreen ? (
                    <Minimize className="h-6 w-6 mr-3" />
                  ) : (
                    <Camera className="h-6 w-6 mr-3" />
                  )}
                  {isLoading ? 'Starting Fullscreen Camera...' : 'Start Fullscreen Scan'}
                </div>
              </Button>
            )}
            
            {jsQRLoaded && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 py-5 text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
              >
                <Upload className="h-6 w-6 mr-3" />
                Upload Image to Scan
              </Button>
            )}
            
            {!jsQRLoaded && (
              <div className="text-center p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-400/30 shadow-xl">
                <div className="relative">
                  <Zap className="h-10 w-10 text-yellow-400 mx-auto mb-3 animate-pulse" />
                  <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 animate-ping" />
                </div>
                <p className="text-yellow-200 font-bold text-lg">Loading QR Scanner...</p>
                <p className="text-yellow-300/70 text-sm mt-1">Preparing advanced scanning features</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden Elements */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
