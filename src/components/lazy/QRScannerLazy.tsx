import { lazy, ComponentType } from 'react';

// Lazy load QR scanner components to reduce initial bundle size
export const OptimizedQRScanner = lazy(() => import('../optimized-qr-scanner'));
export const QRScanner = lazy(() => import('../qr-scanner'));
export const SimpleQRScanner = lazy(() => import('../simple-qr-scanner'));

// Re-export types if needed
export type { OptimizedQRScannerProps } from '../optimized-qr-scanner';