
"use client";

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
    History as HistoryIcon, 
    Mic, 
    FileText, 
    Combine, 
    ImageIcon, 
    Wand2, 
    AudioLines, 
    Search,
    Heart,
    Trash2,
    Download,
    Upload,
    BarChart3,
    Clock,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHistory } from '@/hooks/use-history';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { useContext } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

const iconMap: { [key: string]: React.ElementType } = {
    '/voice-transcript': Mic,
    '/pdf-transcript': FileText,
    '/text-to-speech': AudioLines,
    '/combine-pdf': Combine,
    '/image-to-pdf': ImageIcon,
    '/convert-image-format': Wand2,
};

export default function HistoryPage() {
    const { 
        history, 
        isLoaded, 
        isLoading,
        error,
        deleteHistoryItem,
        clearHistory,
        toggleFavorite,
        searchHistory,
        getHistoryStats,
        getHistoryByCategory,
        exportHistory,
        importHistory
    } = useHistory();
    
    const langContext = useContext(LanguageContext);
    const { toast } = useToast();
    
    // Local state for UI controls
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'frequent' | 'name'>('recent');
    const [showFavorites, setShowFavorites] = useState(false);
    const [showStats, setShowStats] = useState(false);
    
    if (!langContext) {
        throw new Error('HistoryPage must be used within a LanguageProvider');
    }

    const { language } = langContext;
    const t = useMemo(() => allTranslations[language], [language]);

    // Get filtered and sorted history
    const filteredHistory = useMemo(() => {
        let filtered = searchQuery ? searchHistory(searchQuery) : history;
        
        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = getHistoryByCategory(selectedCategory);
        }
        
        // Apply favorites filter
        if (showFavorites) {
            filtered = filtered.filter(item => item.favorite);
        }
        
        // Apply sorting
        switch (sortBy) {
            case 'recent':
                return [...filtered].sort((a, b) => b.lastVisited - a.lastVisited);
            case 'frequent':
                return [...filtered].sort((a, b) => b.count - a.count);
            case 'name':
                return [...filtered].sort((a, b) => a.label.localeCompare(b.label));
            default:
                return filtered;
        }
    }, [history, searchQuery, selectedCategory, showFavorites, sortBy, searchHistory, getHistoryByCategory]);

    // Get unique categories
    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(
            history.map(item => item.category || 'General')
        ));
        return uniqueCategories.sort();
    }, [history]);

    // Get statistics
    const stats = useMemo(() => getHistoryStats(), [getHistoryStats]);

    // Format time ago
    const formatTimeAgo = useCallback((timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 30) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    }, []);

    // Handle favorite toggle
    const handleToggleFavorite = useCallback((e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        const newState = toggleFavorite(id);
        toast({
            title: newState ? "Added to Favorites" : "Removed from Favorites",
            description: newState ? "Page saved to your favorites" : "Page removed from favorites"
        });
    }, [toggleFavorite, toast]);

    // Handle delete item
    const handleDeleteItem = useCallback((e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm('Are you sure you want to delete this history item?')) {
            const success = deleteHistoryItem(id);
            if (success) {
                toast({
                    title: "Item Deleted",
                    description: "History item has been removed"
                });
            }
        }
    }, [deleteHistoryItem, toast]);

    // Handle clear all history
    const handleClearHistory = useCallback(() => {
        if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
            clearHistory();
            toast({
                title: "History Cleared",
                description: "All history items have been deleted"
            });
        }
    }, [clearHistory, toast]);

    // Handle export history
    const handleExportHistory = useCallback(() => {
        try {
            const exportData = exportHistory();
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `history-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast({
                title: "History Exported",
                description: "Your history has been downloaded"
            });
        } catch {
            toast({
                title: "Export Failed",
                description: "Failed to export history",
                variant: "destructive"
            });
        }
    }, [exportHistory, toast]);

    // Handle import history
    const handleImportHistory = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = e.target?.result as string;
                const result = importHistory(jsonData);
                
                if (result.success) {
                    toast({
                        title: "Import Successful",
                        description: `Imported ${result.imported} items${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`
                    });
                } else {
                    toast({
                        title: "Import Failed",
                        description: result.errors.join(', '),
                        variant: "destructive"
                    });
                }
            } catch {
                toast({
                    title: "Import Error",
                    description: "Failed to read the import file",
                    variant: "destructive"
                });
            }
        };
        reader.readAsText(file);
        
        // Reset input
        event.target.value = '';
    }, [importHistory, toast]);

    if (error) {
        return (
            <FeaturePageLayout title={t.history as string}>
                <div className="p-4 md:p-6 h-full flex items-center justify-center">
                    <Card className="p-6 text-center">
                        <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading History</h3>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()}>Retry</Button>
                    </Card>
                </div>
            </FeaturePageLayout>
        );
    }

    return (
        <FeaturePageLayout title={t.history as string}>
            <div className="p-4 md:p-6 h-full flex flex-col gap-4">
                {/* Stats Panel */}
                {showStats && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-primary">{stats.totalVisits}</div>
                                    <div className="text-sm text-muted-foreground">Total Visits</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-600">{stats.uniquePages}</div>
                                    <div className="text-sm text-muted-foreground">Unique Pages</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-pink-600">{stats.favoritePages}</div>
                                    <div className="text-sm text-muted-foreground">Favorites</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {Object.keys(stats.categories).length}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Categories</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                {/* Controls */}
                <Card>
                    <CardContent className="p-4">
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search history..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map(category => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                <Select value={sortBy} onValueChange={(value: 'recent' | 'frequent' | 'name') => setSortBy(value)}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="recent">Recent</SelectItem>
                                        <SelectItem value="frequent">Most Used</SelectItem>
                                        <SelectItem value="name">Name</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={showFavorites ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowFavorites(!showFavorites)}
                            >
                                <Heart className={`h-4 w-4 mr-1 ${showFavorites ? 'fill-current' : ''}`} />
                                {showFavorites ? 'Show All' : 'Favorites'}
                            </Button>
                            
                            <Button
                                variant={showStats ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowStats(!showStats)}
                            >
                                <BarChart3 className="h-4 w-4 mr-1" />
                                Stats
                            </Button>
                            
                            <Button variant="outline" size="sm" onClick={handleExportHistory}>
                                <Download className="h-4 w-4 mr-1" />
                                Export
                            </Button>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('import-file')?.click()}
                            >
                                <Upload className="h-4 w-4 mr-1" />
                                Import
                            </Button>
                            
                            {history.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearHistory}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Clear All
                                </Button>
                            )}
                        </div>
                        
                        {/* Hidden file input */}
                        <input
                            id="import-file"
                            type="file"
                            accept=".json"
                            onChange={handleImportHistory}
                            className="hidden"
                        />
                    </CardContent>
                </Card>

                {/* History Items */}
                <Card className="flex-1 flex flex-col">
                    {isLoading ? (
                        <div className="flex items-center justify-center flex-1 py-12">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                <p className="text-muted-foreground">Loading history...</p>
                            </div>
                        </div>
                    ) : !isLoaded || filteredHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center p-10 flex-grow">
                            <HistoryIcon className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold">
                                {history.length === 0 ? (t.noHistory as string) : 'No matches found'}
                            </h3>
                            <p className="text-muted-foreground mt-2">
                                {history.length === 0 
                                    ? "Start using the tools to see your history here." 
                                    : "Try adjusting your search or filters."
                                }
                            </p>
                            {history.length === 0 && (
                                <Button asChild className="mt-4">
                                    <Link href="/home">Go to Home</Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <ScrollArea className="flex-grow">
                            <CardContent className="p-4 space-y-3">
                                {filteredHistory.map(item => {
                                    const Icon = iconMap[item.href] || HistoryIcon;
                                    return (
                                        <Link key={item.id} href={item.href}>
                                            <Card className="p-4 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-primary/10 rounded-lg">
                                                        <Icon className="w-6 h-6 text-primary" />
                                                    </div>
                                                    
                                                    <div className="flex-grow min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-lg truncate">{item.label}</h4>
                                                            {item.favorite && (
                                                                <Heart className="h-4 w-4 text-pink-500 fill-current flex-shrink-0" />
                                                            )}
                                                            {item.category && (
                                                                <span className="px-2 py-1 bg-secondary rounded text-xs text-secondary-foreground flex-shrink-0">
                                                                    {item.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatTimeAgo(item.lastVisited)}
                                                            </span>
                                                            {item.count > 1 && (
                                                                <span className="flex items-center gap-1">
                                                                    <HistoryIcon className="h-3 w-3" />
                                                                    {item.count} visits
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action buttons */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => handleToggleFavorite(e, item.id)}
                                                            className={item.favorite ? 'text-pink-500 hover:text-pink-600' : 'hover:text-pink-500'}
                                                        >
                                                            <Heart className={`h-4 w-4 ${item.favorite ? 'fill-current' : ''}`} />
                                                        </Button>
                                                        
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => handleDeleteItem(e, item.id)}
                                                            className="text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </CardContent>
                        </ScrollArea>
                    )}
                </Card>
            </div>
        </FeaturePageLayout>
    );
}
