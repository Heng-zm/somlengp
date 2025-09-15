// Enhanced Image Worker Manager with progressive loading, better caching and performance
'use client';

import { ImageWorkerManager, ProcessingTask, ProcessingResult } from './image-worker-manager';

interface DimensionCacheEntry {
  w: number;
  h: number;
  timestamp: number;
  priority: number; // Higher = more likely to be kept in cache
}

interface ProgressiveImageResult {
  preview?: string; // Low quality preview (blur-up)
  thumbnail?: string; // Thumbnail for listing
  fullImage?: string; // Full quality image
  dimensions?: { width: number; height: number };
  error?: string;
}

export class EnhancedImageWorkerManager extends ImageWorkerManager {
  private dimensionCache = new Map<string, DimensionCacheEntry>();
  private progressiveCache = new Map<string, ProgressiveImageResult>();
  private maxCacheSize = 100;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Enhanced performance tracking
  private performanceStats = {
    totalProcessed: 0,
    averageProcessingTime: 0,
    cacheHitRate: 0
  };
  
  constructor() {
    super();
    this.setupCacheCleanup();
  }
  
  // Enhanced memory pressure check with caching considerations
  protected checkMemoryPressure(): { isHigh: boolean; usage: number; limit: number } {
    const baseResult = super.checkMemoryPressure();
    
    // Add cache memory estimation
    const cacheMemoryEstimate = (this.dimensionCache.size * 0.1) + (this.progressiveCache.size * 1); // Rough estimate in MB
    const totalUsage = baseResult.usage + cacheMemoryEstimate;
    
    return {
      isHigh: baseResult.isHigh || totalUsage > baseResult.limit * 0.6, // More conservative with caching
      usage: totalUsage,
      limit: baseResult.limit
    };
  }
  
  private setupCacheCleanup() {
    // Perform cache cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => this.performCacheCleanup(), 2 * 60 * 1000);
  }
  
  // Override generateThumbnail to return ProcessingResult
  async generateThumbnail(
    file: File,
    maxSize: number = 200
  ): Promise<ProcessingResult> {
    try {
      const result = await super.generateThumbnail(file, maxSize);
      
      // Update performance stats
      this.performanceStats.totalProcessed++;
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalName: file.name
      };
    }
  }

  public dispose() {
    // Clean up when component unmounts
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Perform final cache cleanup
    this.performCacheCleanup(true);
    
    // Call parent dispose method
    this.terminate();
  }
  
  private performCacheCleanup(clearAll = false) {
    console.log(`Performing cache cleanup, total entries: ${this.dimensionCache.size} dimensions, ${this.progressiveCache.size} images`);
    
    if (clearAll) {
      // Revoke all blob URLs
      this.progressiveCache.forEach(entry => {
        if (entry.preview && entry.preview.startsWith('blob:')) {
          URL.revokeObjectURL(entry.preview);
        }
        if (entry.thumbnail && entry.thumbnail.startsWith('blob:')) {
          URL.revokeObjectURL(entry.thumbnail);
        }
        if (entry.fullImage && entry.fullImage.startsWith('blob:')) {
          URL.revokeObjectURL(entry.fullImage);
        }
      });
      
      this.dimensionCache.clear();
      this.progressiveCache.clear();
      return;
    }
    
    // Only clear if over size limit
    if (this.dimensionCache.size > this.maxCacheSize) {
      // Sort by priority and timestamp, keep most important entries
      const entries = Array.from(this.dimensionCache.entries());
      entries.sort((a, b) => {
        // First by priority (higher = keep)
        if (b[1].priority !== a[1].priority) {
          return b[1].priority - a[1].priority;
        }
        // Then by recency (newer = keep)
        return b[1].timestamp - a[1].timestamp;
      });
      
      // Keep top entries, remove the rest
      const toRemove = entries.slice(Math.floor(this.maxCacheSize * 0.7));
      toRemove.forEach(([key]) => {
        this.dimensionCache.delete(key);
      });
    }
    
    // Clear old image entries
    const now = Date.now();
    const MAX_AGE = 10 * 60 * 1000; // 10 minutes
    
    this.progressiveCache.forEach((entry, key) => {
      const cacheEntry = this.dimensionCache.get(key);
      if (!cacheEntry || now - cacheEntry.timestamp > MAX_AGE) {
        // Revoke blob URLs before removing
        if (entry.preview && entry.preview.startsWith('blob:')) {
          URL.revokeObjectURL(entry.preview);
        }
        if (entry.thumbnail && entry.thumbnail.startsWith('blob:')) {
          URL.revokeObjectURL(entry.thumbnail);
        }
        if (entry.fullImage && entry.fullImage.startsWith('blob:')) {
          URL.revokeObjectURL(entry.fullImage);
        }
        this.progressiveCache.delete(key);
      }
    });
  }
  
  // Create a cache key from file metadata
  private createCacheKey(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }
  
  // Load image with progressive features (preview, thumbnail, dimensions)
  public async loadImageProgressive(
    file: File,
    options: {
      generateThumbnail?: boolean;
      thumbnailSize?: number;
      priority?: number;
      onProgress?: (phase: string, progress: number) => void;
    } = {}
  ): Promise<ProgressiveImageResult> {
    const { generateThumbnail = true, thumbnailSize = 150, onProgress } = options;
    const cacheKey = this.createCacheKey(file);
    
    try {
      onProgress?.('init', 0);
      
      // Check cache first
      const cached = this.progressiveCache.get(cacheKey);
      if (cached && !cached.error) {
        onProgress?.('complete', 100);
        this.performanceStats.totalProcessed++;
        return cached;
      }
      
      // Create preview URL
      const preview = URL.createObjectURL(file);
      onProgress?.('preview', 30);
      
      // Generate thumbnail if requested
      let thumbnailUrl: string | undefined;
      if (generateThumbnail) {
        try {
          const thumbnailResult = await this.generateThumbnail(file, thumbnailSize);
          if (thumbnailResult.success && thumbnailResult.data) {
            const blob = new Blob([thumbnailResult.data], { type: 'image/jpeg' });
            thumbnailUrl = URL.createObjectURL(blob);
          }
          onProgress?.('thumbnail', 60);
        } catch (error) {
          console.warn('Failed to generate thumbnail:', error);
          thumbnailUrl = preview; // Fallback to preview
        }
      }
      
      // Load dimensions
      const dimensions = await super.loadImageDimensions(file);
      onProgress?.('complete', 100);
      
      const result: ProgressiveImageResult = {
        preview,
        thumbnail: thumbnailUrl || preview,
        dimensions
      };
      
      // Cache the result
      this.progressiveCache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      const errorResult = {
        error: error instanceof Error ? error.message : 'Failed to load image progressively'
      };
      
      this.progressiveCache.set(cacheKey, errorResult);
      return errorResult;
    }
  }

  // Enhanced dimension loading with caching
  public async loadImageDimensionsWithCache(file: File): Promise<{ width: number; height: number } | null> {
    const cacheKey = this.createCacheKey(file);
    
    // Check cache first
    const cached = this.dimensionCache.get(cacheKey);
    if (cached) {
      cached.timestamp = Date.now(); // Update access time
      cached.priority += 1; // Boost priority
      return { width: cached.w, height: cached.h };
    }
    
    try {
      // Load dimensions using parent method
      const dimensions = await super.loadImageDimensions(file);
      
      if (dimensions) {
        // Cache the result
        this.dimensionCache.set(cacheKey, {
          w: dimensions.width,
          h: dimensions.height,
          timestamp: Date.now(),
          priority: 1
        });
      }
      
      return dimensions;
    } catch (error) {
      console.warn('Failed to load image dimensions:', error);
      return null;
    }
  }
  
  // Add compatibility method for loadImageDimensionsProgressive
  public async loadImageDimensionsProgressive(
    file: File,
    options: {
      priority?: number;
      useQueue?: boolean;
      timeout?: number;
      onProgress?: (phase: string, progress: number) => void;
    } = {}
  ): Promise<{ w: number; h: number } | null> {
    const dimensions = await this.loadImageDimensionsWithCache(file);
    if (dimensions) {
      return { w: dimensions.width, h: dimensions.height };
    }
    return null;
  }
  
  // Get performance statistics
  public getPerformanceStats() {
    return {
      ...this.performanceStats,
      cacheSize: {
        dimensions: this.dimensionCache.size,
        progressive: this.progressiveCache.size
      }
    };
  }
  
  // Clear all caches
  public clearCaches(): void {
    this.performCacheCleanup(true);
  }
}

// Singleton instance
let enhancedImageWorkerManager: EnhancedImageWorkerManager | null = null;

export function getEnhancedImageWorkerManager(): EnhancedImageWorkerManager {
  if (!enhancedImageWorkerManager) {
    enhancedImageWorkerManager = new EnhancedImageWorkerManager();
  }
  return enhancedImageWorkerManager;
}

// Clean up function for component unmounting
export function disposeEnhancedImageWorkerManager(): void {
  if (enhancedImageWorkerManager) {
    enhancedImageWorkerManager.dispose();
    enhancedImageWorkerManager = null;
  }
}
