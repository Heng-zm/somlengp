'use client';
// Service Worker registration and management
interface ServiceWorkerConfig {
  swUrl: string;
  enablePerformanceMonitoring: boolean;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  updateCheckInterval: number; // in milliseconds
  showUpdateToast: boolean;
}
interface SwPerformanceData {
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  backgroundSyncs: number;
  lastCleanup: number;
}
interface SwMessage {
  type: string;
  payload?: any;
}
const DEFAULT_CONFIG: ServiceWorkerConfig = {
  swUrl: '/sw.js',
  enablePerformanceMonitoring: true,
  enableBackgroundSync: true,
  enablePushNotifications: false,
  updateCheckInterval: 60 * 60 * 1000, // 1 hour
  showUpdateToast: true,
};
class ServiceWorkerManager {
  private config: ServiceWorkerConfig;
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private isSupported = false;
  private callbacks: Map<string, ((data?: any) => void)[]> = new Map();
  constructor(config: Partial<ServiceWorkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isSupported = 'serviceWorker' in navigator;
    if (this.isSupported && typeof window !== 'undefined') {
      this.initialize();
    }
  }
  private async initialize() {
    try {
      await this.register();
      this.setupEventListeners();
      this.startUpdateChecks();
      if (this.config.enableBackgroundSync) {
        this.setupBackgroundSync();
      }
    } catch (error) {
      console.error('Failed to initialize Service Worker:', error);
    }
  }
  private async register(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported) {
      throw new Error('Service Workers not supported');
    }
    try {
      this.registration = await navigator.serviceWorker.register(this.config.swUrl, {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });
      // Handle registration events
      this.registration.addEventListener('updatefound', () => {
        const installingWorker = this.registration!.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Update available
                this.handleUpdateAvailable();
              } else {
                // First time installation
                this.handleFirstInstall();
              }
            }
          });
        }
      });
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }
  private setupEventListeners() {
    if (!this.isSupported) return;
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });
    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.emit('controller-changed');
      // Reload page if user accepts update
      if (this.config.showUpdateToast) {
        window.location.reload();
      }
    });
  }
  private setupBackgroundSync() {
    if (!this.registration) return;
    // Register periodic background sync for performance data
    if ('sync' in this.registration) {
      (this.registration.sync as any).register('performance-sync').catch(console.warn);
    }
  }
  private startUpdateChecks() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }
    this.updateCheckInterval = setInterval(async () => {
      await this.checkForUpdates();
    }, this.config.updateCheckInterval);
  }
  public async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;
    try {
      await this.registration.update();
      return true;
    } catch (error) {
      return false;
    }
  }
  private handleUpdateAvailable() {
    this.emit('update-available');
    if (this.config.showUpdateToast) {
      this.showUpdateToast();
    }
  }
  private handleFirstInstall() {
    this.emit('first-install');
  }
  private showUpdateToast() {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 300px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
      ">
        <span>App update available!</span>
        <button onclick="this.parentElement.parentElement.remove(); window.swManager?.applyUpdate()" 
                style="
                  background: rgba(255,255,255,0.2);
                  border: none;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 12px;
                ">
          Update
        </button>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="
                  background: transparent;
                  border: none;
                  color: white;
                  padding: 4px;
                  cursor: pointer;
                  font-size: 16px;
                  line-height: 1;
                ">
          ×
        </button>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    document.body.appendChild(toast);
    // Auto remove after 10 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 10000);
  }
  private handleMessage(message: SwMessage) {
    this.emit('message', message);
  }
  private emit(eventName: string, data?: any) {
    const callbacks = this.callbacks.get(eventName) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventName} callback:`, error);
      }
    });
  }
  // Public methods
  public on(eventName: string, callback: (data?: any) => void): () => void {
    if (!this.callbacks.has(eventName)) {
      this.callbacks.set(eventName, []);
    }
    this.callbacks.get(eventName)!.push(callback);
    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(eventName);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
  public async applyUpdate(): Promise<void> {
    if (!this.registration || !this.registration.waiting) return;
    // Tell the waiting service worker to skip waiting
    this.sendMessage({ type: 'SKIP_WAITING' });
  }
  public sendMessage(message: SwMessage): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }
  public async getPerformanceData(): Promise<SwPerformanceData | null> {
    if (!navigator.serviceWorker.controller) return null;
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      navigator.serviceWorker.controller!.postMessage(
        { type: 'GET_PERFORMANCE_DATA' },
        [channel.port2]
      );
      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }
  public async clearCache(): Promise<boolean> {
    if (!navigator.serviceWorker.controller) return false;
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.success || false);
      };
      navigator.serviceWorker.controller!.postMessage(
        { type: 'CLEAR_CACHE' },
        [channel.port2]
      );
      setTimeout(() => resolve(false), 10000);
    });
  }
  public async cleanupCaches(): Promise<boolean> {
    if (!navigator.serviceWorker.controller) return false;
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.success || false);
      };
      navigator.serviceWorker.controller!.postMessage(
        { type: 'CLEANUP_CACHES' },
        [channel.port2]
      );
      setTimeout(() => resolve(false), 10000);
    });
  }
  public isInstalled(): boolean {
    return !!navigator.serviceWorker?.controller;
  }
  public isUpdateAvailable(): boolean {
    return !!(this.registration?.waiting);
  }
  public async requestPushPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Push notifications not supported');
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && this.registration) {
      // Subscribe to push notifications
      try {
        const subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          // Add your VAPID public key here
          // applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        this.emit('push-subscribed', subscription);
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
      }
    }
    return permission;
  }
  public updateConfig(newConfig: Partial<ServiceWorkerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Restart update checks if interval changed
    if (newConfig.updateCheckInterval !== undefined) {
      this.startUpdateChecks();
    }
  }
  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
  public cleanup(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
    this.callbacks.clear();
  }
}
// Singleton instance
let serviceWorkerManager: ServiceWorkerManager | null = null;
export function getServiceWorkerManager(config?: Partial<ServiceWorkerConfig>): ServiceWorkerManager {
  if (!serviceWorkerManager && typeof window !== 'undefined') {
    serviceWorkerManager = new ServiceWorkerManager(config);
    // Make it globally accessible for the update toast
    (window as any).swManager = serviceWorkerManager;
  }
  return serviceWorkerManager!;
}
// React hook for service worker management
export function useServiceWorker() {
  const manager = getServiceWorkerManager();
  return {
    isSupported: 'serviceWorker' in navigator,
    isInstalled: manager?.isInstalled() || false,
    isUpdateAvailable: manager?.isUpdateAvailable() || false,
    applyUpdate: () => manager?.applyUpdate(),
    checkForUpdates: () => manager?.checkForUpdates(),
    getPerformanceData: () => manager?.getPerformanceData(),
    clearCache: () => manager?.clearCache(),
    cleanupCaches: () => manager?.cleanupCaches(),
    requestPushPermission: () => manager?.requestPushPermission(),
    on: (eventName: string, callback: (data?: any) => void) => manager?.on(eventName, callback),
    sendMessage: (message: SwMessage) => manager?.sendMessage(message),
    updateConfig: (config: Partial<ServiceWorkerConfig>) => manager?.updateConfig(config),
  };
}
// Utility functions
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}
export function isCacheApiSupported(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}
export function isPushApiSupported(): boolean {
  return typeof window !== 'undefined' && 'PushManager' in window;
}
export function isBackgroundSyncSupported(): boolean {
  return typeof window !== 'undefined' && 
         'serviceWorker' in navigator && 
         'sync' in window.ServiceWorkerRegistration.prototype;
}
// Initialize service worker on import (only in production)
// Memory leak prevention: Event listeners need cleanup, Timers need cleanup
// Add cleanup in useEffect return function

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  getServiceWorkerManager();
}
export { ServiceWorkerManager, type ServiceWorkerConfig, type SwPerformanceData, type SwMessage };


// TODO: Memory leak fix needed - Add cleanup for event listeners:
// useEffect(() => {
//   const cleanup = () => {
//     // Add removeEventListener calls here
//   };
//   return cleanup;
// }, []);