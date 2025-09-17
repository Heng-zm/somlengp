'use client';
import { Comment } from '@/types/comment-types';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

/**
 * Comment caching system for improved performance
 * Implements LRU cache with time-based expiration
 */
interface CacheEntry {
  data: Comment[];
  timestamp: number;
  pageId: string;
  sortBy: string;
}
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}
class CommentCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  private stats: CacheStats;
  constructor(maxSize = 50, ttlMinutes = 5) {
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.stats = { hits: 0, misses: 0, size: 0, maxSize };
  }
  /**
   * Generate cache key from pageId and sortBy
   */
  private generateKey(pageId: string, sortBy: string): string {
    return `${pageId}:${sortBy}`;
  }
  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.ttl;
  }
  /**
   * Implement LRU eviction when cache is full
   */
  private evictOldest(): void {
    if (this.cache.size >= this.maxSize) {
      let oldestKey: string | undefined;
      let oldestTimestamp = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }
  /**
   * Get cached comments if available and valid
   */
  get(pageId: string, sortBy: string): Comment[] | null {
    const key = this.generateKey(pageId, sortBy);
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    if (!this.isValid(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    // Move to end for LRU (re-insert)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.stats.hits++;
    return entry.data;
  }
  /**
   * Cache comments data
   */
  set(pageId: string, sortBy: string, comments: Comment[]): void {
    const key = this.generateKey(pageId, sortBy);
    // Evict oldest if cache is full
    this.evictOldest();
    const entry: CacheEntry = {
      data: structuredClone(comments), // Deep copy to prevent mutations
      timestamp: Date.now(),
      pageId,
      sortBy
    };
    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }
  /**
   * Invalidate cache for specific pageId
   */
  invalidate(pageId: string): void {
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (entry.pageId === pageId) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.size = this.cache.size;
  }
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0, maxSize: this.maxSize };
  }
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  /**
   * Get cache hit rate as percentage
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
  /**
   * Clean expired entries
   */
  cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.ttl) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.size = this.cache.size;
  }
  /**
   * Prefetch comments for common sort orders
   */
  async prefetch(
    pageId: string, 
    sortOrders: string[], 
    fetchFunction: (pageId: string, sortBy: string) => Promise<Comment[]>
  ): Promise<void> {
    const prefetchPromises = sortOrders.map(async (sortBy) => {
      const key = this.generateKey(pageId, sortBy);
      if (!this.cache.has(key)) {
        try {
          const comments = await fetchFunction(pageId, sortBy);
          this.set(pageId, sortBy, comments);
        } catch (error) {
        }
      }
    });
    await Promise.allSettled(prefetchPromises);
  }
}
// Global comment cache instance
export const commentCache = new CommentCache();
// Auto-cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    commentCache.cleanExpired();
  }, 5 * 60 * 1000);
}
/**
 * Enhanced comment utilities for optimization
 */
export const commentUtils = {
  /**
   * Deep compare two comment arrays for changes
   */
  commentsEqual(a: Comment[], b: Comment[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((commentA, index) => {
      const commentB = b[index];
      return (
        commentA.id === commentB.id &&
        commentA.content === commentB.content &&
        commentA.upvotes === commentB.upvotes &&
        commentA.downvotes === commentB.downvotes &&
        commentA.replies.length === commentB.replies.length &&
        this.commentsEqual(commentA.replies, commentB.replies)
      );
    });
  },
  /**
   * Calculate comment thread depth for performance optimization
   */
  getMaxDepth(comments: Comment[], currentDepth = 0): number {
    if (comments.length === 0) return currentDepth;
    return Math.max(
      currentDepth,
      ...comments.map(comment => 
        this.getMaxDepth(comment.replies, currentDepth + 1)
      )
    );
  },
  /**
   * Flatten nested comments for virtualization
   */
  flattenComments(comments: Comment[], level = 0): Array<Comment & { level: number }> {
    const flattened: Array<Comment & { level: number }> = [];
    for (const comment of comments) {
      flattened.push({ ...comment, level });
      if (comment.replies && comment.replies.length > 0) {
        flattened.push(...this.flattenComments(comment.replies, level + 1));
      }
    }
    return flattened;
  },
  /**
   * Sanitize comment content to prevent XSS
   */
  sanitizeContent(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
  /**
   * Extract mentions from comment content
   */
  extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  },
  /**
   * Calculate comment engagement score
   */
  calculateEngagementScore(comment: Comment): number {
    const voteScore = comment.upvotes - comment.downvotes;
    const replyScore = comment.replies.length * 2;
    const timeDecay = Math.max(0, 1 - (Date.now() - comment.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)); // 7 days
    return (voteScore + replyScore) * timeDecay;
  }
};
/**
 * Performance monitoring for comment system
 */
export class CommentPerformanceMonitor {
  private metrics = new Map<string, number[]>();
  startTiming(operation: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration);
    };
  }
  recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    const times = this.metrics.get(operation)!;
    times.push(duration);
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
  }
  getMetrics(operation: string): { avg: number; min: number; max: number; count: number } | null {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return null;
    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length
    };
  }
  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    for (const [operation, times] of this.metrics.entries()) {
      if (times.length > 0) {
        result[operation] = {
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length
        };
      }
    }
    return result;
  }
}
export const commentPerformanceMonitor = new CommentPerformanceMonitor();
