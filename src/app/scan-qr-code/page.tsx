'use client';

import React, { useState, useContext } from 'react';
import Link from 'next/link';
import { QrCode, Copy, ExternalLink, X, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageContext } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { QRScannerModal } from '@/components/qr-scanner-modal';

export default function ScanQRCodePage() {
  const [scannedData, setScannedData] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  
  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('ScanQRCodePage must be used within a LanguageProvider');
  }
  
  // const { language } = langContext;
  // const t = allTranslations[language]; // Uncomment when translations are needed

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleScanResult = (data: string) => {
    setScannedData(data);
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

                {/* Scan Button */}
                <div className="space-y-4">
                  <Button
                    onClick={openModal}
                    className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <ScanLine className="h-6 w-6 mr-3" />
                    📷 Start QR Scan
                  </Button>
                  
                  <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 text-center">
                    <p className="text-blue-700 font-medium">✨ Tap the button above to open scanner</p>
                    <p className="text-blue-600 text-sm mt-1">Camera, flashlight, and upload options available</p>
                  </div>
                </div>
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
        
        {/* QR Scanner Modal */}
        <QRScannerModal 
          isOpen={isModalOpen}
          onClose={closeModal}
          onScanResult={handleScanResult}
        />
      </div>
    </FeaturePageLayout>
  );
}
