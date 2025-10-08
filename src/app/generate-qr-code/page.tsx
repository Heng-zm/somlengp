'use client';

import { memo } from 'react';
import React, { useState, useRef, useContext, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  Download, Copy, QrCode, Share, Settings, Palette, 
  Monitor, Smartphone, Image as ImageIcon, FileImage, Camera,
  Zap, Shield, Lock, Wrench, Eye, RotateCcw,
  Sparkles, CheckCircle, Loader2, Type, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LanguageContext } from '@/contexts/language-context';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/lib/toast-utils';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { QRScannerFAB } from '@/components/floating-action-button';
import { QRScannerSheet } from '@/components/qr-scanner-sheet';
import QRCodeLib from 'qrcode';

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


const GenerateQRCodePageComponent = function GenerateQRCodePage() {
  const [inputText, setInputText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [livePreviewUrl, setLivePreviewUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLiveGenerating, setIsLiveGenerating] = useState(false);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('M');
  const [size, setSize] = useState(256);
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [outputFormat, setOutputFormat] = useState<'png' | 'svg' | 'jpeg'>('png');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const { toast } = useToast(); // Not used directly, using toast utils instead
  
  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('GenerateQRCodePage must be used within a LanguageProvider');
  }

  // Debounced values for live preview
  const debouncedInputText = useDebounce(inputText, 300);
  const debouncedQrOptions = useDebounce({
    errorCorrectionLevel: errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H',
    margin: 1,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
    width: size,
    ...(outputFormat === 'jpeg' && { quality: 0.8 }),
    ...(outputFormat === 'png' && { quality: 0.92 })
  }, 100);

  // Memoized QR generation options
  const qrOptions = useMemo(() => ({
    errorCorrectionLevel: errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H',
    margin: 1,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
    width: size,
    ...(outputFormat === 'jpeg' && { quality: 0.8 }),
    ...(outputFormat === 'png' && { quality: 0.92 })
  }), [errorCorrectionLevel, foregroundColor, backgroundColor, size, outputFormat]);

  // Live preview generation effect
  useEffect(() => {
    const generateLivePreview = async () => {
      if (!debouncedInputText.trim()) {
        setLivePreviewUrl('');
        return;
      }

      setIsLiveGenerating(true);
      try {
        let url: string;
        if (outputFormat === 'svg') {
          // Generate SVG string and convert to data URL
          const svgString = await QRCodeLib.toString(debouncedInputText, {
            ...debouncedQrOptions,
            type: 'svg',
          });
          url = `data:image/svg+xml;base64,${btoa(svgString)}`;
        } else {
          // Create properly typed options for toDataURL
          const dataUrlOptions = {
            ...debouncedQrOptions,
            type: outputFormat === 'jpeg' ? 'image/jpeg' as const : 'image/png' as const
          };
          url = await QRCodeLib.toDataURL(debouncedInputText, dataUrlOptions);
        }
        setLivePreviewUrl(url);
      } catch (error) {
        console.error('Error generating live preview:', error);
        setLivePreviewUrl('');
      } finally {
        setIsLiveGenerating(false);
      }
    };

    generateLivePreview();
  }, [debouncedInputText, debouncedQrOptions, outputFormat]);

  // Cleanup canvas on unmount
  useEffect(() => {
    const canvas = canvasRef.current; // Capture current value
    return () => {
      // Clean up canvas context
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
  }, []);
  

  const generateQRCode = useCallback(async () => {
    if (!inputText.trim()) {
      showWarningToast("Text Required");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Use live preview URL if available, otherwise generate new one
      let url = livePreviewUrl;
      if (!url) {
        if (outputFormat === 'svg') {
          const svgString = await QRCodeLib.toString(inputText, {
            ...qrOptions,
            type: 'svg',
          });
          url = `data:image/svg+xml;base64,${btoa(svgString)}`;
        } else {
          // Create properly typed options for toDataURL
          const dataUrlOptions = {
            ...qrOptions,
            type: outputFormat === 'jpeg' ? 'image/jpeg' as const : 'image/png' as const
          };
          url = await QRCodeLib.toDataURL(inputText, dataUrlOptions);
        }
      }
      setQrCodeUrl(url);
      
      // Also generate on canvas for download
      if (canvasRef.current) {
        await QRCodeLib.toCanvas(canvasRef.current, inputText, qrOptions);
      }
      
      // Open the sheet modal to show the QR code
      setIsSheetOpen(true);
      
      showSuccessToast("QR Code Generated!");
    } catch (error) {
      console.error('Error generating QR code:', error);
      showErrorToast("Generation Failed");
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, qrOptions, livePreviewUrl, outputFormat]);

  const downloadQRCode = useCallback(() => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-code.${outputFormat}`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessToast("Download Complete!");
  }, [qrCodeUrl, outputFormat]);

  const copyToClipboard = useCallback(async () => {
    if (!qrCodeUrl) return;
    
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      
      showSuccessToast("Copied Successfully!");
    } catch (error) {
      console.error('Failed to copy QR code:', error);
      showErrorToast("Copy Failed");
    }
  }, [qrCodeUrl]);

  const shareQRCode = useCallback(async () => {
    if (!qrCodeUrl || !navigator.share) {
      showWarningToast("Share Unavailable");
      return;
    }

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], `qr-code.${outputFormat}`, { type: blob.type });
      
      await navigator.share({
        title: 'QR Code',
        text: `QR Code for: ${inputText}`,
        files: [file],
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
      showErrorToast("Share Failed");
    }
  }, [qrCodeUrl, inputText, outputFormat]);

  const handleScanSuccess = useCallback((data: string) => {
    setInputText(data);
    setIsScannerOpen(false);
    // No need to call generateQRCode since live preview will handle it automatically
    // The 500ms delay is removed as live preview updates in real-time
  }, []);

  // Memoized color reset function
  const resetColors = useCallback(() => {
    setForegroundColor('#000000');
    setBackgroundColor('#ffffff');
  }, []);

  // Memoized foreground color setter functions
  const setForegroundColorFunctions = useMemo(() => 
    ['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af'].map(color => 
      () => setForegroundColor(color)
    ), []
  );

  // Memoized background color setter functions  
  const setBackgroundColorFunctions = useMemo(() => 
    ['#ffffff', '#f8fafc', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af'].map(color => 
      () => setBackgroundColor(color)
    ), []
  );

  // Memoized live preview download handler
  const handleLivePreviewDownload = useCallback(() => {
    if (livePreviewUrl) {
      const link = document.createElement('a');
      link.download = `qr-code.${outputFormat}`;
      link.href = livePreviewUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccessToast("Download Complete!");
    }
  }, [livePreviewUrl, outputFormat]);

  // Memoized live preview copy handler
  const handleLivePreviewCopy = useCallback(async () => {
    if (livePreviewUrl) {
      try {
        const response = await fetch(livePreviewUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        showSuccessToast("Copied Successfully!");
      } catch (error) {
        console.error('Failed to copy QR code:', error);
        showErrorToast("Copy Failed");
      }
    }
  }, [livePreviewUrl]);

  // Memoized live preview share handler
  const handleLivePreviewShare = useCallback(async () => {
    if (livePreviewUrl && navigator.share) {
      try {
        const response = await fetch(livePreviewUrl);
        const blob = await response.blob();
        const file = new File([blob], `qr-code.${outputFormat}`, { type: blob.type });
        
        await navigator.share({
          title: 'QR Code',
          text: `QR Code for: ${inputText}`,
          files: [file],
        });
      } catch (error) {
        console.error('Error sharing QR code:', error);
        showErrorToast("Share Failed");
      }
    }
  }, [livePreviewUrl, outputFormat, inputText]);

  return (
    <FeaturePageLayout title="QR Code Generator">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-8">
            <div className="space-y-6">
              {/* Text Input */}
              <div className="space-y-3">
                <Label htmlFor="input-text" className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Type className="w-4 h-4 text-gray-600" />
                  Enter Your Content
                </Label>
                <Textarea
                  id="input-text"
                  placeholder="Paste your URL, type a message, or enter any text to generate a QR code..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                  className="w-full p-4 text-base border-2 border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 rounded-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 resize-none placeholder:text-gray-400"
                />
                <div className="text-right text-xs text-gray-500">
                  {inputText.length} characters
                </div>
              </div>


              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-700" />
                  Customize Settings
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Shield className="w-4 h-4 text-gray-600" /> Error Correction</Label>
                    <Select value={errorCorrectionLevel} onValueChange={setErrorCorrectionLevel}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-gray-500 rounded-xl bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border-gray-200 rounded-xl">
                        <SelectItem value="L" className="rounded-lg flex items-center gap-2"><Wrench className="w-4 h-4" /> Low (7%)</SelectItem>
                        <SelectItem value="M" className="rounded-lg flex items-center gap-2"><Zap className="w-4 h-4" /> Medium (15%)</SelectItem>
                        <SelectItem value="Q" className="rounded-lg flex items-center gap-2"><Lock className="w-4 h-4" /> Quartile (25%)</SelectItem>
                        <SelectItem value="H" className="rounded-lg flex items-center gap-2"><Shield className="w-4 h-4" /> High (30%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Monitor className="w-4 h-4 text-gray-600" /> Size</Label>
                    <Select value={size.toString()} onValueChange={(value) => setSize(parseInt(value))}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-400 rounded-xl bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border-gray-200 rounded-xl">
                        <SelectItem value="128" className="rounded-lg flex items-center gap-2"><Smartphone className="w-4 h-4" /> Small (128px)</SelectItem>
                        <SelectItem value="256" className="rounded-lg flex items-center gap-2"><Monitor className="w-4 h-4" /> Medium (256px)</SelectItem>
                        <SelectItem value="512" className="rounded-lg flex items-center gap-2"><Monitor className="w-4 h-4" /> Large (512px)</SelectItem>
                        <SelectItem value="1024" className="rounded-lg flex items-center gap-2"><Monitor className="w-4 h-4" /> XL (1024px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-gray-600" /> Format</Label>
                    <Select value={outputFormat} onValueChange={(value: 'png' | 'svg' | 'jpeg') => setOutputFormat(value)}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border-gray-200 rounded-xl">
                        <SelectItem value="png" className="rounded-lg flex items-center gap-2"><FileImage className="w-4 h-4" /> PNG (High Quality)</SelectItem>
                        <SelectItem value="svg" className="rounded-lg flex items-center gap-2"><ImageIcon className="w-4 h-4" /> SVG (Scalable)</SelectItem>
                        <SelectItem value="jpeg" className="rounded-lg flex items-center gap-2"><Camera className="w-4 h-4" /> JPEG (Compact)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Color Customization */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-gray-700" />
                  Colors
                </h3>
                
                <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Foreground Color */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Hash className="w-4 h-4 text-gray-600" /> Foreground</Label>
                        <span className="text-xs font-mono bg-white px-2 py-1 rounded-lg border text-gray-600">
                          {foregroundColor}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="color"
                          value={foregroundColor}
                          onChange={(e) => setForegroundColor(e.target.value)}
                          className="h-16 w-full cursor-pointer border-2 border-gray-200 hover:border-gray-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        {['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af'].map((color, index) => (
                          <button
                            key={color}
                            type="button"
                            onClick={setForegroundColorFunctions[index]}
                            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                              foregroundColor === color ? 'border-gray-800 shadow-lg scale-110' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Background Color */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Hash className="w-4 h-4 text-gray-600" /> Background</Label>
                        <span className="text-xs font-mono bg-white px-2 py-1 rounded-lg border text-gray-600">
                          {backgroundColor}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="h-16 w-full cursor-pointer border-2 border-gray-200 hover:border-blue-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        {['#ffffff', '#f8fafc', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af'].map((color, index) => (
                          <button
                            key={color}
                            type="button"
                            onClick={setBackgroundColorFunctions[index]}
                            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                              backgroundColor === color ? 'border-gray-800 shadow-lg scale-110' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Color Preview */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2"><Eye className="w-4 h-4 text-gray-600" /> Preview</div>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center"
                        style={{ backgroundColor: backgroundColor }}
                      >
                        <div className="grid grid-cols-3 gap-0.5">
                          {[...Array(9)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 h-1 rounded-sm"
                              style={{ 
                                backgroundColor: [0, 2, 6, 8, 4].includes(i) ? foregroundColor : 'transparent'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={resetColors}
                        className="text-xs text-gray-600 hover:text-gray-800 font-medium px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <span className="flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Reset</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateQRCode}
                disabled={isGenerating || !inputText.trim()}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-gray-800 via-gray-700 to-black hover:from-gray-900 hover:via-gray-800 hover:to-black text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : livePreviewUrl ? (
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5" />
                    <span>View Full QR Code</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <QrCode className="h-5 w-5" />
                    <span>Generate QR Code</span>
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Result Section - Hidden on mobile */}
          <div className="hidden lg:block bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-8">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-gray-600" /> Live Preview
                </h2>
                <p className="text-gray-600">
                  {livePreviewUrl ? 'Updates as you type!' : (inputText.trim() ? 'Generating preview...' : 'Type something to see live preview')}
                </p>
              </div>

              {livePreviewUrl || isLiveGenerating ? (
                <div className="space-y-6">
                  {/* QR Code Display */}
                  <div className="flex justify-center">
                    <div className="relative group">
                      <div className="absolute -inset-2 bg-gradient-to-r from-gray-400 via-gray-300 to-gray-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse"></div>
                      <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                        {isLiveGenerating && !livePreviewUrl ? (
                          <div className="w-[280px] h-[280px] flex items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-gray-600" />
                          </div>
                        ) : livePreviewUrl ? (
                          <Image
                            src={livePreviewUrl}
                            alt="Live QR Code Preview"
                            width={280}
                            height={280}
                            className={`w-full h-auto rounded-2xl transition-all duration-300 hover:scale-105 ${isLiveGenerating ? 'opacity-70' : 'opacity-100'}`}
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-[280px] h-[280px] flex items-center justify-center text-gray-400">
                            <QrCode className="h-16 w-16" />
                          </div>
                        )}
                        {livePreviewUrl && (
                          <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {isLiveGenerating && livePreviewUrl && (
                          <div className="absolute -top-3 -left-3 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={handleLivePreviewDownload}
                      disabled={!livePreviewUrl || isLiveGenerating}
                      className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span className="font-medium">Download {outputFormat.toUpperCase()}</span>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={handleLivePreviewCopy}
                      disabled={!livePreviewUrl || isLiveGenerating}
                      variant="outline"
                      className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <div className="flex items-center gap-2">
                        <Copy className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Copy to Clipboard</span>
                      </div>
                    </Button>
                    
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <Button
                        onClick={handleLivePreviewShare}
                        disabled={!livePreviewUrl || isLiveGenerating}
                        variant="outline"
                        className="w-full h-12 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                      >
                        <div className="flex items-center gap-2">
                          <Share className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-700">Share QR Code</span>
                        </div>
                      </Button>
                    )}
                  </div>
                  
                  {/* QR Code Details */}
                  {livePreviewUrl && (
                    <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 rounded-2xl p-6 border border-gray-100">
                      <h4 className="font-semibold text-gray-800 text-center mb-4 text-lg flex items-center justify-center gap-2">
                        <Eye className="w-5 h-5 text-gray-600" /> Live Preview Info
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                          <span className="text-gray-600 font-medium text-sm flex items-center gap-2"><Type className="w-4 h-4" /> Content:</span>
                          <span className="font-semibold text-gray-800 text-sm max-w-[60%] text-right truncate">
                            {inputText.length > 25 ? `${inputText.substring(0, 25)}...` : inputText}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                          <span className="text-gray-600 font-medium text-sm flex items-center gap-2"><Monitor className="w-4 h-4" /> Size:</span>
                          <span className="font-semibold text-gray-800 text-sm">{size}×{size}px</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                          <span className="text-gray-600 font-medium text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Error Correction:</span>
                          <span className="font-semibold text-gray-800 text-sm">
                            {errorCorrectionLevel === 'L' && <span className="flex items-center gap-1"><Wrench className="w-4 h-4" /> Low (7%)</span>}
                            {errorCorrectionLevel === 'M' && <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> Medium (15%)</span>}
                            {errorCorrectionLevel === 'Q' && <span className="flex items-center gap-1"><Lock className="w-4 h-4" /> Quartile (25%)</span>}
                            {errorCorrectionLevel === 'H' && <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> High (30%)</span>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                          <span className="text-gray-600 font-medium text-sm flex items-center gap-2"><Palette className="w-4 h-4" /> Colors:</span>
                          <div className="flex gap-3 items-center">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm" 
                                style={{ backgroundColor: foregroundColor }}
                              />
                              <span className="text-xs text-gray-500 font-mono">{foregroundColor}</span>
                            </div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm" 
                                style={{ backgroundColor: backgroundColor }}
                              />
                              <span className="text-xs text-gray-500 font-mono">{backgroundColor}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 rounded-full animate-pulse opacity-50"></div>
                    <div className="relative p-6 bg-white rounded-full shadow-lg border border-gray-200">
                      <QrCode className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  <div className="text-center space-y-3 max-w-sm">
                    <h3 className="text-xl font-semibold text-gray-700 flex items-center justify-center gap-2"><QrCode className="w-5 h-5" /> Ready to Generate</h3>
                    <p className="text-gray-500 leading-relaxed">
                      Enter your content on the left and click the generate button to create your personalized QR code.
                    </p>
                    <div className="flex justify-center items-center gap-2 pt-4">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '400ms'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
      {/* Hidden canvas for download */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* QR Scanner Floating Button */}
        <QRScannerFAB onClick={() => setIsScannerOpen(true)} />
        
        {/* QR Scanner Sheet */}
        <QRScannerSheet 
          open={isScannerOpen} 
          onOpenChange={setIsScannerOpen} 
          onScanSuccess={handleScanSuccess} 
        />
      </div>

      {/* QR Code Bottom Sheet Modal */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="flex flex-col h-auto max-h-[85vh] rounded-t-3xl border-0 bg-gradient-to-b from-white via-white to-gray-50/80 backdrop-blur-xl shadow-2xl">
          {/* Fixed Header */}
          <div className="flex-shrink-0">
            <SheetHeader className="pb-4 pt-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 opacity-60" />
              <SheetTitle className="text-center text-2xl font-bold bg-gradient-to-r from-gray-800 via-gray-600 to-black bg-clip-text text-transparent flex items-center justify-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" /> QR Code Generated!
              </SheetTitle>
              <SheetDescription className="text-center text-gray-600 text-base">
                Your QR code is ready to use. Scan, share, or download it below.
              </SheetDescription>
            </SheetHeader>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 transition-colors" style={{padding: '1rem'}}>
            {qrCodeUrl && (
              <div className="space-y-6 pb-6 px-2">
                {/* QR Code Display */}
                <div className="flex justify-center pt-2">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-400/20 via-gray-300/20 to-gray-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse" />
                    <div className="relative p-8 bg-white rounded-3xl border border-gray-100 shadow-2xl">
                      <Image
                        src={qrCodeUrl}
                        alt="Generated QR Code"
                        width={320}
                        height={320}
                        className="w-full max-w-xs h-auto rounded-2xl shadow-lg"
                        unoptimized={true}
                      />
                      <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center px-4">
                  <Button
                    onClick={downloadQRCode}
                    className="flex items-center gap-2 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-2xl px-6 py-3"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  
                  <Button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-2xl px-6 py-3"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button
                      onClick={shareQRCode}
                      className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-2xl px-6 py-3"
                    >
                      <Share className="h-4 w-4" />
                      Share
                    </Button>
                  )}
                </div>

                {/* QR Code Details */}
                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/60 backdrop-blur-sm rounded-2xl p-5 mx-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-800 text-center mb-4 text-lg flex items-center justify-center gap-2"><Eye className="w-5 h-5 text-gray-600" /> QR Code Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <span className="text-gray-500 text-sm font-medium flex items-center gap-2"><Type className="w-4 h-4" /> Data:</span>
                      <span className="font-medium text-gray-800 text-sm break-all text-right max-w-[60%]">
                        {inputText.length > 30 ? `${inputText.substring(0, 30)}...` : inputText}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <span className="text-gray-500 text-sm font-medium flex items-center gap-2"><Monitor className="w-4 h-4" /> Size:</span>
                      <span className="font-medium text-gray-800 text-sm">{size}×{size}px</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <span className="text-gray-500 text-sm font-medium flex items-center gap-2"><Shield className="w-4 h-4" /> Error Correction:</span>
                      <span className="font-medium text-gray-800 text-sm">{errorCorrectionLevel}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <span className="text-gray-500 text-sm font-medium flex items-center gap-2"><Palette className="w-4 h-4" /> Colors:</span>
                      <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300" 
                            style={{ backgroundColor: foregroundColor }}
                          />
                          <span className="text-xs text-gray-500">FG</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300" 
                            style={{ backgroundColor: backgroundColor }}
                          />
                          <span className="text-xs text-gray-500">BG</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </FeaturePageLayout>
  );
}


export default memo(GenerateQRCodePageComponent);