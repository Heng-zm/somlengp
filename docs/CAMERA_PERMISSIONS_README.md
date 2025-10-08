# Camera Permission Utilities

This project now includes comprehensive camera permission utilities that make it easy to request, manage, and work with camera permissions in your React applications.

## 🎯 Features

- ✅ **Comprehensive Permission Handling** - Automatic permission checking and error handling
- ✅ **Multiple Quality Options** - Support for low, medium, high, and ultra quality
- ✅ **Device Selection** - Select specific camera devices
- ✅ **Fallback Constraints** - Automatic fallback to lower quality if needed
- ✅ **React Hooks Integration** - Easy-to-use React hooks
- ✅ **TypeScript Support** - Full TypeScript support with proper types
- ✅ **Error Mapping** - User-friendly error messages
- ✅ **Permission State Tracking** - Real-time permission state monitoring

## 📁 Files Added

1. **`src/utils/camera-permissions.ts`** - Core utility functions
2. **`src/hooks/use-camera-permission.ts`** - React hooks for camera management
3. **`src/components/camera-example.tsx`** - Simple example component
4. **`src/components/camera-debug.tsx`** - Enhanced debug tool (updated)

## 🚀 Quick Start

### Basic Usage with React Hook

```tsx
import { useSimpleCamera } from '@/hooks/use-camera-permission';

function MyComponent() {
  const { stream, requestPermission, stopCamera, isLoading, error } = useSimpleCamera();

  return (
    <div>
      {!stream ? (
        <button onClick={requestPermission} disabled={isLoading}>
          Start Camera
        </button>
      ) : (
        <button onClick={stopCamera}>Stop Camera</button>
      )}
      
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          srcObject={stream}
        />
      )}
    </div>
  );
}
```

### Advanced Usage

```tsx
import { useCameraPermission } from '@/hooks/use-camera-permission';

function AdvancedCamera() {
  const {
    stream,
    devices,
    requestWithQuality,
    requestWithDevice,
    switchCamera,
    isLoading,
    error
  } = useCameraPermission();

  return (
    <div>
      {/* Quality Selection */}
      <button onClick={() => requestWithQuality('high')}>
        High Quality
      </button>
      
      {/* Device Selection */}
      {devices.map(device => (
        <button
          key={device.deviceId}
          onClick={() => requestWithDevice(device.deviceId)}
        >
          {device.label}
        </button>
      ))}
    </div>
  );
}
```

## 📚 API Reference

### Core Functions (`camera-permissions.ts`)

#### `requestCameraPermission(constraints?)`
Request camera access with optional constraints.
- **Returns**: `Promise<CameraPermissionResult>`
- **Example**: `await requestCameraPermission({ video: { width: 1280 } })`

#### `requestCameraWithQuality(quality, constraints?)`
Request camera with predefined quality settings.
- **Quality**: `'low' | 'medium' | 'high' | 'ultra'`
- **Example**: `await requestCameraWithQuality('high')`

#### `requestCameraWithDevice(deviceId, constraints?)`
Request camera access for a specific device.
- **Example**: `await requestCameraWithDevice('camera-device-id')`

#### `getCameraDevices()`
Get list of available camera devices.
- **Returns**: `Promise<CameraDeviceInfo[]>`

#### `getCameraPermissionStatus()`
Check current permission status.
- **Returns**: `Promise<PermissionState | null>`

#### `isCameraSupported()`
Check if camera is supported in current environment.
- **Returns**: `boolean`

### React Hooks

#### `useCameraPermission(options?)`
Comprehensive camera permission hook with full control.

**Options:**
```tsx
interface UseCameraPermissionOptions {
  autoRequest?: boolean;        // Auto-request on mount
  defaultConstraints?: CameraConstraints;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  useFallback?: boolean;        // Use fallback constraints
  autoStop?: boolean;           // Auto-stop on unmount
}
```

**Returns:**
```tsx
interface UseCameraPermissionReturn {
  // State
  stream: MediaStream | null;
  isLoading: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  permissionState: PermissionState | null;
  devices: CameraDeviceInfo[];
  error: CameraPermissionResult['error'] | null;
  
  // Actions
  requestPermission: (constraints?) => Promise<CameraPermissionResult>;
  requestWithDevice: (deviceId) => Promise<CameraPermissionResult>;
  requestWithQuality: (quality) => Promise<CameraPermissionResult>;
  requestWithFallback: () => Promise<CameraPermissionResult>;
  stopCamera: () => void;
  refreshDevices: () => Promise<void>;
  checkPermission: () => Promise<void>;
  
  // Utilities
  getDeviceById: (deviceId) => CameraDeviceInfo | undefined;
  switchCamera: (deviceId) => Promise<CameraPermissionResult>;
}
```

#### `useSimpleCamera(autoStart?)`
Simplified hook for basic camera access.
- **autoStart**: `boolean` - Auto-request permission on mount
- **Returns**: Subset of `UseCameraPermissionReturn` with essential features

## 🔧 Error Handling

The utilities provide comprehensive error handling with user-friendly messages:

```tsx
const result = await requestCameraPermission();

if (!result.success) {
  switch (result.error?.code) {
    case 'PERMISSION_DENIED':
      // User denied camera access
      break;
    case 'NO_CAMERA_FOUND':
      // No camera device found
      break;
    case 'CAMERA_IN_USE':
      // Camera is being used by another app
      break;
    case 'UNSUPPORTED_CONSTRAINTS':
      // Camera doesn't support requested settings
      break;
  }
}
```

## 📱 Quality Settings

Predefined quality settings for different use cases:

| Quality | Resolution | Use Case |
|---------|------------|----------|
| `low` | 320x240 | Basic video calls, low bandwidth |
| `medium` | 640x480 | Standard video calls |
| `high` | 1280x720 | HD video recording |
| `ultra` | 1920x1080 | Full HD recording |

## 🎯 Examples

### 1. Simple Camera Access
```tsx
function SimpleCamera() {
  const { stream, requestPermission, stopCamera } = useSimpleCamera();
  // Implementation...
}
```

### 2. Camera with Device Selection
```tsx
function MultiCamera() {
  const { devices, requestWithDevice } = useCameraPermission();
  
  return (
    <div>
      {devices.map(device => (
        <button
          key={device.deviceId}
          onClick={() => requestWithDevice(device.deviceId)}
        >
          📷 {device.label}
        </button>
      ))}
    </div>
  );
}
```

### 3. Quality Selection
```tsx
function QualityCamera() {
  const { requestWithQuality } = useCameraPermission();
  
  const qualities = ['low', 'medium', 'high', 'ultra'] as const;
  
  return (
    <div>
      {qualities.map(quality => (
        <button
          key={quality}
          onClick={() => requestWithQuality(quality)}
        >
          {quality} quality
        </button>
      ))}
    </div>
  );
}
```

## 🔍 Debug Tool

Use the enhanced camera debug tool at `/camera-debug` to:
- Check camera support and permissions
- Test different quality settings
- Test specific camera devices
- View detailed error information
- Monitor permission state changes

## 🛡️ Security Notes

1. **HTTPS Required**: Camera access requires a secure context (HTTPS)
2. **User Permission**: Always handle permission denial gracefully
3. **Privacy**: Stop camera streams when not needed to respect user privacy
4. **Error Handling**: Provide clear feedback for permission issues

## 📝 Best Practices

1. **Always check support**: Use `isCameraSupported()` before requesting access
2. **Handle errors gracefully**: Provide user-friendly error messages
3. **Clean up streams**: Always stop camera streams when done
4. **Use appropriate quality**: Choose quality based on your use case
5. **Respect user privacy**: Don't auto-start camera without user interaction

## 🐛 Troubleshooting

### Common Issues:

1. **"Camera not supported"**
   - Ensure you're using HTTPS
   - Check if browser supports WebRTC

2. **"Permission denied"**
   - User needs to allow camera access
   - Check browser permission settings

3. **"No camera found"**
   - Ensure camera is connected
   - Check if camera is being used by another app

4. **"Camera in use"**
   - Close other applications using the camera
   - Restart the browser

## 📊 Browser Support

The utilities work in all modern browsers that support:
- WebRTC (`getUserMedia`)
- MediaDevices API
- Permissions API (optional, for enhanced features)

This includes Chrome, Firefox, Safari, and Edge.
