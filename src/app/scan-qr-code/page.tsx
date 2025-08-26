'use client';

import React, { useState, useContext } from 'react';
import Link from 'next/link';
import { QrCode, ScanLine, Camera, Upload, Flashlight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageContext } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { QRScannerModal } from '@/components/qr-scanner-modal';

export default function ScanQRCodePage() {
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

  // Removed scan result handlers since results are now shown in popup

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
              onClick={openModal}
            >
              <ScanLine className="h-5 w-5 mr-2" />
              SCAN QR
            </Button>
          </div>
          
        </div>
        
        {/* QR Scanner Modal */}
        <QRScannerModal 
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      </div>
    </FeaturePageLayout>
  );
}
