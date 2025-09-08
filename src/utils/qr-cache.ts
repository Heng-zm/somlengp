/**
 * QR Code Result Caching System
 * Implements intelligent caching for QR scan results to improve performance
 */

interface QRCacheEntry {
  data: string;
  location?: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
  timestamp: number;
  imageHash: string;
  confidence: number;
  scanCount: number;
  lastAccessed: number;
}

interface QRCacheOptions {
  maxEntries?: number;
  ttlMs?: number; // Time to live in milliseconds
  maxAge?: number; // Maximum age before considering stale
  enableCompression?: boolean;
}

class QRCodeCache {
  private cache = new Map<string, QRCacheEntry>();
  private options: Required<QRCacheOptions>;
  private stats = {
    hits: 0,
    misses: 0,
    stores: 0,
    evictions: 0
  };

  constructor(options: QRCacheOptions = {}) {
    this.options = {
      maxEntries: options.maxEntries || 100,
      ttlMs: options.ttlMs || 5 * 60 * 1000, // 5 minutes
      maxAge: options.maxAge || 24 * 60 * 60 * 1000, // 24 hours
      enableCompression: options.enableCompression || false
    };
  }

  /**
   * Generate a hash for image data to use as cache key
   */
  private generateImageHash(imageData: ImageData): string {
    const { data, width, height } = imageData;
    
    // Create a simplified hash by sampling pixels at regular intervals
    let hash = '';
    const step = Math.max(1, Math.floor(data.length / 1000)); // Sample ~1000 pixels max
    
    for (let i = 0; i < data.length; i += step * 4) {
      // Use RGB values (skip alpha)
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Convert to grayscale and create hash component
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      hash += gray.toString(16).padStart(2, '0');
      
      if (hash.length >= 64) break; // Limit hash length
    }
    
    return `${width}x${height}-${hash.substring(0, 32)}`;
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValidEntry(entry: QRCacheEntry): boolean {
    const now = Date.now();
    
    // Check TTL
    if (now - entry.timestamp > this.options.ttlMs) {
      return false;
    }
    
    // Check max age
    if (now - entry.timestamp > this.options.maxAge) {
      return false;
    }
    
    return true;
  }

  /**
   * Evict old or least recently used entries
   */
  private evictEntries(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries first
    entries.forEach(([key, entry]) => {
      if (!this.isValidEntry(entry)) {
        this.cache.delete(key);
        this.stats.evictions++;
      }
    });
    
    // If still over limit, remove least recently used entries
    if (this.cache.size >= this.options.maxEntries) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const toRemove = sortedEntries.slice(0, this.cache.size - this.options.maxEntries + 10);
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
        this.stats.evictions++;
      });
    }
  }

  /**
   * Store a QR scan result in cache
   */
  store(
    imageData: ImageData, 
    result: {
      data: string;
      location?: QRCacheEntry['location'];
    },
    confidence: number = 100
  ): void {
    try {
      const imageHash = this.generateImageHash(imageData);
      const now = Date.now();
      
      // Check if we already have this result
      const existing = this.cache.get(imageHash);
      if (existing && existing.data === result.data) {
        // Update existing entry
        existing.scanCount++;
        existing.lastAccessed = now;
        existing.confidence = Math.max(existing.confidence, confidence);
        return;
      }
      
      // Create new cache entry
      const entry: QRCacheEntry = {
        data: result.data,
        location: result.location,
        timestamp: now,
        imageHash,
        confidence,
        scanCount: 1,
        lastAccessed: now
      };
      
      this.cache.set(imageHash, entry);
      this.stats.stores++;
      
      // Evict old entries if necessary
      if (this.cache.size >= this.options.maxEntries) {
        this.evictEntries();
      }
      
    } catch (error) {
      console.warn('Failed to store QR result in cache:', error);
    }
  }

  /**
   * Retrieve a QR scan result from cache
   */
  get(imageData: ImageData): QRCacheEntry | null {
    try {
      const imageHash = this.generateImageHash(imageData);
      const entry = this.cache.get(imageHash);
      
      if (!entry) {
        this.stats.misses++;
        return null;
      }
      
      if (!this.isValidEntry(entry)) {
        this.cache.delete(imageHash);
        this.stats.evictions++;
        this.stats.misses++;
        return null;
      }
      
      // Update access time
      entry.lastAccessed = Date.now();
      this.stats.hits++;
      
      return entry;
      
    } catch (error) {
      console.warn('Failed to retrieve from QR cache:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Check if image data likely contains a QR code based on cache history
   */
  hasSimilar(imageData: ImageData, threshold: number = 0.8): QRCacheEntry | null {
    try {
      const targetHash = this.generateImageHash(imageData);
      
      // Look for similar hashes (basic similarity check)
      for (const [hash, entry] of this.cache.entries()) {
        if (!this.isValidEntry(entry)) continue;
        
        // Simple hash similarity check
        let similarChars = 0;
        const minLength = Math.min(hash.length, targetHash.length);
        
        for (let i = 0; i < minLength; i++) {
          if (hash[i] === targetHash[i]) {
            similarChars++;
          }
        }
        
        const similarity = similarChars / minLength;
        if (similarity >= threshold) {
          entry.lastAccessed = Date.now();
          return entry;
        }
      }
      
      return null;
      
    } catch (error) {
      console.warn('Failed to check for similar QR cache entries:', error);
      return null;
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      stores: 0,
      evictions: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(1) : '0.0';
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      totalRequests: total
    };
  }

  /**
   * Get cache entries for debugging
   */
  getEntries(): Array<[string, QRCacheEntry]> {
    return Array.from(this.cache.entries());
  }

  /**
   * Remove stale entries manually
   */
  cleanup(): number {
    const initialSize = this.cache.size;
    this.evictEntries();
    return initialSize - this.cache.size;
  }

  /**
   * Export cache data (for persistence)
   */
  export(): string {
    try {
      const exportData = {
        cache: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now(),
        version: '1.0'
      };
      return JSON.stringify(exportData);
    } catch (error) {
      console.warn('Failed to export QR cache:', error);
      return '{}';
    }
  }

  /**
   * Import cache data (from persistence)
   */
  import(data: string): boolean {
    try {
      const importData = JSON.parse(data);
      
      if (!importData.cache || !Array.isArray(importData.cache)) {
        return false;
      }
      
      // Clear existing cache
      this.clear();
      
      // Import entries
      importData.cache.forEach(([key, entry]: [string, QRCacheEntry]) => {
        if (this.isValidEntry(entry)) {
          this.cache.set(key, entry);
        }
      });
      
      // Import stats if available
      if (importData.stats) {
        this.stats = { ...this.stats, ...importData.stats };
      }
      
      console.log(`📦 QR Cache imported ${this.cache.size} entries`);
      return true;
      
    } catch (error) {
      console.warn('Failed to import QR cache:', error);
      return false;
    }
  }
}

// Create and export singleton instance
export const qrCache = new QRCodeCache({
  maxEntries: 50,
  ttlMs: 10 * 60 * 1000, // 10 minutes
  maxAge: 60 * 60 * 1000, // 1 hour
  enableCompression: false
});

// Utility functions
export const saveQRCacheToStorage = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const data = qrCache.export();
      localStorage.setItem('qr-cache-data', data);
      return true;
    }
  } catch (error) {
    console.warn('Failed to save QR cache to storage:', error);
  }
  return false;
};

export const loadQRCacheFromStorage = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem('qr-cache-data');
      if (data) {
        return qrCache.import(data);
      }
    }
  } catch (error) {
    console.warn('Failed to load QR cache from storage:', error);
  }
  return false;
};

// Auto-save cache periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    saveQRCacheToStorage();
  }, 5 * 60 * 1000); // Save every 5 minutes
  
  // Load cache on initialization
  loadQRCacheFromStorage();
  
  // Save cache before page unload
  window.addEventListener('beforeunload', () => {
    saveQRCacheToStorage();
  });
}
