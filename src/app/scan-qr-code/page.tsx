'use client';

import React, { useState, useContext, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { QrCode, ScanLine, Camera, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageContext } from '@/contexts/language-context';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { QRHistoryViewer } from '@/components/qr-history-viewer';
import { getQRStats } from '@/utils/qr-scan-history';

// Use Next.js dynamic import with proper SSR handling
const QRScannerModal = dynamic(
  () => import('@/components/qr-scanner-modal').then(module => ({ 
    default: module.QRScannerModal 
  })),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Camera className="h-8 w-8 text-white animate-bounce" />
          </div>
          <h3 className="text-xl font-bold mb-2">Loading Scanner...</h3>
          <p className="text-gray-600">Preparing QR code scanner</p>
        </div>
      </div>
    )
  }
);

export default function ScanQRCodePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [stats, setStats] = useState<{
    totalScans: number;
    uniqueScans: number;
    favoriteScans: number;
  } | null>(null);
  
  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('ScanQRCodePage must be used within a LanguageProvider');
  }
  
  // const { language } = langContext;
  // const t = allTranslations[language]; // Uncomment when translations are needed

  React.useEffect(() => {
    // Load stats when page mounts
    const currentStats = getQRStats();
    setStats(currentStats);
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Refresh stats after scanning
    const currentStats = getQRStats();
    setStats(currentStats);
  };

  const openHistory = () => {
    setIsHistoryOpen(true);
  };

  const closeHistory = () => {
    setIsHistoryOpen(false);
    // Refresh stats after history operations
    const currentStats = getQRStats();
    setStats(currentStats);
  };

  return (
    <FeaturePageLayout title="QR Code Scanner">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-900 relative overflow-hidden">
        {/* Enhanced animated background elements with better gradients */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-purple-500/30 rounded-full blur-3xl animate-pulse opacity-70"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-emerald-500/30 via-teal-500/20 to-cyan-500/30 rounded-full blur-3xl animate-pulse opacity-70" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse opacity-50" style={{animationDelay: '4s'}}></div>
        
        {/* Scanning grid overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.5) 1px, transparent 0)`,
            backgroundSize: '60px 60px',
            animation: 'float 20s ease-in-out infinite'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
          {/* Hero Section with stats */}
          {stats && (
            <div className="text-center mb-8 animate-in fade-in duration-1000">
              <div className="inline-flex items-center gap-6 bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">{stats.totalScans}</div>
                  <div className="text-xs text-gray-300">Total Scans</div>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.uniqueScans}</div>
                  <div className="text-xs text-gray-300">Unique</div>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{stats.favoriteScans}</div>
                  <div className="text-xs text-gray-300">Favorites</div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Main Action Buttons with modern design */}
          <div className="flex flex-col lg:flex-row justify-center gap-8 mb-16 animate-in slide-in-from-bottom duration-700 delay-300">
            <Button 
              className="group relative w-full lg:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white px-12 py-10 rounded-3xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] font-black text-xl sm:text-2xl overflow-hidden border border-white/10"
              onClick={openModal}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              
              <div className="relative flex items-center gap-5">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center group-hover:animate-pulse shadow-lg backdrop-blur-sm border border-white/20 group-hover:bg-white/25 transition-all duration-300">
                  <ScanLine className="h-7 w-7 animate-pulse group-hover:animate-bounce" />
                </div>
                <div className="text-left">
                  <div className="tracking-wide flex items-center gap-2">
                    <span>Scan QR Code</span>
                  </div>
                  <div className="text-sm text-white/90 font-semibold mt-1 opacity-90">
                    <span className="inline-flex items-center gap-1">
                      Camera <span className="text-cyan-300">•</span> Upload <span className="text-cyan-300">•</span> AI-Powered
                    </span>
                  </div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="group relative w-full lg:w-auto bg-white/5 backdrop-blur-xl border-2 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400/60 hover:text-emerald-200 px-12 py-10 rounded-3xl shadow-xl hover:shadow-emerald-500/25 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] font-black text-xl sm:text-2xl overflow-hidden"
              onClick={openHistory}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              
              <div className="relative flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-500/15 rounded-2xl flex items-center justify-center group-hover:animate-pulse shadow-lg backdrop-blur-sm border border-emerald-400/30 group-hover:bg-emerald-500/25 transition-all duration-300">
                  <History className="h-7 w-7 text-emerald-400 animate-pulse group-hover:animate-bounce" />
                </div>
                <div className="text-left">
                  <div className="tracking-wide flex items-center gap-2">
                    <span>View History</span>
                  </div>
                  <div className="text-sm text-emerald-300/90 font-semibold mt-1 opacity-90">
                    <span className="inline-flex items-center gap-1">
                      Browse <span className="text-emerald-400">•</span> Search <span className="text-emerald-400">•</span> Organize
                    </span>
                  </div>
                </div>
              </div>
            </Button>
          </div>

          {/* Enhanced Secondary Actions with better spacing */}
          <div className="flex flex-wrap justify-center gap-4 mb-12 animate-in slide-in-from-bottom duration-700 delay-500">
            <Link href="/generate-qr-code">
              <Button 
                variant="outline"
                className="group bg-white/5 backdrop-blur-xl border-2 border-gray-500/30 text-gray-300 hover:bg-gray-500/10 hover:border-gray-400/50 hover:text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 font-semibold text-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative flex items-center gap-3">
                  <QrCode className="h-5 w-5 group-hover:animate-bounce transition-all duration-300 group-hover:text-cyan-400" />
                  <span>Create QR Code</span>
                </div>
              </Button>
            </Link>
          </div>

        </div>
        
        {/* QR Scanner Modal with Suspense for lazy loading */}
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Camera className="h-8 w-8 text-white animate-bounce" />
              </div>
              <h3 className="text-xl font-bold mb-2">Loading Scanner...</h3>
              <p className="text-gray-600">Preparing QR code scanner</p>
            </div>
          </div>
        }>
          <QRScannerModal 
            isOpen={isModalOpen}
            onClose={closeModal}
          />
        </Suspense>

        {/* QR History Viewer */}
        <QRHistoryViewer 
          isOpen={isHistoryOpen}
          onClose={closeHistory}
        />
      </div>
    </FeaturePageLayout>
  );
}
