'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Upload, Square, Zap } from 'lucide-react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    } else if (window.jsQR) {
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
      const result = await requestWithQuality('medium');
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
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-white text-xl font-bold flex items-center gap-2">
          <Camera className="h-6 w-6" />
          QR Scanner
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black">
        {stream && isScanning ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Scanning Frame */}
                <div className="w-64 h-64 relative">
                  <div className="absolute inset-0 border-2 border-cyan-400 rounded-2xl opacity-50" />
                  
                  {/* Corner Brackets */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />
                  
                  {/* Scanning Line */}
                  <div className="absolute inset-4 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="text-center mt-8">
                  <p className="text-white text-lg font-semibold">Position QR Code in Frame</p>
                  <p className="text-gray-300 text-sm mt-2">Scanning automatically...</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6">
              {isLoading ? (
                <>
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Camera className="h-10 w-10 text-white animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">Starting Camera...</h3>
                    <p className="text-gray-400">Please wait while we access your camera</p>
                  </div>
                </>
              ) : error ? (
                <>
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                    <X className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">Camera Error</h3>
                    <p className="text-red-400 text-sm">{error.message}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">Ready to Scan</h3>
                    <p className="text-gray-400">Start your camera or upload an image</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-white/10">
        {stream && isScanning ? (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={handleStop}
              variant="destructive"
              className="px-8 py-3"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Camera
            </Button>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="px-6 py-3 border-white/20 text-white hover:bg-white/10"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {isSupported && jsQRLoaded && (
              <Button
                onClick={startCamera}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 py-4 text-lg"
              >
                <Camera className="h-5 w-5 mr-2" />
                {isLoading ? 'Starting Camera...' : 'Start Camera Scan'}
              </Button>
            )}
            
            {jsQRLoaded && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 py-4 text-lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Image to Scan
              </Button>
            )}
            
            {!jsQRLoaded && (
              <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2 animate-pulse" />
                <p className="text-yellow-200 font-semibold">Loading QR Scanner...</p>
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
