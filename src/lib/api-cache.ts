// Enhanced API utilities with caching and retry logic

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = (ttl || this.defaultTTL);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

const apiCache = new APICache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  apiCache.cleanup();
}, 5 * 60 * 1000);

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
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });

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

      console.warn(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
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

      console.warn(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, error);
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
      console.log('Cache hit for:', endpoint);
      return cached;
    }
  }

  try {
    const response = await fetchWithRetry(endpoint, fetchOptions, retryOptions);
    const data = await response.json();

    const result: APIResponse<T> = {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : (data.error || data.message || `HTTP ${response.status}`),
      status: response.status
    };

    // Cache successful responses
    if (useCache && result.success && (!fetchOptions.method || fetchOptions.method === 'GET')) {
      apiCache.set(cacheKey, result, cacheTTL);
      console.log('Cached response for:', endpoint);
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

/**
 * Preload profile data (useful for performance)
 */
export async function preloadProfile(authToken: string): Promise<void> {
  try {
    await profileAPI.getProfile(authToken);
    console.log('Profile data preloaded');
  } catch (error) {
    console.warn('Failed to preload profile data:', error);
  }
}