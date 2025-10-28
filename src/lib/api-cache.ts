// Enhanced API utilities with persistent caching, LRU, and retry logic
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}
class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder: string[] = []; // LRU
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxEntries = 300; // cap cache size
  private readonly storageKey = 'apiCache.v1';
  private cleanupTimer?: number;

  constructor() {
    this.hydrateFromStorage();
    // Periodic cleanup using requestIdleCallback when available
    const schedule = () => {
      const idle: any = (globalThis as any).requestIdleCallback;
      if (typeof idle === 'function') {
        this.cleanupTimer = idle(() => this.cleanup(), { timeout: 60_000 });
      } else {
        this.cleanupTimer = (setTimeout(() => this.cleanup(), 60_000) as unknown) as number;
      }
    };
    schedule();
  }

  private persistToStorage(): void {
    try {
      const serializable: Record<string, CacheEntry<any>> = {};
      for (const [k, v] of this.cache.entries()) serializable[k] = v;
      localStorage.setItem(this.storageKey, JSON.stringify(serializable));
    } catch (e) {
      // ignore persistence errors (quota, privacy mode)
    }
  }

  private hydrateFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, CacheEntry<any>>;
      const now = Date.now();
      for (const [k, v] of Object.entries(parsed)) {
        if (v && typeof v === 'object' && now <= (v.expiry || 0)) {
          this.cache.set(k, v);
          this.touch(k);
        }
      }
    } catch (e) {
      // ignore hydration errors (corrupted data)
    }
  }

  private touch(key: string): void {
    const idx = this.accessOrder.indexOf(key);
    if (idx !== -1) this.accessOrder.splice(idx, 1);
    this.accessOrder.push(key);
  }

  private evictIfNeeded(): void {
    while (this.cache.size > this.maxEntries) {
      const oldest = this.accessOrder.shift();
      if (oldest) this.cache.delete(oldest);
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = ttl ?? this.defaultTTL;
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), expiry: Date.now() + expiry };
    this.cache.set(key, entry);
    this.touch(key);
    this.evictIfNeeded();
    this.persistToStorage();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.persistToStorage();
      return null;
    }
    this.touch(key);
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.persistToStorage();
      return false;
    }
    this.touch(key);
    return true;
  }

  delete(key: string): void {
    if (this.cache.delete(key)) this.persistToStorage();
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    try { localStorage.removeItem(this.storageKey); } catch (e) { /* noop */ }
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    let mutated = false;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        mutated = true;
      }
    }
    if (mutated) this.persistToStorage();
  }
}
const apiCache = new APICache();

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryCondition?: (error: any, response?: Response) => boolean;
}
/**
 * Enhanced fetch with retry logic and exponential backoff
 */
async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = (error, response) => {
      if (error) return true;
      if (!response) return true;
      // Retry on 5xx errors and 429 (rate limit)
      return response.status >= 500 || response.status === 429;
    }
  } = retryOptions;
  let lastError: any;
  let lastResponse: Response | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = (options as any).timeout ?? 10_000;
      const to = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': (options.body instanceof FormData) ? undefined as any : 'application/json',
          ...options.headers,
        }
      });
      clearTimeout(to);
      // If successful or not retryable, return the response
      if (response.ok || !retryCondition(null, response)) {
        return response;
      }
      lastResponse = response;
      // If this is the last attempt, don't wait
      if (attempt === maxRetries) break;
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      console.warn(`Request failed for ${url}, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error;
      // If this is the last attempt or error is not retryable, throw
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error;
      }
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );
      console.error(`Request error for ${url}, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  // If we get here, all retries failed
  if (lastError) throw lastError;
  if (lastResponse) return lastResponse;
  throw new Error('Max retries exceeded');
}
/**
 * Enhanced API request with caching, retry logic, and better error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & {
    useCache?: boolean;
    cacheTTL?: number;
    retryOptions?: RetryOptions;
  } = {}
): Promise<APIResponse<T>> {
  const { useCache = false, cacheTTL, retryOptions, ...fetchOptions } = options;
  // Generate cache key from endpoint and relevant options
  const cacheKey = useCache ? `${endpoint}-${JSON.stringify({
    method: fetchOptions.method || 'GET',
    body: fetchOptions.body,
    headers: fetchOptions.headers
  })}` : '';
  // Check cache first (only for GET requests)
  if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const cached = apiCache.get<APIResponse<T>>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  try {
    const response = await fetchWithRetry(endpoint, fetchOptions, retryOptions);
    const data = await response.json().catch(() => ({}));
    const result: APIResponse<T> = {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : (data.error || data.message || `HTTP ${response.status}`),
      status: response.status
    };
    // Cache successful responses
    if (useCache && result.success && (!fetchOptions.method || fetchOptions.method === 'GET')) {
      apiCache.set(cacheKey, result, cacheTTL);
    } else if (!result.success && (response.status === 304)) {
      // If not modified, try to return cached
      const cached = apiCache.get<APIResponse<T>>(cacheKey);
      if (cached) return cached;
    }
    return result;
  } catch (error) {
    console.error('API request failed:', endpoint, error);
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    return {
      success: false,
      error: errorMessage
    };
  }
}
/**
 * Profile-specific API functions with enhanced error handling
 */
export const profileAPI = {
  /**
   * Get user profile with caching
   */
  async getProfile(authToken: string): Promise<APIResponse<any>> {
    return apiRequest('/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      useCache: true,
      cacheTTL: 2 * 60 * 1000, // 2 minutes for profile data
      retryOptions: {
        maxRetries: 2,
        retryCondition: (error, response) => {
          // Don't retry on auth errors
          if (response?.status === 401 || response?.status === 403) {
            return false;
          }
          return true;
        }
      }
    });
  },
  /**
   * Update user profile with optimistic updates
   */
  async updateProfile(
    authToken: string, 
    updates: Record<string, any>
  ): Promise<APIResponse<any>> {
    // Invalidate cache before making the request
    const cachePattern = '/api/user/profile-GET-';
    apiCache.clear(); // Simple approach - clear all cache
    const result = await apiRequest('/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updates),
      retryOptions: {
        maxRetries: 2,
        retryCondition: (error, response) => {
          // Don't retry on client errors
          if (response && response.status >= 400 && response.status < 500) {
            return false;
          }
          return true;
        }
      }
    });
    return result;
  },
  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    authToken: string, 
    file: File
  ): Promise<APIResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/api/user/profile/picture', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
        // Don't set Content-Type for FormData
      },
      body: formData,
      retryOptions: {
        maxRetries: 1, // File uploads are expensive, fewer retries
        retryCondition: (error, response) => {
          // Don't retry on client errors or file too large
          if (response && response.status >= 400 && response.status < 500) {
            return false;
          }
          return true;
        }
      }
    });
  }
};
/**
 * Clear API cache (useful for logout or testing)
 */
export function clearAPICache(): void {
  apiCache.clear();
}

// Expose low-level cache for advanced usage
export const __apiCacheInternal = apiCache;
/**
 * Preload profile data (useful for performance)
 */
export async function preloadProfile(authToken: string): Promise<void> {
  try {
    await profileAPI.getProfile(authToken);
  } catch (error) {
    // swallow preload errors to avoid impacting UX
  }
}
