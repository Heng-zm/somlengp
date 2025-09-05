// Service Worker for Somleng - Advanced caching and offline support with image optimization
// Version 1.3.0

const CACHE_NAME = 'somleng-v1-3-0';
const RUNTIME_CACHE_NAME = 'somleng-runtime-v1-3-0';
const PERFORMANCE_CACHE_NAME = 'somleng-performance-v1-3-0';
const IMAGE_CACHE_NAME = 'somleng-images-v1-3-0';
const OPTIMIZED_IMAGE_CACHE_NAME = 'somleng-optimized-images-v1-3-0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  // Add critical CSS and JS paths here when known
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = [
  { pattern: /^https:\/\/api\./, strategy: 'networkFirst', ttl: 5 * 60 * 1000 }, // 5 minutes
  { pattern: /\/api\/auth/, strategy: 'networkOnly' }, // Never cache auth
  { pattern: /\/api\/user/, strategy: 'networkFirst', ttl: 10 * 60 * 1000 }, // 10 minutes
  { pattern: /\/api\/features/, strategy: 'staleWhileRevalidate', ttl: 30 * 60 * 1000 }, // 30 minutes
];

// Image caching patterns
const IMAGE_PATTERNS = [
  /\.(png|jpg|jpeg|gif|webp|avif|svg)$/,
  /_next\/image/,
  /placehold\.co/,
  /gstatic\.com/
];

// Performance monitoring data structure
let performanceData = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  backgroundSyncs: 0,
  imageOptimizations: 0,
  imageCacheHits: 0,
  totalImageSavings: 0,
  lastCleanup: Date.now()
};

// Image optimization configuration
const IMAGE_OPTIMIZATION_CONFIG = {
  quality: 80,
  formats: ['avif', 'webp', 'jpeg'],
  maxWidth: 1920,
  maxHeight: 1080,
  enableProgressive: true,
  cacheExpiry: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Utility functions
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function isImageRequest(request) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isApiRequest(request) {
  return request.url.includes('/api/') || 
         API_CACHE_PATTERNS.some(({ pattern }) => pattern.test(request.url));
}

function getApiCacheStrategy(request) {
  for (const { pattern, strategy, ttl } of API_CACHE_PATTERNS) {
    if (pattern.test(request.url)) {
      return { strategy, ttl };
    }
  }
  return { strategy: 'networkFirst', ttl: 5 * 60 * 1000 };
}

function isExpired(cachedResponse, ttl = 24 * 60 * 60 * 1000) {
  if (!cachedResponse) return true;
  
  const cachedDate = cachedResponse.headers.get('sw-cached-date');
  if (!cachedDate) return true;
  
  return Date.now() - new Date(cachedDate).getTime() > ttl;
}

function addCacheHeaders(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('sw-cached-date', new Date().toISOString());
  newHeaders.set('sw-cache-version', CACHE_NAME);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// Caching strategies
async function cacheFirst(request, cacheName = RUNTIME_CACHE_NAME) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse)) {
      performanceData.cacheHits++;
      return cachedResponse;
    }
    
    performanceData.cacheMisses++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, addCacheHeaders(networkResponse.clone()));
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    // Return cached version even if expired as fallback
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function networkFirst(request, cacheName = RUNTIME_CACHE_NAME, ttl) {
  try {
    performanceData.networkRequests++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, addCacheHeaders(networkResponse.clone()));
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Network first strategy failed, trying cache:', error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      performanceData.cacheHits++;
      return cachedResponse;
    }
    
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName = RUNTIME_CACHE_NAME, ttl) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Start network request in background
  const networkPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, addCacheHeaders(response.clone()));
      }
      return response;
    })
    .catch(() => null); // Ignore network errors for stale-while-revalidate
  
  // Return cached response immediately if available
  if (cachedResponse && !isExpired(cachedResponse, ttl)) {
    performanceData.cacheHits++;
    // Don't await the network request, let it complete in background
    networkPromise.catch(() => {}); // Prevent unhandled rejection
    return cachedResponse;
  }
  
  // If no cache or expired, wait for network
  performanceData.networkRequests++;
  const networkResponse = await networkPromise;
  
  if (networkResponse) {
    return networkResponse;
  }
  
  // Fallback to expired cache if network fails
  if (cachedResponse) {
    performanceData.cacheHits++;
    return cachedResponse;
  }
  
  throw new Error('No cached response available and network failed');
}

async function networkOnly(request) {
  performanceData.networkRequests++;
  return fetch(request);
}

// Advanced image optimization functions
function detectOptimalImageFormat() {
  // Check support for different image formats
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  
  try {
    // Try AVIF first (best compression)
    canvas.convertToBlob({ type: 'image/avif', quality: 0.8 })
      .then(() => {})
      .catch(() => {});
    return 'avif';
  } catch {
    try {
      // Fallback to WebP
      canvas.convertToBlob({ type: 'image/webp', quality: 0.8 });
      return 'webp';
    } catch {
      // Ultimate fallback to JPEG
      return 'jpeg';
    }
  }
}

async function optimizeImage(originalResponse, config = IMAGE_OPTIMIZATION_CONFIG) {
  try {
    const arrayBuffer = await originalResponse.arrayBuffer();
    const blob = new Blob([arrayBuffer]);
    
    // Create ImageBitmap from the original image
    const imageBitmap = await createImageBitmap(blob);
    const { width, height } = imageBitmap;
    
    // Calculate target dimensions
    let targetWidth = Math.min(width, config.maxWidth);
    let targetHeight = Math.min(height, config.maxHeight);
    
    // Maintain aspect ratio
    const aspectRatio = width / height;
    if (targetWidth / targetHeight > aspectRatio) {
      targetWidth = targetHeight * aspectRatio;
    } else {
      targetHeight = targetWidth / aspectRatio;
    }
    
    // Create canvas for optimization
    const canvas = new OffscreenCanvas(Math.round(targetWidth), Math.round(targetHeight));
    const ctx = canvas.getContext('2d');
    
    // Draw and resize image
    ctx.drawImage(imageBitmap, 0, 0, Math.round(targetWidth), Math.round(targetHeight));
    
    // Determine optimal format
    const optimalFormat = detectOptimalImageFormat();
    const mimeType = `image/${optimalFormat}`;
    
    // Convert to optimized blob
    const optimizedBlob = await canvas.convertToBlob({
      type: mimeType,
      quality: config.quality / 100
    });
    
    // Calculate savings
    const originalSize = arrayBuffer.byteLength;
    const optimizedSize = optimizedBlob.size;
    const savings = Math.max(0, originalSize - optimizedSize);
    
    performanceData.imageOptimizations++;
    performanceData.totalImageSavings += savings;
    
    // Create optimized response
    const optimizedResponse = new Response(optimizedBlob, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: {
        ...Object.fromEntries(originalResponse.headers.entries()),
        'content-type': mimeType,
        'content-length': optimizedBlob.size.toString(),
        'sw-optimized': 'true',
        'sw-original-size': originalSize.toString(),
        'sw-optimized-size': optimizedSize.toString(),
        'sw-savings': savings.toString()
      }
    });
    
    return optimizedResponse;
  } catch (error) {
    console.warn('Image optimization failed:', error);
    return originalResponse;
  }
}

async function optimizedImageCacheFirst(request) {
  try {
    // Check optimized cache first
    const optimizedCache = await caches.open(OPTIMIZED_IMAGE_CACHE_NAME);
    const cachedOptimized = await optimizedCache.match(request);
    
    if (cachedOptimized && !isExpired(cachedOptimized, IMAGE_OPTIMIZATION_CONFIG.cacheExpiry)) {
      performanceData.imageCacheHits++;
      return cachedOptimized;
    }
    
    // Check original image cache
    const imageCache = await caches.open(IMAGE_CACHE_NAME);
    const cachedOriginal = await imageCache.match(request);
    
    if (cachedOriginal && !isExpired(cachedOriginal, IMAGE_OPTIMIZATION_CONFIG.cacheExpiry)) {
      // Optimize cached original image
      const optimizedResponse = await optimizeImage(cachedOriginal);
      
      // Cache the optimized version
      optimizedCache.put(request, addCacheHeaders(optimizedResponse.clone()));
      
      return optimizedResponse;
    }
    
    // Fetch from network
    performanceData.networkRequests++;
    const networkResponse = await fetch(request);
    
    if (!networkResponse.ok) {
      return networkResponse;
    }
    
    // Cache original image
    imageCache.put(request, addCacheHeaders(networkResponse.clone()));
    
    // Optimize and cache
    const optimizedResponse = await optimizeImage(networkResponse);
    optimizedCache.put(request, addCacheHeaders(optimizedResponse.clone()));
    
    return optimizedResponse;
    
  } catch (error) {
    console.error('Optimized image cache failed:', error);
    // Fallback to regular caching
    return cacheFirst(request, IMAGE_CACHE_NAME);
  }
}

// Progressive image loading support
async function createProgressiveImageResponse(request) {
  try {
    const url = new URL(request.url);
    const quality = url.searchParams.get('q') || '80';
    const width = url.searchParams.get('w');
    const height = url.searchParams.get('h');
    
    // Generate low-quality placeholder first
    const placeholderConfig = {
      ...IMAGE_OPTIMIZATION_CONFIG,
      quality: 20,
      maxWidth: width ? Math.min(parseInt(width), 100) : 100,
      maxHeight: height ? Math.min(parseInt(height), 100) : 100
    };
    
    // This would implement progressive loading with multiple quality levels
    // For now, return optimized version
    return optimizedImageCacheFirst(request);
    
  } catch (error) {
    console.error('Progressive image loading failed:', error);
    return optimizedImageCacheFirst(request);
  }
}

// Background sync for performance data
async function sendPerformanceData() {
  try {
    const data = {
      ...performanceData,
      timestamp: Date.now(),
      url: self.location.href,
      swVersion: CACHE_NAME
    };
    
    await fetch('/api/performance/sw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    });
    
    // Reset performance data after successful send
    performanceData = {
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
      backgroundSyncs: performanceData.backgroundSyncs + 1,
      lastCleanup: performanceData.lastCleanup
    };
  } catch (error) {
    console.warn('Failed to send performance data:', error);
  }
}

// Cache management
async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('somleng-') && 
      name !== CACHE_NAME && 
      name !== RUNTIME_CACHE_NAME && 
      name !== PERFORMANCE_CACHE_NAME
    );
    
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    
    // Clean up expired entries in current caches
    const currentCaches = [RUNTIME_CACHE_NAME, PERFORMANCE_CACHE_NAME];
    
    for (const cacheName of currentCaches) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (isExpired(response, 7 * 24 * 60 * 60 * 1000)) { // 7 days default
          await cache.delete(request);
        }
      }
    }
    
    performanceData.lastCleanup = Date.now();
    console.log('Cache cleanup completed');
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

// Event handlers
self.addEventListener('install', event => {
  console.log('Service Worker installing:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('Installation failed:', error);
        throw error;
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating:', CACHE_NAME);
  
  event.waitUntil(
    Promise.all([
      cleanupOldCaches(),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  const request = event.request;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (isNavigationRequest(request)) {
    // For navigation requests, use network-first with offline fallback
    event.respondWith(
      networkFirst(request, CACHE_NAME)
        .catch(async () => {
          // Offline fallback to cached index page
          const cache = await caches.open(CACHE_NAME);
          const fallbackResponse = await cache.match('/');
          if (fallbackResponse) {
            return fallbackResponse;
          }
          
          // Ultimate fallback - minimal offline page
          return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Offline - Somleng</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: sans-serif; text-align: center; padding: 50px; }
                .offline { max-width: 400px; margin: 0 auto; }
                h1 { color: #333; }
                p { color: #666; margin: 20px 0; }
                button { 
                  background: #007bff; color: white; border: none; 
                  padding: 12px 24px; border-radius: 4px; cursor: pointer;
                }
                button:hover { background: #0056b3; }
              </style>
            </head>
            <body>
              <div class="offline">
                <h1>You're offline</h1>
                <p>Please check your internet connection and try again.</p>
                <button onclick="window.location.reload()">Retry</button>
              </div>
            </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
  } else if (isApiRequest(request)) {
    // Handle API requests with appropriate strategies
    const { strategy, ttl } = getApiCacheStrategy(request);
    
    let handler;
    switch (strategy) {
      case 'networkFirst':
        handler = networkFirst(request, RUNTIME_CACHE_NAME, ttl);
        break;
      case 'staleWhileRevalidate':
        handler = staleWhileRevalidate(request, RUNTIME_CACHE_NAME, ttl);
        break;
      case 'networkOnly':
        handler = networkOnly(request);
        break;
      default:
        handler = networkFirst(request, RUNTIME_CACHE_NAME, ttl);
    }
    
    event.respondWith(handler);
  } else if (isImageRequest(request)) {
    // Images use optimized cache-first strategy with automatic optimization
    event.respondWith(optimizedImageCacheFirst(request));
  } else if (url.pathname.startsWith('/_next/') || 
             url.pathname.startsWith('/static/')) {
    // Static assets use cache-first strategy
    event.respondWith(cacheFirst(request, CACHE_NAME));
  } else {
    // Other requests use stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE_NAME));
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_PERFORMANCE_DATA':
        event.ports[0].postMessage(performanceData);
        break;
      case 'CLEAR_CACHE':
        caches.delete(RUNTIME_CACHE_NAME)
          .then(() => event.ports[0].postMessage({ success: true }))
          .catch(error => event.ports[0].postMessage({ success: false, error }));
        break;
      case 'CLEANUP_CACHES':
        cleanupOldCaches()
          .then(() => event.ports[0].postMessage({ success: true }))
          .catch(error => event.ports[0].postMessage({ success: false, error }));
        break;
    }
  }
});

// Background sync for performance data (every 5 minutes)
self.addEventListener('sync', event => {
  if (event.tag === 'performance-sync') {
    event.waitUntil(sendPerformanceData());
  }
});

// Periodic background sync (if supported)
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
  // Schedule periodic cleanup and data sync
  setInterval(() => {
    const now = Date.now();
    
    // Send performance data every 5 minutes
    if (performanceData.cacheHits > 0 || performanceData.cacheMisses > 0) {
      sendPerformanceData();
    }
    
    // Cleanup caches every hour
    if (now - performanceData.lastCleanup > 60 * 60 * 1000) {
      cleanupOldCaches();
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// Push notification handler (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'open' || !action) {
    const url = data.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

console.log('Service Worker loaded:', CACHE_NAME);
