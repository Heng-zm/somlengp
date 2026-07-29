'use client';

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Camera,
  CameraOff,
  ImageUp,
  Loader2,
  RefreshCw,
  SwitchCamera,
  Upload,
  X,
  Zap,
  ZapOff,
  ZoomIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQRCamera } from '@/hooks/use-camera-permission';
import { useQRScannerWorker } from '@/hooks/use-qr-worker';
import { qrPerformanceMonitor } from '@/utils/qr-performance';

export interface OptimizedQRScannerProps {
  onScanSuccess?: (data: string, location?: QRLocation, confidence?: number) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
  className?: string;
  enableVibration?: boolean;
  enableSound?: boolean;
  scanRegion?: 'full' | 'center' | 'auto';
  scanQuality?: 'fast' | 'balanced' | 'accurate';
}

interface QRPoint {
  x: number;
  y: number;
}

interface QRLocation {
  topLeftCorner?: QRPoint;
  topRightCorner?: QRPoint;
  bottomLeftCorner?: QRPoint;
  bottomRightCorner?: QRPoint;
}

interface DecodeResult {
  data: string;
  location?: QRLocation;
  processingTime: number;
  source: 'native' | 'worker' | 'main-thread';
}

interface NativeBarcode {
  rawValue?: string;
}

interface NativeBarcodeDetector {
  detect(source: CanvasImageSource): Promise<NativeBarcode[]>;
}

interface NativeBarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): NativeBarcodeDetector;
  getSupportedFormats?: () => Promise<string[]>;
}

interface ExtendedCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  zoom?: {
    min?: number;
    max?: number;
    step?: number;
  };
}

interface ExtendedSettings extends MediaTrackSettings {
  torch?: boolean;
  zoom?: number;
}

type ScannerStatus = 'starting' | 'scanning' | 'found' | 'paused' | 'error';

const MAX_UPLOAD_BYTES = 16 * 1024 * 1024;
const MAX_UPLOAD_DIMENSION = 2048;

function getCameraErrorMessage(error?: { name?: string; message?: string } | null): string {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera access was denied. Allow camera access in your browser settings, then try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera was found on this device.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'The camera is already in use by another application.';
    case 'OverconstrainedError':
      return 'This camera does not support the requested quality. Try switching cameras.';
    default:
      return error?.message || 'Unable to start the camera.';
  }
}

function calculateRegion(
  width: number,
  height: number,
  scanRegion: OptimizedQRScannerProps['scanRegion'],
) {
  if (scanRegion === 'full') {
    return { x: 0, y: 0, width, height };
  }

  const shortestSide = Math.min(width, height);
  const size = scanRegion === 'center' ? shortestSide * 0.68 : shortestSide * 0.82;

  return {
    x: (width - size) / 2,
    y: (height - size) / 2,
    width: size,
    height: size,
  };
}

const OptimizedQRScannerComponent = function OptimizedQRScanner({
  onScanSuccess,
  onScanError,
  onClose,
  className = '',
  enableVibration = true,
  enableSound = false,
  scanRegion = 'auto',
  scanQuality = 'balanced',
}: OptimizedQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanFrameRef = useRef<() => Promise<void>>(async () => undefined);
  const scanLoopRef = useRef<FrameRequestCallback>(() => undefined);
  const scanInFlightRef = useRef(false);
  const scanningRef = useRef(false);
  const cameraRequestStartedRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const lastScannedDataRef = useRef('');
  const lastReportedErrorRef = useRef(0);
  const nativeDetectorRef = useRef<NativeBarcodeDetector | null>(null);
  const nativeDetectorCheckedRef = useRef(false);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);
  const onCloseRef = useRef(onClose);

  onScanSuccessRef.current = onScanSuccess;
  onScanErrorRef.current = onScanError;
  onCloseRef.current = onClose;

  const [status, setStatus] = useState<ScannerStatus>('starting');
  const [statusMessage, setStatusMessage] = useState('Starting camera…');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [supportsTorch, setSupportsTorch] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);

  const {
    stream,
    isLoading,
    isSupported,
    permissionState,
    devices,
    error: cameraError,
    requestCamera,
    stopCamera,
    switchFacingMode,
  } = useQRCamera();

  const {
    isReady: workerReady,
    scanQR,
    stats: workerStats,
    error: workerError,
  } = useQRScannerWorker();

  const scanInterval = useMemo(() => {
    if (scanQuality === 'fast') return 100;
    if (scanQuality === 'accurate') return 220;
    return 150;
  }, [scanQuality]);

  const reportError = useCallback((message: string, notify = true) => {
    setStatus('error');
    setStatusMessage(message);
    if (notify) {
      onScanErrorRef.current?.(message);
    }
  }, []);

  const getVideoTrack = useCallback(() => {
    return stream?.getVideoTracks()[0] || null;
  }, [stream]);

  const updateTrackControls = useCallback(() => {
    const track = getVideoTrack();
    if (!track) {
      setSupportsTorch(false);
      setZoomRange(null);
      setTorchOn(false);
      setZoom(1);
      return;
    }

    const capabilities = track.getCapabilities?.() as ExtendedCapabilities | undefined;
    const settings = track.getSettings() as ExtendedSettings;
    const nextZoomRange = capabilities?.zoom;

    setSupportsTorch(Boolean(capabilities?.torch));
    setTorchOn(Boolean(settings.torch));

    if (
      nextZoomRange &&
      Number.isFinite(nextZoomRange.min) &&
      Number.isFinite(nextZoomRange.max) &&
      Number(nextZoomRange.max) > Number(nextZoomRange.min)
    ) {
      const min = Number(nextZoomRange.min);
      const max = Number(nextZoomRange.max);
      setZoomRange({
        min,
        max,
        step: Number(nextZoomRange.step) || 0.1,
      });
      setZoom(Math.min(max, Math.max(min, Number(settings.zoom) || min)));
    } else {
      setZoomRange(null);
      setZoom(1);
    }
  }, [getVideoTrack]);

  const getNativeDetector = useCallback(async () => {
    if (nativeDetectorCheckedRef.current) {
      return nativeDetectorRef.current;
    }

    nativeDetectorCheckedRef.current = true;
    const Detector = (
      window as typeof window & { BarcodeDetector?: NativeBarcodeDetectorConstructor }
    ).BarcodeDetector;

    if (!Detector) {
      return null;
    }

    try {
      const supportedFormats = await Detector.getSupportedFormats?.();
      if (supportedFormats && !supportedFormats.includes('qr_code')) {
        return null;
      }
      nativeDetectorRef.current = new Detector({ formats: ['qr_code'] });
    } catch {
      nativeDetectorRef.current = null;
    }

    return nativeDetectorRef.current;
  }, []);

  const decodeCanvas = useCallback(async (
    canvas: HTMLCanvasElement,
    getImageData: () => ImageData,
  ): Promise<DecodeResult | null> => {
    const startedAt = performance.now();
    const detector = await getNativeDetector();

    if (detector) {
      try {
        const barcodes = await detector.detect(canvas);
        const match = barcodes.find((barcode) => barcode.rawValue?.trim());
        if (match?.rawValue) {
          return {
            data: match.rawValue,
            processingTime: performance.now() - startedAt,
            source: 'native',
          };
        }
      } catch {
        // Native detection is an optimization. The worker remains the reliable fallback.
      }
    }

    const imageData = getImageData();

    if (workerReady) {
      try {
        const result = await scanQR(imageData, {
          inversionAttempts: 'attemptBoth',
          locateOptions: {
            skipUntilFound: scanQuality === 'fast',
            assumeSquare: false,
            centerROI: false,
            maxFinderPatternStdDev: scanQuality === 'accurate' ? 5 : 10,
          },
        });

        if (result.qrCode?.data) {
          return {
            data: result.qrCode.data,
            location: result.qrCode.location,
            processingTime: result.processingTime,
            source: 'worker',
          };
        }

        return null;
      } catch {
        // Fall back to the main thread if the worker is unavailable or restarted.
      }
    }

    const { default: jsQR } = await import('jsqr');
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (!result?.data) {
      return null;
    }

    return {
      data: result.data,
      location: result.location,
      processingTime: performance.now() - startedAt,
      source: 'main-thread',
    };
  }, [getNativeDetector, scanQR, scanQuality, workerReady]);

  const triggerFeedback = useCallback(() => {
    if (enableVibration && 'vibrate' in navigator) {
      navigator.vibrate([45, 45, 70]);
    }

    if (!enableSound) return;

    try {
      const AudioContextClass = window.AudioContext
        || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(820, audioContext.currentTime);
      gain.gain.setValueAtTime(0.18, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.18);
      oscillator.onended = () => {
        void audioContext.close();
      };
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.18);
    } catch {
      // Audio feedback is optional and must never interrupt a successful scan.
    }
  }, [enableSound, enableVibration]);

  const stopScanning = useCallback(() => {
    scanningRef.current = false;
    scanInFlightRef.current = false;
    setIsScanning(false);

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const startScanning = useCallback(() => {
    if (scanningRef.current) return;

    scanningRef.current = true;
    setIsScanning(true);
    setStatus('scanning');
    setStatusMessage('Hold the QR code inside the frame');
    qrPerformanceMonitor.startScanning();

    animationFrameRef.current = requestAnimationFrame((time) => {
      scanLoopRef.current(time);
    });
  }, []);

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !scanningRef.current
      || !video
      || !canvas
      || video.paused
      || video.ended
      || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      || video.videoWidth === 0
      || video.videoHeight === 0
    ) {
      return;
    }

    const now = performance.now();
    if (now - lastScanTimeRef.current < scanInterval) {
      return;
    }
    lastScanTimeRef.current = now;

    const region = calculateRegion(video.videoWidth, video.videoHeight, scanRegion);
    const sourceX = Math.max(0, Math.floor(region.x));
    const sourceY = Math.max(0, Math.floor(region.y));
    const sourceWidth = Math.max(
      1,
      Math.min(video.videoWidth - sourceX, Math.floor(region.width)),
    );
    const sourceHeight = Math.max(
      1,
      Math.min(video.videoHeight - sourceY, Math.floor(region.height)),
    );

    if (canvas.width !== sourceWidth || canvas.height !== sourceHeight) {
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
    }

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      reportError('Image processing is not available in this browser.');
      stopScanning();
      return;
    }

    context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight,
    );

    qrPerformanceMonitor.recordScanAttempt();

    try {
      const result = await decodeCanvas(
        canvas,
        () => context.getImageData(0, 0, sourceWidth, sourceHeight),
      );

      if (!result || !result.data.trim() || result.data === lastScannedDataRef.current) {
        return;
      }

      lastScannedDataRef.current = result.data;
      const confidence = result.source === 'native'
        ? 98
        : result.processingTime < 80
          ? 95
          : 90;

      stopScanning();
      setStatus('found');
      setStatusMessage('QR code detected');
      qrPerformanceMonitor.recordSuccessfulScan(result.data);
      triggerFeedback();
      onScanSuccessRef.current?.(result.data, result.location, confidence);
    } catch (error) {
      qrPerformanceMonitor.recordFailedScan(
        error instanceof Error ? error.message : 'Unknown scanner error',
      );

      const timestamp = Date.now();
      if (timestamp - lastReportedErrorRef.current > 5000) {
        lastReportedErrorRef.current = timestamp;
        onScanErrorRef.current?.('The scanner could not process this frame. Retrying…');
      }
    }
  }, [
    decodeCanvas,
    reportError,
    scanInterval,
    scanRegion,
    stopScanning,
    triggerFeedback,
  ]);

  scanFrameRef.current = scanFrame;
  scanLoopRef.current = () => {
    if (!scanningRef.current) {
      animationFrameRef.current = null;
      return;
    }

    if (scanInFlightRef.current) {
      animationFrameRef.current = requestAnimationFrame((time) => {
        scanLoopRef.current(time);
      });
      return;
    }

    scanInFlightRef.current = true;
    void scanFrameRef.current().finally(() => {
      scanInFlightRef.current = false;
      if (scanningRef.current) {
        animationFrameRef.current = requestAnimationFrame((time) => {
          scanLoopRef.current(time);
        });
      } else {
        animationFrameRef.current = null;
      }
    });
  };

  useEffect(() => {
    if (
      !isSupported
      || stream
      || isLoading
      || cameraError
      || cameraRequestStartedRef.current
    ) {
      return;
    }

    cameraRequestStartedRef.current = true;
    const timeout = window.setTimeout(() => {
      setStatus('starting');
      setStatusMessage('Requesting camera access…');
      void requestCamera().then((result) => {
        if (!result.success) {
          cameraRequestStartedRef.current = false;
          reportError(getCameraErrorMessage(result.error));
        }
      });
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [cameraError, isLoading, isSupported, reportError, requestCamera, stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    updateTrackControls();

    const handleReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        startScanning();
      }
    };

    video.addEventListener('loadedmetadata', handleReady);
    video.addEventListener('playing', handleReady);
    void video.play().then(handleReady).catch(() => {
      setStatus('paused');
      setStatusMessage('Tap resume to start the camera preview');
    });

    return () => {
      video.removeEventListener('loadedmetadata', handleReady);
      video.removeEventListener('playing', handleReady);
      stopScanning();
      if (video.srcObject === stream) {
        video.srcObject = null;
      }
    };
  }, [startScanning, stopScanning, stream, updateTrackControls]);

  useEffect(() => {
    return () => {
      stopScanning();
      stopCamera();
    };
  }, [stopCamera, stopScanning]);

  const handlePermissionRequest = useCallback(async () => {
    cameraRequestStartedRef.current = true;
    setStatus('starting');
    setStatusMessage('Requesting camera access…');
    const result = await requestCamera();

    if (!result.success) {
      cameraRequestStartedRef.current = false;
      reportError(getCameraErrorMessage(result.error));
    }
  }, [reportError, requestCamera]);

  const handleResume = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      await video.play();
      startScanning();
    } catch {
      reportError('The camera preview could not be resumed.');
    }
  }, [reportError, startScanning]);

  const handleSwitchCamera = useCallback(async () => {
    stopScanning();
    setStatus('starting');
    setStatusMessage('Switching camera…');
    const result = await switchFacingMode('high');

    if (!result.success) {
      reportError(getCameraErrorMessage(result.error));
    }
  }, [reportError, stopScanning, switchFacingMode]);

  const handleTorchToggle = useCallback(async () => {
    const track = getVideoTrack();
    if (!track || !supportsTorch) return;

    const nextValue = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: nextValue } as MediaTrackConstraintSet],
      });
      setTorchOn(nextValue);
    } catch {
      reportError('This camera could not change the flashlight setting.', false);
    }
  }, [getVideoTrack, reportError, supportsTorch, torchOn]);

  const handleZoomChange = useCallback(async (value: number) => {
    const track = getVideoTrack();
    if (!track || !zoomRange) return;

    const nextZoom = Math.min(zoomRange.max, Math.max(zoomRange.min, value));
    setZoom(nextZoom);

    try {
      await track.applyConstraints({
        advanced: [{ zoom: nextZoom } as MediaTrackConstraintSet],
      });
    } catch {
      updateTrackControls();
    }
  }, [getVideoTrack, updateTrackControls, zoomRange]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      reportError('Choose an image file containing a QR code.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reportError('The selected image is larger than 16 MB.');
      return;
    }

    setIsProcessingUpload(true);
    setStatus('starting');
    setStatusMessage('Scanning the selected image…');

    let bitmap: ImageBitmap | null = null;
    let objectUrl: string | null = null;

    try {
      let source: CanvasImageSource;
      let sourceWidth: number;
      let sourceHeight: number;

      if ('createImageBitmap' in window) {
        bitmap = await window.createImageBitmap(file);
        source = bitmap;
        sourceWidth = bitmap.width;
        sourceHeight = bitmap.height;
      } else {
        objectUrl = URL.createObjectURL(file);
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const element = new Image();
          element.onload = () => resolve(element);
          element.onerror = () => reject(new Error('Image could not be loaded'));
          element.src = objectUrl as string;
        });
        source = image;
        sourceWidth = image.naturalWidth;
        sourceHeight = image.naturalHeight;
      }

      const scale = Math.min(
        1,
        MAX_UPLOAD_DIMENSION / Math.max(sourceWidth, sourceHeight),
      );
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        throw new Error('Image processing is not available');
      }

      context.drawImage(source, 0, 0, width, height);
      const result = await decodeCanvas(
        canvas,
        () => context.getImageData(0, 0, width, height),
      );

      if (!result?.data) {
        reportError('No QR code was found in that image.');
        return;
      }

      lastScannedDataRef.current = result.data;
      setStatus('found');
      setStatusMessage('QR code detected');
      triggerFeedback();
      onScanSuccessRef.current?.(result.data, result.location, 96);
    } catch (error) {
      reportError(
        error instanceof Error
          ? error.message
          : 'The selected image could not be processed.',
      );
    } finally {
      bitmap?.close();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setIsProcessingUpload(false);
    }
  }, [decodeCanvas, reportError, triggerFeedback]);

  const handleClose = useCallback(() => {
    stopScanning();
    stopCamera();
    onCloseRef.current?.();
  }, [stopCamera, stopScanning]);

  const uploadInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileUpload}
      className="sr-only"
      tabIndex={-1}
      aria-label="Upload an image containing a QR code"
    />
  );

  if (!isSupported) {
    return (
      <div className={`rounded-2xl border border-border bg-card p-6 text-center ${className}`}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CameraOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Camera unavailable</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          This browser cannot access a camera here. You can still scan a QR code from an image.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={handleUploadClick} disabled={isProcessingUpload}>
            {isProcessingUpload
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              : <ImageUp className="mr-2 h-4 w-4" aria-hidden="true" />}
            Choose image
          </Button>
          {onClose && (
            <Button variant="outline" onClick={handleClose}>Close</Button>
          )}
        </div>
        {uploadInput}
      </div>
    );
  }

  if (!stream && !isLoading) {
    const denied = permissionState === 'denied';
    const message = denied
      ? 'Camera access is blocked. Update this site’s camera permission, then try again.'
      : cameraError
        ? getCameraErrorMessage(cameraError)
        : 'Enable the camera to scan live, or choose an image from your device.';

    return (
      <div className={`rounded-2xl border border-border bg-card p-6 text-center ${className}`}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Camera className="h-6 w-6 text-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          {denied ? 'Camera permission required' : 'Scan a QR code'}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={handlePermissionRequest}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {denied || cameraError ? 'Try camera again' : 'Enable camera'}
          </Button>
          <Button variant="outline" onClick={handleUploadClick} disabled={isProcessingUpload}>
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            Choose image
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={handleClose}>Close</Button>
          )}
        </div>
        {uploadInput}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black ${className}`}>
      <div className="relative min-h-[420px] sm:min-h-[500px]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
          aria-label="Live camera preview"
        />

        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_34%,rgba(0,0,0,0.62)_35%,rgba(0,0,0,0.78)_100%)]"
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
          <div className="relative aspect-square w-full max-w-[300px]">
            <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-2xl border-l-4 border-t-4 border-white" />
            <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-2xl border-r-4 border-t-4 border-white" />
            <div className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-2xl border-b-4 border-l-4 border-white" />
            <div className="absolute bottom-0 right-0 h-12 w-12 rounded-br-2xl border-b-4 border-r-4 border-white" />
            {isScanning && (
              <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 animate-pulse bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4">
          <div
            className="flex min-w-0 items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-2 text-sm text-white backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            <span
              className={`h-2 w-2 flex-none rounded-full ${
                status === 'error'
                  ? 'bg-red-400'
                  : status === 'found'
                    ? 'bg-emerald-400'
                    : 'bg-white animate-pulse'
              }`}
            />
            <span className="truncate">{statusMessage}</span>
          </div>

          {onClose && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleClose}
              className="h-10 w-10 flex-none rounded-full border border-white/15 bg-black/55 text-white hover:bg-black/75 hover:text-white"
              aria-label="Close scanner"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-16">
          {zoomRange && (
            <div className="mx-auto flex max-w-sm items-center gap-3 rounded-full border border-white/15 bg-black/45 px-4 py-2 backdrop-blur-md">
              <ZoomIn className="h-4 w-4 flex-none text-white" aria-hidden="true" />
              <input
                type="range"
                min={zoomRange.min}
                max={zoomRange.max}
                step={zoomRange.step}
                value={zoom}
                onChange={(event) => void handleZoomChange(Number(event.target.value))}
                className="h-1.5 w-full cursor-pointer accent-white"
                aria-label="Camera zoom"
                aria-valuetext={`${zoom.toFixed(1)} times`}
              />
              <span className="w-9 text-right text-xs tabular-nums text-white">
                {zoom.toFixed(1)}×
              </span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2">
            {devices.length > 1 && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleSwitchCamera}
                disabled={isLoading}
                className="h-11 w-11 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                aria-label="Switch camera"
              >
                <SwitchCamera className="h-5 w-5" aria-hidden="true" />
              </Button>
            )}

            {supportsTorch && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleTorchToggle}
                className="h-11 w-11 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                aria-label={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
                aria-pressed={torchOn}
              >
                {torchOn
                  ? <ZapOff className="h-5 w-5" aria-hidden="true" />
                  : <Zap className="h-5 w-5" aria-hidden="true" />}
              </Button>
            )}

            {status === 'paused' ? (
              <Button type="button" onClick={handleResume} className="rounded-full px-5">
                <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
                Resume
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleUploadClick}
                disabled={isProcessingUpload}
                className="rounded-full bg-white px-5 text-black hover:bg-white/90"
              >
                {isProcessingUpload
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  : <Upload className="mr-2 h-4 w-4" aria-hidden="true" />}
                Scan image
              </Button>
            )}
          </div>

          {(workerStats.totalScans > 0 || workerError) && (
            <p className="text-center text-xs text-white/65">
              {workerError
                ? 'Using compatibility scanner'
                : `${workerStats.totalScans} frames checked · ${workerStats.averageProcessingTime.toFixed(0)} ms average`}
            </p>
          )}
        </div>

        {(isLoading || isProcessingUpload) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/65 backdrop-blur-sm">
            <div className="rounded-2xl border border-white/15 bg-black/55 px-6 py-5 text-center text-white">
              <Loader2 className="mx-auto h-7 w-7 animate-spin" aria-hidden="true" />
              <p className="mt-3 text-sm">
                {isProcessingUpload ? 'Scanning image…' : 'Preparing camera…'}
              </p>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      {uploadInput}
    </div>
  );
};

export const OptimizedQRScanner = memo(OptimizedQRScannerComponent);
export default OptimizedQRScanner;
