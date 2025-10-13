'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { QRGeneratorErrorBoundary } from '@/components/qr-generator/error-boundary';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Camera, History, Settings } from 'lucide-react';

// Lazy load the mobile optimized component
const QRCodeMobileOptimized = dynamic(() => import('@/components/qr-generator/qr-mobile-optimized').then(mod => ({ default: mod.QRCodeMobileOptimized })), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  )
});

function GenerateQRCodePageComponent() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const mobileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => setIsScannerOpen(true)}>
          <Camera className="w-4 h-4 mr-2" />
          Scan QR
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsHistoryOpen(true)}>
          <History className="w-4 h-4 mr-2" />
          History
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <FeaturePageLayout title="QR Code Generator" rightElement={mobileMenu}>
      <QRGeneratorErrorBoundary enableReporting={true} maxRetries={3}>
        <QRCodeMobileOptimized 
          externalScannerState={{ isScannerOpen, setIsScannerOpen }}
          externalHistoryState={{ isHistoryOpen, setIsHistoryOpen }}
          externalSettingsState={{ isSettingsOpen, setIsSettingsOpen }}
        />
      </QRGeneratorErrorBoundary>
    </FeaturePageLayout>
  );
}

export default GenerateQRCodePageComponent;