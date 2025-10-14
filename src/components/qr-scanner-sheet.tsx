'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { OptimizedQRScanner } from './optimized-qr-scanner';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions


interface QRScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess?: (data: string) => void;
  onScanError?: (error: string) => void;
}

export function QRScannerSheet({ open, onOpenChange, onScanSuccess, onScanError }: QRScannerSheetProps) {
  const [scannedData, setScannedData] = useState<string>('');

  const handleScanSuccess = (data: string, location?: any, confidence?: number) => {
    setScannedData(data);
    const message = confidence ? `QR Code Scanned! (${confidence}% confidence)` : 'QR Code Scanned!';
    showSuccessToast(message);
    onScanSuccess?.(data);
  };

  const handleScanError = (error: string) => {
    showErrorToast('Scan Failed');
    onScanError?.(error);
  };

  const handleClose = () => {
    setScannedData('');
    onOpenChange(false);
  };

  const copyToClipboard = async () => {
    if (scannedData) {
      try {
        await navigator.clipboard.writeText(scannedData);
        showSuccessToast('Copied to clipboard!');
      } catch (error) {
        showErrorToast('Failed to copy');
      }
    }
  };

  const openInNewTab = () => {
    if (scannedData && isValidUrl(scannedData)) {
      window.open(scannedData, '_blank', 'noopener,noreferrer');
    }
  };

  const isValidUrl = (text: string): boolean => {
    try {
      new URL(text);
      return true;
    } catch {
      return text.startsWith('http://') || text.startsWith('https://');
    }
  };

  const getContentType = (text: string): string => {
    if (isValidUrl(text)) return 'URL';
    if (text.includes('@') && text.includes('.')) return 'Email';
    if (text.match(/^\+?[\d\s\-()]+$/)) return 'Phone';
    if (text.startsWith('WIFI:')) return 'WiFi';
    if (text.startsWith('VCARD:') || text.startsWith('BEGIN:VCARD')) return 'Contact';
    return 'Text';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="flex flex-col h-auto max-h-[90vh] rounded-t-3xl border-0 bg-gradient-to-b from-white via-white to-gray-50/80 backdrop-blur-xl shadow-2xl"
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          <SheetHeader className="pb-2 pt-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />
          </SheetHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 transition-colors px-2">
          {!scannedData ? (
            /* Scanner View */
            <div className="space-y-4 pb-6">
              <OptimizedQRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                onClose={handleClose}
                className="w-full max-w-lg mx-auto"
                enableVibration={true}
                enableSound={false}
                scanRegion="auto"
                scanQuality="balanced"
              />
            </div>
          ) : (
            /* Results View */
            <div className="space-y-6 pb-6">
              {/* Success Header */}
              <div className="text-center bg-gray-100 rounded-2xl p-6 mx-2">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">QR Code Detected!</h3>
                <p className="text-gray-700 text-sm">Successfully scanned and decoded the QR code</p>
              </div>

              {/* Content Details */}
              <div className="bg-white rounded-2xl p-6 mx-2 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">📄 Scanned Content</h4>
                  <span className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-800 rounded-full">
                    {getContentType(scannedData)}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-gray-800 text-sm break-all font-mono leading-relaxed">
                    {scannedData}
                  </p>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  Content length: {scannedData.length} characters
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mx-2">
                <Button
                  onClick={copyToClipboard}
                  className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl py-3"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </Button>

                {isValidUrl(scannedData) && (
                  <Button
                    onClick={openInNewTab}
                    className="bg-gray-600 hover:bg-gray-500 text-white rounded-xl py-3"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open
                  </Button>
                )}
              </div>

              {/* Scan Another */}
              <div className="flex justify-center mx-2">
                <Button
                  onClick={() => setScannedData('')}
                  variant="outline"
                  className="rounded-xl px-8 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Scan Another QR Code
                </Button>
              </div>
            </div>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}
