// Dynamic imports for heavy components to improve initial page load
import dynamic from 'next/dynamic';

// AI Assistant components - loaded only when needed
export const LazyAIAssistant = dynamic(
  () => import('../app/ai-assistant/page'),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"></div>
        </div>
      </div>
    ),
    ssr: false
  }
);

// Chart components - heavy with recharts
export const LazyAnalyticsChart = dynamic(
  () => import('../components/charts/analytics-chart'),
  {
    loading: () => (
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
    ),
    ssr: false
  }
);

// PDF viewer/processor - heavy with pdf-lib
export const LazyPDFProcessor = dynamic(
  () => import('../components/pdf/pdf-processor'),
  {
    loading: () => (
      <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading PDF tools...</div>
      </div>
    ),
    ssr: false
  }
);

// QR Code generator - heavy with qrcode library
export const LazyQRCodeGenerator = dynamic(
  () => import('../components/qr/qr-code-generator'),
  {
    loading: () => (
      <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
    ),
    ssr: false
  }
);

// Image processing components - heavy with canvas operations
export const LazyImageProcessor = dynamic(
  () => import('../components/image/image-processor'),
  {
    loading: () => (
      <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading image tools...</div>
      </div>
    ),
    ssr: false
  }
);

// Audio/Speech components - heavy with Web APIs
export const LazyAudioRecorder = dynamic(
  () => import('../components/audio/audio-recorder'),
  {
    loading: () => (
      <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading audio recorder...</div>
      </div>
    ),
    ssr: false
  }
);

export const LazyTextToSpeech = dynamic(
  () => import('../components/audio/text-to-speech'),
  {
    loading: () => (
      <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
    ),
    ssr: false
  }
);

// Performance overlay - development only
export const LazyPerformanceOverlay = dynamic(
  () => import('../components/shared/performance-dashboard'),
  {
    loading: () => null,
    ssr: false
  }
);

// Camera components - heavy with media APIs
export const LazyCameraCapture = dynamic(
  () => import('../components/camera/camera-capture'),
  {
    loading: () => (
      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading camera...</div>
      </div>
    ),
    ssr: false
  }
);