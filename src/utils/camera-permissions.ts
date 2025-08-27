/**
 * Camera Permission Utilities
 * Comprehensive functions for requesting and managing camera permissions
 */

export interface CameraPermissionResult {
  success: boolean;
  stream?: MediaStream;
  error?: {
    name: string;
    message: string;
    code?: string;
  };
  permissions?: {
    camera: PermissionState;
  };
}

export interface CameraConstraints {
  video?: MediaTrackConstraints | boolean;
  audio?: boolean;
}

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  groupId: string;
}

/**
 * Check if the browser supports camera access
 */
export function isCameraSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    window.isSecureContext
  );
}

/**
 * Check current camera permission status
 */
export async function getCameraPermissionStatus(): Promise<PermissionState | null> {
  try {
    if (!('permissions' in navigator)) {
      return null;
    }
    
    const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return permission.state;
  } catch (error) {
    console.warn('Could not query camera permission:', error);
    return null;
  }
}

/**
 * Get list of available camera devices
 */
export async function getCameraDevices(): Promise<CameraDeviceInfo[]> {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) {
      throw new Error('Device enumeration not supported');
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter(device => device.kind === 'videoinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 8)}...`,
        kind: device.kind,
        groupId: device.groupId
      }));
  } catch (error) {
    console.error('Error getting camera devices:', error);
    return [];
  }
}

/**
 * Request camera permission and return stream
 */
export async function requestCameraPermission(
  constraints: CameraConstraints = { video: true }
): Promise<CameraPermissionResult> {
  // Check if camera is supported
  if (!isCameraSupported()) {
    return {
      success: false,
      error: {
        name: 'NotSupportedError',
        message: 'Camera access is not supported in this browser or requires HTTPS',
        code: 'CAMERA_NOT_SUPPORTED'
      }
    };
  }

  try {
    // Get current permission status
    const permissionStatus = await getCameraPermissionStatus();
    
    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    return {
      success: true,
      stream,
      permissions: {
        camera: permissionStatus || 'granted'
      }
    };
  } catch (error) {
    const err = error as DOMException;
    
    // Map specific error types to user-friendly messages
    const errorMap: Record<string, { message: string; code: string }> = {
      'NotAllowedError': {
        message: 'Camera access was denied. Please allow camera permissions in your browser.',
        code: 'PERMISSION_DENIED'
      },
      'NotFoundError': {
        message: 'No camera was found. Please check if a camera is connected.',
        code: 'NO_CAMERA_FOUND'
      },
      'NotReadableError': {
        message: 'Camera is already in use by another application.',
        code: 'CAMERA_IN_USE'
      },
      'OverconstrainedError': {
        message: 'Camera does not support the requested video settings.',
        code: 'UNSUPPORTED_CONSTRAINTS'
      },
      'AbortError': {
        message: 'Camera access was aborted.',
        code: 'ACCESS_ABORTED'
      },
      'SecurityError': {
        message: 'Camera access blocked due to security restrictions.',
        code: 'SECURITY_ERROR'
      }
    };

    const errorInfo = errorMap[err.name] || {
      message: `Camera access failed: ${err.message}`,
      code: 'UNKNOWN_ERROR'
    };

    return {
      success: false,
      error: {
        name: err.name,
        message: errorInfo.message,
        code: errorInfo.code
      }
    };
  }
}

/**
 * Request camera with specific device ID
 */
export async function requestCameraWithDevice(
  deviceId: string,
  constraints: Omit<CameraConstraints, 'video'> = {}
): Promise<CameraPermissionResult> {
  const videoConstraints: MediaTrackConstraints = {
    deviceId: { exact: deviceId },
    width: { ideal: 1280, min: 320 },
    height: { ideal: 720, min: 240 }
  };

  return requestCameraPermission({
    ...constraints,
    video: videoConstraints
  });
}

/**
 * Request camera with quality preferences
 */
export async function requestCameraWithQuality(
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium',
  constraints: Omit<CameraConstraints, 'video'> = {},
  facingMode: 'user' | 'environment' = 'user'
): Promise<CameraPermissionResult> {
  const qualityMap = {
    low: { width: 320, height: 240 },
    medium: { width: 640, height: 480 },
    high: { width: 1280, height: 720 },
    ultra: { width: 1920, height: 1080 }
  };

  const { width, height } = qualityMap[quality];
  
  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: width, min: 320 },
    height: { ideal: height, min: 240 },
    facingMode // Use provided facing mode (user for front, environment for back)
  };

  return requestCameraPermission({
    ...constraints,
    video: videoConstraints
  });
}

/**
 * Stop camera stream and release resources
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (!stream) return;
  
  stream.getTracks().forEach(track => {
    track.stop();
  });
}

/**
 * Get detailed camera capabilities
 */
export async function getCameraCapabilities(deviceId: string): Promise<MediaTrackCapabilities | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } }
    });
    
    const videoTrack = stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    
    // Clean up
    stopCameraStream(stream);
    
    return capabilities;
  } catch (error) {
    console.error('Error getting camera capabilities:', error);
    return null;
  }
}

/**
 * Check if camera permission is permanently denied
 */
export async function isCameraPermissionDenied(): Promise<boolean> {
  const status = await getCameraPermissionStatus();
  return status === 'denied';
}

/**
 * Comprehensive camera permission check with detailed info
 */
export async function checkCameraPermissionDetails() {
  const result = {
    supported: isCameraSupported(),
    secureContext: window.isSecureContext,
    mediaDevicesSupported: !!navigator.mediaDevices,
    getUserMediaSupported: !!navigator.mediaDevices?.getUserMedia,
    permissionStatus: await getCameraPermissionStatus(),
    devices: [] as CameraDeviceInfo[],
    userAgent: navigator.userAgent,
    location: window.location.href
  };

  if (result.supported) {
    result.devices = await getCameraDevices();
  }

  return result;
}

/**
 * Request back camera (rear-facing) specifically
 */
export async function requestBackCamera(
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium',
  constraints: Omit<CameraConstraints, 'video'> = {}
): Promise<CameraPermissionResult> {
  return requestCameraWithQuality(quality, constraints, 'environment');
}

/**
 * Request front camera (user-facing) specifically
 */
export async function requestFrontCamera(
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium',
  constraints: Omit<CameraConstraints, 'video'> = {}
): Promise<CameraPermissionResult> {
  return requestCameraWithQuality(quality, constraints, 'user');
}

/**
 * Get back camera devices
 * Note: Device labels may not be available without permission
 */
export async function getBackCameraDevices(): Promise<CameraDeviceInfo[]> {
  const devices = await getCameraDevices();
  // Filter devices that are likely back cameras based on label patterns
  return devices.filter(device => {
    const label = device.label.toLowerCase();
    return (
      label.includes('back') ||
      label.includes('rear') ||
      label.includes('environment') ||
      label.includes('camera2') || // Common on Android
      label.includes('facing back')
    );
  });
}

/**
 * Get front camera devices
 * Note: Device labels may not be available without permission
 */
export async function getFrontCameraDevices(): Promise<CameraDeviceInfo[]> {
  const devices = await getCameraDevices();
  // Filter devices that are likely front cameras based on label patterns
  return devices.filter(device => {
    const label = device.label.toLowerCase();
    return (
      label.includes('front') ||
      label.includes('user') ||
      label.includes('selfie') ||
      label.includes('camera0') || // Common on Android
      label.includes('facing front') ||
      (!label.includes('back') && !label.includes('rear')) // Default assumption
    );
  });
}

/**
 * Request back camera with fallback to any available camera
 */
export async function requestBackCameraWithFallback(
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
): Promise<CameraPermissionResult> {
  // First try to get back camera using facingMode
  try {
    const result = await requestBackCamera(quality);
    if (result.success) {
      return result;
    }
  } catch (error) {
    console.warn('Back camera request failed, trying device enumeration');
  }

  // If facingMode fails, try to find back camera devices
  const backCameras = await getBackCameraDevices();
  for (const camera of backCameras) {
    try {
      const result = await requestCameraWithDevice(camera.deviceId);
      if (result.success) {
        return result;
      }
    } catch (error) {
      continue;
    }
  }

  // If no back camera found, try any available camera
  return requestCameraWithFallback();
}

/**
 * Request camera with fallback options
 */
export async function requestCameraWithFallback(
  facingMode: 'user' | 'environment' = 'user'
): Promise<CameraPermissionResult> {
  const fallbackConstraints = [
    // Try high quality first with preferred facing mode
    { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode } },
    // Fallback to medium quality with facing mode
    { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode } },
    // Fallback to any quality with facing mode
    { video: { facingMode } },
    // Fallback to any video without facing mode constraint
    { video: true },
    // Last resort - basic constraints
    { video: { width: 320, height: 240 } }
  ];

  for (const constraints of fallbackConstraints) {
    try {
      const result = await requestCameraPermission(constraints);
      if (result.success) {
        return result;
      }
    } catch (error) {
      // Continue to next fallback
      continue;
    }
  }

  // If all fallbacks fail, return the last error
  return requestCameraPermission({ video: true });
}

/**
 * Switch between front and back cameras
 */
export async function switchCameraFacing(
  currentStream: MediaStream | null,
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
): Promise<CameraPermissionResult> {
  // Stop current stream
  if (currentStream) {
    stopCameraStream(currentStream);
  }

  // Detect current facing mode from stream settings
  let currentFacingMode: 'user' | 'environment' = 'user';
  if (currentStream) {
    const videoTrack = currentStream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      currentFacingMode = (settings.facingMode as 'user' | 'environment') || 'user';
    }
  }

  // Switch to opposite facing mode
  const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
  
  // Request camera with new facing mode
  return requestCameraWithQuality(quality, {}, newFacingMode);
}
