'use client';

import React, { useState, useRef, useContext, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Copy, QrCode, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LanguageContext } from '@/contexts/language-context';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/lib/toast-utils';
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
  // const { toast } = useToast(); // Not used directly, using toast utils instead
  
  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('GenerateQRCodePage must be used within a LanguageProvider');
  }
  

  const generateQRCode = useCallback(async () => {
    if (!inputText.trim()) {
      showWarningToast("Text Required");
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
      
      showSuccessToast("QR Code Generated!");
    } catch (error) {
      console.error('Error generating QR code:', error);
      showErrorToast("Generation Failed");
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, errorCorrectionLevel, size, foregroundColor, backgroundColor]);

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessToast("Download Complete!");
  };

  const copyToClipboard = async () => {
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
  };

  const shareQRCode = async () => {
    if (!qrCodeUrl || !navigator.share) {
      showWarningToast("Share Unavailable");
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
      showErrorToast("Share Failed");
    }
  };

  return (
    <FeaturePageLayout title="QR Code Generator">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold text-lg"
              disabled
            >
              <QrCode className="h-5 w-5 mr-2" />
              CREATE QR
            </Button>
          </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
            <div className="space-y-6">
              {/* Text Input */}
              <div className="space-y-3">
                <Label htmlFor="input-text" className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Enter Your Content
                </Label>
                <Textarea
                  id="input-text"
                  placeholder="Paste your URL, type a message, or enter any text to generate a QR code..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                  className="w-full p-4 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 resize-none placeholder:text-gray-400"
                />
                <div className="text-right text-xs text-gray-500">
                  {inputText.length} characters
                </div>
              </div>


              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Customize Settings
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Error Correction</Label>
                    <Select value={errorCorrectionLevel} onValueChange={setErrorCorrectionLevel}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-400 rounded-xl bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border-gray-200 rounded-xl">
                        <SelectItem value="L" className="rounded-lg">🔧 Low (7%)</SelectItem>
                        <SelectItem value="M" className="rounded-lg">⚡ Medium (15%)</SelectItem>
                        <SelectItem value="Q" className="rounded-lg">🔒 Quartile (25%)</SelectItem>
                        <SelectItem value="H" className="rounded-lg">🛡️ High (30%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">QR Code Size</Label>
                    <Select value={size.toString()} onValueChange={(value) => setSize(parseInt(value))}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-400 rounded-xl bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border-gray-200 rounded-xl">
                        <SelectItem value="128" className="rounded-lg">📱 Small (128px)</SelectItem>
                        <SelectItem value="256" className="rounded-lg">💻 Medium (256px)</SelectItem>
                        <SelectItem value="512" className="rounded-lg">🖥️ Large (512px)</SelectItem>
                        <SelectItem value="1024" className="rounded-lg">🎯 XL (1024px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Color Customization */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  Color Theme
                </h3>
                
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Foreground Color */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700">Foreground</Label>
                        <span className="text-xs font-mono bg-white px-2 py-1 rounded-lg border text-gray-600">
                          {foregroundColor}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="color"
                          value={foregroundColor}
                          onChange={(e) => setForegroundColor(e.target.value)}
                          className="h-16 w-full cursor-pointer border-2 border-gray-200 hover:border-blue-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        {['#000000', '#1f2937', '#dc2626', '#7c3aed', '#059669', '#ea580c'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setForegroundColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                              foregroundColor === color ? 'border-blue-500 shadow-lg scale-110' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Background Color */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700">Background</Label>
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
                        {['#ffffff', '#f8fafc', '#fef3c7', '#ddd6fe', '#dcfce7', '#fed7d7'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setBackgroundColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                              backgroundColor === color ? 'border-blue-500 shadow-lg scale-110' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Color Preview */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700">Preview</div>
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
                        onClick={() => {
                          setForegroundColor('#000000');
                          setBackgroundColor('#ffffff');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateQRCode}
                disabled={isGenerating || !inputText.trim()}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Generating Magic...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <QrCode className="h-5 w-5" />
                    <span>✨ Generate QR Code</span>
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Result Section - Hidden on mobile */}
          <div className="hidden lg:block bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  ✨ Your QR Code
                </h2>
                <p className="text-gray-600">
                  {qrCodeUrl ? 'Ready to share!' : 'Generate a QR code to preview it here'}
                </p>
              </div>

              {qrCodeUrl ? (
                <div className="space-y-6">
                  {/* QR Code Display */}
                  <div className="flex justify-center">
                    <div className="relative group">
                      <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse"></div>
                      <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                        <Image
                          src={qrCodeUrl}
                          alt="Generated QR Code"
                          width={280}
                          height={280}
                          className="w-full h-auto rounded-2xl transition-transform duration-300 hover:scale-105"
                          unoptimized={true}
                        />
                        <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={downloadQRCode}
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span className="font-medium">💾 Download PNG</span>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="w-full h-12 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-2xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-2">
                        <Copy className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-700">📋 Copy to Clipboard</span>
                      </div>
                    </Button>
                    
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <Button
                        onClick={shareQRCode}
                        variant="outline"
                        className="w-full h-12 border-2 border-green-200 hover:border-green-300 hover:bg-green-50 rounded-2xl transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-2">
                          <Share2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">🚀 Share QR Code</span>
                        </div>
                      </Button>
                    )}
                  </div>
                  
                  {/* QR Code Details */}
                  <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/50 rounded-2xl p-6 border border-gray-100">
                    <h4 className="font-semibold text-gray-800 text-center mb-4 text-lg">
                      📊 QR Code Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                        <span className="text-gray-600 font-medium text-sm">📝 Content:</span>
                        <span className="font-semibold text-gray-800 text-sm max-w-[60%] text-right truncate">
                          {inputText.length > 25 ? `${inputText.substring(0, 25)}...` : inputText}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                        <span className="text-gray-600 font-medium text-sm">📐 Size:</span>
                        <span className="font-semibold text-gray-800 text-sm">{size}×{size}px</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                        <span className="text-gray-600 font-medium text-sm">🛡️ Error Correction:</span>
                        <span className="font-semibold text-gray-800 text-sm">
                          {errorCorrectionLevel === 'L' && '🔧 Low (7%)'}
                          {errorCorrectionLevel === 'M' && '⚡ Medium (15%)'}
                          {errorCorrectionLevel === 'Q' && '🔒 Quartile (25%)'}
                          {errorCorrectionLevel === 'H' && '🛡️ High (30%)'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                        <span className="text-gray-600 font-medium text-sm">🎨 Colors:</span>
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
                    <h3 className="text-xl font-semibold text-gray-700">🎯 Ready to Generate</h3>
                    <p className="text-gray-500 leading-relaxed">
                      Enter your content on the left and click the generate button to create your personalized QR code.
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
                      <Image
                        src={qrCodeUrl}
                        alt="Generated QR Code"
                        width={320}
                        height={320}
                        className="w-full max-w-xs h-auto rounded-2xl shadow-lg"
                        unoptimized={true}
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
      </div>
    </FeaturePageLayout>
  );
}
