/**
 * React Hook for QR Scanner Web Worker
 * Manages Web Worker lifecycle and provides enhanced QR scanning capabilities
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface QRScanOptions {
  inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
  locateOptions?: {
    skipUntilFound?: boolean;
    assumeSquare?: boolean;
    centerROI?: boolean;
    maxFinderPatternStdDev?: number;
  };
}

interface QRCodeResult {
  data: string;
  location: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
    topLeftFinderPattern: { x: number; y: number };
    topRightFinderPattern: { x: number; y: number };
    bottomLeftFinderPattern: { x: number; y: number };
    bottomRightAlignmentPattern?: { x: number; y: number };
  };
  binaryData: number[];
}

interface QRWorkerMessage {
  type: 'scan' | 'init' | 'destroy';
  data?: {
    imageData?: ImageData;
    options?: QRScanOptions;
  };
  id?: string;
}

interface QRWorkerResponse {
  type: 'result' | 'error' | 'ready';
  data?: {
    qrCode?: {
      data: string;
      location: {
        topLeftCorner: { x: number; y: number };
        topRightCorner: { x: number; y: number };
        bottomLeftCorner: { x: number; y: number };
        bottomRightCorner: { x: number; y: number };
        topLeftFinderPattern: { x: number; y: number };
        topRightFinderPattern: { x: number; y: number };
        bottomLeftFinderPattern: { x: number; y: number };
        bottomRightAlignmentPattern?: { x: number; y: number };
      };
      binaryData: number[];
    } | null;
    error?: string;
    processingTime?: number;
  };
  id?: string;
}

interface UseQRWorkerOptions {
  /** Auto-initialize worker on mount */
  autoInit?: boolean;
  /** Maximum concurrent scan requests */
  maxConcurrentScans?: number;
  /** Scan timeout in milliseconds */
  scanTimeout?: number;
}

interface UseQRWorkerReturn {
  /** Whether the worker is ready */
  isReady: boolean;
  /** Whether the worker is currently processing */
  isScanning: boolean;
  /** Worker initialization error */
  error: string | null;
  /** Scan QR code from image data */
  scanQR: (imageData: ImageData, options?: QRScanOptions) => Promise<{
    qrCode: QRCodeResult | null;
    processingTime: number;
  }>;
  /** Initialize the worker */
  initWorker: () => Promise<void>;
  /** Destroy the worker */
  destroyWorker: () => void;
  /** Worker performance stats */
  stats: {
    totalScans: number;
    averageProcessingTime: number;
    successfulScans: number;
    failedScans: number;
  };
}

export function useQRWorker(options: UseQRWorkerOptions = {}): UseQRWorkerReturn {
  const {
    autoInit = true,
    maxConcurrentScans = 3,
    scanTimeout = 5000
  } = options;

  const [isReady, setIsReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalScans: 0,
    averageProcessingTime: 0,
    successfulScans: 0,
    failedScans: 0
  });

  const workerRef = useRef<Worker | null>(null);
  const pendingScansRef = useRef(new Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>());
  const scanIdCounterRef = useRef(0);

  // Generate unique scan ID
  const generateScanId = useCallback(() => {
    return `qr-scan-${Date.now()}-${++scanIdCounterRef.current}`;
  }, []);

  // Initialize worker
  const initWorker = useCallback(async () => {
    if (workerRef.current) {
      return;
    }

    try {
      setError(null);
      
      // Create worker with proper fallback handling
      let worker: Worker;
      try {
        // Try to load as ES module first (works in development and modern browsers)
        worker = new Worker(
          new URL('../workers/qr-scanner.worker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (e) {
        console.warn('Module worker failed, trying fallback:', e);
        
        // Enhanced fallback with inline QR scanner implementation
        const workerCode = `
          // Import jsQR from CDN
          importScripts('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js');
          
          // Basic QR scanning implementation
          self.onmessage = function(event) {
            const { type, data, id } = event.data;
            
            switch (type) {
              case 'init':
                self.postMessage({ type: 'ready', id });
                break;
                
              case 'scan':
                if (!data?.imageData) {
                  self.postMessage({ 
                    type: 'error', 
                    data: { error: 'No image data provided' }, 
                    id 
                  });
                  return;
                }
                
                const startTime = performance.now();
                try {
                  const result = jsQR(
                    data.imageData.data, 
                    data.imageData.width, 
                    data.imageData.height,
                    data.options || { inversionAttempts: 'dontInvert' }
                  );
                  
                  const processingTime = performance.now() - startTime;
                  
                  self.postMessage({
                    type: 'result',
                    data: {
                      qrCode: result ? {
                        data: result.data,
                        location: result.location,
                        binaryData: result.binaryData
                      } : null,
                      processingTime
                    },
                    id
                  });
                } catch (error) {
                  const processingTime = performance.now() - startTime;
                  self.postMessage({
                    type: 'error',
                    data: { 
                      error: error.message || 'QR scanning failed',
                      processingTime 
                    },
                    id
                  });
                }
                break;
                
              default:
                self.postMessage({
                  type: 'error',
                  data: { error: 'Unknown message type: ' + type },
                  id
                });
            }
          };
        `;
        
        const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(workerBlob));
      }

      workerRef.current = worker;

      // Set up message handler
      worker.onmessage = (event: MessageEvent<QRWorkerResponse>) => {
        const { type, data, id } = event.data;

        switch (type) {
          case 'ready':
            if (id && pendingScansRef.current.has(id)) {
              // This is a response to init
              setIsReady(true);
              const pending = pendingScansRef.current.get(id);
              if (pending) {
                clearTimeout(pending.timeout);
                pending.resolve(undefined);
                pendingScansRef.current.delete(id);
              }
            } else {
              setIsReady(true);
            }
            break;

          case 'result':
            if (id && pendingScansRef.current.has(id)) {
              const pending = pendingScansRef.current.get(id);
              if (pending) {
                clearTimeout(pending.timeout);
                
                // Update stats
                setStats(prev => ({
                  totalScans: prev.totalScans + 1,
                  averageProcessingTime: data?.processingTime 
                    ? (prev.averageProcessingTime * prev.totalScans + data.processingTime) / (prev.totalScans + 1)
                    : prev.averageProcessingTime,
                  successfulScans: data?.qrCode ? prev.successfulScans + 1 : prev.successfulScans,
                  failedScans: !data?.qrCode ? prev.failedScans + 1 : prev.failedScans
                }));

                pending.resolve({
                  qrCode: data?.qrCode || null,
                  processingTime: data?.processingTime || 0
                });
                pendingScansRef.current.delete(id);
              }
            }
            break;

          case 'error':
            if (id && pendingScansRef.current.has(id)) {
              const pending = pendingScansRef.current.get(id);
              if (pending) {
                clearTimeout(pending.timeout);
                setStats(prev => ({
                  ...prev,
                  totalScans: prev.totalScans + 1,
                  failedScans: prev.failedScans + 1
                }));
                pending.reject(new Error(data?.error || 'Unknown worker error'));
                pendingScansRef.current.delete(id);
              }
            } else {
              setError(data?.error || 'Unknown worker error');
            }
            break;
        }

        // Update scanning state
        setIsScanning(pendingScansRef.current.size > 0);
      };

      // Set up error handler
      worker.onerror = (error) => {
        console.error('QR Worker error:', error);
        setError(`Worker error: ${error.message}`);
        setIsReady(false);
      };

      // Initialize the worker
      const initId = generateScanId();
      
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Worker initialization timeout'));
        }, scanTimeout);

        pendingScansRef.current.set(initId, {
          resolve,
          reject,
          timeout
        });

        worker.postMessage({
          type: 'init',
          id: initId
        } as QRWorkerMessage);
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize worker';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [generateScanId, scanTimeout]);

  // Destroy worker
  const destroyWorker = useCallback(() => {
    if (workerRef.current) {
      // Clear all pending scans
      pendingScansRef.current.forEach(({ reject, timeout }) => {
        clearTimeout(timeout);
        reject(new Error('Worker destroyed'));
      });
      pendingScansRef.current.clear();

      // Terminate worker
      workerRef.current.terminate();
      workerRef.current = null;
      
      setIsReady(false);
      setIsScanning(false);
      setError(null);
    }
  }, []);

  // Scan QR code
  const scanQR = useCallback(async (
    imageData: ImageData, 
    scanOptions: QRScanOptions = {}
  ): Promise<{ qrCode: QRCodeResult | null; processingTime: number }> => {
    if (!workerRef.current || !isReady) {
      throw new Error('Worker not ready. Call initWorker() first.');
    }

    if (pendingScansRef.current.size >= maxConcurrentScans) {
      throw new Error('Too many concurrent scan requests. Try again later.');
    }

    const scanId = generateScanId();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingScansRef.current.delete(scanId);
        reject(new Error('Scan timeout'));
      }, scanTimeout);

      pendingScansRef.current.set(scanId, {
        resolve,
        reject,
        timeout
      });

      workerRef.current!.postMessage({
        type: 'scan',
        data: {
          imageData,
          options: scanOptions
        },
        id: scanId
      } as QRWorkerMessage);

      setIsScanning(true);
    });
  }, [isReady, maxConcurrentScans, scanTimeout, generateScanId]);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInit) {
      initWorker().catch(err => {
        console.error('Failed to auto-initialize QR worker:', err);
      });
    }

    // Cleanup on unmount
    return () => {
      destroyWorker();
    };
  }, [autoInit, initWorker, destroyWorker]);

  return {
    isReady,
    isScanning,
    error,
    scanQR,
    initWorker,
    destroyWorker,
    stats
  };
}

// Convenience hook with default options for QR scanning
export function useQRScannerWorker() {
  return useQRWorker({
    autoInit: true,
    maxConcurrentScans: 2,
    scanTimeout: 3000
  });
}
