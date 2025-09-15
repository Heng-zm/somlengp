// Centralized URL Manager for better memory management and lifecycle tracking
'use client';

interface ManagedURL {
  url: string;
  type: 'preview' | 'thumbnail' | 'processed' | 'temp';
  fileId: string;
  fileName?: string;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  size?: number;
  isRevoked: boolean;
}

export class URLManager {
  private static instance: URLManager;
  private managedUrls = new Map<string, ManagedURL>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxAge = 10 * 60 * 1000; // 10 minutes
  private maxUrls = 200;
  
  private constructor() {
    this.setupPeriodicCleanup();
  }
  
  public static getInstance(): URLManager {
    if (!URLManager.instance) {
      URLManager.instance = new URLManager();
    }
    return URLManager.instance;
  }
  
  private setupPeriodicCleanup() {
    // Clean up old URLs every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 2 * 60 * 1000);
  }
  
  // Create and track a new blob URL
  public createURL(
    blob: Blob | File, 
    type: ManagedURL['type'], 
    fileId: string, 
    fileName?: string
  ): string {
    const url = URL.createObjectURL(blob);
    const now = Date.now();
    
    const managedUrl: ManagedURL = {
      url,
      type,
      fileId,
      fileName,
      createdAt: now,
      lastAccessed: now,
      accessCount: 1,
      size: blob.size,
      isRevoked: false
    };
    
    this.managedUrls.set(url, managedUrl);
    
    // Trigger cleanup if we have too many URLs
    if (this.managedUrls.size > this.maxUrls) {
      this.performCleanup(false); // Don't force, just clean old ones
    }
    
    return url;
  }
  
  // Track access to existing URL
  public accessURL(url: string): boolean {
    const managedUrl = this.managedUrls.get(url);
    if (managedUrl && !managedUrl.isRevoked) {
      managedUrl.lastAccessed = Date.now();
      managedUrl.accessCount++;
      return true;
    }
    return false;
  }
  
  // Revoke a specific URL
  public revokeURL(url: string): boolean {
    const managedUrl = this.managedUrls.get(url);
    if (managedUrl && !managedUrl.isRevoked) {
      URL.revokeObjectURL(url);
      managedUrl.isRevoked = true;
      this.managedUrls.delete(url);
      return true;
    }
    return false;
  }
  
  // Revoke all URLs for a specific file ID
  public revokeFileURLs(fileId: string): number {
    let revokedCount = 0;
    const urlsToRevoke: string[] = [];
    
    for (const [url, managedUrl] of this.managedUrls.entries()) {
      if (managedUrl.fileId === fileId && !managedUrl.isRevoked) {
        urlsToRevoke.push(url);
      }
    }
    
    urlsToRevoke.forEach(url => {
      if (this.revokeURL(url)) {
        revokedCount++;
      }
    });
    
    return revokedCount;
  }
  
  // Get all URLs for a file ID
  public getFileURLs(fileId: string): ManagedURL[] {
    const fileUrls: ManagedURL[] = [];
    
    for (const managedUrl of this.managedUrls.values()) {
      if (managedUrl.fileId === fileId && !managedUrl.isRevoked) {
        fileUrls.push(managedUrl);
      }
    }
    
    return fileUrls;
  }
  
  // Get URL by type for a specific file
  public getFileURLByType(fileId: string, type: ManagedURL['type']): string | null {
    for (const managedUrl of this.managedUrls.values()) {
      if (managedUrl.fileId === fileId && managedUrl.type === type && !managedUrl.isRevoked) {
        this.accessURL(managedUrl.url);
        return managedUrl.url;
      }
    }
    return null;
  }
  
  // Perform cleanup of old or unused URLs
  private performCleanup(force = false) {
    const now = Date.now();
    const urlsToRevoke: string[] = [];
    
    console.log(`[URLManager] Starting cleanup. Current URLs: ${this.managedUrls.size}`);
    
    for (const [url, managedUrl] of this.managedUrls.entries()) {
      if (managedUrl.isRevoked) {
        // Already revoked, just remove from tracking
        this.managedUrls.delete(url);
        continue;
      }
      
      const age = now - managedUrl.createdAt;
      const timeSinceAccess = now - managedUrl.lastAccessed;
      
      // Conditions for cleanup
      const isOld = age > this.maxAge;
      const isUnused = timeSinceAccess > (this.maxAge / 2) && managedUrl.accessCount === 1;
      const shouldForceClean = force && managedUrl.type === 'temp';
      
      if (isOld || isUnused || shouldForceClean) {
        urlsToRevoke.push(url);
      }
    }
    
    // If we still have too many URLs, remove least recently accessed ones
    if (this.managedUrls.size > this.maxUrls * 0.8) {
      const sortedUrls = Array.from(this.managedUrls.entries())
        .filter(([_, managedUrl]) => !managedUrl.isRevoked && !urlsToRevoke.includes(managedUrl.url))
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const excessCount = Math.floor(this.managedUrls.size * 0.2);
      const oldestUrls = sortedUrls.slice(0, excessCount);
      
      oldestUrls.forEach(([url, _]) => {
        if (!urlsToRevoke.includes(url)) {
          urlsToRevoke.push(url);
        }
      });
    }
    
    // Perform the actual cleanup
    let cleanedCount = 0;
    urlsToRevoke.forEach(url => {
      if (this.revokeURL(url)) {
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`[URLManager] Cleaned up ${cleanedCount} URLs. Remaining: ${this.managedUrls.size}`);
    }
  }
  
  // Get statistics about managed URLs
  public getStats() {
    const now = Date.now();
    const stats = {
      total: this.managedUrls.size,
      byType: {} as Record<string, number>,
      byAge: {
        under1min: 0,
        under5min: 0,
        under10min: 0,
        over10min: 0
      },
      totalSize: 0,
      averageAccessCount: 0
    };
    
    let totalAccessCount = 0;
    
    for (const managedUrl of this.managedUrls.values()) {
      if (managedUrl.isRevoked) continue;
      
      // Count by type
      stats.byType[managedUrl.type] = (stats.byType[managedUrl.type] || 0) + 1;
      
      // Count by age
      const age = now - managedUrl.createdAt;
      if (age < 60 * 1000) stats.byAge.under1min++;
      else if (age < 5 * 60 * 1000) stats.byAge.under5min++;
      else if (age < 10 * 60 * 1000) stats.byAge.under10min++;
      else stats.byAge.over10min++;
      
      // Accumulate size and access count
      stats.totalSize += managedUrl.size || 0;
      totalAccessCount += managedUrl.accessCount;
    }
    
    stats.averageAccessCount = stats.total > 0 ? totalAccessCount / stats.total : 0;
    
    return stats;
  }
  
  // Force cleanup of all URLs
  public cleanup(): void {
    console.log(`[URLManager] Force cleanup requested. Revoking ${this.managedUrls.size} URLs.`);
    
    const allUrls = Array.from(this.managedUrls.keys());
    allUrls.forEach(url => this.revokeURL(url));
    
    this.managedUrls.clear();
  }
  
  // Dispose of the URL manager
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.cleanup();
  }
}

// Export singleton instance for easy access
export const urlManager = URLManager.getInstance();

// Helper functions for common operations
export const createManagedURL = (
  blob: Blob | File, 
  type: ManagedURL['type'], 
  fileId: string, 
  fileName?: string
) => urlManager.createURL(blob, type, fileId, fileName);

export const revokeManagedURL = (url: string) => urlManager.revokeURL(url);

export const revokeFileURLs = (fileId: string) => urlManager.revokeFileURLs(fileId);

export const getManagedFileURL = (fileId: string, type: ManagedURL['type']) => 
  urlManager.getFileURLByType(fileId, type);

export const getURLManagerStats = () => urlManager.getStats();