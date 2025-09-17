/**
 * Back Camera Demo Page
 * Showcases the back camera functionality
 */
import { BackCameraExample, SimpleBackCameraExample } from '@/components/back-camera-example';
export default function BackCameraDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  📷 Back Camera Demo
                </h1>
              </div>
            </div>
            <nav className="flex space-x-8">
              <a
                href="/camera-debug"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Camera Debug
              </a>
            </nav>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-8">
            {/* Introduction */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  📱 Back Camera API Demo
                </h2>
                <div className="prose text-gray-600">
                  <p>
                    This demo showcases the enhanced camera utilities with dedicated back camera support.
                    The implementation provides easy access to the rear-facing camera using the WebRTC 
                    <code>facingMode: &apos;environment&apos;</code> constraint.
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">✨ Features:</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Direct back camera access</li>
                        <li>Fallback mechanisms</li>
                        <li>Device enumeration</li>
                        <li>Camera switching</li>
                        <li>Photo capture</li>
                        <li>Quality selection</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">🛠️ API Methods:</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li><code>requestBackCamera()</code></li>
                        <li><code>requestBackCameraWithFallback()</code></li>
                        <li><code>switchFacingMode()</code></li>
                        <li><code>getBackCameraDevices()</code></li>
                        <li><code>useBackCamera()</code> hook</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Full Featured Demo */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  🔥 Full Featured Back Camera Demo
                </h2>
                <BackCameraExample />
              </div>
            </div>
            {/* Simple Demo */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  ⚡ Simple Back Camera Demo
                </h2>
                <SimpleBackCameraExample />
              </div>
            </div>
            {/* Code Examples */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  💻 Code Examples
                </h2>
                <div className="space-y-6">
                  {/* Basic Usage */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Usage</h3>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { useBackCamera } from '@/hooks/use-camera-permission';
function MyComponent() {
  const { 
    stream, 
    requestBackCamera, 
    stopCamera, 
    isLoading, 
    error 
  } = useBackCamera();
  return (
    <div>
      <button onClick={() => requestBackCamera('high')}>
        Start Back Camera
      </button>
      <button onClick={stopCamera}>
        Stop Camera
      </button>
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
}`}
                    </pre>
                  </div>
                  {/* Advanced Usage */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Advanced Usage with Device Switching</h3>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { useCameraPermission } from '@/hooks/use-camera-permission';
function AdvancedCameraComponent() {
  const {
    stream,
    backCameras,
    frontCameras,
    currentFacingMode,
    requestBackCamera,
    requestFrontCamera,
    switchFacingMode,
    requestWithDevice
  } = useCameraPermission();
  return (
    <div>
      {/* Back camera options */}
      {backCameras.map(camera => (
        <button 
          key={camera.deviceId}
          onClick={() => requestWithDevice(camera.deviceId)}
        >
          {camera.label}
        </button>
      ))}
      {/* Switch between front/back */}
      <button onClick={() => switchFacingMode('high')}>
        Switch to {currentFacingMode === 'user' ? 'Back' : 'Front'} Camera
      </button>
    </div>
  );
}`}
                    </pre>
                  </div>
                  {/* Direct API Usage */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Direct API Usage</h3>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { 
// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions

  requestBackCamera, 
  requestBackCameraWithFallback,
  getBackCameraDevices 
} from '@/utils/camera-permissions';
async function startBackCamera() {
  // Direct back camera access
  const result = await requestBackCamera('high');
  if (result.success) {
  } else {
    console.error('Failed:', result.error);
  }
}
async function startWithFallback() {
  // With fallback for better compatibility
  const result = await requestBackCameraWithFallback('medium');
  return result;
}
async function listBackCameras() {
  const devices = await getBackCameraDevices();
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
            {/* Browser Compatibility */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  🌐 Browser Compatibility
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Browser
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Back Camera Support
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Chrome Mobile
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Full Support
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Excellent facingMode support
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Safari iOS
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Full Support
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Good compatibility
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Firefox Mobile
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Partial Support
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          May require fallback
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Desktop Browsers
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Limited
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Usually only one camera available
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
