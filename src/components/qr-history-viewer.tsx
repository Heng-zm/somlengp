'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, Heart, Trash2, Download, Upload, BarChart3, Calendar, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { qrScanHistory, QRHistoryItem, getQRStats } from '@/utils/qr-scan-history';
import { getQRTypeColor } from '@/utils/qr-data-parser';
import { QRResultDrawer } from '@/components/qr-result-drawer';

interface QRHistoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRHistoryViewer({ isOpen, onClose }: QRHistoryViewerProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<QRHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<QRHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'frequent' | 'name'>('recent');
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QRHistoryItem | null>(null);
  const [showResultDrawer, setShowResultDrawer] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<{
    totalScans: number;
    uniqueScans: number;
    favoriteScans: number;
    typeStats: Record<string, number>;
  } | null>(null);

  const applyFilters = useCallback(() => {
    let filtered = [...history];

    // Apply search filter
    if (searchQuery) {
      filtered = qrScanHistory.searchHistory(searchQuery);
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.parsedData.type === filterType);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Apply favorites filter
    if (showFavorites) {
      filtered = filtered.filter(item => item.favorite);
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.lastScanned - a.lastScanned);
        break;
      case 'frequent':
        filtered.sort((a, b) => b.scanCount - a.scanCount);
        break;
      case 'name':
        filtered.sort((a, b) => a.data.localeCompare(b.data));
        break;
    }

    setFilteredHistory(filtered);
  }, [history, searchQuery, filterType, filterCategory, sortBy, showFavorites]);

  // Load history when modal opens
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadHistory = () => {
    const currentHistory = qrScanHistory.getHistory();
    const currentStats = getQRStats();
    setHistory(currentHistory);
    setStats(currentStats);
  };

  const handleItemClick = (item: QRHistoryItem) => {
    setSelectedItem(item);
    setShowResultDrawer(true);
  };

  const toggleFavorite = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newFavoriteState = qrScanHistory.toggleFavorite(id);
    loadHistory(); // Refresh data
    
    toast({
      title: newFavoriteState ? "Added to Favorites" : "Removed from Favorites",
      description: newFavoriteState ? "QR code saved to your favorites" : "QR code removed from favorites",
    });
  };

  const deleteItem = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const success = qrScanHistory.deleteItem(id);
    if (success) {
      loadHistory();
      toast({
        title: "Item Deleted",
        description: "QR code removed from history",
      });
    }
  };

  const clearHistory = () => {
    qrScanHistory.clearHistory();
    loadHistory();
    toast({
      title: "History Cleared",
      description: "All scan history has been deleted",
    });
  };

  const exportHistory = () => {
    const exportData = qrScanHistory.exportHistory();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "History Exported",
      description: "Your QR history has been downloaded",
    });
  };

  const importHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const result = qrScanHistory.importHistory(jsonData);
        
        if (result.success) {
          loadHistory();
          toast({
            title: "Import Successful",
            description: `Imported ${result.imported} items${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`,
          });
        } else {
          toast({
            title: "Import Failed",
            description: result.errors.join(', '),
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Import Error",
          description: "Failed to read the import file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getUniqueTypes = () => {
    const types = new Set(history.map(item => item.parsedData.type));
    return Array.from(types);
  };

  const getUniqueCategories = () => {
    return qrScanHistory.getCategories();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-hidden">
          <div className="flex flex-col h-full bg-gradient-to-b from-blue-50 to-white">
            {/* Header */}
            <SheetHeader className="p-4 sm:p-6 pb-4 border-b border-blue-100 bg-gradient-to-r from-blue-500 to-indigo-500">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <div>QR History</div>
                    <div className="text-sm font-normal text-blue-100 mt-1">
                      {history.length} scans • {stats?.favoriteScans || 0} favorites
                    </div>
                  </div>
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowStats(!showStats)}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </SheetHeader>

            {/* Statistics Panel */}
            {showStats && stats && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-blue-600">{stats.totalScans}</div>
                    <div className="text-xs text-gray-600">Total Scans</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-purple-600">{stats.uniqueScans}</div>
                    <div className="text-xs text-gray-600">Unique Codes</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-pink-600">{stats.favoriteScans}</div>
                    <div className="text-xs text-gray-600">Favorites</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-green-600">
                      {Object.keys(stats.typeStats).length}
                    </div>
                    <div className="text-xs text-gray-600">Types</div>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="p-4 space-y-3 border-b border-gray-100 bg-white">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 focus:border-blue-300"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {getUniqueTypes().map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getUniqueCategories().map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: 'recent' | 'frequent' | 'name') => setSortBy(value)}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="frequent">Most Used</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showFavorites ? "default" : "outline"}
                  onClick={() => setShowFavorites(!showFavorites)}
                  className="rounded-xl"
                >
                  <Heart className={`h-4 w-4 mr-1 ${showFavorites ? 'fill-current' : ''}`} />
                  {showFavorites ? 'Favorites' : 'All'}
                </Button>
              </div>
            </div>

            {/* History Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {searchQuery || filterType !== 'all' || filterCategory !== 'all' || showFavorites 
                      ? 'No matches found' 
                      : 'No scan history yet'
                    }
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {searchQuery || filterType !== 'all' || filterCategory !== 'all' || showFavorites
                      ? 'Try adjusting your filters or search terms'
                      : 'Start scanning QR codes to see them here'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item) => {
                    const typeColor = getQRTypeColor(item.parsedData.type);
                    const colorClasses = {
                      blue: 'border-l-blue-400 bg-blue-50 hover:bg-blue-100',
                      green: 'border-l-green-400 bg-green-50 hover:bg-green-100',
                      purple: 'border-l-purple-400 bg-purple-50 hover:bg-purple-100',
                      cyan: 'border-l-cyan-400 bg-cyan-50 hover:bg-cyan-100',
                      orange: 'border-l-orange-400 bg-orange-50 hover:bg-orange-100',
                      pink: 'border-l-pink-400 bg-pink-50 hover:bg-pink-100',
                      gray: 'border-l-gray-400 bg-gray-50 hover:bg-gray-100',
                      red: 'border-l-red-400 bg-red-50 hover:bg-red-100',
                      yellow: 'border-l-yellow-400 bg-yellow-50 hover:bg-yellow-100'
                    };
                    const colorClass = colorClasses[typeColor as keyof typeof colorClasses] || colorClasses.gray;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`p-4 rounded-xl border-l-4 ${colorClass} cursor-pointer transition-all duration-200 hover:shadow-md group`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{item.parsedData.icon}</span>
                              <span className="font-semibold text-gray-800">
                                {item.parsedData.label}
                              </span>
                              {item.favorite && (
                                <Heart className="h-4 w-4 text-red-500 fill-current" />
                              )}
                              {item.category && (
                                <span className="px-2 py-0.5 bg-white/60 rounded-full text-xs font-medium text-gray-600 flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {item.category}
                                </span>
                              )}
                            </div>

                            {/* Content Preview */}
                            <p className="text-sm text-gray-700 truncate mb-2 font-mono">
                              {item.data}
                            </p>

                            {/* Metadata */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(item.lastScanned)}
                                </span>
                                {item.scanCount > 1 && (
                                  <span className="flex items-center gap-1">
                                    <History className="h-3 w-3" />
                                    {item.scanCount}x
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-400">
                                {item.data.length} chars
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => toggleFavorite(item.id, e)}
                              className={`h-8 w-8 ${item.favorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                            >
                              <Heart className={`h-4 w-4 ${item.favorite ? 'fill-current' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => deleteItem(item.id, e)}
                              className="h-8 w-8 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {history.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportHistory}
                    className="flex-1 min-w-0 rounded-xl"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('import-input')?.click()}
                    className="flex-1 min-w-0 rounded-xl"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearHistory}
                    className="flex-1 min-w-0 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Hidden import input */}
      <input
        id="import-input"
        type="file"
        accept=".json"
        onChange={importHistory}
        className="hidden"
      />

      {/* Result Drawer */}
      <QRResultDrawer
        isOpen={showResultDrawer}
        onClose={() => {
          setShowResultDrawer(false);
          setSelectedItem(null);
        }}
        scannedData={selectedItem?.data || ''}
        showBackButton={true}
      />
    </>
  );
}
