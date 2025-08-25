'use client';

import React, { useState, useRef, useContext } from 'react';
import { Download, Copy, QrCode, Share2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LanguageContext } from '@/contexts/language-context';
import { allTranslations } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import QRCodeLib from 'qrcode';

export default function GenerateQRCodePage() {
  const [inputText, setInputText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('M');
  const [size, setSize] = useState(256);
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('GenerateQRCodePage must be used within a LanguageProvider');
  }
  
  const { language } = langContext;
  const t = allTranslations[language];

  const generateQRCode = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text or URL to generate QR code",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const options = {
        errorCorrectionLevel: errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H',
        type: 'image/png' as const,
        quality: 0.92,
        margin: 1,
        color: {
          dark: foregroundColor,
          light: backgroundColor,
        },
        width: size,
      };

      const url = await QRCodeLib.toDataURL(inputText, options);
      setQrCodeUrl(url);
      
      // Also generate on canvas for download
      if (canvasRef.current) {
        await QRCodeLib.toCanvas(canvasRef.current, inputText, options);
      }
      
      // Open the sheet modal to show the QR code
      setIsSheetOpen(true);
      
      toast({
        title: "Success",
        description: "QR code generated successfully!",
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Downloaded",
      description: "QR code saved as qr-code.png",
    });
  };

  const copyToClipboard = async () => {
    if (!qrCodeUrl) return;
    
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      
      toast({
        title: "Copied",
        description: "QR code copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy QR code:', error);
      toast({
        title: "Error", 
        description: "Failed to copy QR code to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareQRCode = async () => {
    if (!qrCodeUrl || !navigator.share) {
      toast({
        title: "Error",
        description: "Sharing not supported on this device",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], 'qr-code.png', { type: blob.type });
      
      await navigator.share({
        title: 'QR Code',
        text: `QR Code for: ${inputText}`,
        files: [file],
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
      toast({
        title: "Error",
        description: "Failed to share QR code",
        variant: "destructive",
      });
    }
  };

  return (
    <FeaturePageLayout
      title={t.generateQrCode}
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-2 xl:gap-12">
          {/* Input Section */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                  <QrCode className="h-5 w-5" />
                </div>
                Generate QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="input-text" className="text-sm font-medium text-gray-700">Text or URL</Label>
                <Textarea
                  id="input-text"
                  placeholder="Enter text, URL, or any data you want to encode..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                  className="resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 bg-white/70"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="error-correction" className="text-sm font-medium text-gray-700">Error Correction Level</Label>
                  <Select value={errorCorrectionLevel} onValueChange={setErrorCorrectionLevel}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm">
                      <SelectItem value="L" className="hover:bg-blue-50">Low (7%)</SelectItem>
                      <SelectItem value="M" className="hover:bg-blue-50">Medium (15%)</SelectItem>
                      <SelectItem value="Q" className="hover:bg-blue-50">Quartile (25%)</SelectItem>
                      <SelectItem value="H" className="hover:bg-blue-50">High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="size" className="text-sm font-medium text-gray-700">QR Code Size</Label>
                  <Select value={size.toString()} onValueChange={(value) => setSize(parseInt(value))}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm">
                      <SelectItem value="128" className="hover:bg-blue-50">128x128px</SelectItem>
                      <SelectItem value="256" className="hover:bg-blue-50">256x256px</SelectItem>
                      <SelectItem value="512" className="hover:bg-blue-50">512x512px</SelectItem>
                      <SelectItem value="1024" className="hover:bg-blue-50">1024x1024px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                    <Palette className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Color Customization</h3>
                    <p className="text-xs text-gray-500">Personalize your QR code colors</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/60 rounded-2xl p-5 border border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Foreground Color */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="fg-color" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-800 border border-gray-300"></div>
                          Foreground
                        </Label>
                        <span className="text-xs font-mono text-gray-500 bg-white/80 px-2 py-1 rounded-md">
                          {foregroundColor.toUpperCase()}
                        </span>
                      </div>
                      <div className="relative group">
                        <Input
                          id="fg-color"
                          type="color"
                          value={foregroundColor}
                          onChange={(e) => setForegroundColor(e.target.value)}
                          className="h-14 w-full cursor-pointer border-2 border-gray-200/80 hover:border-purple-300 focus:border-purple-400 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                      
                      {/* Quick Color Presets for Foreground */}
                      <div className="flex gap-2 justify-center">
                        {['#000000', '#1f2937', '#374151', '#6b7280', '#dc2626', '#7c3aed'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setForegroundColor(color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
                              foregroundColor === color ? 'border-purple-400 shadow-lg scale-110' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Background Color */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="bg-color" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
                          Background
                        </Label>
                        <span className="text-xs font-mono text-gray-500 bg-white/80 px-2 py-1 rounded-md">
                          {backgroundColor.toUpperCase()}
                        </span>
                      </div>
                      <div className="relative group">
                        <Input
                          id="bg-color"
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="h-14 w-full cursor-pointer border-2 border-gray-200/80 hover:border-purple-300 focus:border-purple-400 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                      
                      {/* Quick Color Presets for Background */}
                      <div className="flex gap-2 justify-center">
                        {['#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#fef3c7', '#ddd6fe'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setBackgroundColor(color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
                              backgroundColor === color ? 'border-purple-400 shadow-lg scale-110' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Color Preview */}
                  <div className="mt-6 pt-5 border-t border-gray-200/60">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Color Preview</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setForegroundColor('#000000');
                          setBackgroundColor('#ffffff');
                        }}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors duration-200"
                      >
                        Reset to Default
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <div 
                        className="w-24 h-24 rounded-2xl border-2 border-gray-200 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
                        style={{ backgroundColor: backgroundColor }}
                      >
                        <div className="grid grid-cols-3 gap-1">
                          {[...Array(9)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-sm ${
                                [0, 2, 6, 8, 4].includes(i) ? '' : 'opacity-60'
                              }`}
                              style={{ 
                                backgroundColor: [0, 2, 6, 8, 4].includes(i) ? foregroundColor : 'transparent'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={generateQRCode}
                disabled={isGenerating || !inputText.trim()}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Generate QR Code
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section - Hidden on mobile */}
          <Card className="hidden lg:block shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                <div className="p-2 rounded-full bg-gradient-to-br from-green-500 to-blue-600 text-white shadow-lg">
                  <QrCode className="h-5 w-5" />
                </div>
                Generated QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {qrCodeUrl ? (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="relative p-6 bg-white rounded-2xl border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl"></div>
                      <img
                        src={qrCodeUrl}
                        alt="Generated QR Code"
                        className="relative max-w-full h-auto rounded-lg transition-all duration-300 hover:scale-105"
                        style={{ maxWidth: '320px' }}
                      />
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={downloadQRCode}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                    >
                      <Download className="h-4 w-4 text-blue-600" />
                      Download
                    </Button>
                    
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                    >
                      <Copy className="h-4 w-4 text-purple-600" />
                      Copy
                    </Button>
                    
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <Button
                        onClick={shareQRCode}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                      >
                        <Share2 className="h-4 w-4 text-green-600" />
                        Share
                      </Button>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4 space-y-2">
                    <h4 className="font-medium text-gray-800 text-center mb-3">QR Code Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="bg-white/70 rounded-lg p-3 text-center">
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Data</p>
                        <p className="font-medium text-gray-800 break-all">{inputText.length > 20 ? `${inputText.substring(0, 20)}...` : inputText}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 text-center">
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Size</p>
                        <p className="font-medium text-gray-800">{size}×{size}px</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 text-center">
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Error Correction</p>
                        <p className="font-medium text-gray-800">{errorCorrectionLevel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full opacity-20 animate-pulse"></div>
                    <QrCode className="relative h-16 w-16 text-gray-300" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-gray-600">Your QR code will appear here</p>
                    <p className="text-sm text-gray-500">Enter text above and click &quot;Generate QR Code&quot; to get started</p>
                  </div>
                  <div className="mt-6 flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Hidden canvas for download */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* QR Code Bottom Sheet Modal */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="flex flex-col h-auto max-h-[85vh] rounded-t-3xl border-0 bg-gradient-to-b from-white via-white to-gray-50/80 backdrop-blur-xl shadow-2xl">
          {/* Fixed Header */}
          <div className="flex-shrink-0">
            <SheetHeader className="pb-4 pt-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 opacity-60" />
              <SheetTitle className="text-center text-2xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎉 QR Code Generated!
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
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-green-400/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse" />
                    <div className="relative p-8 bg-white rounded-3xl border border-gray-100 shadow-2xl">
                      <img
                        src={qrCodeUrl}
                        alt="Generated QR Code"
                        className="w-full max-w-xs h-auto rounded-2xl shadow-lg"
                      />
                      <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center px-4">
                  <Button
                    onClick={downloadQRCode}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-2xl px-6 py-3"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  
                  <Button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-2xl px-6 py-3"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button
                      onClick={shareQRCode}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-2xl px-6 py-3"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  )}
                </div>

                {/* QR Code Details */}
                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/60 backdrop-blur-sm rounded-2xl p-5 mx-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-800 text-center mb-4 text-lg">QR Code Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <span className="text-gray-500 text-sm font-medium">Data:</span>
                      <span className="font-medium text-gray-800 text-sm break-all text-right max-w-[60%]">
                        {inputText.length > 30 ? `${inputText.substring(0, 30)}...` : inputText}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <span className="text-gray-500 text-sm font-medium">Size:</span>
                      <span className="font-medium text-gray-800 text-sm">{size}×{size}px</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <span className="text-gray-500 text-sm font-medium">Error Correction:</span>
                      <span className="font-medium text-gray-800 text-sm">{errorCorrectionLevel}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <span className="text-gray-500 text-sm font-medium">Colors:</span>
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
    </FeaturePageLayout>
  );
}
