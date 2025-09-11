'use client';

import { getPerformanceMonitor } from './performance-monitor';

export interface ImageOptimizationConfig {
  quality: number;
  format: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  maxWidth?: number;
  maxHeight?: number;
  enableProgressive?: boolean;
  enableLossless?: boolean;
  stripMetadata?: boolean;
  enableSharpening?: boolean;
  compressionLevel?: number;
}

export interface ImageProcessingResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  dimensions: { width: number; height: number };
  processingTime: number;
  optimizationSavings: number;
  success: boolean;
  error?: string;
}

export interface ImageCacheEntry {
  originalUrl: string;
  optimizedUrl: string;
  config: ImageOptimizationConfig;
  result: ImageProcessingResult;
  timestamp: number;
  lastAccessed: number;
  hitCount: number;
}

// Default optimization configurations
export const OPTIMIZATION_PRESETS: Record<string, ImageOptimizationConfig> = {
  thumbnail: {
    quality: 80,
    format: 'webp',
    maxWidth: 200,
    maxHeight: 200,
    enableProgressive: true,
    enableLossless: false,
    stripMetadata: true,
    compressionLevel: 6
  },
  hero: {
    quality: 85,
    format: 'auto',
    maxWidth: 1920,
    maxHeight: 1080,
    enableProgressive: true,
    enableLossless: false,
    stripMetadata: true,
    enableSharpening: true,
    compressionLevel: 7
  },
  gallery: {
    quality: 75,
    format: 'webp',
    maxWidth: 800,
    maxHeight: 600,
    enableProgressive: true,
    enableLossless: false,
    stripMetadata: true,
    compressionLevel: 6
  },
  print: {
    quality: 95,
    format: 'jpeg',
    enableProgressive: false,
    enableLossless: true,
    stripMetadata: false,
    compressionLevel: 9
  }
};

class ImageOptimizer {
  private cache: Map<string, ImageCacheEntry> = new Map();
  private readonly maxCacheSize = 100;
  private readonly maxCacheSizeBytes = 50 * 1024 * 1024; // 50MB
  private currentCacheSizeBytes = 0;
  private readonly cacheExpirationTime = 24 * 60 * 60 * 1000; // 24 hours
  private readonly performanceMonitor = getPerformanceMonitor();
  private processingQueue: Set<string> = new Set();
  private cacheAccessOrder: string[] = []; // Track access order for LRU

  constructor() {
    this.loadCache();
    this.setupCacheCleanup();
  }

  // Optimize image with given configuration
  async optimizeImage(
    imageUrl: string,
    config: ImageOptimizationConfig = OPTIMIZATION_PRESETS.gallery
  ): Promise<ImageProcessingResult> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(imageUrl, config);
    
    // Check cache first
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      this.updateCacheAccess(cacheKey);
      this.performanceMonitor?.trackCustomMetric?.('image_cache_hit', 1);
      return cachedResult.result;
    }

    // Prevent duplicate processing
    if (this.processingQueue.has(cacheKey)) {
      return this.waitForProcessing(cacheKey);
    }

    this.processingQueue.add(cacheKey);

    try {
      const result = await this.processImage(imageUrl, config);
      const processingTime = performance.now() - startTime;
      
      const finalResult: ImageProcessingResult = {
        ...result,
        processingTime,
        success: true
      };

      // Cache the result
      this.cacheResult(cacheKey, imageUrl, config, finalResult);
      
      // Report metrics
      this.performanceMonitor?.trackCustomMetric?.('image_optimization_time', processingTime);
      this.performanceMonitor?.trackCustomMetric?.('image_compression_ratio', result.compressionRatio);
      
      return finalResult;
    } catch (error) {
      const processingTime = performance.now() - startTime;
      const errorResult: ImageProcessingResult = {
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        format: config.format,
        dimensions: { width: 0, height: 0 },
        processingTime,
        optimizationSavings: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.performanceMonitor?.trackCustomMetric?.('image_optimization_error', 1);
      return errorResult;
    } finally {
      this.processingQueue.delete(cacheKey);
    }
  }

  // Process image with different optimization strategies
  private async processImage(
    imageUrl: string,
    config: ImageOptimizationConfig
  ): Promise<Omit<ImageProcessingResult, 'processingTime' | 'success'>> {
    // Load the image
    const { blob: originalBlob, dimensions } = await this.loadImage(imageUrl);
    const originalSize = originalBlob.size;

    // Determine optimal format
    const targetFormat = config.format === 'auto' 
      ? this.detectOptimalFormat() 
      : config.format;

    // Create canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Load image to canvas
    const img = await this.createImageFromBlob(originalBlob);
    
    // Calculate target dimensions
    const targetDimensions = this.calculateTargetDimensions(
      dimensions,
      config.maxWidth,
      config.maxHeight
    );

    // Set canvas size
    canvas.width = targetDimensions.width;
    canvas.height = targetDimensions.height;

    // Apply image processing
    this.applyImageProcessing(ctx, img, targetDimensions, config);

    // Convert to optimized format
    const optimizedBlob = await this.canvasToOptimizedBlob(canvas, targetFormat, config);
    const optimizedSize = optimizedBlob.size;

    const compressionRatio = originalSize > 0 ? optimizedSize / originalSize : 1;
    const optimizationSavings = Math.max(0, originalSize - optimizedSize);

    return {
      originalSize,
      optimizedSize,
      compressionRatio,
      format: targetFormat,
      dimensions: targetDimensions,
      optimizationSavings
    };
  }

  // Load image from URL
  private async loadImage(url: string): Promise<{ blob: Blob; dimensions: { width: number; height: number } }> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const img = await this.createImageFromBlob(blob);
    
    return {
      blob,
      dimensions: { width: img.naturalWidth, height: img.naturalHeight }
    };
  }

  // Create image element from blob
  private createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  // Calculate target dimensions respecting aspect ratio and limits
  private calculateTargetDimensions(
    original: { width: number; height: number },
    maxWidth?: number,
    maxHeight?: number
  ): { width: number; height: number } {
    let { width, height } = original;
    
    if (maxWidth && width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    if (maxHeight && height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  // Apply image processing effects
  private applyImageProcessing(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dimensions: { width: number; height: number },
    config: ImageOptimizationConfig
  ) {
    // Set image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw resized image
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
    
    // Apply sharpening if enabled
    if (config.enableSharpening) {
      this.applySharpeningFilter(ctx, dimensions);
    }
  }

  // Apply sharpening filter
  private applySharpeningFilter(
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number; height: number }
  ) {
    const imageData = ctx.getImageData(0, 0, dimensions.width, dimensions.height);
    const data = imageData.data;
    const width = dimensions.width;
    const height = dimensions.height;
    
    // Simple sharpening kernel
    const sharpenKernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    const tempData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels only
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixel = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelValue = sharpenKernel[(ky + 1) * 3 + (kx + 1)];
              sum += tempData[pixel] * kernelValue;
            }
          }
          const index = (y * width + x) * 4 + c;
          data[index] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  // Convert canvas to optimized blob
  private async canvasToOptimizedBlob(
    canvas: HTMLCanvasElement,
    format: string,
    config: ImageOptimizationConfig
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = this.formatToMimeType(format);
      const quality = config.quality / 100;
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create optimized blob'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  // Convert format string to MIME type
  private formatToMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'avif': 'image/avif'
    };
    
    return mimeTypes[format] || 'image/jpeg';
  }

  // Detect optimal format based on browser support
  private detectOptimalFormat(): string {
    if (typeof window === 'undefined') return 'jpeg';
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    // Check AVIF support
    if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
      return 'avif';
    }
    
    // Check WebP support
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      return 'webp';
    }
    
    return 'jpeg';
  }

  // Generate cache key
  private generateCacheKey(url: string, config: ImageOptimizationConfig): string {
    const configHash = btoa(JSON.stringify(config)).replace(/[^a-zA-Z0-9]/g, '');
    return `${url}-${configHash}`;
  }

  // Get cached result
  private getCachedResult(cacheKey: string): ImageCacheEntry | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;
    
    // Check expiration
    if (Date.now() - entry.timestamp > this.cacheExpirationTime) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry;
  }

  // Update cache access
  private updateCacheAccess(cacheKey: string) {
    const entry = this.cache.get(cacheKey);
    if (entry) {
      entry.lastAccessed = Date.now();
      entry.hitCount++;
      
      // Update LRU order
      const index = this.cacheAccessOrder.indexOf(cacheKey);
      if (index > -1) {
        this.cacheAccessOrder.splice(index, 1);
      }
      this.cacheAccessOrder.push(cacheKey);
    }
  }

  // Cache optimization result
  private cacheResult(
    cacheKey: string,
    originalUrl: string,
    config: ImageOptimizationConfig,
    result: ImageProcessingResult
  ) {
    const entrySize = result.originalSize + result.optimizedSize;
    
    // Remove entries if cache size limits are exceeded
    while (
      this.cache.size >= this.maxCacheSize || 
      this.currentCacheSizeBytes + entrySize > this.maxCacheSizeBytes
    ) {
      if (!this.evictLeastRecentlyUsed()) {
        // If no entries to evict, don't cache this entry
        return;
      }
    }
    
    const entry: ImageCacheEntry = {
      originalUrl,
      optimizedUrl: '', // Would be populated with actual optimized URL in real implementation
      config,
      result,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      hitCount: 0
    };
    
    this.cache.set(cacheKey, entry);
    this.cacheAccessOrder.push(cacheKey);
    this.currentCacheSizeBytes += entrySize;
    this.saveCache();
  }

  // Evict least recently used entry
  private evictLeastRecentlyUsed(): boolean {
    if (this.cacheAccessOrder.length === 0) {
      return false;
    }
    
    const lruKey = this.cacheAccessOrder.shift()!;
    const entry = this.cache.get(lruKey);
    
    if (entry) {
      const entrySize = entry.result.originalSize + entry.result.optimizedSize;
      this.currentCacheSizeBytes = Math.max(0, this.currentCacheSizeBytes - entrySize);
      this.cache.delete(lruKey);
      return true;
    }
    
    return false;
  }
  
  // Evict expired entries
  private evictExpiredEntries(): number {
    const now = Date.now();
    let evictedCount = 0;
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheExpirationTime) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      const entry = this.cache.get(key);
      if (entry) {
        const entrySize = entry.result.originalSize + entry.result.optimizedSize;
        this.currentCacheSizeBytes = Math.max(0, this.currentCacheSizeBytes - entrySize);
      }
      
      this.cache.delete(key);
      const accessIndex = this.cacheAccessOrder.indexOf(key);
      if (accessIndex > -1) {
        this.cacheAccessOrder.splice(accessIndex, 1);
      }
      evictedCount++;
    }
    
    return evictedCount;
  }

  // Wait for ongoing processing
  private async waitForProcessing(cacheKey: string): Promise<ImageProcessingResult> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.processingQueue.has(cacheKey)) {
          clearInterval(checkInterval);
          const cached = this.getCachedResult(cacheKey);
          if (cached) {
            resolve(cached.result);
          } else {
            // Fallback error result
            resolve({
              originalSize: 0,
              optimizedSize: 0,
              compressionRatio: 0,
              format: 'jpeg',
              dimensions: { width: 0, height: 0 },
              processingTime: 0,
              optimizationSavings: 0,
              success: false,
              error: 'Processing timeout'
            });
          }
        }
      }, 100);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve({
          originalSize: 0,
          optimizedSize: 0,
          compressionRatio: 0,
          format: 'jpeg',
          dimensions: { width: 0, height: 0 },
          processingTime: 30000,
          optimizationSavings: 0,
          success: false,
          error: 'Processing timeout'
        });
      }, 30000);
    });
  }

  // Load cache from storage
  private loadCache() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('image_optimization_cache');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [key, entry] of Object.entries(data)) {
          this.cache.set(key, entry as ImageCacheEntry);
        }
      }
    } catch (error) {
      console.warn('Failed to load image optimization cache:', error);
    }
  }

  // Save cache to storage
  private saveCache() {
    if (typeof window === 'undefined') return;
    
    try {
      const data = Object.fromEntries(this.cache.entries());
      localStorage.setItem('image_optimization_cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save image optimization cache:', error);
    }
  }

  // Setup cache cleanup
  private setupCacheCleanup() {
    setInterval(() => {
      const evictedCount = this.evictExpiredEntries();
      
      // Also perform size-based cleanup if we're over the size limit
      while (this.currentCacheSizeBytes > this.maxCacheSizeBytes * 0.9) {
        if (!this.evictLeastRecentlyUsed()) {
          break;
        }
      }
      
      if (evictedCount > 0) {
        this.saveCache();
        console.debug(`Cache cleanup: evicted ${evictedCount} expired entries`);
      }
    }, 60000); // Check every minute
  }

  // Public API methods

  // Get cache statistics
  getCacheStats() {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const totalSavings = entries.reduce((sum, entry) => sum + entry.result.optimizationSavings, 0);
    
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      cacheSizeBytes: this.currentCacheSizeBytes,
      maxCacheSizeBytes: this.maxCacheSizeBytes,
      cacheUtilization: this.maxCacheSizeBytes > 0 ? this.currentCacheSizeBytes / this.maxCacheSizeBytes : 0,
      totalHits,
      totalSavings,
      averageCompressionRatio: entries.length > 0 
        ? entries.reduce((sum, entry) => sum + entry.result.compressionRatio, 0) / entries.length 
        : 0,
      hitRate: totalHits > 0 ? entries.filter(e => e.hitCount > 0).length / entries.length : 0,
      accessOrderLength: this.cacheAccessOrder.length
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.cacheAccessOrder.length = 0;
    this.currentCacheSizeBytes = 0;
    this.saveCache();
  }

  // Batch optimize multiple images
  async optimizeBatch(
    imageUrls: string[],
    config: ImageOptimizationConfig = OPTIMIZATION_PRESETS.gallery
  ): Promise<ImageProcessingResult[]> {
    const promises = imageUrls.map(url => this.optimizeImage(url, config));
    return Promise.all(promises);
  }

  // Get optimization recommendations
  getOptimizationRecommendations(imageUrl: string): Promise<{
    currentFormat: string;
    recommendedFormat: string;
    estimatedSavings: number;
    recommendations: string[];
  }> {
    // This would analyze the image and provide recommendations
    // For now, return basic recommendations
    return Promise.resolve({
      currentFormat: 'jpeg',
      recommendedFormat: this.detectOptimalFormat(),
      estimatedSavings: 0.3, // 30% estimated savings
      recommendations: [
        'Convert to WebP format for better compression',
        'Enable progressive loading',
        'Consider resizing for mobile devices'
      ]
    });
  }
}

// Singleton instance
let imageOptimizer: ImageOptimizer | null = null;

export function getImageOptimizer(): ImageOptimizer | null {
  if (!imageOptimizer && typeof window !== 'undefined') {
    imageOptimizer = new ImageOptimizer();
  }
  return imageOptimizer;
}

// Utility functions
export function optimizeImageUrl(
  url: string,
  preset: keyof typeof OPTIMIZATION_PRESETS = 'gallery'
): Promise<ImageProcessingResult> {
  const optimizer = getImageOptimizer();
  if (!optimizer) {
    return Promise.reject(new Error('ImageOptimizer not available in this environment'));
  }
  return optimizer.optimizeImage(url, OPTIMIZATION_PRESETS[preset]);
}

export function createResponsiveImageSet(
  url: string,
  breakpoints: Array<{ width: number; quality?: number }>
): Promise<ImageProcessingResult[]> {
  const optimizer = getImageOptimizer();
  if (!optimizer) {
    return Promise.reject(new Error('ImageOptimizer not available in this environment'));
  }
  const promises = breakpoints.map(bp => {
    const config: ImageOptimizationConfig = {
      ...OPTIMIZATION_PRESETS.gallery,
      maxWidth: bp.width,
      quality: bp.quality || OPTIMIZATION_PRESETS.gallery.quality
    };
    return optimizer!.optimizeImage(url, config);
  });
  
  return Promise.all(promises);
}

export { ImageOptimizer };
