/**
 * React Hook for Camera Permission Management
 * Provides comprehensive camera permission handling with state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CameraPermissionResult,
  CameraConstraints,
  CameraDeviceInfo,
  requestCameraPermission,
  requestCameraWithDevice,
  requestCameraWithQuality,
  requestCameraWithFallback,
  requestBackCamera,
  requestFrontCamera,
  requestBackCameraWithFallback,
  getBackCameraDevices,
  getFrontCameraDevices,
  switchCameraFacing,
  getCameraDevices,
  getCameraPermissionStatus,
  checkCameraPermissionDetails,
  stopCameraStream,
  isCameraSupported,
  isCameraPermissionDenied
} from '@/utils/camera-permissions';

export interface UseCameraPermissionOptions {
  /** Auto-request permission on mount */
  autoRequest?: boolean;
  /** Default camera constraints */
  defaultConstraints?: CameraConstraints;
  /** Quality preference for camera */
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  /** Preferred facing mode ('user' for front, 'environment' for back) */
  facingMode?: 'user' | 'environment';
  /** Use fallback constraints if primary fails */
  useFallback?: boolean;
  /** Auto-stop stream on unmount */
  autoStop?: boolean;
}

export interface UseCameraPermissionReturn {
  // State
  stream: MediaStream | null;
  isLoading: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  permissionState: PermissionState | null;
  devices: CameraDeviceInfo[];
  backCameras: CameraDeviceInfo[];
  frontCameras: CameraDeviceInfo[];
  currentFacingMode: 'user' | 'environment' | null;
  error: CameraPermissionResult['error'] | null;
  
  // Actions
  requestPermission: (constraints?: CameraConstraints) => Promise<CameraPermissionResult>;
  requestWithDevice: (deviceId: string) => Promise<CameraPermissionResult>;
  requestWithQuality: (quality: 'low' | 'medium' | 'high' | 'ultra', facingMode?: 'user' | 'environment') => Promise<CameraPermissionResult>;
  requestWithFallback: (facingMode?: 'user' | 'environment') => Promise<CameraPermissionResult>;
  requestBackCamera: (quality?: 'low' | 'medium' | 'high' | 'ultra') => Promise<CameraPermissionResult>;
  requestFrontCamera: (quality?: 'low' | 'medium' | 'high' | 'ultra') => Promise<CameraPermissionResult>;
  requestBackCameraWithFallback: (quality?: 'low' | 'medium' | 'high' | 'ultra') => Promise<CameraPermissionResult>;
  switchFacingMode: (quality?: 'low' | 'medium' | 'high' | 'ultra') => Promise<CameraPermissionResult>;
  stopCamera: () => void;
  refreshDevices: () => Promise<void>;
  checkPermission: () => Promise<void>;
  
  // Utilities
  getDeviceById: (deviceId: string) => CameraDeviceInfo | undefined;
  switchCamera: (deviceId: string) => Promise<CameraPermissionResult>;
}

export function useCameraPermission(options: UseCameraPermissionOptions = {}): UseCameraPermissionReturn {
  const {
    autoRequest = false,
    defaultConstraints = { video: true },
    quality = 'medium',
    facingMode = 'user',
    useFallback = true,
    autoStop = true
  } = options;

  // State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [devices, setDevices] = useState<CameraDeviceInfo[]>([]);
  const [backCameras, setBackCameras] = useState<CameraDeviceInfo[]>([]);
  const [frontCameras, setFrontCameras] = useState<CameraDeviceInfo[]>([]);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment' | null>(null);
  const [error, setError] = useState<CameraPermissionResult['error'] | null>(null);
  const [isSupported] = useState(() => isCameraSupported());

  // Refs to track current stream for cleanup
  const currentStreamRef = useRef<MediaStream | null>(null);

  // Update refs when stream changes
  useEffect(() => {
    currentStreamRef.current = stream;
  }, [stream]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (currentStreamRef.current) {
      stopCameraStream(currentStreamRef.current);
      setStream(null);
      currentStreamRef.current = null;
    }
  }, []);

  // Auto cleanup on unmount
  useEffect(() => {
    if (autoStop) {
      return cleanup;
    }
  }, [autoStop, cleanup]);

  // Check permission status
  const checkPermission = useCallback(async () => {
    try {
      const status = await getCameraPermissionStatus();
      setPermissionState(status);
      setHasPermission(status === 'granted');
    } catch (err) {
      console.warn('Could not check camera permission:', err);
    }
  }, []);

  // Refresh devices list
  const refreshDevices = useCallback(async () => {
    try {
      const deviceList = await getCameraDevices();
      const backCameraList = await getBackCameraDevices();
      const frontCameraList = await getFrontCameraDevices();
      
      setDevices(deviceList);
      setBackCameras(backCameraList);
      setFrontCameras(frontCameraList);
    } catch (err) {
      console.error('Error refreshing devices:', err);
      setDevices([]);
      setBackCameras([]);
      setFrontCameras([]);
    }
  }, []);

  // Generic request handler
  const handleRequest = useCallback(async (
    requestFn: () => Promise<CameraPermissionResult>
  ): Promise<CameraPermissionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop current stream first
      cleanup();

      const result = await requestFn();

      if (result.success && result.stream) {
        setStream(result.stream);
        setHasPermission(true);
        setPermissionState(result.permissions?.camera || 'granted');
        // Refresh devices after successful access
        refreshDevices();
      } else {
        setError(result.error || null);
        setHasPermission(false);
      }

      return result;
    } catch (err) {
      const error = {
        name: 'UnknownError',
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR'
      };
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [cleanup, refreshDevices]);

  // Request permission with default constraints
  const requestPermission = useCallback((constraints?: CameraConstraints) => {
    return handleRequest(() => 
      requestCameraPermission(constraints || defaultConstraints)
    );
  }, [handleRequest, defaultConstraints]);

  // Request with specific device
  const requestWithDevice = useCallback((deviceId: string) => {
    return handleRequest(() => requestCameraWithDevice(deviceId));
  }, [handleRequest]);

  // Request with quality preference
  const requestWithQuality = useCallback((
    qualityLevel: 'low' | 'medium' | 'high' | 'ultra',
    requestedFacingMode?: 'user' | 'environment'
  ) => {
    return handleRequest(() => requestCameraWithQuality(qualityLevel, {}, requestedFacingMode || facingMode));
  }, [handleRequest, facingMode]);

  // Request with fallback
  const requestWithFallback = useCallback((requestedFacingMode?: 'user' | 'environment') => {
    return handleRequest(() => requestCameraWithFallback(requestedFacingMode || facingMode));
  }, [handleRequest, facingMode]);

  // Request back camera
  const requestBackCameraFn = useCallback((quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium') => {
    return handleRequest(() => {
      setCurrentFacingMode('environment');
      return requestBackCamera(quality);
    });
  }, [handleRequest]);

  // Request front camera
  const requestFrontCameraFn = useCallback((quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium') => {
    return handleRequest(() => {
      setCurrentFacingMode('user');
      return requestFrontCamera(quality);
    });
  }, [handleRequest]);

  // Request back camera with fallback
  const requestBackCameraWithFallbackFn = useCallback((quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium') => {
    return handleRequest(() => {
      setCurrentFacingMode('environment');
      return requestBackCameraWithFallback(quality);
    });
  }, [handleRequest]);

  // Switch facing mode
  const switchFacingModeFn = useCallback((quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium') => {
    return handleRequest(() => {
      const result = switchCameraFacing(currentStreamRef.current, quality);
      // Update facing mode based on current stream
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      setCurrentFacingMode(newFacingMode);
      return result;
    });
  }, [handleRequest, currentFacingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    cleanup();
    setHasPermission(false);
    setError(null);
  }, [cleanup]);

  // Get device by ID
  const getDeviceById = useCallback((deviceId: string): CameraDeviceInfo | undefined => {
    return devices.find(device => device.deviceId === deviceId);
  }, [devices]);

  // Switch camera device
  const switchCamera = useCallback(async (deviceId: string): Promise<CameraPermissionResult> => {
    const device = getDeviceById(deviceId);
    if (!device) {
      const error = {
        name: 'NotFoundError',
        message: `Camera device with ID ${deviceId} not found`,
        code: 'DEVICE_NOT_FOUND'
      };
      setError(error);
      return { success: false, error };
    }

    return requestWithDevice(deviceId);
  }, [getDeviceById, requestWithDevice]);

  // Initial setup
  useEffect(() => {
    const initialize = async () => {
      // Check initial permission status
      await checkPermission();
      
      // Load available devices
      await refreshDevices();
      
      // Auto-request if enabled
      if (autoRequest && isSupported) {
        if (useFallback) {
          await requestWithFallback();
        } else {
          await requestWithQuality(quality);
        }
      }
    };

    initialize();
  }, [autoRequest, isSupported, useFallback, quality, checkPermission, refreshDevices, requestWithFallback, requestWithQuality]);

  // Listen for permission changes
  useEffect(() => {
    if (!navigator.permissions) return;

    let permissionStatus: PermissionStatus;

    const setupPermissionListener = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        const handlePermissionChange = () => {
          setPermissionState(permissionStatus.state);
          setHasPermission(permissionStatus.state === 'granted');
          
          // If permission was denied, stop the stream
          if (permissionStatus.state === 'denied') {
            cleanup();
          }
        };

        permissionStatus.addEventListener('change', handlePermissionChange);
        
        // Set initial state
        handlePermissionChange();
      } catch (err) {
        console.warn('Could not set up permission listener:', err);
      }
    };

    setupPermissionListener();

    return () => {
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', () => {});
      }
    };
  }, [cleanup]);

  return {
    // State
    stream,
    isLoading,
    isSupported,
    hasPermission,
    permissionState,
    devices,
    backCameras,
    frontCameras,
    currentFacingMode,
    error,
    
    // Actions
    requestPermission,
    requestWithDevice,
    requestWithQuality,
    requestWithFallback,
    requestBackCamera: requestBackCameraFn,
    requestFrontCamera: requestFrontCameraFn,
    requestBackCameraWithFallback: requestBackCameraWithFallbackFn,
    switchFacingMode: switchFacingModeFn,
    stopCamera,
    refreshDevices,
    checkPermission,
    
    // Utilities
    getDeviceById,
    switchCamera
  };
}

// Convenience hook for simple camera access
export function useSimpleCamera(autoStart = false) {
  return useCameraPermission({
    autoRequest: autoStart,
    useFallback: true,
    autoStop: true
  });
}

// Convenience hook for back camera access
export function useBackCamera(autoStart = false, quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium') {
  return useCameraPermission({
    autoRequest: autoStart,
    facingMode: 'environment',
    quality,
    useFallback: true,
    autoStop: true
  });
}

// Convenience hook for front camera access
export function useFrontCamera(autoStart = false, quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium') {
  return useCameraPermission({
    autoRequest: autoStart,
    facingMode: 'user',
    quality,
    useFallback: true,
    autoStop: true
  });
}
