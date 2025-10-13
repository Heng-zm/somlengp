'use client';

import { 
  memo, 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  Suspense, 
  lazy,
  ComponentType,
  ReactNode 
} from 'react';
import { OptimizedLoader, SectionLoader } from './optimized-loader';

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Advanced Intersection Observer Hook for Lazy Loading
 */
export const useIntersectionObserver = (
  threshold = 0.1,
  rootMargin = '100px',
  delay = 0
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setElement = useCallback((element: HTMLElement | null) => {
    if (elementRef.current && observerRef.current) {
      observerRef.current.unobserve(elementRef.current);
    }
    
    elementRef.current = element;
    
    if (element && !hasLoaded) {
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (delay > 0) {
                  setTimeout(() => {
                    setIsVisible(true);
                    setHasLoaded(true);
                  }, delay);
                } else {
                  setIsVisible(true);
                  setHasLoaded(true);
                }
                
                if (observerRef.current && elementRef.current) {
                  observerRef.current.unobserve(elementRef.current);
                }
              }
            });
          },
          {
            threshold: Array.isArray(threshold) ? threshold : [threshold],
            rootMargin,
          }
        );
      }
      
      observerRef.current.observe(element);
    }
  }, [threshold, rootMargin, delay, hasLoaded]);

  useEffect(() => {
    return () => {
      if (observerRef.current && elementRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { isVisible: isVisible || hasLoaded, setElement, hasLoaded };
};

/**
 * Advanced Lazy Component Wrapper
 */
export const LazyComponent = memo(function LazyComponent({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  delay = 0,
  onLoad,
  onError,
}: LazyComponentProps) {
  const { isVisible, setElement } = useIntersectionObserver(
    threshold,
    rootMargin,
    delay
  );
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible && !hasError) {
      setIsLoading(true);
      try {
        onLoad?.();
        setIsLoading(false);
      } catch (error) {
        setHasError(true);
        setIsLoading(false);
        onError?.(error as Error);
      }
    }
  }, [isVisible, hasError, onLoad, onError]);

  const defaultFallback = fallback || (
    <SectionLoader text="Loading content..." height="h-24" />
  );

  if (hasError) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-sm">Failed to load content</span>
      </div>
    );
  }

  return (
    <div ref={setElement}>
      {isVisible ? (
        isLoading ? defaultFallback : children
      ) : (
        defaultFallback
      )}
    </div>
  );
});

/**
 * Code Highlighter with Advanced Lazy Loading
 */
interface LazyCodeHighlighterProps {
  language: string;
  children: string;
  customStyle?: React.CSSProperties;
  showLineNumbers?: boolean;
}

// Enhanced Code Skeleton
const CodeSkeleton = memo(function CodeSkeleton({ 
  lines = 5, 
  showLineNumbers = false 
}: { 
  lines?: number; 
  showLineNumbers?: boolean;
}) {
  return (
    <div className="my-3 sm:my-4 rounded-md sm:rounded-lg overflow-hidden bg-gray-900 border border-gray-600 dark:border-gray-700 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between bg-gray-800 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2">
        <div className="h-3 bg-gray-600 rounded w-16"></div>
        <div className="h-3 w-3 bg-gray-600 rounded"></div>
      </div>
      
      {/* Code skeleton */}
      <div className="p-2 sm:p-3 md:p-4">
        <div className="space-y-2">
          {Array.from({ length: Math.min(lines, 10) }, (_, i) => (
            <div key={`skeleton-line-${i}`} className="flex items-center space-x-2">
              {showLineNumbers && (
                <div className="w-6 h-3 bg-gray-700 rounded flex-shrink-0"></div>
              )}
              <div 
                className={`h-3 bg-gray-700 rounded ${
                  i === 0 ? 'w-3/4' : 
                  i === 1 ? 'w-1/2' : 
                  i === lines - 1 ? 'w-2/3' :
                  'w-5/6'
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Lazy-loaded Syntax Highlighter
const SyntaxHighlighter = lazy(() => 
  import('react-syntax-highlighter').then(module => ({
    default: module.Prism
  }))
);

export const AdvancedLazyCodeHighlighter = memo(function AdvancedLazyCodeHighlighter({
  language,
  children,
  customStyle,
  showLineNumbers = false
}: LazyCodeHighlighterProps) {
  const lineCount = String(children || '').split('\n').length;
  const [loadError, setLoadError] = useState(false);
  
  // Fallback if children is null/undefined
  if (!children || typeof children !== 'string') {
    return <CodeSkeleton lines={3} showLineNumbers={showLineNumbers} />;
  }

  const handleLoadError = useCallback((error: Error) => {
    console.warn('Code highlighter failed to load:', error);
    setLoadError(true);
  }, []);

  // If syntax highlighter fails to load, fall back to simple highlighting
  if (loadError) {
    return (
      <div className="my-3 sm:my-4 rounded-md sm:rounded-lg overflow-hidden bg-black dark:bg-gray-900 border border-gray-600 dark:border-gray-700">
        <div className="flex items-center justify-between bg-gray-800 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2">
          <span className="text-gray-300 font-mono text-xs">{language}</span>
        </div>
        <div className="overflow-x-auto">
          <pre className="p-2 sm:p-3 md:p-4 text-white font-mono text-xs leading-tight whitespace-pre">
            <code className="block">{children}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <LazyComponent
      threshold={0.1}
      rootMargin="100px"
      onError={handleLoadError}
      fallback={<CodeSkeleton lines={Math.min(lineCount, 10)} showLineNumbers={showLineNumbers} />}
    >
      <Suspense fallback={<CodeSkeleton lines={Math.min(lineCount, 10)} showLineNumbers={showLineNumbers} />}>
        <div className="my-3 sm:my-4 rounded-md sm:rounded-lg overflow-hidden bg-black dark:bg-gray-900 border border-gray-600 dark:border-gray-700">
          <div className="flex items-center justify-between bg-gray-800 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2">
            <span className="text-gray-300 font-mono text-xs">{language}</span>
          </div>
          <div className="overflow-x-auto">
            <SyntaxHighlighter
              language={language || 'text'}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: '8px 12px',
                background: 'transparent',
                fontSize: 'clamp(10px, 2.5vw, 14px)',
                lineHeight: '1.4',
                ...customStyle
              }}
              showLineNumbers={showLineNumbers}
              wrapLines={false}
              wrapLongLines={true}
            >
              {children}
            </SyntaxHighlighter>
          </div>
        </div>
      </Suspense>
    </LazyComponent>
  );
});

/**
 * Image Lazy Loader with Advanced Features
 */
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f3f4f6"/></svg>',
  onLoad,
  onError
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageError, setImageError] = useState(false);
  const { isVisible, setElement } = useIntersectionObserver(0.1, '50px');

  useEffect(() => {
    if (isVisible && !imageError) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        onLoad?.();
      };
      img.onerror = () => {
        setImageError(true);
        onError?.();
      };
      img.src = src;
    }
  }, [isVisible, src, onLoad, onError, imageError]);

  return (
    <div ref={setElement} className={`overflow-hidden ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          imageSrc === placeholder ? 'opacity-70' : 'opacity-100'
        }`}
        loading="lazy"
      />
      {imageError && (
        <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 text-sm p-4">
          Failed to load image
        </div>
      )}
    </div>
  );
});

/**
 * Section Lazy Loader for Heavy Components
 */
interface LazySectionProps {
  children: ReactNode;
  height?: string;
  loadingText?: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazySection = memo(function LazySection({
  children,
  height = 'min-h-[200px]',
  loadingText = 'Loading section...',
  className = '',
  threshold = 0.1,
  rootMargin = '100px'
}: LazySectionProps) {
  return (
    <div className={`${height} ${className}`}>
      <LazyComponent
        threshold={threshold}
        rootMargin={rootMargin}
        fallback={<SectionLoader text={loadingText} height={height} />}
      >
        {children}
      </LazyComponent>
    </div>
  );
});