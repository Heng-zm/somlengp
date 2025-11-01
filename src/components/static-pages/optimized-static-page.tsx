'use client';

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useEffect, 
  useState,
  useRef
} from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  structuredData?: Record<string, any>;
  noIndex?: boolean;
  priority?: number;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export interface PagePerformanceConfig {
  preloadCriticalResources?: string[];
  prefetchLinks?: string[];
  lazyLoadImages?: boolean;
  optimizeImages?: boolean;
  enableCompression?: boolean;
  cacheStrategy?: 'default' | 'no-cache' | 'force-cache';
}

export interface AccessibilityConfig {
  skipToContent?: boolean;
  ariaLabels?: Record<string, string>;
  focusManagement?: boolean;
  reducedMotion?: boolean;
  highContrast?: boolean;
}

export interface StaticPageProps {
  children: React.ReactNode;
  seo: SEOConfig;
  performance?: PagePerformanceConfig;
  accessibility?: AccessibilityConfig;
  className?: string;
  layout?: 'default' | 'centered' | 'full-width' | 'article';
  showHeader?: boolean;
  showFooter?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<{
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  }>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Core Web Vitals monitoring
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
        } else if (entry.entryType === 'first-input') {
          setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
        } else if (entry.entryType === 'layout-shift') {
          if (!(entry as any).hadRecentInput) {
            setMetrics(prev => ({ ...prev, cls: (prev.cls || 0) + (entry as any).value }));
          }
        } else if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
        } else if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          setMetrics(prev => ({ 
            ...prev, 
            ttfb: navEntry.responseStart - navEntry.requestStart 
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint', 'navigation'] });

    return () => observer.disconnect();
  }, []);

  return metrics;
}

// ============================================================================
// ACCESSIBILITY HOOKS
// ============================================================================

function useAccessibility(config: AccessibilityConfig = {}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(reducedMotionQuery.matches);
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // High contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(highContrastQuery.matches);
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };
    
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    // Focus management
    if (config.focusManagement) {
      const handleFocus = (e: FocusEvent) => {
        if (e.target instanceof HTMLElement) {
          e.target.setAttribute('data-focus-visible', 'true');
        }
      };
      
      const handleBlur = (e: FocusEvent) => {
        if (e.target instanceof HTMLElement) {
          e.target.removeAttribute('data-focus-visible');
        }
      };

      document.addEventListener('focusin', handleFocus);
      document.addEventListener('focusout', handleBlur);

      return () => {
        reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
        highContrastQuery.removeEventListener('change', handleHighContrastChange);
        document.removeEventListener('focusin', handleFocus);
        document.removeEventListener('focusout', handleBlur);
      };
    }

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, [config.focusManagement]);

  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return {
    prefersReducedMotion,
    prefersHighContrast,
    skipToContent
  };
}

// ============================================================================
// SEO HEAD COMPONENT
// ============================================================================

const SEOHead = memo(function SEOHead({ seo }: { seo: SEOConfig }) {
  const structuredDataString = useMemo(() => {
    if (!seo.structuredData) return null;
    return JSON.stringify({
      "@context": "https://schema.org",
      ...seo.structuredData
    });
  }, [seo.structuredData]);

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.keywords && <meta name="keywords" content={seo.keywords.join(', ')} />}
      {seo.author && <meta name="author" content={seo.author} />}
      
      {/* Canonical URL */}
      {seo.canonical && <link rel="canonical" href={seo.canonical} />}
      
      {/* Robots */}
      <meta name="robots" content={seo.noIndex ? 'noindex, nofollow' : 'index, follow'} />
      
      {/* Open Graph */}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:type" content={seo.ogType || 'website'} />
      {seo.ogImage && <meta property="og:image" content={seo.ogImage} />}
      {seo.canonical && <meta property="og:url" content={seo.canonical} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={seo.twitterCard || 'summary_large_image'} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      {seo.ogImage && <meta name="twitter:image" content={seo.ogImage} />}
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <meta name="theme-color" content="#3b82f6" />
      
      {/* Performance Hints */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Structured Data */}
      {structuredDataString && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredDataString }}
        />
      )}
    </Head>
  );
});

// ============================================================================
// OPTIMIZED IMAGE COMPONENT
// ============================================================================

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  lazy?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  lazy = true,
  placeholder = 'empty',
  blurDataURL
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div 
        className={cn(
          "bg-gray-200 flex items-center justify-center",
          className
        )}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Image failed to load</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={lazy ? 'lazy' : 'eager'}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{
          objectFit: 'cover',
          objectPosition: 'center'
        }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
});

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

function usePerformanceOptimizations(config: PagePerformanceConfig = {}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Preload critical resources
    if (config.preloadCriticalResources) {
      config.preloadCriticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.includes('.css') ? 'style' : 
                  resource.includes('.js') ? 'script' : 
                  resource.includes('.woff') ? 'font' : 'fetch';
        if (link.as === 'font') {
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
      });
    }

    // Prefetch next pages
    if (config.prefetchLinks) {
      config.prefetchLinks.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      });
    }

    // Service Worker registration for caching
    if ('serviceWorker' in navigator && config.cacheStrategy !== 'no-cache') {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, [config]);
}

// ============================================================================
// SKIP TO CONTENT COMPONENT
// ============================================================================

const SkipToContent = memo(function SkipToContent({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 bg-blue-600 text-white px-4 py-2 rounded-md z-50 
                 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Skip to main content
    </button>
  );
});

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

interface LayoutProps {
  children: React.ReactNode;
  type: 'default' | 'centered' | 'full-width' | 'article';
  className?: string;
}

const PageLayout = memo(function PageLayout({ children, type, className }: LayoutProps) {
  const layoutClasses = useMemo(() => {
    const base = "min-h-screen";
    
    switch (type) {
      case 'centered':
        return cn(base, "flex items-center justify-center p-4", className);
      case 'full-width':
        return cn(base, "w-full", className);
      case 'article':
        return cn(base, "max-w-4xl mx-auto px-4 py-8", className);
      default:
        return cn(base, "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className);
    }
  }, [type, className]);

  return <div className={layoutClasses}>{children}</div>;
});

// ============================================================================
// MAIN OPTIMIZED STATIC PAGE COMPONENT
// ============================================================================

export const OptimizedStaticPage = memo(function OptimizedStaticPage({
  children,
  seo,
  performance = {},
  accessibility = {},
  className,
  layout = 'default',
  showHeader = true,
  showFooter = true,
  backgroundColor = 'bg-white',
  textColor = 'text-gray-900'
}: StaticPageProps) {
  const router = useRouter();
  const metrics = usePerformanceMetrics();
  const { prefersReducedMotion, prefersHighContrast, skipToContent } = useAccessibility(accessibility);
  
  usePerformanceOptimizations(performance);

  // Report performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && Object.keys(metrics).length > 0) {
      void 0;
    }
  }, [metrics]);

  const pageClasses = useMemo(() => cn(
    backgroundColor,
    textColor,
    prefersReducedMotion && 'motion-reduce:transition-none',
    prefersHighContrast && 'contrast-more:border-black',
    className
  ), [backgroundColor, textColor, prefersReducedMotion, prefersHighContrast, className]);

  return (
    <div className={pageClasses}>
      <SEOHead seo={seo} />
      
      {/* Skip to content link */}
      {accessibility.skipToContent && (
        <SkipToContent onClick={skipToContent} />
      )}

      {/* Page Header */}
      {showHeader && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/home" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg" />
                <span className="text-xl font-bold">Somleng</span>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <PageLayout type={layout}>
          {children}
        </PageLayout>
      </main>

      {/* Page Footer */}
      {showFooter && (
        <footer className="bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-600">
                © 2024 Somleng. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      )}

      {/* Performance debugging in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
          <div>LCP: {metrics.lcp?.toFixed(0)}ms</div>
          <div>FID: {metrics.fid?.toFixed(0)}ms</div>
          <div>CLS: {metrics.cls?.toFixed(3)}</div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// SPECIALIZED PAGE COMPONENTS
// ============================================================================

// Landing Page Component
export const OptimizedLandingPage = memo(function OptimizedLandingPage({
  children,
  seo,
  hero,
  ...props
}: StaticPageProps & {
  hero?: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    ctaText?: string;
    ctaLink?: string;
  };
}) {
  const enhancedSEO: SEOConfig = {
    ...seo,
    structuredData: {
      "@type": "WebSite",
      "name": seo.title,
      "description": seo.description,
      "url": seo.canonical,
      ...seo.structuredData
    }
  };

  return (
    <OptimizedStaticPage 
      seo={enhancedSEO} 
      layout="full-width"
      performance={{
        preloadCriticalResources: ['/fonts/inter.woff2'],
        prefetchLinks: ['/features', '/pricing', '/contact'],
        ...props.performance
      }}
      {...props}
    >
      {hero && (
        <section className="relative py-20 px-4">
          {hero.backgroundImage && (
            <OptimizedImage
              src={hero.backgroundImage}
              alt="Hero background"
              priority
              className="absolute inset-0 z-0"
            />
          )}
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              {hero.subtitle}
            </p>
            {hero.ctaText && hero.ctaLink && (
              <Link href={hero.ctaLink}>
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors">
                  {hero.ctaText}
                </button>
              </Link>
            )}
          </div>
        </section>
      )}
      {children}
    </OptimizedStaticPage>
  );
});

// Article Page Component
export const OptimizedArticlePage = memo(function OptimizedArticlePage({
  children,
  seo,
  article,
  ...props
}: StaticPageProps & {
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    category?: string;
    tags?: string[];
    readingTime?: number;
  };
}) {
  const enhancedSEO: SEOConfig = {
    ...seo,
    ogType: 'article',
    structuredData: {
      "@type": "Article",
      "headline": seo.title,
      "description": seo.description,
      "author": {
        "@type": "Person",
        "name": article?.author || seo.author
      },
      "datePublished": article?.publishedTime,
      "dateModified": article?.modifiedTime,
      ...seo.structuredData
    }
  };

  return (
    <OptimizedStaticPage 
      seo={enhancedSEO} 
      layout="article"
      {...props}
    >
      {article && (
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{seo.title}</h1>
          <div className="text-gray-600 space-x-4">
            {article.author && <span>By {article.author}</span>}
            {article.publishedTime && (
              <time dateTime={article.publishedTime}>
                {new Date(article.publishedTime).toLocaleDateString()}
              </time>
            )}
            {article.readingTime && (
              <span>{article.readingTime} min read</span>
            )}
          </div>
        </header>
      )}
      <article className="prose prose-lg max-w-none">
        {children}
      </article>
    </OptimizedStaticPage>
  );
});

// Product Page Component
export const OptimizedProductPage = memo(function OptimizedProductPage({
  children,
  seo,
  product,
  ...props
}: StaticPageProps & {
  product?: {
    name: string;
    price?: number;
    currency?: string;
    brand?: string;
    category?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    rating?: {
      value: number;
      count: number;
    };
  };
}) {
  const enhancedSEO: SEOConfig = {
    ...seo,
    ogType: 'product',
    structuredData: {
      "@type": "Product",
      "name": product?.name || seo.title,
      "description": seo.description,
      "brand": {
        "@type": "Brand",
        "name": product?.brand
      },
      "category": product?.category,
      "offers": {
        "@type": "Offer",
        "price": product?.price,
        "priceCurrency": product?.currency || "USD",
        "availability": `https://schema.org/${product?.availability || 'InStock'}`
      },
      ...(product?.rating && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.rating.value,
          "reviewCount": product.rating.count
        }
      }),
      ...seo.structuredData
    }
  };

  return (
    <OptimizedStaticPage seo={enhancedSEO} {...props}>
      {children}
    </OptimizedStaticPage>
  );
});

export default OptimizedStaticPage;