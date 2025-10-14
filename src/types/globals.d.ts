
// Performance monitoring types
export interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
  };
  timing: {
    load: number;
    domContent: number;
  };
  network: string;
}

// QR Code types
export interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  version?: number;
  maskPattern?: number;
  margin?: number;
  scale?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

// Extended Window interface
declare global {
  interface Window {
    webVitals?: any;
    gtag?: (...args: any[]) => void;
  }
}

export {};
