'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { QRGeneratorErrorBoundary } from '@/components/qr-generator/error-boundary';

// Lazy load the modernized component
const ModernQRGenerator = dynamic(
  () => import('@/components/qr-generator/qr-modern').then(mod => ({ default: mod.ModernQRGenerator })), 
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 font-medium">Loading QR Generator...</p>
        </div>
      </div>
    )
  }
);

export default function GenerateQRCodePage() {
  return (
    <FeaturePageLayout title="QR Code Generator">
      <QRGeneratorErrorBoundary>
        <ModernQRGenerator />
      </QRGeneratorErrorBoundary>
    </FeaturePageLayout>
  );
}
