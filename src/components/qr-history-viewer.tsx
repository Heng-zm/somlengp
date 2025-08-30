'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { History, Search, Heart, Trash2, Download, Upload, BarChart3, Calendar, Tag, X, Loader2 } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<{
    totalScans: number;
    uniqueScans: number;
    favoriteScans: number;
    typeStats: Record<string, number>;
  } | null>(null);
  
  // Cache for performance optimization
  const historyCache = useRef<QRHistoryItem[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(query);
    }, 300); // 300ms debounce
  }, []);

  // Optimized filtering with useMemo for performance
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...history];

    // Apply search filter with debounced query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(item => {
        return (
          item.data.toLowerCase().includes(query) ||
          item.parsedData?.label?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
          item.notes?.toLowerCase().includes(query) ||
          item.parsedData?.type?.toLowerCase().includes(query)
        );
      });
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.parsedData?.type === filterType);
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
        filtered.sort((a, b) => (b.lastScanned || 0) - (a.lastScanned || 0));
        break;
      case 'frequent':
        filtered.sort((a, b) => (b.scanCount || 0) - (a.scanCount || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.data || '').localeCompare(b.data || ''));
        break;
      default:
        filtered.sort((a, b) => (b.lastScanned || 0) - (a.lastScanned || 0));
    }

    return filtered;
  }, [history, searchQuery, filterType, filterCategory, sortBy, showFavorites]);

  // Load history when modal opens with caching
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  // Update filtered history when filters change
  useEffect(() => {
    setFilteredHistory(filteredAndSortedHistory);
  }, [filteredAndSortedHistory]);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check cache first
      if (historyCache.current.length === 0) {
        const currentHistory = qrScanHistory.getHistory();
        historyCache.current = currentHistory;
      }
      
      const currentStats = getQRStats();
      setHistory([...historyCache.current]);
      setStats(currentStats);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load scan history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleItemClick = (item: QRHistoryItem) => {
    setSelectedItem(item);
    setShowResultDrawer(true);
  };

  const toggleFavorite = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Optimistic update - update UI immediately
    setHistory(prevHistory => 
      prevHistory.map(item => 
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
    );
    
    // Update cache
    historyCache.current = historyCache.current.map(item => 
      item.id === id ? { ...item, favorite: !item.favorite } : item
    );
    
    try {
      const newFavoriteState = qrScanHistory.toggleFavorite(id);
      
      // Update stats optimistically
      setStats(prevStats => {
        if (!prevStats) return prevStats;
        return {
          ...prevStats,
          favoriteScans: newFavoriteState 
            ? prevStats.favoriteScans + 1 
            : Math.max(0, prevStats.favoriteScans - 1)
        };
      });
      
      toast({
        title: newFavoriteState ? "❤️ Added to Favorites" : "💔 Removed from Favorites",
        description: newFavoriteState ? "QR code saved to your favorites" : "QR code removed from favorites",
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert optimistic update on error
      loadHistory();
      toast({
        title: "Action Failed",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  }, [loadHistory, toast]);

  const deleteItem = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Store item for potential rollback
    const itemToDelete = history.find(item => item.id === id);
    if (!itemToDelete) return;
    
    // Optimistic update - remove from UI immediately
    setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
    
    // Update cache
    historyCache.current = historyCache.current.filter(item => item.id !== id);
    
    try {
      const success = qrScanHistory.deleteItem(id);
      if (success) {
        // Update stats optimistically
        setStats(prevStats => {
          if (!prevStats) return prevStats;
          return {
            ...prevStats,
            uniqueScans: Math.max(0, prevStats.uniqueScans - 1),
            totalScans: Math.max(0, prevStats.totalScans - itemToDelete.scanCount),
            favoriteScans: itemToDelete.favorite 
              ? Math.max(0, prevStats.favoriteScans - 1) 
              : prevStats.favoriteScans
          };
        });
        
        toast({
          title: "🗑️ Item Deleted",
          description: "QR code removed from history",
        });
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      // Revert optimistic update on error
      loadHistory();
      toast({
        title: "Delete Failed",
        description: "Failed to remove QR code from history",
        variant: "destructive",
      });
    }
  }, [history, loadHistory, toast]);

  const clearHistory = useCallback(() => {
    // Show confirmation
    if (!confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) {
      return;
    }
    
    // Store current state for potential rollback
    const backupHistory = [...history];
    const backupStats = stats;
    
    // Optimistic update - clear UI immediately
    setHistory([]);
    historyCache.current = [];
    setStats({
      totalScans: 0,
      uniqueScans: 0,
      favoriteScans: 0,
      typeStats: {}
    });
    
    try {
      qrScanHistory.clearHistory();
      toast({
        title: "🧹 History Cleared",
        description: "All scan history has been deleted",
      });
    } catch (error) {
      console.error('Failed to clear history:', error);
      // Revert optimistic update on error
      setHistory(backupHistory);
      historyCache.current = backupHistory;
      setStats(backupStats);
      toast({
        title: "Clear Failed",
        description: "Failed to clear scan history",
        variant: "destructive",
      });
    }
  }, [history, stats, toast]);

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
        <SheetContent side="right" className="w-full sm:max-w-3xl lg:max-w-4xl p-0 overflow-hidden">
          <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 relative">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/10 to-purple-200/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-200/10 to-emerald-200/10 rounded-full blur-3xl" />
            {/* Header */}
            <SheetHeader className="relative z-10 p-4 sm:p-6 pb-4 border-b border-blue-200/50 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/10">
                    <History className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse" />
                  </div>
                  <div>
                    <div className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      📚 QR History
                    </div>
                    <div className="text-sm sm:text-base font-normal text-blue-100 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        {history.length} scans
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Heart className="h-3 w-3 text-red-300 fill-current" />
                        {stats?.favoriteScans || 0} favorites
                      </span>
                    </div>
                  </div>
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowStats(!showStats)}
                    className={`text-white/80 hover:text-white hover:bg-white/20 rounded-xl w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 transform hover:scale-110 ${
                      showStats ? 'bg-white/20 text-white' : ''
                    }`}
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 transform hover:scale-110 hover:rotate-90"
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
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 focus:border-blue-300 transition-all duration-200 focus:ring-2 focus:ring-blue-200"
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
                )}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-blue-500/30">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading History</h3>
                    <p className="text-gray-600">Fetching your scan history...</p>
                  </div>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12 animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <History className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {searchQuery || filterType !== 'all' || filterCategory !== 'all' || showFavorites 
                      ? '🔍 No matches found' 
                      : '📱 No scan history yet'
                    }
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto">
                    {searchQuery || filterType !== 'all' || filterCategory !== 'all' || showFavorites
                      ? 'Try adjusting your filters or search terms to find what you\'re looking for'
                      : 'Start scanning QR codes to build your personal history collection'
                    }
                  </p>
                  {!searchQuery && filterType === 'all' && filterCategory === 'all' && !showFavorites && (
                    <Button 
                      onClick={onClose}
                      className="mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      🚀 Start Scanning
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item, index) => {
                    const typeColor = getQRTypeColor(item.parsedData.type);
                    const colorClasses = {
                      blue: 'border-l-blue-400 bg-gradient-to-r from-blue-50 to-blue-25 hover:from-blue-100 hover:to-blue-75 shadow-blue-100',
                      green: 'border-l-green-400 bg-gradient-to-r from-green-50 to-green-25 hover:from-green-100 hover:to-green-75 shadow-green-100',
                      purple: 'border-l-purple-400 bg-gradient-to-r from-purple-50 to-purple-25 hover:from-purple-100 hover:to-purple-75 shadow-purple-100',
                      cyan: 'border-l-cyan-400 bg-gradient-to-r from-cyan-50 to-cyan-25 hover:from-cyan-100 hover:to-cyan-75 shadow-cyan-100',
                      orange: 'border-l-orange-400 bg-gradient-to-r from-orange-50 to-orange-25 hover:from-orange-100 hover:to-orange-75 shadow-orange-100',
                      pink: 'border-l-pink-400 bg-gradient-to-r from-pink-50 to-pink-25 hover:from-pink-100 hover:to-pink-75 shadow-pink-100',
                      gray: 'border-l-gray-400 bg-gradient-to-r from-gray-50 to-gray-25 hover:from-gray-100 hover:to-gray-75 shadow-gray-100',
                      red: 'border-l-red-400 bg-gradient-to-r from-red-50 to-red-25 hover:from-red-100 hover:to-red-75 shadow-red-100',
                      yellow: 'border-l-yellow-400 bg-gradient-to-r from-yellow-50 to-yellow-25 hover:from-yellow-100 hover:to-yellow-75 shadow-yellow-100'
                    };
                    const colorClass = colorClasses[typeColor as keyof typeof colorClasses] || colorClasses.gray;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`p-4 rounded-xl border-l-4 ${colorClass} cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-${typeColor}-100/50 group transform hover:scale-[1.02] active:scale-[0.98]`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animation: 'slideInRight 0.3s ease-out forwards'
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span className="text-xl sm:text-2xl">{item.parsedData.icon}</span>
                              <span className="font-bold text-gray-800 text-base sm:text-lg leading-tight">
                                {item.parsedData.label}
                              </span>
                              {item.favorite && (
                                <div className="flex items-center justify-center w-6 h-6 bg-red-500/10 rounded-full">
                                  <Heart className="h-3 w-3 text-red-500 fill-current" />
                                </div>
                              )}
                              {item.category && (
                                <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-sm border border-white/50">
                                  <Tag className="h-3 w-3" />
                                  {item.category}
                                </span>
                              )}
                            </div>

                            {/* Content Preview */}
                            <div className="mb-3">
                              <p className="text-sm text-gray-700 font-mono bg-gray-50/80 rounded-lg px-3 py-2 break-all">
                                {item.data.length > 100 ? `${item.data.substring(0, 100)}...` : item.data}
                              </p>
                            </div>

                            {/* Tags */}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {item.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <span 
                                    key={tagIndex}
                                    className="px-2 py-0.5 bg-white/50 rounded-md text-xs font-medium text-gray-600 border border-white/40"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {item.tags.length > 3 && (
                                  <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs font-medium text-gray-500">
                                    +{item.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 bg-white/50 rounded-lg px-2 py-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(item.lastScanned)}
                                </span>
                                {item.scanCount > 1 && (
                                  <span className="flex items-center gap-1.5 bg-white/50 rounded-lg px-2 py-1">
                                    <History className="h-3 w-3" />
                                    <span className="font-semibold">{item.scanCount}</span> scans
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-400 bg-white/30 rounded-lg px-2 py-1">
                                {item.data.length} chars
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => toggleFavorite(item.id, e)}
                              className={`h-10 w-10 rounded-xl transition-all duration-200 transform hover:scale-110 ${
                                item.favorite 
                                  ? 'text-red-500 bg-red-50 hover:bg-red-100 shadow-sm' 
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                            >
                              <Heart className={`h-4 w-4 ${item.favorite ? 'fill-current' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => deleteItem(item.id, e)}
                              className="h-10 w-10 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 transform hover:scale-110"
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
      
      {/* Custom CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              transform: translate3d(0,0,0);
            }
            40%, 43% {
              transform: translate3d(0, -5px, 0);
            }
            70% {
              transform: translate3d(0, -3px, 0);
            }
            90% {
              transform: translate3d(0, -2px, 0);
            }
          }
          
          .animate-bounce-slow {
            animation: bounce 2s infinite;
          }
          
          .glass-effect {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
        `
      }} />
    </>
  );
}
