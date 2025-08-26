'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Flashlight, FlashlightOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';

// QR code scanning library - we'll use jsqr for client-side scanning
declare global {
  interface Window {
    jsQR: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
  }
}


interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (data: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onScanResult }: QRScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load jsQR library
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.jsQR) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.async = true;
      document.head.appendChild(script);
      
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, []);

  // Check camera availability
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setHasCamera(cameras.length > 0);
      } catch (error) {
        console.error('Error checking camera:', error);
        setHasCamera(false);
      }
    };

    if (navigator.mediaDevices && isOpen) {
      checkCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        
        // Start scanning
        setIsScanning(true);
        scanQRCode();
      }
      
      toast({
        title: "Camera Started",
        description: "Point your camera at a QR code to scan",
      });
    } catch (error) {
      console.error('Error starting camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsScanning(false);
    setFlashlightOn(false);
  }, [stream]);

  const toggleFlashlight = async () => {
    if (!stream) return;
    
    try {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      
      if (videoTrack && 'torch' in capabilities) {
        await videoTrack.applyConstraints({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          advanced: [{ torch: !flashlightOn }] as any
        });
        setFlashlightOn(!flashlightOn);
        
        toast({
          title: flashlightOn ? "Flashlight Off" : "Flashlight On",
          description: `Flashlight ${flashlightOn ? 'disabled' : 'enabled'}`,
        });
      } else {
        toast({
          title: "Flashlight Not Available",
          description: "Your device doesn't support flashlight control",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error toggling flashlight:', error);
      toast({
        title: "Flashlight Error",
        description: "Could not control flashlight",
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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        onScanResult(code.data);
        setIsScanning(false);
        stopCamera();
        onClose();
        
        toast({
          title: "QR Code Detected!",
          description: "Successfully scanned QR code",
        });
        return;
      }
    }

    if (isScanning) {
      requestAnimationFrame(scanQRCode);
    }
  }, [isScanning, onScanResult, stopCamera, onClose, toast]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
            onClose();
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

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl border-0 p-0">
          <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black text-white">
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Camera className="h-5 w-5" />
                  </div>
                  Scan QR Code
                </SheetTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </SheetHeader>

            {/* Camera Section */}
            <div className="flex-1 flex flex-col">
              {isCameraActive ? (
                <div className="flex-1 relative bg-black">
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  
                  {/* Scanning Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Dark overlay with transparent center */}
                      <div className="absolute inset-0 bg-black/60" />
                      
                      {/* Scanning frame */}
                      <div className="relative z-10">
                        <div className="w-64 h-64 relative">
                          <div className="w-full h-full border-2 border-white/30 rounded-2xl" />
                          
                          {/* Corner brackets */}
                          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                          
                          {/* Animated scanning line */}
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
                            <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse scan-line" />
                          </div>
                        </div>
                        
                        {/* Instructions */}
                        <div className="text-center mt-6">
                          <p className="text-white text-lg font-medium">
                            Position QR code within the frame
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center space-y-8 max-w-sm">
                    <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                      <Camera className="h-12 w-12 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Ready to Scan</h3>
                      <p className="text-gray-400 text-lg">
                        Start your camera or upload an image to scan QR codes
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-6 border-t border-gray-700 space-y-4">
              {isCameraActive ? (
                <div className="flex items-center justify-center gap-4">
                  {/* Flashlight Toggle */}
                  <Button
                    onClick={toggleFlashlight}
                    size="lg"
                    variant="outline"
                    className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-white rounded-full w-16 h-16 p-0"
                  >
                    {flashlightOn ? (
                      <FlashlightOff className="h-6 w-6" />
                    ) : (
                      <Flashlight className="h-6 w-6" />
                    )}
                  </Button>
                  
                  {/* Stop Camera */}
                  <Button
                    onClick={stopCamera}
                    size="lg"
                    variant="destructive"
                    className="rounded-full px-8 h-16 text-lg font-semibold"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Stop Camera
                  </Button>
                  
                  {/* Upload Button */}
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    variant="outline"
                    className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-white rounded-full w-16 h-16 p-0"
                  >
                    <Upload className="h-6 w-6" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Start Camera */}
                  {hasCamera && (
                    <Button
                      onClick={startCamera}
                      size="lg"
                      className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl text-lg font-semibold"
                    >
                      <Camera className="h-6 w-6 mr-3" />
                      Start Camera Scan
                    </Button>
                  )}
                  
                  {/* Upload File */}
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    variant="outline"
                    className="w-full h-16 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white rounded-2xl text-lg font-semibold"
                  >
                    <Upload className="h-6 w-6 mr-3" />
                    Upload Image
                  </Button>
                </div>
              )}
              
              {!hasCamera && (
                <div className="bg-yellow-900/50 border border-yellow-600 rounded-2xl p-4 text-center">
                  <p className="text-yellow-200 font-medium">Camera not available</p>
                  <p className="text-yellow-300 text-sm mt-1">You can upload images to scan QR codes</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* CSS for scanning animation */}
      <style jsx>{`
        .scan-line {
          animation: scanline 2s ease-in-out infinite;
        }
        
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(0%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </>
  );
}
