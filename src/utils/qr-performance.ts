// QR Scanner Performance Monitoring Utility

import { errorHandler, safeSync, MediaError, ValidationError, validateInput, commonValidations } from '@/lib/error-utils';

interface PerformanceMetrics {
  scanStartTime: number;
  scanEndTime: number;
  scanDuration: number;
  cameraInitTime: number;
  libraryLoadTime: number;
  scanAttempts: number;
  successfulScans: number;
  failedScans: number;
}

class QRPerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private scanStarted = false;
  private scanAttempts = 0;

  // Start timing camera initialization
  startCameraInit() {
    try {
      if (typeof performance === 'undefined' || !performance.now) {
        console.warn('Performance API not available');
        return;
      }
      this.metrics.cameraInitTime = performance.now();
    } catch (error) {
      errorHandler.handle(error, { method: 'startCameraInit' });
    }
  }

  // End timing camera initialization
  endCameraInit() {
    try {
      if (!this.metrics.cameraInitTime) {
        console.warn('Camera init timing was not started');
        return;
      }
      
      if (typeof performance === 'undefined' || !performance.now) {
        console.warn('Performance API not available');
        return;
      }
      
      const duration = performance.now() - this.metrics.cameraInitTime;
      if (duration >= 0) {
        console.log(`📷 Camera initialization took: ${duration.toFixed(2)}ms`);
        this.metrics.cameraInitTime = duration;
      } else {
        console.warn('Invalid camera init duration calculated');
      }
    } catch (error) {
      errorHandler.handle(error, { method: 'endCameraInit', hasStartTime: !!this.metrics.cameraInitTime });
    }
  }

  // Start timing library load
  startLibraryLoad() {
    try {
      if (typeof performance === 'undefined' || !performance.now) {
        console.warn('Performance API not available');
        return;
      }
      this.metrics.libraryLoadTime = performance.now();
    } catch (error) {
      errorHandler.handle(error, { method: 'startLibraryLoad' });
    }
  }

  // End timing library load
  endLibraryLoad() {
    try {
      if (!this.metrics.libraryLoadTime) {
        console.warn('Library load timing was not started');
        return;
      }
      
      if (typeof performance === 'undefined' || !performance.now) {
        console.warn('Performance API not available');
        return;
      }
      
      const duration = performance.now() - this.metrics.libraryLoadTime;
      if (duration >= 0) {
        console.log(`📚 Library load took: ${duration.toFixed(2)}ms`);
        this.metrics.libraryLoadTime = duration;
      } else {
        console.warn('Invalid library load duration calculated');
      }
    } catch (error) {
      errorHandler.handle(error, { method: 'endLibraryLoad', hasStartTime: !!this.metrics.libraryLoadTime });
    }
  }

  // Start scanning session
  startScanning() {
    try {
      if (typeof performance === 'undefined' || !performance.now) {
        console.warn('Performance API not available, scanning metrics may be inaccurate');
      }
      
      this.scanStarted = true;
      this.metrics.scanStartTime = performance?.now?.() || Date.now();
      this.scanAttempts = 0;
      console.log('🔍 Started QR scanning session');
    } catch (error) {
      errorHandler.handle(error, { method: 'startScanning' });
      // Continue with degraded functionality
      this.scanStarted = true;
      this.scanAttempts = 0;
    }
  }

  // Record a scan attempt
  recordScanAttempt() {
    try {
      if (this.scanStarted) {
        this.scanAttempts++;
      } else {
        console.warn('Scan attempt recorded before scanning session started');
      }
    } catch (error) {
      errorHandler.handle(error, { method: 'recordScanAttempt', scanStarted: this.scanStarted });
    }
  }

  // Record successful scan
  recordSuccessfulScan(qrData: string) {
    try {
      // Validate input
      validateInput(qrData, [
        commonValidations.required('QR data is required for metrics'),
        commonValidations.string('QR data must be a string')
      ], { method: 'recordSuccessfulScan' });
      
      if (!this.scanStarted) {
        console.warn('Successful scan recorded before scanning session started');
        return;
      }
      
      const now = performance?.now?.() || Date.now();
      this.metrics.scanEndTime = now;
      this.metrics.scanDuration = now - (this.metrics.scanStartTime || now);
      this.metrics.scanAttempts = this.scanAttempts;
      this.metrics.successfulScans = (this.metrics.successfulScans || 0) + 1;
      
      // Validate calculated metrics
      if (this.metrics.scanDuration < 0) {
        console.warn('Invalid scan duration calculated, using 0');
        this.metrics.scanDuration = 0;
      }
      
      console.log('✅ QR Scan Performance Metrics:');
      console.log(`   Duration: ${this.metrics.scanDuration.toFixed(2)}ms`);
      console.log(`   Attempts: ${this.scanAttempts}`);
      console.log(`   Data length: ${qrData.length} characters`);
      
      // Calculate scan rate safely
      const scanRate = this.metrics.scanDuration > 0 
        ? (this.scanAttempts / (this.metrics.scanDuration / 1000))
        : 0;
      console.log(`   Scan rate: ${scanRate.toFixed(2)} attempts/second`);
      
      // Send to analytics if available
      this.sendAnalytics('qr_scan_success', {
        duration: this.metrics.scanDuration,
        attempts: this.scanAttempts,
        dataLength: qrData.length,
        scanRate
      });
      
      this.resetScanning();
    } catch (error) {
      errorHandler.handle(error, { 
        method: 'recordSuccessfulScan', 
        scanStarted: this.scanStarted,
        dataLength: qrData?.length || 0
      });
    }
  }

  // Record failed scan session
  recordFailedScan(reason?: string) {
    try {
      if (!this.scanStarted) {
        console.warn('Failed scan recorded before scanning session started');
        return;
      }
      
      this.metrics.failedScans = (this.metrics.failedScans || 0) + 1;
      console.log('❌ QR scan session failed', reason ? `- ${reason}` : '');
      
      // Calculate duration safely
      const now = performance?.now?.() || Date.now();
      const duration = this.metrics.scanStartTime ? now - this.metrics.scanStartTime : 0;
      
      // Send to analytics if available
      this.sendAnalytics('qr_scan_failure', {
        attempts: this.scanAttempts,
        duration: Math.max(0, duration),
        reason: reason || 'unknown'
      });
    } catch (error) {
      errorHandler.handle(error, { 
        method: 'recordFailedScan',
        scanStarted: this.scanStarted,
        reason
      });
    }
  }

  // Reset scanning state
  private resetScanning() {
    try {
      this.scanStarted = false;
      this.scanAttempts = 0;
    } catch (error) {
      errorHandler.handle(error, { method: 'resetScanning' });
      // Force reset even if error occurs
      this.scanStarted = false;
      this.scanAttempts = 0;
    }
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    try {
      return { ...this.metrics };
    } catch (error) {
      errorHandler.handle(error, { method: 'getMetrics' });
      return {}; // Return empty metrics if error
    }
  }

  // Send metrics to analytics (placeholder for future implementation)
  private sendAnalytics(event: string, data: Record<string, any>) {
    try {
      // Validate inputs
      if (!event || typeof event !== 'string') {
        console.warn('Invalid analytics event name');
        return;
      }
      
      if (!data || typeof data !== 'object') {
        console.warn('Invalid analytics data');
        return;
      }
      
      // In production, this could send to Google Analytics, Mixpanel, etc.
      if (typeof window !== 'undefined' && (window as any).gtag) {
        try {
          (window as any).gtag('event', event, {
            custom_parameter: JSON.stringify(data)
          });
        } catch (gtagError) {
          console.warn('Failed to send gtag analytics:', gtagError);
        }
      }
      
      // For now, just log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Analytics Event: ${event}`, data);
      }
    } catch (error) {
      errorHandler.handle(error, { 
        method: 'sendAnalytics', 
        event, 
        dataKeys: Object.keys(data || {}) 
      });
    }
  }

  // Record memory usage (if available)
  recordMemoryUsage() {
    try {
      if (typeof window === 'undefined') {
        console.log('💾 Memory usage not available (not in browser environment)');
        return null;
      }
      
      if (!('performance' in window) || !('memory' in (window.performance as any))) {
        console.log('💾 Memory usage API not available in this browser');
        return null;
      }
      
      const memory = (window.performance as any).memory;
      
      // Validate memory object
      if (!memory || typeof memory !== 'object') {
        console.warn('Invalid memory object');
        return null;
      }
      
      const memoryData = {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0,
        limit: memory.jsHeapSizeLimit || 0
      };
      
      // Validate memory values
      if (memoryData.used < 0 || memoryData.total < 0 || memoryData.limit < 0) {
        console.warn('Invalid memory values detected');
        return null;
      }
      
      console.log('💾 Memory Usage:');
      console.log(`   Used: ${(memoryData.used / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Total: ${(memoryData.total / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Limit: ${(memoryData.limit / 1024 / 1024).toFixed(2)} MB`);
      
      return memoryData;
    } catch (error) {
      errorHandler.handle(error, { method: 'recordMemoryUsage' });
      return null;
    }
  }

  // Reset all metrics
  reset() {
    try {
      this.metrics = {};
      this.scanStarted = false;
      this.scanAttempts = 0;
      console.log('📊 Performance metrics reset');
    } catch (error) {
      errorHandler.handle(error, { method: 'reset' });
      // Force reset even if error occurs
      this.metrics = {};
      this.scanStarted = false;
      this.scanAttempts = 0;
    }
  }
}

// Export singleton instance
export const qrPerformanceMonitor = new QRPerformanceMonitor();

// Export utility functions
export const trackCameraInit = (fn: () => Promise<void>) => {
  return async () => {
    try {
      if (typeof fn !== 'function') {
        throw new ValidationError('trackCameraInit requires a function parameter');
      }
      
      qrPerformanceMonitor.startCameraInit();
      
      try {
        await fn();
        qrPerformanceMonitor.endCameraInit();
      } catch (error) {
        qrPerformanceMonitor.endCameraInit();
        // Re-throw as MediaError if it's camera-related
        if (error instanceof Error && (error.name.includes('NotAllowed') || error.message.includes('camera') || error.message.includes('permission'))) {
          throw new MediaError('Camera initialization failed', { originalError: error.message });
        }
        throw error;
      }
    } catch (error) {
      errorHandler.handle(error, { function: 'trackCameraInit' });
      throw error;
    }
  };
};

export const trackLibraryLoad = () => {
  try {
    qrPerformanceMonitor.startLibraryLoad();
    
    return () => {
      try {
        qrPerformanceMonitor.endLibraryLoad();
      } catch (error) {
        errorHandler.handle(error, { function: 'trackLibraryLoad.end' });
      }
    };
  } catch (error) {
    errorHandler.handle(error, { function: 'trackLibraryLoad.start' });
    // Return a no-op function if initialization fails
    return () => {};
  }
};

export const trackScanningSession = (fn: () => void) => {
  try {
    if (typeof fn !== 'function') {
      throw new ValidationError('trackScanningSession requires a function parameter');
    }
    
    qrPerformanceMonitor.startScanning();
    
    try {
      fn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scanning error';
      qrPerformanceMonitor.recordFailedScan(errorMessage);
      throw error;
    }
  } catch (error) {
    errorHandler.handle(error, { function: 'trackScanningSession' });
    throw error;
  }
};
