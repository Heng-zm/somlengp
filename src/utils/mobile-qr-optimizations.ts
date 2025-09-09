/**
 * Mobile-specific QR Scanner Optimizations
 * Handles device orientation, touch-to-focus, and mobile camera constraints
 */

interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTablet: boolean;
  screenSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  hasGyroscope: boolean;
  hasTouchscreen: boolean;
}

interface TouchFocusPoint {
  x: number;
  y: number;
  timestamp: number;
}

class MobileQROptimizer {
  private deviceInfo: DeviceInfo;
  private orientationListeners: Set<(orientation: string) => void> = new Set();
  private focusPoints: TouchFocusPoint[] = [];
  private lastFocusAttempt = 0;
  private focusDebounceMs = 500;

  constructor() {
    this.deviceInfo = this.detectDevice();
    this.setupOrientationListener();
    this.setupVisibilityListener();
  }

  /**
   * Detect device capabilities and characteristics
   */
  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent);
    
    // Detect screen size
    const screenWidth = Math.min(screen.width, screen.height);
    let screenSize: 'small' | 'medium' | 'large' = 'medium';
    if (screenWidth < 360) screenSize = 'small';
    else if (screenWidth > 768) screenSize = 'large';
    
    // Detect orientation
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    
    // Get pixel ratio
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Check for sensors
    const hasGyroscope = 'DeviceOrientationEvent' in window;
    const hasTouchscreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      isMobile,
      isIOS,
      isAndroid,
      isTablet,
      screenSize,
      orientation,
      pixelRatio,
      hasGyroscope,
      hasTouchscreen
    };
  }

  /**
   * Get mobile-optimized camera constraints
   */
  getMobileConstraints(): MediaTrackConstraints {
    const baseConstraints: MediaTrackConstraints = {
      facingMode: 'environment',
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 }
    };

    // iOS specific optimizations
    if (this.deviceInfo.isIOS) {
      return {
        ...baseConstraints,
        // iOS prefers these specific resolutions
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 30 }
        // Note: focusMode, exposureMode, whiteBalanceMode are not standard MediaTrackConstraints
        // They might work on some browsers but should be handled via MediaStreamTrack.applyConstraints()
      };
    }

    // Android specific optimizations  
    if (this.deviceInfo.isAndroid) {
      return {
        ...baseConstraints,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 24 }, // More conservative for Android
        aspectRatio: { ideal: 16/9 }
      };
    }

    // Tablet optimizations
    if (this.deviceInfo.isTablet) {
      return {
        ...baseConstraints,
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30 }
      };
    }

    // Small screen optimizations
    if (this.deviceInfo.screenSize === 'small') {
      return {
        ...baseConstraints,
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 20 } // Lower frame rate for performance
      };
    }

    return baseConstraints;
  }

  /**
   * Setup orientation change listener
   */
  private setupOrientationListener(): void {
    if (!this.deviceInfo.isMobile) return;

    const handleOrientationChange = () => {
      // Debounce orientation changes
      setTimeout(() => {
        const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        if (newOrientation !== this.deviceInfo.orientation) {
          this.deviceInfo.orientation = newOrientation;
          this.notifyOrientationChange(newOrientation);
        }
      }, 100);
    };

    // Listen for orientation changes
    if ('onorientationchange' in window) {
      window.addEventListener('orientationchange', handleOrientationChange);
    }
    window.addEventListener('resize', handleOrientationChange);
  }

  /**
   * Setup visibility change listener to pause/resume scanning
   */
  private setupVisibilityListener(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // Page is hidden, could pause scanning to save battery
          this.notifyVisibilityChange('hidden');
        } else {
          // Page is visible, resume scanning
          this.notifyVisibilityChange('visible');
        }
      });
    }
  }

  /**
   * Add orientation change listener
   */
  onOrientationChange(callback: (orientation: string) => void): () => void {
    this.orientationListeners.add(callback);
    return () => this.orientationListeners.delete(callback);
  }

  /**
   * Notify orientation change listeners
   */
  private notifyOrientationChange(orientation: string): void {
    this.orientationListeners.forEach(callback => {
      try {
        callback(orientation);
      } catch (error) {
        console.warn('Orientation change callback error:', error);
      }
    });
  }

  /**
   * Notify visibility change (placeholder for future implementation)
   */
  private notifyVisibilityChange(state: 'visible' | 'hidden'): void {
    // Could emit events or call callbacks here
    console.log(`📱 Page visibility changed: ${state}`);
  }

  /**
   * Handle touch-to-focus functionality
   */
  async handleTouchFocus(
    x: number, 
    y: number, 
    videoElement: HTMLVideoElement,
    stream: MediaStream
  ): Promise<boolean> {
    if (!this.deviceInfo.hasTouchscreen || !stream) {
      return false;
    }

    const now = Date.now();
    
    // Debounce focus attempts
    if (now - this.lastFocusAttempt < this.focusDebounceMs) {
      return false;
    }
    this.lastFocusAttempt = now;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return false;

      const capabilities = videoTrack.getCapabilities();
      
      // Check if focus is supported (with type assertion for non-standard properties)
      const extendedCapabilities = capabilities as any;
      if (!extendedCapabilities.focusMode || !extendedCapabilities.focusMode.includes('manual')) {
        console.log('📱 Manual focus not supported on this device');
        return false;
      }

      // Convert touch coordinates to video coordinates
      const rect = videoElement.getBoundingClientRect();
      const videoX = (x - rect.left) / rect.width;
      const videoY = (y - rect.top) / rect.height;

      // Clamp coordinates
      const clampedX = Math.max(0, Math.min(1, videoX));
      const clampedY = Math.max(0, Math.min(1, videoY));

      // Store focus point
      this.focusPoints.push({
        x: clampedX,
        y: clampedY,
        timestamp: now
      });

      // Keep only recent focus points
      this.focusPoints = this.focusPoints.filter(p => now - p.timestamp < 5000);

      // Apply focus constraints (using type assertion for non-standard properties)
      await videoTrack.applyConstraints({
        advanced: [{
          focusMode: 'manual',
          pointsOfInterest: [{ x: clampedX, y: clampedY }]
        } as any]
      });

      console.log(`📱 Touch focus applied at (${clampedX.toFixed(2)}, ${clampedY.toFixed(2)})`);
      return true;

    } catch (error) {
      console.warn('Touch focus failed:', error);
      return false;
    }
  }

  /**
   * Get optimal scan region for mobile devices
   */
  getMobileScanRegion(videoWidth: number, videoHeight: number): {
    x: number; y: number; width: number; height: number;
  } {
    // Mobile devices often have QR codes in the center
    const centerX = videoWidth / 2;
    const centerY = videoHeight / 2;

    let regionSize: number;
    
    if (this.deviceInfo.screenSize === 'small') {
      // Smaller region for small screens to improve performance
      regionSize = Math.min(videoWidth, videoHeight) * 0.7;
    } else if (this.deviceInfo.isTablet) {
      // Larger region for tablets
      regionSize = Math.min(videoWidth, videoHeight) * 0.8;
    } else {
      // Standard mobile region
      regionSize = Math.min(videoWidth, videoHeight) * 0.75;
    }

    // Adjust for orientation
    if (this.deviceInfo.orientation === 'landscape') {
      regionSize *= 0.9; // Slightly smaller in landscape
    }

    return {
      x: centerX - regionSize / 2,
      y: centerY - regionSize / 2,
      width: regionSize,
      height: regionSize
    };
  }

  /**
   * Get mobile-optimized scan interval
   */
  getMobileScanInterval(): number {
    let baseInterval = 300; // 300ms base

    // Adjust based on device performance characteristics
    if (this.deviceInfo.screenSize === 'small') {
      baseInterval = 400; // Slower for small devices
    } else if (this.deviceInfo.isTablet) {
      baseInterval = 250; // Faster for tablets
    }

    // Adjust for pixel ratio (high DPI devices)
    if (this.deviceInfo.pixelRatio > 2) {
      baseInterval += 50; // Slightly slower for high DPI
    }

    // Adjust for orientation (landscape might be more resource intensive)
    if (this.deviceInfo.orientation === 'landscape') {
      baseInterval += 25;
    }

    return baseInterval;
  }

  /**
   * Check if device supports advanced camera features
   */
  getAdvancedCameraSupport(): {
    manualFocus: boolean;
    exposureCompensation: boolean;
    iso: boolean;
    torch: boolean;
    zoom: boolean;
  } {
    // This would need to be checked against actual stream capabilities
    // For now, return estimated support based on device type
    return {
      manualFocus: this.deviceInfo.isIOS || this.deviceInfo.isAndroid,
      exposureCompensation: this.deviceInfo.isIOS,
      iso: false, // Rarely supported in web
      torch: this.deviceInfo.isAndroid, // More common on Android
      zoom: this.deviceInfo.isIOS || this.deviceInfo.isTablet
    };
  }

  /**
   * Get current device info
   */
  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  /**
   * Handle device motion for stability detection
   */
  onDeviceMotion(callback: (stability: 'stable' | 'moving' | 'shaking') => void): () => void {
    if (!this.deviceInfo.hasGyroscope) {
      return () => {}; // No-op cleanup function
    }

    let lastAcceleration: { x: number; y: number; z: number } | null = null;
    const stabilityBuffer: number[] = [];

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const x = acceleration.x ?? 0;
      const y = acceleration.y ?? 0;
      const z = acceleration.z ?? 0;

      if (lastAcceleration) {
        const deltaX = Math.abs(x - lastAcceleration.x);
        const deltaY = Math.abs(y - lastAcceleration.y);
        const deltaZ = Math.abs(z - lastAcceleration.z);
        const totalDelta = deltaX + deltaY + deltaZ;

        stabilityBuffer.push(totalDelta);
        if (stabilityBuffer.length > 10) {
          stabilityBuffer.shift();
        }

        const avgDelta = stabilityBuffer.reduce((a, b) => a + b, 0) / stabilityBuffer.length;
        
        let stability: 'stable' | 'moving' | 'shaking';
        if (avgDelta < 0.5) stability = 'stable';
        else if (avgDelta < 2) stability = 'moving';
        else stability = 'shaking';

        callback(stability);
      }

      lastAcceleration = { x, y, z };
    };

    window.addEventListener('devicemotion', handleDeviceMotion);

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }
}

// Export singleton instance
export const mobileQROptimizer = new MobileQROptimizer();

// Export utility functions
export const isMobileDevice = () => mobileQROptimizer.getDeviceInfo().isMobile;
export const isIOSDevice = () => mobileQROptimizer.getDeviceInfo().isIOS;
export const isAndroidDevice = () => mobileQROptimizer.getDeviceInfo().isAndroid;
export const getCurrentOrientation = () => mobileQROptimizer.getDeviceInfo().orientation;
export const getScreenSize = () => mobileQROptimizer.getDeviceInfo().screenSize;
