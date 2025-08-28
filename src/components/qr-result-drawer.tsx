'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, QrCode, Heart, History, Share2, Download, Tag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { parseQRData, ParsedQRData, getQRTypeColor } from '@/utils/qr-data-parser';
import { addQRScan, qrScanHistory } from '@/utils/qr-scan-history';

interface QRResultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scannedData: string;
  showBackButton?: boolean; // Show back arrow instead of X when opened from history
}

export function QRResultDrawer({ isOpen, onClose, scannedData, showBackButton = false }: QRResultDrawerProps) {
  const { toast } = useToast();
  const [parsedData, setParsedData] = useState<ParsedQRData | null>(null);
  const [historyItem, setHistoryItem] = useState<{
    id: string;
    favorite: boolean;
    scanCount: number;
    category?: string;
  } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (scannedData && isOpen) {
      // Parse the QR data
      const parsed = parseQRData(scannedData);
      setParsedData(parsed);
      
      // Add to history and get the history item
      const histItem = addQRScan(scannedData);
      setHistoryItem(histItem);
      setIsFavorite(histItem.favorite);
    }
  }, [scannedData, isOpen]);

  const handleAction = async (action: () => void | Promise<void>, actionName: string) => {
    try {
      await Promise.resolve(action());
      toast({
        title: "Success!",
        description: `${actionName} completed successfully`,
      });
    } catch (error) {
      console.error(`Action failed: ${actionName}`, error);
      toast({
        title: "Action Failed",
        description: `Could not complete ${actionName.toLowerCase()}`,
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = () => {
    if (historyItem) {
      const newFavoriteState = qrScanHistory.toggleFavorite(historyItem.id);
      setIsFavorite(newFavoriteState);
      toast({
        title: newFavoriteState ? "Added to Favorites" : "Removed from Favorites",
        description: newFavoriteState ? "QR code saved to your favorites" : "QR code removed from favorites",
      });
    }
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code: ${parsedData?.label || 'Scanned Content'}`,
          text: scannedData
        });
      } catch {
        // User cancelled sharing or error occurred
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(scannedData);
      toast({
        title: "Copied to Clipboard",
        description: "QR content copied for sharing",
      });
    }
  };

  const exportData = () => {
    const exportText = `QR Code Export\n\nType: ${parsedData?.label || 'Unknown'}\nScanned: ${new Date().toLocaleString()}\n\nContent:\n${scannedData}`;
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!parsedData) return null;

  const typeColor = getQRTypeColor(parsedData.type);
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500 border-blue-100',
    green: 'from-green-500 to-emerald-500 border-green-100',
    purple: 'from-purple-500 to-violet-500 border-purple-100',
    cyan: 'from-cyan-500 to-teal-500 border-cyan-100',
    orange: 'from-orange-500 to-amber-500 border-orange-100',
    pink: 'from-pink-500 to-rose-500 border-pink-100',
    gray: 'from-gray-500 to-slate-500 border-gray-100',
    red: 'from-red-500 to-pink-500 border-red-100',
    yellow: 'from-yellow-500 to-orange-500 border-yellow-100'
  };
  const currentColorClass = colorClasses[typeColor as keyof typeof colorClasses] || colorClasses.gray;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[85vh] rounded-t-3xl border-0 p-0 overflow-hidden">
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 relative">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-cyan-100/30 to-emerald-100/30 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          {/* Enhanced Header with Modern Glassmorphism */}
          <SheetHeader className={`relative z-10 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-white/20 bg-gradient-to-r ${currentColorClass} backdrop-blur-xl shadow-lg`}>
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/25 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg animate-glow">
                  <span className="text-xl sm:text-2xl animate-bounce">{parsedData.icon}</span>
                </div>
                <div>
                  <div className="hidden sm:block font-black tracking-tight">{parsedData.label} Detected!</div>
                  <div className="sm:hidden font-black tracking-tight">{parsedData.label}!</div>
                  <div className="text-xs sm:text-sm font-semibold text-white/90 mt-1 bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    {(historyItem?.scanCount ?? 1) > 1 ? `✨ Scanned ${historyItem?.scanCount} times` : '🎉 First time scan'}
                  </div>
                </div>
              </SheetTitle>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={toggleFavorite}
                  className={`text-white/90 hover:text-white hover:bg-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:shadow-lg hover:scale-110 group ${isFavorite ? 'text-red-200 bg-red-500/20' : ''}`}
                >
                  <Heart className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 group-hover:scale-125 ${isFavorite ? 'fill-current animate-pulse' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onClose}
                  className="text-white/90 hover:text-white hover:bg-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:shadow-lg group"
                >
                  {showBackButton ? (
                    <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 group-hover:-translate-x-1 transition-transform duration-300" />
                  ) : (
                    <X className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-90 transition-transform duration-300" />
                  )}
                </Button>
              </div>
            </div>
            <div className="text-white/95 text-center pt-3 text-sm sm:text-base flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-700">
              <CheckCircle className="h-4 w-4 animate-pulse text-emerald-300" />
              <span className="font-medium">Successfully detected and parsed QR code content</span>
            </div>
          </SheetHeader>

          {/* Enhanced Content Section */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
              
              {/* Type-specific Content Display */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    {parsedData.icon} <span className="hidden sm:inline">Content Details</span><span className="sm:hidden">Content</span>
                  </h4>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white bg-gradient-to-r ${currentColorClass.split(' ')[0]} ${currentColorClass.split(' ')[1]}`}>
                    {parsedData.label}
                  </div>
                </div>
                
                {/* Enhanced content display based on type */}
                {parsedData.parsed && (
                  <div className="mb-4 space-y-2">
                    {/* WiFi Network Display */}
                    {parsedData.type === 'wifi' && parsedData.parsed && 'ssid' in parsedData.parsed && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div className="text-xs font-medium text-blue-600 mb-1">Network Name</div>
                          <div className="font-semibold text-blue-800">{parsedData.parsed.ssid}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                          <div className="text-xs font-medium text-green-600 mb-1">Security</div>
                          <div className="font-semibold text-green-800">{parsedData.parsed.security || 'Open'}</div>
                        </div>
                        {parsedData.parsed.password && (
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 sm:col-span-2">
                            <div className="text-xs font-medium text-purple-600 mb-1">Password</div>
                            <div className="font-mono text-sm text-purple-800 break-all">{parsedData.parsed.password}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Contact Display */}
                    {parsedData.type === 'contact' && parsedData.parsed && 'name' in parsedData.parsed && (
                      <div className="space-y-2">
                        {parsedData.parsed.name && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <div className="text-xs font-medium text-blue-600 mb-1">Name</div>
                            <div className="font-semibold text-blue-800">{parsedData.parsed.name}</div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {'phone' in parsedData.parsed && parsedData.parsed.phone && (
                            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                              <div className="text-xs font-medium text-green-600 mb-1">Phone</div>
                              <div className="font-semibold text-green-800">{parsedData.parsed.phone}</div>
                            </div>
                          )}
                          {'email' in parsedData.parsed && parsedData.parsed.email && (
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                              <div className="text-xs font-medium text-purple-600 mb-1">Email</div>
                              <div className="font-semibold text-purple-800 break-all">{parsedData.parsed.email}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Location Display */}
                    {parsedData.type === 'geo' && parsedData.parsed && 'latitude' in parsedData.parsed && 'longitude' in parsedData.parsed && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                        <div className="text-xs font-medium text-red-600 mb-1">Coordinates</div>
                        <div className="font-semibold text-red-800">
                          {parsedData.parsed.latitude}°, {parsedData.parsed.longitude}°
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Raw content display */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 transition-all duration-200 hover:bg-gray-100 hover:border-gray-200">
                  <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <QrCode className="h-3 w-3" />
                    Raw QR Data
                  </div>
                  <p className="text-gray-800 break-all text-xs sm:text-sm leading-relaxed font-mono select-all">
                    {scannedData}
                  </p>
                </div>
              </div>

              {/* Enhanced Metadata and Statistics */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 animate-in slide-in-from-bottom-2 duration-300 delay-200">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📊 <span className="hidden sm:inline">Scan Information</span><span className="sm:hidden">Info</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 transition-all duration-200 hover:bg-blue-100">
                    <div className="text-xs font-medium text-blue-600 mb-1">Content Type</div>
                    <div className="font-semibold text-blue-800 flex items-center gap-1">
                      {parsedData.icon} {parsedData.label}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 transition-all duration-200 hover:bg-purple-100">
                    <div className="text-xs font-medium text-purple-600 mb-1">Data Length</div>
                    <div className="font-semibold text-purple-800">{scannedData.length} characters</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100 transition-all duration-200 hover:bg-green-100">
                    <div className="text-xs font-medium text-green-600 mb-1">Scan Count</div>
                    <div className="font-semibold text-green-800 flex items-center gap-1">
                      <History className="h-3 w-3" />
                      {historyItem?.scanCount ?? 1} times
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 transition-all duration-200 hover:bg-orange-100">
                    <div className="text-xs font-medium text-orange-600 mb-1">Category</div>
                    <div className="font-semibold text-orange-800 flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {historyItem?.category || 'Unknown'}
                    </div>
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4 animate-pulse" />
                    <span className="font-medium text-sm">Successfully parsed and saved to history</span>
                  </div>
                </div>
              </div>

              {/* Smart Action Buttons */}
              <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300 delay-300">
                {/* Primary Actions from Parser */}
                {parsedData.actions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAction(action.action, action.label)}
                    className={`w-full h-12 sm:h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg font-semibold group ${
                      action.primary 
                        ? `bg-gradient-to-r ${currentColorClass.split(' ')[0]} ${currentColorClass.split(' ')[1]} text-white` 
                        : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="mr-2 group-hover:animate-bounce text-lg">{action.icon}</span>
                    <span className="hidden sm:inline">{action.label}</span>
                    <span className="sm:hidden">{action.label.split(' ')[0]}</span>
                  </Button>
                ))}
                
                {/* Additional Utility Actions */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button
                    onClick={shareQR}
                    variant="outline"
                    className="h-10 sm:h-12 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all duration-200 text-sm sm:text-base font-medium group"
                  >
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:animate-pulse" />
                    <span className="hidden sm:inline">Share</span>
                    <span className="sm:hidden">Share</span>
                  </Button>
                  
                  <Button
                    onClick={exportData}
                    variant="outline"
                    className="h-10 sm:h-12 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl transition-all duration-200 text-sm sm:text-base font-medium group"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:animate-pulse" />
                    <span className="hidden sm:inline">Export</span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                </div>
                
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full h-10 sm:h-12 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-base sm:text-lg font-medium mt-4"
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
