'use client';

import React from 'react';
import { Copy, ExternalLink, X, CheckCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';

interface QRResultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scannedData: string;
}

export function QRResultDrawer({ isOpen, onClose, scannedData }: QRResultDrawerProps) {
  const { toast } = useToast();

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

  const getContentType = () => {
    if (scannedData.startsWith('http')) return { icon: '🔗', label: 'URL' };
    if (scannedData.includes('@')) return { icon: '📧', label: 'Email' };
    if (/^\d+$/.test(scannedData)) return { icon: '🔢', label: 'Number' };
    return { icon: '📄', label: 'Text' };
  };

  const contentType = getContentType();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl border-0 p-0">
        <div className="flex flex-col h-full bg-gradient-to-b from-green-50 to-white">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b border-green-100 bg-gradient-to-r from-green-500 to-emerald-500">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6" />
                </div>
                QR Code Scanned!
              </SheetTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="text-green-50 text-center pt-2">
              ✨ Successfully detected QR code content
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Success Message */}
              <div className="bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 rounded-2xl p-6 text-center border border-green-200">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Scan Successful!</h3>
                <p className="text-green-700">Your QR code has been successfully scanned and decoded.</p>
              </div>

              {/* Content Display */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    📋 Scanned Content
                  </h4>
                  <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                    <span>{contentType.icon}</span>
                    <span className="text-gray-600 font-medium">{contentType.label}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-gray-800 break-all text-sm leading-relaxed font-mono">
                    {scannedData}
                  </p>
                </div>
              </div>

              {/* Content Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📊 Content Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600 font-medium">Type:</span>
                    <span className="font-semibold text-gray-800 flex items-center gap-1">
                      {contentType.icon} {contentType.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600 font-medium">Length:</span>
                    <span className="font-semibold text-gray-800">{scannedData.length} characters</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600 font-medium">Status:</span>
                    <span className="font-semibold text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Successfully Decoded
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={copyToClipboard}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-lg font-semibold"
                >
                  <Copy className="h-5 w-5 mr-3" />
                  📋 Copy to Clipboard
                </Button>
                
                {(scannedData.startsWith('http://') || scannedData.startsWith('https://')) && (
                  <Button
                    onClick={openLink}
                    variant="outline"
                    className="w-full h-14 border-2 border-green-300 hover:border-green-400 hover:bg-green-50 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] text-lg font-semibold"
                  >
                    <ExternalLink className="h-5 w-5 mr-3 text-green-600" />
                    <span className="text-green-700">🔗 Open Link</span>
                  </Button>
                )}
                
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full h-14 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] text-lg font-semibold"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
