/**
 * Smooth Scroll Animation Hook
 * Provides intersection observer based animations for enhanced user experience
 */
import { useEffect, useRef, useCallback, useMemo } from 'react';
// Memory leak prevention: Event listeners need cleanup, Timers need cleanup, Observers need cleanup
// Add cleanup in useEffect return function


interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  delay?: number;
  duration?: number;
  easing?: string;
}

interface ScrollAnimationReturn<T extends HTMLElement = HTMLElement> {
  ref: React.RefObject<T>;
  isVisible: boolean;
  trigger: () => void;
}

/**
 * Custom hook for scroll-triggered animations
 * Uses Intersection Observer for optimal performance
 */
export function useScrollAnimation<T extends HTMLElement = HTMLElement>(options: ScrollAnimationOptions = {}): ScrollAnimationReturn<T> {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -10% 0px',
    once = true,
    delay = 0,
    duration = 500,
    easing = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  } = options;

  const elementRef = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isVisibleRef = useRef(false);

  const trigger = useCallback(() => {
    if (elementRef.current && !isVisibleRef.current) {
      elementRef.current.classList.add('in-view');
      isVisibleRef.current = true;
      
      // Clean up will-change property after animation completes
      setTimeout(() => {
        if (elementRef.current) {
          elementRef.current.style.willChange = 'auto';
        }
      }, duration + delay);
    }
  }, [duration, delay]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set up initial state and performance optimizations
    element.style.willChange = 'transform, opacity';
    
    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              trigger();
            }, delay);

            // Disconnect if once is true
            if (once && observerRef.current) {
              observerRef.current.disconnect();
            }
          } else if (!once) {
            // Reset animation if not once
            entry.target.classList.remove('in-view');
            isVisibleRef.current = false;
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, once, delay, trigger]);

  return {
    ref: elementRef,
    isVisible: isVisibleRef.current,
    trigger,
  };
}

/**
 * Hook for staggered scroll animations
 * Useful for animating lists or groups of elements
 */
export function useStaggeredScrollAnimation<T extends HTMLElement = HTMLElement>(
  count: number,
  baseDelay: number = 100,
  options: ScrollAnimationOptions = {}
) {
  // Calculate the animation options for each index
  const animationOptions = useMemo(() => {
    return Array.from({ length: count }, (_, index) => ({
      ...options,
      delay: (options.delay || 0) + (baseDelay * index),
    }));
  }, [count, baseDelay, options]);

  // Since we can't call hooks in a loop dynamically, we'll return a factory function
  // that components can use to create individual animations
  return useMemo(() => {
    return animationOptions.map((_, index) => {
      return {
        ...options,
        delay: (options.delay || 0) + (baseDelay * index),
      };
    });
  }, [animationOptions, options, baseDelay]);
}

/**
 * Hook for parallax scroll effects
 * Creates smooth parallax movement based on scroll position
 */
export function useParallaxScroll<T extends HTMLElement = HTMLElement>(speed: number = 0.5, direction: 'vertical' | 'horizontal' = 'vertical') {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set up performance optimizations
    element.style.willChange = 'transform';
    element.style.transform = 'translate3d(0, 0, 0)';

    let ticking = false;

    const updateTransform = () => {
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const scrolled = window.pageYOffset;
      const rate = scrolled * -speed;

      if (direction === 'vertical') {
        element.style.transform = `translate3d(0, ${rate}px, 0)`;
      } else {
        element.style.transform = `translate3d(${rate}px, 0, 0)`;
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateTransform);
        ticking = true;
      }
    };

    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (element) {
        element.style.willChange = 'auto';
      }
    };
  }, [speed, direction]);

  return elementRef;
}

/**
 * Hook for smooth scroll to element
 * Provides smooth scrolling with customizable easing
 */
export function useSmoothScrollTo() {
  const scrollTo = useCallback((
    target: HTMLElement | string,
    options: {
      duration?: number;
      easing?: string;
      offset?: number;
      callback?: () => void;
    } = {}
  ) => {
    const {
      duration = 800,
      easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      offset = 0,
      callback
    } = options;

    const targetElement = typeof target === 'string' 
      ? document.querySelector(target) as HTMLElement
      : target;

    if (!targetElement) return;

    const startPosition = window.pageYOffset;
    const targetPosition = targetElement.offsetTop - offset;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      
      window.scrollTo(0, startPosition + (distance * easedProgress));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else if (callback) {
        callback();
      }
    };

    requestAnimationFrame(animateScroll);
  }, []);

  return scrollTo;
}

/**
 * Hook for managing animation performance
 * Automatically pauses animations when tab is not visible
 */
export function useAnimationPerformance() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      const animatedElements = document.querySelectorAll('[class*="animate-"]');
      
      animatedElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        if (isHidden) {
          htmlElement.style.animationPlayState = 'paused';
        } else {
          htmlElement.style.animationPlayState = 'running';
        }
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Return a function to manually control animation states
  const controlAnimations = useCallback((play: boolean) => {
    const animatedElements = document.querySelectorAll('[class*="animate-"]');
    animatedElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.animationPlayState = play ? 'running' : 'paused';
    });
  }, []);

  return { controlAnimations };
}

// Export utility functions for direct use
export const animationUtils = {
  /**
   * Apply hardware acceleration to an element
   */
  enableHardwareAcceleration: (element: HTMLElement) => {
    element.style.transform = 'translate3d(0, 0, 0)';
    element.style.backfaceVisibility = 'hidden';
    element.style.perspective = '1000px';
  },

  /**
   * Clean up performance optimizations after animation
   */
  cleanupPerformanceOptimizations: (element: HTMLElement) => {
    element.style.willChange = 'auto';
    element.style.transform = '';
    element.style.backfaceVisibility = '';
    element.style.perspective = '';
  },

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Get optimized animation duration based on user preferences
   */
  getOptimizedDuration: (baseDuration: number) => {
    return animationUtils.prefersReducedMotion() ? Math.min(baseDuration * 0.1, 100) : baseDuration;
  }
};
