'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { clearAllUIFunctionCaches, clearCachesByPattern, CacheStats } from '@/utils/cache-cleaner';
import { cn } from '@/lib/utils';

interface CacheControlPanelProps {
  className?: string;
  onCacheCleared?: (stats: CacheStats) => void;
  showAdvanced?: boolean;
}

export function CacheControlPanel({
  className,
  onCacheCleared,
  showAdvanced = false
}: CacheControlPanelProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [lastClearStats, setLastClearStats] = useState<CacheStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  const handleClearAllCaches = async () => {
    setIsClearing(true);
    try {
      const stats = await clearAllUIFunctionCaches();
      setLastClearStats(stats);
      setShowStats(true);
      onCacheCleared?.(stats);
      
      // Auto-hide stats after 5 seconds
      setTimeout(() => setShowStats(false), 5000);
    } catch (error) {
      console.error('Failed to clear caches:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearPatternCaches = async (patterns: string[]) => {
    setIsClearing(true);
    try {
      const stats = clearCachesByPattern(patterns);
      setLastClearStats(stats);
      setShowStats(true);
      onCacheCleared?.(stats);
      
      setTimeout(() => setShowStats(false), 3000);
    } catch (error) {
      console.error('Failed to clear pattern caches:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const clearPatterns = [
    { name: 'UI Components', patterns: ['ui-', 'component-', 'widget-'] },
    { name: 'Functions', patterns: ['func-', 'callback-', 'memo-'] },
    { name: 'Images', patterns: ['img-', 'image-', 'media-'] },
    { name: 'API Data', patterns: ['api-', 'fetch-', 'query-'] },
    { name: 'User Preferences', patterns: ['user-', 'pref-', 'settings-'] }
  ];

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🧹</span>
          UI Function Cache Control
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main clear button */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleClearAllCaches}
            disabled={isClearing}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            {isClearing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Clearing Caches...
              </div>
            ) : (
              'Clear All UI Function Caches'
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground text-center">
            Removes memoized functions, cached components, and UI performance optimizations
          </p>
        </div>

        {/* Advanced options */}
        {showAdvanced && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Clear Specific Cache Types</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {clearPatterns.map((pattern) => (
                <Button
                  key={pattern.name}
                  onClick={() => handleClearPatternCaches(pattern.patterns)}
                  disabled={isClearing}
                  variant="outline"
                  size="sm"
                >
                  {pattern.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Stats display */}
        {showStats && lastClearStats && (
          <div className="space-y-3 p-3 bg-muted rounded-lg animate-in slide-in-from-top-2">
            <h4 className="text-sm font-medium text-green-600 dark:text-green-400">
              ✅ Cache Clearing Complete
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Items Cleared:</span>
                <Badge variant="secondary" className="ml-1">
                  {lastClearStats.totalClearedItems}
                </Badge>
              </div>
              
              <div>
                <span className="font-medium">Cache Types:</span>
                <Badge variant="secondary" className="ml-1">
                  {lastClearStats.clearedCaches.length}
                </Badge>
              </div>
            </div>

            {lastClearStats.clearedCaches.length > 0 && (
              <div>
                <span className="text-sm font-medium">Cleared:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {lastClearStats.clearedCaches.slice(0, 4).map((cache, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {cache}
                    </Badge>
                  ))}
                  {lastClearStats.clearedCaches.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{lastClearStats.clearedCaches.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {lastClearStats.errors.length > 0 && (
              <div>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  ⚠️ Warnings:
                </span>
                <div className="text-xs text-muted-foreground mt-1">
                  {lastClearStats.errors.length} operation(s) had issues
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Clears React component memoization caches</li>
            <li>Removes useMemo and useCallback cached values</li>
            <li>Invalidates browser storage for UI functions</li>
            <li>Forces re-computation of optimized functions</li>
            <li>Clears Next.js router and component caches</li>
          </ul>
          <p className="pt-1">
            <strong>Note:</strong> This may temporarily impact performance while caches rebuild.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}