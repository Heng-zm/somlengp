'use client';

import React, { 
  useEffect, 
  useState, 
  useRef, 
  useCallback, 
  useMemo,
  memo 
} from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface StaticPageConfig {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  priority?: number;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastmod?: string;
  template?: 'default' | 'article' | 'product' | 'landing';
  metadata?: Record<string, any>;
  accessibility?: AccessibilityConfig;
  performance?: PerformanceHints;
}

export interface AccessibilityConfig {
  skipToMain?: boolean;
  ariaLandmarks?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
  screenReaderOptimizations?: boolean;
  colorContrastCheck?: boolean;
  reducedMotion?: boolean;
  highContrastMode?: boolean;
}

export interface PerformanceHints {
  prefetchResources?: string[];
  preloadImages?: string[];
  criticalCSS?: string;
  deferNonCritical?: boolean;
  optimizeImages?: boolean;
  enableCompression?: boolean;
}

export interface CoreWebVitalsConfig {
  lcpThreshold?: number; // Largest Contentful Paint (ms)
  fidThreshold?: number; // First Input Delay (ms)
  clsThreshold?: number; // Cumulative Layout Shift
  fcpThreshold?: number; // First Contentful Paint (ms)
}

// ============================================================================
// ACCESSIBILITY HOOKS
// ============================================================================

export function useAccessibilityEnhancements(config: AccessibilityConfig = {}) {
  const [focusVisible, setFocusVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const focusableElements = useRef<HTMLElement[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };
    contrastQuery.addEventListener('change', handleContrastChange);

    // Focus management
    if (config.focusManagement) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          setFocusVisible(true);
        }
      };

      const handleMouseDown = () => {
        setFocusVisible(false);
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleMouseDown);

      // Update focusable elements list
      const updateFocusableElements = () => {
        const selector = [
          'a[href]',
          'button:not([disabled])',
          'textarea:not([disabled])',
          'input[type="text"]:not([disabled])',
          'input[type="radio"]:not([disabled])',
          'input[type="checkbox"]:not([disabled])',
          'select:not([disabled])',
          '[tabindex]:not([tabindex="-1"])'
        ].join(', ');
        
        focusableElements.current = Array.from(document.querySelectorAll(selector));
      };

      updateFocusableElements();
      const observer = new MutationObserver(updateFocusableElements);
      observer.observe(document.body, { childList: true, subtree: true });

      return () => {
        motionQuery.removeEventListener('change', handleMotionChange);
        contrastQuery.removeEventListener('change', handleContrastChange);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleMouseDown);
        observer.disconnect();
      };
    }

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, [config.focusManagement]);

  const skipToMain = useCallback(() => {
    const main = document.getElementById('main-content') || document.querySelector('main');
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [reducedMotion]);

  const trapFocus = useCallback((containerElement: HTMLElement) => {
    const focusable = containerElement.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusable.length === 0) return;
    
    const firstFocusable = focusable[0] as HTMLElement;
    const lastFocusable = focusable[focusable.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      } else if (e.key === 'Escape') {
        containerElement.focus();
      }
    };

    containerElement.addEventListener('keydown', handleKeyDown);
    
    return () => {
      containerElement.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    focusVisible,
    reducedMotion,
    highContrast,
    skipToMain,
    trapFocus,
    focusableElements: focusableElements.current
  };
}

// ============================================================================
// CORE WEB VITALS MONITORING
// ============================================================================

export function useCoreWebVitals(config: CoreWebVitalsConfig = {}) {
  const [vitals, setVitals] = useState<{
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  }>({});

  const [scores, setScores] = useState<{
    lcp?: 'good' | 'needs-improvement' | 'poor';
    fid?: 'good' | 'needs-improvement' | 'poor';
    cls?: 'good' | 'needs-improvement' | 'poor';
    fcp?: 'good' | 'needs-improvement' | 'poor';
  }>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            const lcp = entry.startTime;
            setVitals(prev => ({ ...prev, lcp }));
            setScores(prev => ({
              ...prev,
              lcp: lcp <= (config.lcpThreshold || 2500) ? 'good' : 
                   lcp <= 4000 ? 'needs-improvement' : 'poor'
            }));
            break;

          case 'first-input':
            const fid = (entry as any).processingStart - entry.startTime;
            setVitals(prev => ({ ...prev, fid }));
            setScores(prev => ({
              ...prev,
              fid: fid <= (config.fidThreshold || 100) ? 'good' : 
                   fid <= 300 ? 'needs-improvement' : 'poor'
            }));
            break;

          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              const cls = (vitals.cls || 0) + (entry as any).value;
              setVitals(prev => ({ ...prev, cls }));
              setScores(prev => ({
                ...prev,
                cls: cls <= (config.clsThreshold || 0.1) ? 'good' : 
                     cls <= 0.25 ? 'needs-improvement' : 'poor'
              }));
            }
            break;

          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              const fcp = entry.startTime;
              setVitals(prev => ({ ...prev, fcp }));
              setScores(prev => ({
                ...prev,
                fcp: fcp <= (config.fcpThreshold || 1800) ? 'good' : 
                     fcp <= 3000 ? 'needs-improvement' : 'poor'
              }));
            }
            break;

          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming;
            const ttfb = navEntry.responseStart - navEntry.requestStart;
            setVitals(prev => ({ ...prev, ttfb }));
            break;
        }
      });
    });

    try {
      observer.observe({ 
        entryTypes: [
          'largest-contentful-paint', 
          'first-input', 
          'layout-shift', 
          'paint',
          'navigation'
        ] 
      });
    } catch (e) {
      console.warn('Performance Observer not fully supported');
    }

    return () => observer.disconnect();
  }, [config, vitals.cls]);

  const overallScore = useMemo(() => {
    const scoreValues = { good: 3, 'needs-improvement': 2, poor: 1 };
    const scores_array = [scores.lcp, scores.fid, scores.cls, scores.fcp]
      .filter(Boolean)
      .map(score => scoreValues[score!]);
    
    if (scores_array.length === 0) return null;
    
    const average = scores_array.reduce((sum, score) => sum + score, 0) / scores_array.length;
    
    if (average >= 2.5) return 'good';
    if (average >= 2) return 'needs-improvement';
    return 'poor';
  }, [scores]);

  return {
    vitals,
    scores,
    overallScore
  };
}

// ============================================================================
// ACCESSIBILITY COMPONENTS
// ============================================================================

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink = memo(function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'bg-blue-600 text-white px-4 py-2 rounded-md z-50',
        'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  );
});

interface VisuallyHiddenProps {
  children: React.ReactNode;
  className?: string;
}

export const VisuallyHidden = memo(function VisuallyHidden({ children, className }: VisuallyHiddenProps) {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  );
});

interface FocusWrapperProps {
  children: React.ReactNode;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export const FocusWrapper = memo(function FocusWrapper({ 
  children, 
  autoFocus = false, 
  restoreFocus = true,
  className 
}: FocusWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const { trapFocus } = useAccessibilityEnhancements({ focusManagement: true });

  useEffect(() => {
    if (!wrapperRef.current) return;

    if (autoFocus) {
      previousFocus.current = document.activeElement as HTMLElement;
      wrapperRef.current.focus();
    }

    const cleanup = trapFocus(wrapperRef.current);

    return () => {
      cleanup?.();
      if (restoreFocus && previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [autoFocus, restoreFocus, trapFocus]);

  return (
    <div
      ref={wrapperRef}
      tabIndex={-1}
      className={cn('focus:outline-none', className)}
    >
      {children}
    </div>
  );
});

// ============================================================================
// OPTIMIZED STATIC PAGE WRAPPER
// ============================================================================

interface OptimizedStaticPageWrapperProps {
  children: React.ReactNode;
  config: StaticPageConfig;
  className?: string;
}

export const OptimizedStaticPageWrapper = memo(function OptimizedStaticPageWrapper({
  children,
  config,
  className
}: OptimizedStaticPageWrapperProps) {
  const pathname = usePathname();
  const { reducedMotion, highContrast, skipToMain } = useAccessibilityEnhancements(config.accessibility);
  const { vitals, scores, overallScore } = useCoreWebVitals();

  // Preload critical resources
  useEffect(() => {
    if (!config.performance?.prefetchResources) return;

    config.performance.prefetchResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }, [config.performance?.prefetchResources]);

  // Critical CSS injection
  useEffect(() => {
    if (!config.performance?.criticalCSS) return;

    const style = document.createElement('style');
    style.textContent = config.performance.criticalCSS;
    style.setAttribute('data-critical', 'true');
    document.head.insertBefore(style, document.head.firstChild);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [config.performance?.criticalCSS]);

  // Performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && Object.keys(vitals).length > 0) {
      console.group(`🎯 Core Web Vitals for ${pathname}`);
      console.log('LCP:', vitals.lcp?.toFixed(0), 'ms', `(${scores.lcp})`);
      console.log('FID:', vitals.fid?.toFixed(0), 'ms', `(${scores.fid})`);
      console.log('CLS:', vitals.cls?.toFixed(3), `(${scores.cls})`);
      console.log('FCP:', vitals.fcp?.toFixed(0), 'ms', `(${scores.fcp})`);
      
      console.groupEnd();
    }
  }, [vitals, scores, overallScore, pathname]);

  return (
    <div 
      className={cn(
        'min-h-screen',
        reducedMotion && 'motion-reduce:transition-none',
        highContrast && 'contrast-more:border-black',
        className
      )}
    >
      {/* Skip to main content link */}
      {config.accessibility?.skipToMain && (
        <SkipLink href="#main-content">
          Skip to main content
        </SkipLink>
      )}

      {/* Main content with proper landmarks */}
      <main 
        id="main-content" 
        tabIndex={-1}
        className="focus:outline-none"
        role="main"
        aria-label="Main content"
      >
        {children}
      </main>

      {/* Performance debugging overlay */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
          <div className="font-bold mb-2">Core Web Vitals</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>LCP:</span>
              <span className={cn(
                'font-bold',
                scores.lcp === 'good' && 'text-green-400',
                scores.lcp === 'needs-improvement' && 'text-yellow-400',
                scores.lcp === 'poor' && 'text-red-400'
              )}>
                {vitals.lcp?.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>FID:</span>
              <span className={cn(
                'font-bold',
                scores.fid === 'good' && 'text-green-400',
                scores.fid === 'needs-improvement' && 'text-yellow-400',
                scores.fid === 'poor' && 'text-red-400'
              )}>
                {vitals.fid?.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>CLS:</span>
              <span className={cn(
                'font-bold',
                scores.cls === 'good' && 'text-green-400',
                scores.cls === 'needs-improvement' && 'text-yellow-400',
                scores.cls === 'poor' && 'text-red-400'
              )}>
                {vitals.cls?.toFixed(3)}
              </span>
            </div>
            {overallScore && (
              <div className="flex justify-between pt-1 border-t border-gray-600">
                <span>Score:</span>
                <span className={cn(
                  'font-bold uppercase',
                  overallScore === 'good' && 'text-green-400',
                  overallScore === 'needs-improvement' && 'text-yellow-400',
                  overallScore === 'poor' && 'text-red-400'
                )}>
                  {overallScore}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// STATIC PAGE GENERATOR UTILITIES
// ============================================================================

export function generateStaticPageConfig(overrides: Partial<StaticPageConfig>): StaticPageConfig {
  return {
    path: '/',
    title: 'Somleng - AI-Powered Tools',
    description: 'Advanced AI tools for document processing, transcription, and content generation.',
    keywords: ['AI', 'tools', 'productivity', 'automation'],
    priority: 1.0,
    changefreq: 'weekly',
    lastmod: new Date().toISOString(),
    template: 'default',
    metadata: {},
    accessibility: {
      skipToMain: true,
      ariaLandmarks: true,
      focusManagement: true,
      keyboardNavigation: true,
      screenReaderOptimizations: true,
      colorContrastCheck: true,
      reducedMotion: true,
      highContrastMode: true
    },
    performance: {
      prefetchResources: [],
      preloadImages: [],
      deferNonCritical: true,
      optimizeImages: true,
      enableCompression: true
    },
    ...overrides
  };
}

export function validateAccessibility(element: HTMLElement): {
  issues: string[];
  score: number;
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for alt text on images
  const images = element.querySelectorAll('img:not([alt])');
  if (images.length > 0) {
    issues.push(`${images.length} images missing alt text`);
    suggestions.push('Add descriptive alt text to all images');
  }

  // Check for heading hierarchy
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let previousLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > previousLevel + 1) {
      issues.push('Heading hierarchy is not sequential');
      suggestions.push('Ensure headings follow sequential order (h1 → h2 → h3, etc.)');
    }
    previousLevel = level;
  });

  // Check for form labels
  const inputs = element.querySelectorAll('input:not([type="hidden"]), textarea, select');
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    if (!id || !element.querySelector(`label[for="${id}"]`)) {
      issues.push('Form inputs missing associated labels');
      suggestions.push('Associate all form inputs with descriptive labels');
    }
  });

  // Check for focus indicators
  const focusableElements = element.querySelectorAll('a, button, input, textarea, select, [tabindex]');
  // This would need runtime checking for CSS focus styles

  // Calculate score (higher is better)
  const maxScore = 100;
  const score = Math.max(0, maxScore - (issues.length * 10));

  return {
    issues,
    score,
    suggestions
  };
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const StaticGeneration = {
  // Hooks
  useAccessibilityEnhancements,
  useCoreWebVitals,
  
  // Components
  SkipLink,
  VisuallyHidden,
  FocusWrapper,
  OptimizedStaticPageWrapper,
  
  // Utilities
  generateStaticPageConfig,
  validateAccessibility
};

export default StaticGeneration;