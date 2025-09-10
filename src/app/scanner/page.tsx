'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QRScanner } from '@/components/qr-scanner';
import { OptimizedQRScanner } from '@/components/optimized-qr-scanner';
import { SimpleQRScanner } from '@/components/simple-qr-scanner';
import { QRScannerSheet } from '@/components/qr-scanner-sheet';

export default function ScannerTestPage() {
  const [showBasicScanner, setShowBasicScanner] = useState(false);
  const [showOptimizedScanner, setShowOptimizedScanner] = useState(false);
  const [showSimpleScanner, setShowSimpleScanner] = useState(false);
  const [showScannerSheet, setShowScannerSheet] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<string>('');
  const [scanError, setScanError] = useState<string>('');

  const handleScanSuccess = (data: string) => {
    console.log('QR Code scanned:', data);
    setLastScanResult(data);
    setScanError('');
    // Auto-close scanners
    setShowBasicScanner(false);
    setShowOptimizedScanner(false);
    setShowSimpleScanner(false);
  };

  const handleScanError = (error: string) => {
    console.error('QR Scan error:', error);
    setScanError(error);
  };

  const handleClose = () => {
    setShowBasicScanner(false);
    setShowOptimizedScanner(false);
    setShowSimpleScanner(false);
    setShowScannerSheet(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">📷 QR Scanner Test</h1>
          <p className="text-gray-600 mb-6">
            Test different QR scanner implementations to debug camera and scanning issues.
          </p>

          {/* Scanner Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Button 
              onClick={() => setShowBasicScanner(true)}
              className="h-16 text-lg"
              variant={showBasicScanner ? "destructive" : "default"}
            >
              {showBasicScanner ? "🔴 Close" : "📱"} Basic Scanner
            </Button>

            <Button 
              onClick={() => setShowOptimizedScanner(true)}
              className="h-16 text-lg"
              variant={showOptimizedScanner ? "destructive" : "default"}
            >
              {showOptimizedScanner ? "🔴 Close" : "⚡"} Optimized Scanner
            </Button>

            <Button 
              onClick={() => setShowSimpleScanner(true)}
              className="h-16 text-lg"
              variant={showSimpleScanner ? "destructive" : "default"}
            >
              {showSimpleScanner ? "🔴 Close" : "🔍"} Simple Scanner
            </Button>

            <Button 
              onClick={() => setShowScannerSheet(true)}
              className="h-16 text-lg"
              variant="outline"
            >
              📄 Scanner Sheet
            </Button>
          </div>

          {/* Results Display */}
          {lastScanResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Last Scan Result:</h3>
              <p className="text-sm text-green-700 break-all font-mono">{lastScanResult}</p>
              <Button 
                onClick={() => navigator.clipboard.writeText(lastScanResult)}
                size="sm" 
                variant="outline" 
                className="mt-2"
              >
                📋 Copy
              </Button>
            </div>
          )}

          {/* Error Display */}
          {scanError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-red-800 mb-2">❌ Scan Error:</h3>
              <p className="text-sm text-red-700">{scanError}</p>
            </div>
          )}

          {/* Debug Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">🔍 Debug Information:</h3>
            <div className="space-y-1 text-sm text-blue-700">
              <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
              <div>Secure Context: {typeof window !== 'undefined' ? (window.isSecureContext ? 'Yes' : 'No') : 'N/A'}</div>
              <div>MediaDevices Supported: {typeof navigator !== 'undefined' && navigator.mediaDevices ? 'Yes' : 'No'}</div>
              <div>getUserMedia Supported: {typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' ? 'Yes' : 'No'}</div>
              <div>Location Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Scanner Components */}
        {showBasicScanner && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Basic QR Scanner</h2>
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              onClose={handleClose}
              className="w-full max-w-md mx-auto"
            />
          </div>
        )}

        {showOptimizedScanner && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Optimized QR Scanner</h2>
            <OptimizedQRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              onClose={handleClose}
              className="w-full max-w-md mx-auto"
              enableVibration={true}
              enableSound={false}
              scanRegion="auto"
              scanQuality="balanced"
            />
          </div>
        )}

        {showSimpleScanner && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Simple QR Scanner (Fallback)</h2>
            <p className="text-gray-600 text-sm mb-4">
              A simplified QR scanner without Web Workers for better compatibility.
            </p>
            <SimpleQRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              onClose={handleClose}
              className="w-full max-w-md mx-auto"
            />
          </div>
        )}

        {/* Scanner Sheet */}
        <QRScannerSheet
          open={showScannerSheet}
          onOpenChange={setShowScannerSheet}
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
        />
      </div>
    </div>
  );
}
