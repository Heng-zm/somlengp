'use client';
// Enhanced caching system with IndexedDB and intelligent storage management
export interface CacheEntry<T = any> {
  id: string;
  data: T;
  metadata: {
    size: number;
    mimeType?: string;
    originalName?: string;
    dimensions?: { width: number; height: number };
    quality?: number;
    format?: string;
    processingTime?: number;
    compressionRatio?: number;
  };
  timestamps: {
    created: number;
    lastAccessed: number;
    expires?: number;
  };
  hitCount: number;
  priority: 'low' | 'normal' | 'high';
  tags: string[];
}
export interface CacheConfig {
  maxMemorySize: number; // bytes
  maxIndexedDBSize: number; // bytes
  maxEntries: number;
  defaultTTL: number; // milliseconds
  compressionThreshold: number; // bytes
  enableCompression: boolean;
  enableIndexedDB: boolean;
  cleanupInterval: number; // milliseconds
  prefetchEnabled: boolean;
}
export interface CacheStats {
  memoryCache: {
    entries: number;
    size: number;
    hitRate: number;
    missRate: number;
  };
  indexedDBCache: {
    entries: number;
    size: number;
    hitRate: number;
    missRate: number;
  };
  performance: {
    averageGetTime: number;
    averageSetTime: number;
    totalHits: number;
    totalMisses: number;
  };
  cleanup: {
    lastCleanup: number;
    entriesEvicted: number;
    sizeFreed: number;
  };
}
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxMemorySize: 50 * 1024 * 1024, // 50MB
  maxIndexedDBSize: 200 * 1024 * 1024, // 200MB
  maxEntries: 1000,
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  compressionThreshold: 1024 * 1024, // 1MB
  enableCompression: true,
  enableIndexedDB: true,
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  prefetchEnabled: true
};
class EnhancedCacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private indexedDB?: IDBDatabase;
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;
  private accessOrder: string[] = []; // For LRU
  private writeQueue: Array<{ key: string; entry: CacheEntry }> = [];
  private isWritingToDB = false;
  private compressionWorker?: Worker;
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.stats = {
      memoryCache: { entries: 0, size: 0, hitRate: 0, missRate: 0 },
      indexedDBCache: { entries: 0, size: 0, hitRate: 0, missRate: 0 },
      performance: { averageGetTime: 0, averageSetTime: 0, totalHits: 0, totalMisses: 0 },
      cleanup: { lastCleanup: Date.now(), entriesEvicted: 0, sizeFreed: 0 }
    };
    this.initialize();
  }
  private async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;
    // Initialize IndexedDB if enabled
    if (this.config.enableIndexedDB) {
      await this.initializeIndexedDB();
    }
    // Initialize compression worker if enabled
    if (this.config.enableCompression) {
      this.initializeCompressionWorker();
    }
    // Start cleanup timer
    this.startCleanupTimer();
    // Load existing cache stats from localStorage
    this.loadStatsFromStorage();
  }
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ImageProcessingCache', 2);
      request.onerror = () => {
        this.config.enableIndexedDB = false;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Create object store for cache entries
        if (!db.objectStoreNames.contains('entries')) {
          const store = db.createObjectStore('entries', { keyPath: 'id' });
          store.createIndex('lastAccessed', 'timestamps.lastAccessed');
          store.createIndex('priority', 'priority');
          store.createIndex('tags', 'tags', { multiEntry: true });
          store.createIndex('expires', 'timestamps.expires');
        }
        // Create object store for metadata
        if (!db.objectStoreNames.contains('metadata')) {
          const metaStore = db.createObjectStore('metadata', { keyPath: 'type' });
        }
      };
      request.onsuccess = (event) => {
        this.indexedDB = (event.target as IDBOpenDBRequest).result;
        // Handle version conflicts
        this.indexedDB.onversionchange = () => {
          this.indexedDB?.close();
          this.initializeIndexedDB();
        };
        resolve();
      };
    });
  }
  private initializeCompressionWorker(): void {
    try {
      // Create a simple compression worker using CompressionStream API
      const workerBlob = new Blob([`
        self.onmessage = async function(e) {
          const { id, action, data } = e.data;
          try {
            if (action === 'compress') {
              const stream = new CompressionStream('gzip');
              const writer = stream.writable.getWriter();
              const reader = stream.readable.getReader();
              writer.write(new Uint8Array(data));
              writer.close();
              const chunks = [];
              let done = false;
              while (!done) {
                const result = await reader.read();
                done = result.done;
                if (!done) chunks.push(result.value);
              }
              const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
              let offset = 0;
              for (const chunk of chunks) {
                compressed.set(chunk, offset);
                offset += chunk.length;
              }
              self.postMessage({ id, success: true, data: compressed.buffer });
            } else if (action === 'decompress') {
              const stream = new DecompressionStream('gzip');
              const writer = stream.writable.getWriter();
              const reader = stream.readable.getReader();
              writer.write(new Uint8Array(data));
              writer.close();
              const chunks = [];
              let done = false;
              while (!done) {
                const result = await reader.read();
                done = result.done;
                if (!done) chunks.push(result.value);
              }
              const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
              let offset = 0;
              for (const chunk of chunks) {
                decompressed.set(chunk, offset);
                offset += chunk.length;
              }
              self.postMessage({ id, success: true, data: decompressed.buffer });
            }
          } catch (error) {
            self.postMessage({ id, success: false, error: error.message });
          }
        };
      `], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(workerBlob));
    } catch (error) {
      this.config.enableCompression = false;
    }
  }
  // Enhanced get method with multi-tier lookup
  async get<T = any>(key: string): Promise<T | null> {
    const startTime = performance.now();
    try {
      // First, try memory cache
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        this.updateAccessMetrics(memoryEntry, 'memory');
        const endTime = performance.now();
        this.updatePerformanceStats('get', endTime - startTime);
        this.stats.memoryCache.hitRate++;
        return memoryEntry.data as T;
      }
      // Try IndexedDB if enabled and not found in memory
      if (this.config.enableIndexedDB && this.indexedDB) {
        const dbEntry = await this.getFromIndexedDB(key);
        if (dbEntry && !this.isExpired(dbEntry)) {
          // Move to memory cache for faster future access
          await this.setInMemory(key, dbEntry);
          this.updateAccessMetrics(dbEntry, 'indexeddb');
          const endTime = performance.now();
          this.updatePerformanceStats('get', endTime - startTime);
          this.stats.indexedDBCache.hitRate++;
          return dbEntry.data as T;
        }
      }
      // Cache miss
      this.stats.performance.totalMisses++;
      this.stats.memoryCache.missRate++;
      const endTime = performance.now();
      this.updatePerformanceStats('get', endTime - startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  // Enhanced set method with intelligent storage decisions
  async set<T = any>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: 'low' | 'normal' | 'high';
      tags?: string[];
      metadata?: Partial<CacheEntry['metadata']>;
      forceMemory?: boolean;
      forceIndexedDB?: boolean;
    } = {}
  ): Promise<void> {
    const startTime = performance.now();
    try {
      const entry: CacheEntry<T> = {
        id: key,
        data,
        metadata: {
          size: this.calculateSize(data),
          ...options.metadata
        },
        timestamps: {
          created: Date.now(),
          lastAccessed: Date.now(),
          expires: options.ttl ? Date.now() + options.ttl : Date.now() + this.config.defaultTTL
        },
        hitCount: 0,
        priority: options.priority || 'normal',
        tags: options.tags || []
      };
      // Decide storage strategy
      const shouldStoreInMemory = this.shouldStoreInMemory(entry, options);
      const shouldStoreInIndexedDB = this.shouldStoreInIndexedDB(entry, options);
      // Store in memory if appropriate
      if (shouldStoreInMemory) {
        await this.setInMemory(key, entry);
      }
      // Queue for IndexedDB storage if appropriate
      if (shouldStoreInIndexedDB && this.config.enableIndexedDB) {
        this.queueForIndexedDB(key, entry);
      }
      const endTime = performance.now();
      this.updatePerformanceStats('set', endTime - startTime);
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }
  // Batch operations for efficiency
  async getMany<T = any>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const promises = keys.map(async (key) => {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    });
    await Promise.all(promises);
    return results;
  }
  async setMany<T = any>(entries: Map<string, T>, options: Parameters<typeof this.set>[2] = {}): Promise<void> {
    const promises = Array.from(entries.entries()).map(([key, value]) =>
      this.set(key, value, options)
    );
    await Promise.all(promises);
  }
  // Enhanced delete with cleanup
  async delete(key: string): Promise<boolean> {
    let deleted = false;
    // Remove from memory cache
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      this.stats.memoryCache.size -= entry.metadata.size;
      this.stats.memoryCache.entries--;
      this.memoryCache.delete(key);
      // Remove from access order
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      deleted = true;
    }
    // Remove from IndexedDB
    if (this.config.enableIndexedDB && this.indexedDB) {
      try {
        await this.deleteFromIndexedDB(key);
        deleted = true;
      } catch (error) {
        console.error('Error deleting from IndexedDB:', error);
      }
    }
    return deleted;
  }
  // Batch delete
  async deleteMany(keys: string[]): Promise<number> {
    let deletedCount = 0;
    const promises = keys.map(async (key) => {
      const deleted = await this.delete(key);
      if (deleted) deletedCount++;
    });
    await Promise.all(promises);
    return deletedCount;
  }
  // Advanced query capabilities
  async findByTags(tags: string[]): Promise<CacheEntry[]> {
    const results: CacheEntry[] = [];
    // Search memory cache
    for (const entry of this.memoryCache.values()) {
      if (tags.some(tag => entry.tags.includes(tag))) {
        results.push(entry);
      }
    }
    // Search IndexedDB if available
    if (this.config.enableIndexedDB && this.indexedDB) {
      try {
        const dbResults = await this.findInIndexedDBByTags(tags);
        results.push(...dbResults);
      } catch (error) {
        console.error('Error searching IndexedDB by tags:', error);
      }
    }
    return results;
  }
  async findExpiring(withinMs: number = 60 * 60 * 1000): Promise<CacheEntry[]> {
    const expiryThreshold = Date.now() + withinMs;
    const results: CacheEntry[] = [];
    // Search memory cache
    for (const entry of this.memoryCache.values()) {
      if (entry.timestamps.expires && entry.timestamps.expires <= expiryThreshold) {
        results.push(entry);
      }
    }
    return results;
  }
  // Cache maintenance methods
  async cleanup(): Promise<{ evicted: number; sizeFreed: number }> {
    const evicted = { count: 0, size: 0 };
    // Clean expired entries from memory
    const expiredKeys: string[] = [];
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
        evicted.size += entry.metadata.size;
        evicted.count++;
      }
    }
    // Remove expired entries
    for (const key of expiredKeys) {
      await this.delete(key);
    }
    // Clean IndexedDB if enabled
    if (this.config.enableIndexedDB && this.indexedDB) {
      await this.cleanupIndexedDB();
    }
    // Check memory pressure and evict LRU if needed
    if (this.isMemoryPressureHigh()) {
      const lruEvicted = await this.evictLRU();
      evicted.count += lruEvicted.count;
      evicted.size += lruEvicted.size;
    }
    // Update stats
    this.stats.cleanup.lastCleanup = Date.now();
    this.stats.cleanup.entriesEvicted += evicted.count;
    this.stats.cleanup.sizeFreed += evicted.size;
    return { evicted: evicted.count, sizeFreed: evicted.size };
  }
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.accessOrder.length = 0;
    this.writeQueue.length = 0;
    // Clear IndexedDB
    if (this.config.enableIndexedDB && this.indexedDB) {
      await this.clearIndexedDB();
    }
    // Reset stats
    this.stats.memoryCache = { entries: 0, size: 0, hitRate: 0, missRate: 0 };
    this.stats.indexedDBCache = { entries: 0, size: 0, hitRate: 0, missRate: 0 };
  }
  // Performance and monitoring
  getStats(): CacheStats {
    return { ...this.stats };
  }
  async getDetailedStats(): Promise<CacheStats & { indexedDBSize: number; memorySize: number }> {
    const baseStats = this.getStats();
    const indexedDBSize = await this.getIndexedDBSize();
    const memorySize = this.getCurrentMemorySize();
    return {
      ...baseStats,
      indexedDBSize,
      memorySize
    };
  }
  // Private helper methods
  private shouldStoreInMemory(entry: CacheEntry, options: any): boolean {
    if (options.forceMemory) return true;
    if (options.forceIndexedDB) return false;
    // Store in memory if high priority or small size
    return (
      entry.priority === 'high' ||
      entry.metadata.size < this.config.compressionThreshold ||
      this.stats.memoryCache.size + entry.metadata.size < this.config.maxMemorySize
    );
  }
  private shouldStoreInIndexedDB(entry: CacheEntry, options: any): boolean {
    if (!this.config.enableIndexedDB) return false;
    if (options.forceMemory) return false;
    // Store in IndexedDB for larger items or when memory is full
    return (
      entry.metadata.size >= this.config.compressionThreshold ||
      entry.priority === 'low' ||
      this.isMemoryPressureHigh()
    );
  }
  private async setInMemory(key: string, entry: CacheEntry): Promise<void> {
    // Check if we need to evict to make space
    while (
      this.stats.memoryCache.size + entry.metadata.size > this.config.maxMemorySize ||
      this.stats.memoryCache.entries >= this.config.maxEntries
    ) {
      await this.evictLRU();
    }
    this.memoryCache.set(key, entry);
    this.stats.memoryCache.entries++;
    this.stats.memoryCache.size += entry.metadata.size;
    // Update access order for LRU
    const existingIndex = this.accessOrder.indexOf(key);
    if (existingIndex > -1) {
      this.accessOrder.splice(existingIndex, 1);
    }
    this.accessOrder.push(key);
  }
  private queueForIndexedDB(key: string, entry: CacheEntry): void {
    this.writeQueue.push({ key, entry });
    this.processWriteQueue();
  }
  private async processWriteQueue(): Promise<void> {
    if (this.isWritingToDB || this.writeQueue.length === 0 || !this.indexedDB) return;
    this.isWritingToDB = true;
    try {
      while (this.writeQueue.length > 0) {
        const batch = this.writeQueue.splice(0, 10); // Process in batches of 10
        await this.writeBatchToIndexedDB(batch);
      }
    } catch (error) {
      console.error('Error processing write queue:', error);
    } finally {
      this.isWritingToDB = false;
    }
  }
  private async writeBatchToIndexedDB(batch: Array<{ key: string; entry: CacheEntry }>): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      for (const { entry } of batch) {
        store.put(entry);
      }
    });
  }
  private async getFromIndexedDB(key: string): Promise<CacheEntry | null> {
    if (!this.indexedDB) return null;
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.indexedDB) return;
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  private async findInIndexedDBByTags(tags: string[]): Promise<CacheEntry[]> {
    if (!this.indexedDB) return [];
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const index = store.index('tags');
      const results: CacheEntry[] = [];
      for (const tag of tags) {
        const request = index.openCursor(IDBKeyRange.only(tag));
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          }
        };
      }
      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(transaction.error);
    });
  }
  private async cleanupIndexedDB(): Promise<void> {
    if (!this.indexedDB) return;
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const index = store.index('expires');
      const now = Date.now();
      const request = index.openCursor(IDBKeyRange.upperBound(now));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
  private async clearIndexedDB(): Promise<void> {
    if (!this.indexedDB) return;
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  private async evictLRU(): Promise<{ count: number; size: number }> {
    if (this.accessOrder.length === 0) return { count: 0, size: 0 };
    const evicted = { count: 0, size: 0 };
    const evictCount = Math.max(1, Math.floor(this.accessOrder.length * 0.1)); // Evict 10%
    for (let i = 0; i < evictCount && this.accessOrder.length > 0; i++) {
      const oldestKey = this.accessOrder.shift()!;
      const entry = this.memoryCache.get(oldestKey);
      if (entry) {
        evicted.size += entry.metadata.size;
        evicted.count++;
        this.memoryCache.delete(oldestKey);
        this.stats.memoryCache.entries--;
        this.stats.memoryCache.size -= entry.metadata.size;
      }
    }
    return evicted;
  }
  private isExpired(entry: CacheEntry): boolean {
    return entry.timestamps.expires ? Date.now() > entry.timestamps.expires : false;
  }
  private isMemoryPressureHigh(): boolean {
    return (
      this.stats.memoryCache.size > this.config.maxMemorySize * 0.8 ||
      this.stats.memoryCache.entries > this.config.maxEntries * 0.8
    );
  }
  private calculateSize(data: any): number {
    if (data instanceof ArrayBuffer) return data.byteLength;
    if (data instanceof Blob) return data.size;
    if (typeof data === 'string') return data.length * 2; // UTF-16
    return JSON.stringify(data).length * 2; // Rough estimate
  }
  private getCurrentMemorySize(): number {
    return Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.metadata.size, 0);
  }
  private async getIndexedDBSize(): Promise<number> {
    if (!this.indexedDB) return 0;
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const request = store.openCursor();
      let totalSize = 0;
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          totalSize += cursor.value.metadata.size;
          cursor.continue();
        } else {
          resolve(totalSize);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  private updateAccessMetrics(entry: CacheEntry, source: 'memory' | 'indexeddb'): void {
    entry.timestamps.lastAccessed = Date.now();
    entry.hitCount++;
    if (source === 'memory') {
      // Update LRU order
      const key = entry.id;
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
    }
    this.stats.performance.totalHits++;
  }
  private updatePerformanceStats(operation: 'get' | 'set', duration: number): void {
    if (operation === 'get') {
      this.stats.performance.averageGetTime = 
        (this.stats.performance.averageGetTime + duration) / 2;
    } else {
      this.stats.performance.averageSetTime = 
        (this.stats.performance.averageSetTime + duration) / 2;
    }
  }
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(console.error);
    }, this.config.cleanupInterval);
  }
  private loadStatsFromStorage(): void {
    try {
      const stored = localStorage.getItem('cacheStats');
      if (stored) {
        const storedStats = JSON.parse(stored);
        this.stats = { ...this.stats, ...storedStats };
      }
    } catch (error) {
    }
  }
  private saveStatsToStorage(): void {
    try {
      localStorage.setItem('cacheStats', JSON.stringify(this.stats));
    } catch (error) {
    }
  }
  // Public cleanup method
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }
    if (this.indexedDB) {
      this.indexedDB.close();
    }
    this.saveStatsToStorage();
    this.memoryCache.clear();
    this.accessOrder.length = 0;
    this.writeQueue.length = 0;
  }
}
// Singleton instance
let cacheManager: EnhancedCacheManager | null = null;
export function getEnhancedCacheManager(config?: Partial<CacheConfig>): EnhancedCacheManager {
  if (!cacheManager) {
    cacheManager = new EnhancedCacheManager(config);
  }
  return cacheManager;
}
// Utility functions for image-specific caching
export function createImageCacheKey(
  fileName: string,
  fileSize: number,
  lastModified: number,
  width: number,
  height: number,
  quality: number,
  format: string
): string {
  return `img_${fileName}_${fileSize}_${lastModified}_${width}x${height}_q${quality}_${format}`;
}
export function createThumbnailCacheKey(fileName: string, fileSize: number, maxSize: number): string {
  return `thumb_${fileName}_${fileSize}_${maxSize}`;
}
export { EnhancedCacheManager };
