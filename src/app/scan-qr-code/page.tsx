'use client';

import React, { useState, useRef, useContext, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Upload, QrCode, Copy, ExternalLink, X, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LanguageContext } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

// QR code scanning library - we'll use jsqr for client-side scanning
declare global {
  interface Window {
    jsQR: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
  }
}

export default function ScanQRCodePage() {
  const [scannedData, setScannedData] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFullscreenScan, setIsFullscreenScan] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('ScanQRCodePage must be used within a LanguageProvider');
  }
  
  // const { language } = langContext;
  // const t = allTranslations[language]; // Uncomment when translations are needed

  // Load jsQR library
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
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

    if (navigator.mediaDevices) {
      checkCamera();
    }
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      setIsCameraActive(true);
      setIsFullscreenScan(true);
      
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
    setIsFullscreenScan(false);
  }, [stream]);

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
        setScannedData(code.data);
        setIsScanning(false);
        stopCamera();
        
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
  }, [isScanning, toast, stopCamera]);

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
            setScannedData(code.data);
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scannedData);
      toast({
        title: "Copied!",
        description: "QR code content copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const openLink = () => {
    if (scannedData.startsWith('http://') || scannedData.startsWith('https://')) {
      window.open(scannedData, '_blank');
    } else {
      toast({
        title: "Not a Link",
        description: "The scanned content is not a valid URL",
        variant: "destructive",
      });
    }
  };

  const clearResult = () => {
    setScannedData('');
  };

  return (
    <FeaturePageLayout title="QR Code Scanner">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Link href="/generate-qr-code">
              <Button 
                variant="outline"
                className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold text-lg"
              >
                <QrCode className="h-5 w-5 mr-2" />
                CREATE QR
              </Button>
            </Link>
            
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold text-lg"
              disabled
            >
              <ScanLine className="h-5 w-5 mr-2" />
              SCAN QR
            </Button>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Scanner Section */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
              <div className="space-y-6">
                
                {/* Header */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    📷 Scan QR Code
                  </h2>
                  <p className="text-gray-600">
                    Use your camera or upload an image to scan QR codes
                  </p>
                </div>

                {/* Camera Section */}
                {isCameraActive ? (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-2xl overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-64 object-cover rounded-2xl"
                        autoPlay
                        playsInline
                        muted
                      />
                      {isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-blue-500 rounded-lg animate-pulse">
                            <div className="absolute inset-2 border border-blue-300/50 rounded-lg animate-pulse" style={{ animationDelay: '0.5s' }} />
                            <ScanLine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400 h-8 w-8 animate-bounce" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="w-full h-12 border-2 border-red-200 hover:border-red-300 hover:bg-red-50 rounded-2xl transition-all duration-200"
                    >
                      <X className="h-4 w-4 mr-2 text-red-600" />
                      <span className="font-medium text-red-700">Stop Camera</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Camera Button */}
                    {hasCamera && (
                      <Button
                        onClick={startCamera}
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <Camera className="h-5 w-5 mr-3" />
                        📷 Start Camera Scan
                      </Button>
                    )}
                    
                    {/* File Upload */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Upload Image
                      </Label>
                      
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl bg-gray-50/50 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-3"
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <div className="text-center">
                          <p className="text-gray-600 font-medium">Click to upload image</p>
                          <p className="text-gray-400 text-sm">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
                
                {!hasCamera && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                    <p className="text-yellow-700 font-medium">📱 Camera not available</p>
                    <p className="text-yellow-600 text-sm mt-1">You can still upload images to scan QR codes</p>
                  </div>
                )}
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                    🎯 Scan Results
                  </h2>
                  <p className="text-gray-600">
                    {scannedData ? 'QR code content detected!' : 'Scan a QR code to see results here'}
                  </p>
                </div>

                {scannedData ? (
                  <div className="space-y-6">
                    {/* Result Display */}
                    <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/50 rounded-2xl p-6 border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-gray-800 text-lg">📋 Content</h3>
                        <Button
                          onClick={clearResult}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-gray-600 p-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="bg-white/80 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-800 break-all text-sm leading-relaxed">
                          {scannedData}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={copyToClipboard}
                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        📋 Copy to Clipboard
                      </Button>
                      
                      {(scannedData.startsWith('http://') || scannedData.startsWith('https://')) && (
                        <Button
                          onClick={openLink}
                          variant="outline"
                          className="w-full h-12 border-2 border-green-200 hover:border-green-300 hover:bg-green-50 rounded-2xl transition-all duration-200 transform hover:scale-[1.02]"
                        >
                          <ExternalLink className="h-4 w-4 mr-2 text-green-600" />
                          <span className="font-medium text-green-700">🔗 Open Link</span>
                        </Button>
                      )}
                    </div>

                    {/* Content Info */}
                    <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/50 rounded-2xl p-6 border border-gray-100">
                      <h4 className="font-semibold text-gray-800 text-center mb-4 text-lg">
                        📊 Content Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                          <span className="text-gray-600 font-medium text-sm">📝 Type:</span>
                          <span className="font-semibold text-gray-800 text-sm">
                            {scannedData.startsWith('http') ? '🔗 URL' : 
                             scannedData.includes('@') ? '📧 Email' : 
                             /^\d+$/.test(scannedData) ? '🔢 Number' : '📄 Text'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                          <span className="text-gray-600 font-medium text-sm">📏 Length:</span>
                          <span className="font-semibold text-gray-800 text-sm">{scannedData.length} characters</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-purple-100 to-green-100 rounded-full animate-pulse opacity-50"></div>
                      <div className="relative p-6 bg-white rounded-full shadow-lg border border-gray-200">
                        <QrCode className="h-12 w-12 text-gray-400" />
                      </div>
                    </div>
                    <div className="text-center space-y-3 max-w-sm">
                      <h3 className="text-xl font-semibold text-gray-700">🔍 Ready to Scan</h3>
                      <p className="text-gray-500 leading-relaxed">
                        Use the camera or upload an image to scan QR codes and see the results here.
                      </p>
                      <div className="flex justify-center items-center gap-2 pt-4">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '400ms'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Hidden canvas for QR processing */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Fullscreen Scanning UI */}
        {isFullscreenScan && (
          <div className="fixed inset-0 z-50 bg-black">
            {/* Fullscreen Video */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Overlay with scanning frame */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Dark overlay with transparent center */}
              <div className="absolute inset-0 bg-black/60" />
              
              {/* Scanning frame container */}
              <div className="relative z-10">
                {/* Main scanning square */}
                <div className="w-72 h-72 relative">
                  {/* Transparent center area */}
                  <div className="w-full h-full border-2 border-white/30 rounded-2xl" />
                  
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                  
                  {/* Animated scanning line */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" 
                           style={{
                             animation: 'scanline 2s ease-in-out infinite'
                           }} />
                    </div>
                  )}
                  
                  {/* Center crosshair */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 border-2 border-white rounded-full opacity-60">
                      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="text-center mt-8 space-y-3">
                  <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                    Scan QR Code
                  </h2>
                  <p className="text-white/80 text-lg drop-shadow-md">
                    Position the QR code within the frame
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '400ms'}} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={stopCamera}
              className="absolute top-6 right-6 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Bottom actions */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full backdrop-blur-md transition-colors flex items-center gap-2"
              >
                <Upload className="h-5 w-5" />
                Upload Image
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* CSS for scanning animation */}
      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(0%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </FeaturePageLayout>
  );
}
