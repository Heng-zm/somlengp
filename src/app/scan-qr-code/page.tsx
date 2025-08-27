'use client';

import React, { useState, useContext, Suspense, lazy } from 'react';
import Link from 'next/link';
import { QrCode, ScanLine, Camera, Upload, History, Zap, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageContext } from '@/contexts/language-context';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { QRHistoryViewer } from '@/components/qr-history-viewer';
import { getQRStats } from '@/utils/qr-scan-history';

// Lazy load the QR scanner modal for better performance
const QRScannerModal = lazy(() => 
  import('@/components/qr-scanner-modal').then(module => ({ 
    default: module.QRScannerModal 
  }))
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-200/20 to-emerald-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        
        <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
          
          {/* Enhanced Header with Modern Glassmorphism */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-4 glass-card-enhanced rounded-3xl px-8 py-6 shadow-2xl border border-white/30 mb-8 animate-in fade-in-scale duration-700">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-glow">
                <QrCode className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-gradient-animated mb-2">
                  QR Code Scanner
                </h1>
                <p className="text-base text-gray-700 font-medium leading-relaxed">
                  ✨ Scan, parse, and manage QR codes with AI-powered recognition
                </p>
              </div>
            </div>

            {/* Enhanced Quick Stats */}
            {stats && stats.totalScans > 0 && (
              <div className="flex justify-center mb-10 animate-in slide-in-from-bottom duration-700 delay-200">
                <div className="grid grid-cols-3 gap-6 glass-card-enhanced rounded-3xl p-6 border border-white/30 shadow-xl">
                  <div className="text-center group">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white font-bold text-lg">{stats.totalScans}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">📊 Total Scans</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white font-bold text-lg">{stats.uniqueScans}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">🎯 Unique Codes</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white font-bold text-lg">{stats.favoriteScans}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">⭐ Favorites</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Main Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-14 animate-in slide-in-from-bottom duration-700 delay-300">
            <Button 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white px-10 py-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 active:scale-95 font-black text-xl sm:text-2xl mobile-touch-target btn-ripple group"
              onClick={openModal}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:animate-bounce shadow-lg backdrop-blur-sm border border-white/10">
                  <ScanLine className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <div className="tracking-wide">📸 Scan QR Code</div>
                  <div className="text-sm text-white/90 font-semibold mt-1">Camera • Upload • AI-Powered</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="w-full sm:w-auto glass-card-enhanced border-2 border-purple-400/40 text-purple-700 hover:bg-purple-50/50 hover:border-purple-400/60 px-10 py-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 font-black text-xl sm:text-2xl mobile-touch-target btn-ripple group"
              onClick={openHistory}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100/70 rounded-2xl flex items-center justify-center group-hover:animate-bounce shadow-lg backdrop-blur-sm border border-purple-200/50">
                  <History className="h-6 w-6 text-purple-700 animate-pulse" />
                </div>
                <div>
                  <div className="tracking-wide">📁 View History</div>
                  <div className="text-sm text-purple-600 font-semibold mt-1">Browse • Search • Organize</div>
                </div>
              </div>
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Link href="/generate-qr-code">
              <Button 
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-semibold group"
              >
                <QrCode className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                Create QR Code
              </Button>
            </Link>
          </div>

          {/* Enhanced Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 animate-in fade-in duration-700 delay-500">
            <div className="glass-card-enhanced rounded-3xl p-8 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 card-hover-lift group">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Smart Recognition</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Automatically detects and parses different QR code types including URLs, WiFi, contacts, locations, and more with intelligent actions.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4">
                <History className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Scan History</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Keep track of all your scans with persistent history, favorites, categories, and powerful search capabilities.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Performance Tracking</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Monitor scanning performance with detailed analytics, success rates, and optimization insights.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Camera & Upload</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Scan with your device camera or upload images from your gallery. Works with various image formats.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Favorites & Tags</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Mark important QR codes as favorites, add custom tags, and organize your scans for easy retrieval.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Export & Import</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Export your scan history for backup or import previous scans to sync across devices.
              </p>
            </div>
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
