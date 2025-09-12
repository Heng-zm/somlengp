'use client';

import { getImageWorkerManager, type BatchProcessingProgress } from './image-worker-manager';

// Enhanced types for better performance tracking
export interface ProcessingOptions {
  enableSharpening?: boolean;
  adjustBrightness?: number;
  adjustContrast?: number;
  stripMetadata?: boolean;
  priority?: 'low' | 'normal' | 'high';
  maxRetries?: number;
  timeout?: number;
}

export interface ProcessingResult {
  success: boolean;
  data?: ArrayBuffer;
  size?: number;
  format?: string;
  dimensions?: { width: number; height: number };
  error?: string;
  originalName?: string;
  processingTime?: number;
  memoryUsage?: number;
  compressionRatio?: number;
}

export interface ProcessingTask {
  id: string;
  type: 'process' | 'batch' | 'thumbnail';
  data: any;
  resolve: (result: any) => void;
  reject: (error: any) => void;
  onProgress?: (progress: number) => void;
  priority?: 'low' | 'normal' | 'high';
  createdAt: number;
  retries: number;
  maxRetries: number;
  timeout: number;
}

export interface MemoryStatus {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
  isHighPressure: boolean;
  availableMemory: number;
}

export interface PerformanceMetrics {
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  totalMemoryUsed: number;
  cacheHitRate: number;
  compressionEfficiency: number;
  queueSize: number;
  activeTasks: number;
}

class EnhancedImageWorkerManager {
  private baseManager = getImageWorkerManager();
  private processingQueue: ProcessingTask[] = [];
  private activeTasks = new Map<string, ProcessingTask>();
  private processedCache = new Map<string, { result: ProcessingResult; timestamp: number; size: number }>();
  private performanceMetrics: PerformanceMetrics = {
    totalProcessed: 0,
    totalFailed: 0,
    averageProcessingTime: 0,
    totalMemoryUsed: 0,
    cacheHitRate: 0,
    compressionEfficiency: 0,
    queueSize: 0,
    activeTasks: 0
  };

  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB cache limit
  private readonly maxCacheItems = 100;
  private readonly cacheExpiryTime = 30 * 60 * 1000; // 30 minutes
  private readonly maxConcurrentTasks = navigator.hardwareConcurrency || 4;
  private readonly memoryCheckInterval = 5000; // 5 seconds
  private readonly performanceUpdateInterval = 1000; // 1 second

  private memoryMonitoringId?: NodeJS.Timeout;
  private performanceUpdateId?: NodeJS.Timeout;
  private isProcessingQueue = false;
  private abortController = new AbortController();

  constructor() {
    this.startMemoryMonitoring();
    this.startPerformanceTracking();
    this.setupCleanupListeners();
  }

  // Memory management methods
  private _getMemoryStatus(): MemoryStatus {
    const memory = (performance as any).memory;
    if (!memory) {
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        usagePercentage: 0,
        isHighPressure: false,
        availableMemory: 0
      };
    }

    const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage,
      isHighPressure: usagePercentage > 70,
      availableMemory: memory.jsHeapSizeLimit - memory.usedJSHeapSize
    };
  }

  private startMemoryMonitoring(): void {
    this.memoryMonitoringId = setInterval(() => {
      const memoryStatus = this._getMemoryStatus();
      
      if (memoryStatus.isHighPressure) {
        console.warn('High memory pressure detected:', memoryStatus);
        this.handleMemoryPressure();
      }
      
      this.performanceMetrics.totalMemoryUsed = memoryStatus.usedJSHeapSize;
    }, this.memoryCheckInterval);
  }

  private handleMemoryPressure(): void {
    // Trigger garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }

    // Clear old cache entries
    this.clearExpiredCache();
    
    // Reduce processing load temporarily
    this.pauseProcessing(2000);
    
    // Clear unused object URLs
    this.cleanupObjectUrls();
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    let clearedSize = 0;
    let clearedCount = 0;

    for (const [key, entry] of this.processedCache.entries()) {
      if (now - entry.timestamp > this.cacheExpiryTime) {
        clearedSize += entry.size;
        this.processedCache.delete(key);
        clearedCount++;
      }
    }

    console.debug(`Cleared ${clearedCount} expired cache entries, freed ${Math.round(clearedSize / 1024)}KB`);
  }

  private cleanupObjectUrls(): void {
    // This would be called when cleaning up file previews and processed results
    // Implementation depends on how URLs are tracked in the main component
  }

  // Enhanced processing with priority queue
  async processImageEnhanced(
    file: File,
    width: number,
    height: number,
    quality: number = 90,
    format: string = 'webp',
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    // Check cache first
    const cacheKey = this.generateCacheKey(file, width, height, quality, format, options);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * this.performanceMetrics.totalProcessed + 1) / 
        (this.performanceMetrics.totalProcessed + 1);
      return cached.result;
    }

    // Create processing task
    const task: ProcessingTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'process',
      data: { file, width, height, quality, format, options },
      resolve: () => {},
      reject: () => {},
      priority: options.priority || 'normal',
      createdAt: Date.now(),
      retries: 0,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000
    };

    return new Promise<ProcessingResult>((resolve, reject) => {
      task.resolve = resolve;
      task.reject = reject;
      this.addToQueue(task);
    });
  }

  // Enhanced batch processing with intelligent chunking
  async processBatchEnhanced(
    files: Array<{
      file: File;
      width: number;
      height: number;
      quality?: number;
      format?: string;
      options?: ProcessingOptions;
      originalName?: string;
    }>,
    onProgress?: (progress: BatchProcessingProgress) => void
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    const memoryStatus = this._getMemoryStatus();
    
    // Adaptive chunk size based on memory and file sizes
    let chunkSize = this.calculateOptimalChunkSize(files, memoryStatus);
    
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);
      
      // Check memory pressure before each chunk
      const currentMemoryStatus = this._getMemoryStatus();
      if (currentMemoryStatus.isHighPressure) {
        chunkSize = Math.max(1, Math.floor(chunkSize / 2));
        await this.waitForMemoryRelief();
      }
      
      try {
        const chunkResults = await this.processChunkConcurrently(chunk, onProgress, i, files.length);
        results.push(...chunkResults);
      } catch (error) {
        console.error('Chunk processing failed:', error);
        // Add error results for failed chunk
        const errorResults = chunk.map(config => ({
          success: false,
          error: `Chunk processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          originalName: config.originalName || config.file.name
        } as ProcessingResult));
        results.push(...errorResults);
      }
      
      // Brief pause between chunks
      await this.sleep(100);
    }
    
    return results;
  }

  private calculateOptimalChunkSize(
    files: Array<{ file: File; width: number; height: number }>,
    memoryStatus: MemoryStatus
  ): number {
    const averageFileSize = files.reduce((sum, f) => sum + f.file.size, 0) / files.length;
    const estimatedMemoryPerFile = averageFileSize * 3; // Rough estimate for processing overhead
    const availableMemoryPercentage = Math.max(0.1, (100 - memoryStatus.usagePercentage) / 100);
    const safeMemoryLimit = memoryStatus.availableMemory * 0.5; // Use only 50% of available memory
    
    const maxChunkSize = Math.floor(safeMemoryLimit / estimatedMemoryPerFile);
    const adaptiveChunkSize = Math.min(this.maxConcurrentTasks, Math.max(1, maxChunkSize));
    
    return adaptiveChunkSize;
  }

  private async processChunkConcurrently(
    chunk: Array<{
      file: File;
      width: number;
      height: number;
      quality?: number;
      format?: string;
      options?: ProcessingOptions;
      originalName?: string;
    }>,
    onProgress?: (progress: BatchProcessingProgress) => void,
    baseIndex: number = 0,
    totalFiles: number = chunk.length
  ): Promise<ProcessingResult[]> {
    const promises = chunk.map(async (config, index) => {
      try {
        const result = await this.processImageEnhanced(
          config.file,
          config.width,
          config.height,
          config.quality || 90,
          config.format || 'webp',
          config.options || {}
        );
        
        // Update progress
        onProgress?.({
          progress: ((baseIndex + index + 1) / totalFiles) * 100,
          completed: baseIndex + index + 1,
          total: totalFiles
        });
        
        return { ...result, originalName: config.originalName || config.file.name };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalName: config.originalName || config.file.name
        } as ProcessingResult;
      }
    });
    
    return Promise.all(promises);
  }

  private async waitForMemoryRelief(): Promise<void> {
    return new Promise(resolve => {
      const checkMemory = () => {
        const memoryStatus = this._getMemoryStatus();
        if (!memoryStatus.isHighPressure) {
          resolve();
        } else {
          setTimeout(checkMemory, 1000);
        }
      };
      checkMemory();
    });
  }

  // Priority queue management
  private addToQueue(task: ProcessingTask): void {
    // Insert task in priority order
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const taskPriority = priorityOrder[task.priority || 'normal'];
    
    let insertIndex = this.processingQueue.length;
    for (let i = 0; i < this.processingQueue.length; i++) {
      const existingPriority = priorityOrder[this.processingQueue[i].priority || 'normal'];
      if (taskPriority < existingPriority) {
        insertIndex = i;
        break;
      }
    }
    
    this.processingQueue.splice(insertIndex, 0, task);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.activeTasks.size >= this.maxConcurrentTasks) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      while (this.processingQueue.length > 0 && this.activeTasks.size < this.maxConcurrentTasks) {
        const task = this.processingQueue.shift()!;
        this.processTaskConcurrently(task);
      }
    } finally {
      this.isProcessingQueue = false;
    }
    
    this.updatePerformanceMetrics();
  }

  private async processTaskConcurrently(task: ProcessingTask): Promise<void> {
    this.activeTasks.set(task.id, task);
    
    const startTime = performance.now();
    const startMemory = this._getMemoryStatus().usedJSHeapSize;
    
    try {
      const result = await this.executeTask(task);
      const endTime = performance.now();
      const endMemory = this._getMemoryStatus().usedJSHeapSize;
      
      // Enhanced result with metrics
      const enhancedResult: ProcessingResult = {
        ...result,
        processingTime: endTime - startTime,
        memoryUsage: endMemory - startMemory
      };
      
      // Cache successful results
      if (result.success && task.type === 'process') {
        this.cacheResult(task, enhancedResult);
      }
      
      this.performanceMetrics.totalProcessed++;
      this.performanceMetrics.averageProcessingTime = 
        (this.performanceMetrics.averageProcessingTime * (this.performanceMetrics.totalProcessed - 1) + 
         (endTime - startTime)) / this.performanceMetrics.totalProcessed;
      
      task.resolve(enhancedResult);
    } catch (error) {
      this.performanceMetrics.totalFailed++;
      
      // Retry logic
      if (task.retries < task.maxRetries) {
        task.retries++;
        setTimeout(() => this.addToQueue(task), 1000 * task.retries); // Exponential backoff
      } else {
        task.reject(error);
      }
    } finally {
      this.activeTasks.delete(task.id);
      // Continue processing queue
      this.processQueue();
    }
  }

  private async executeTask(task: ProcessingTask): Promise<ProcessingResult> {
    const { file, width, height, quality, format, options } = task.data;
    
    // Add timeout handling
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout')), task.timeout);
    });
    
    const processingPromise = this.baseManager.processImage(
      file,
      width,
      height,
      quality,
      format,
      options
    );
    
    return Promise.race([processingPromise, timeoutPromise]);
  }

  // Caching methods
  private generateCacheKey(
    file: File,
    width: number,
    height: number,
    quality: number,
    format: string,
    options: ProcessingOptions
  ): string {
    const optionsKey = JSON.stringify(options);
    return `${file.name}_${file.size}_${file.lastModified}_${width}x${height}_q${quality}_${format}_${btoa(optionsKey)}`;
  }

  private getCachedResult(cacheKey: string): { result: ProcessingResult; timestamp: number; size: number } | null {
    const cached = this.processedCache.get(cacheKey);
    if (!cached) return null;
    
    // Check expiration
    if (Date.now() - cached.timestamp > this.cacheExpiryTime) {
      this.processedCache.delete(cacheKey);
      return null;
    }
    
    return cached;
  }

  private cacheResult(task: ProcessingTask, result: ProcessingResult): void {
    if (!result.success || !result.data) return;
    
    const cacheKey = this.generateCacheKey(
      task.data.file,
      task.data.width,
      task.data.height,
      task.data.quality,
      task.data.format,
      task.data.options
    );
    
    const cacheEntry = {
      result,
      timestamp: Date.now(),
      size: result.data.byteLength
    };
    
    // Check cache size limits
    if (this.shouldEvictCache(cacheEntry.size)) {
      this.evictOldestCacheEntries();
    }
    
    this.processedCache.set(cacheKey, cacheEntry);
  }

  private shouldEvictCache(newEntrySize: number): boolean {
    const currentSize = Array.from(this.processedCache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    return (
      this.processedCache.size >= this.maxCacheItems ||
      currentSize + newEntrySize > this.maxCacheSize
    );
  }

  private evictOldestCacheEntries(): void {
    const entries = Array.from(this.processedCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // Remove oldest 25% of entries
    const removeCount = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.processedCache.delete(entries[i][0]);
    }
  }

  // Performance tracking
  private startPerformanceTracking(): void {
    this.performanceUpdateId = setInterval(() => {
      this.updatePerformanceMetrics();
    }, this.performanceUpdateInterval);
  }

  private updatePerformanceMetrics(): void {
    this.performanceMetrics.queueSize = this.processingQueue.length;
    this.performanceMetrics.activeTasks = this.activeTasks.size;
    
    // Calculate compression efficiency
    if (this.performanceMetrics.totalProcessed > 0) {
      // This would be calculated from actual compression results
      this.performanceMetrics.compressionEfficiency = 0.7; // Placeholder
    }
  }

  // Utility methods
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private pauseProcessing(ms: number): void {
    const resumeTime = Date.now() + ms;
    const originalProcessQueue = this.processQueue.bind(this);
    
    this.processQueue = async () => {
      if (Date.now() >= resumeTime) {
        this.processQueue = originalProcessQueue;
        await originalProcessQueue();
      }
    };
  }

  private setupCleanupListeners(): void {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseProcessing(1000);
      }
    });
  }

  // Public API methods
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getMemoryStatus(): MemoryStatus {
    return this._getMemoryStatus();
  }

  clearCache(): void {
    this.processedCache.clear();
    console.debug('Processing cache cleared');
  }

  cancelAllTasks(): void {
    this.processingQueue.length = 0;
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  cleanup(): void {
    if (this.memoryMonitoringId) {
      clearInterval(this.memoryMonitoringId);
    }
    if (this.performanceUpdateId) {
      clearInterval(this.performanceUpdateId);
    }
    this.cancelAllTasks();
    this.clearCache();
  }

  // Delegate other methods to base manager
  async generateThumbnail(file: File, maxSize: number = 200): Promise<ProcessingResult> {
    return this.baseManager.generateThumbnail(file, maxSize);
  }

  arrayBufferToBlob(arrayBuffer: ArrayBuffer, mimeType: string = 'image/jpeg'): Blob {
    return this.baseManager.arrayBufferToBlob(arrayBuffer, mimeType);
  }

  arrayBufferToDataURL(arrayBuffer: ArrayBuffer, mimeType: string = 'image/jpeg'): Promise<string> {
    return this.baseManager.arrayBufferToDataURL(arrayBuffer, mimeType);
  }

  loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return this.baseManager.loadImageDimensions(file);
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

export default EnhancedImageWorkerManager;
