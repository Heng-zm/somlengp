import { lazy } from 'react';

// Lazy load chart components to reduce initial bundle size
export const PerformanceDashboard = lazy(() => import('../shared/performance-dashboard'));
export const EnhancedPerformanceDashboard = lazy(() => import('../shared/enhanced-performance-dashboard'));