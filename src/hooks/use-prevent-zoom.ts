"use client";

import { useEffect } from 'react';

interface PreventZoomOptions {
  /**
   * Whether to prevent zoom on input focus
   * @default true
   */
  preventZoom?: boolean;
  
  /**
   * Target selector for elements to apply zoom prevention
   * @default 'input, textarea, select'
   */
  selector?: string;
  
  /**
   * Whether to allow user scaling (pinch zoom)
   * @default false - Completely disable zoom for better UX
   */
  allowUserScaling?: boolean;
}

/**
 * Hook to prevent mobile browser zoom when focusing on input elements
 * 
 * This hook dynamically manages the viewport meta tag to prevent zoom
 * while optionally allowing manual zoom controls.
 * 
 * @param options Configuration options for zoom prevention
 */
export function usePreventZoom(options: PreventZoomOptions = {}) {
  const {
    preventZoom = true,
    selector = 'input, textarea, select',
    allowUserScaling = false
  } = options;

  useEffect(() => {
    if (!preventZoom) return;

    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const originalContent = viewportMeta?.getAttribute('content') || '';

    // Store original viewport settings
    let originalViewport = originalContent;

    const preventZoomViewport = allowUserScaling
      ? 'width=device-width, initial-scale=1.0, maximum-scale=3.0'
      : 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      if (target.matches(selector)) {
        // Prevent zoom on input focus
        if (viewportMeta) {
          viewportMeta.setAttribute('content', preventZoomViewport);
        }
      }
    };

    const handleBlur = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      if (target.matches(selector)) {
        // Restore original viewport after blur
        if (viewportMeta && allowUserScaling) {
          // Allow zoom again after input loses focus
          viewportMeta.setAttribute('content', originalViewport || 'width=device-width, initial-scale=1.0');
        }
      }
    };

    const handleTouchStart = () => {
      // Additional safety - prevent zoom during touch
      if (viewportMeta) {
        viewportMeta.setAttribute('content', preventZoomViewport);
      }
    };

    // Apply CSS-based prevention as fallback
    const style = document.createElement('style');
    style.id = 'prevent-zoom-style';
    style.textContent = `
      ${selector} {
        font-size: max(16px, 1rem) !important;
        transform: scale(1) !important;
      }
      
      @media screen and (max-width: 768px) {
        ${selector} {
          font-size: 16px !important;
          -webkit-text-size-adjust: 100% !important;
        }
      }
    `;

    document.head.appendChild(style);

    // Add event listeners
    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Set initial viewport if needed
    if (viewportMeta && !allowUserScaling) {
      viewportMeta.setAttribute('content', preventZoomViewport);
    }

    return () => {
      // Cleanup
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
      document.removeEventListener('touchstart', handleTouchStart);
      
      // Remove custom styles
      const injectedStyle = document.getElementById('prevent-zoom-style');
      if (injectedStyle) {
        injectedStyle.remove();
      }
      
      // Restore original viewport
      if (viewportMeta && originalViewport) {
        viewportMeta.setAttribute('content', originalViewport);
      }
    };
  }, [preventZoom, selector, allowUserScaling]);

  return {
    preventZoom,
    // Utility function to manually apply anti-zoom styles
    getAntiZoomProps: () => ({
      style: {
        fontSize: Math.max(16, parseFloat(getComputedStyle(document.documentElement).fontSize)),
        transform: 'scale(1)',
        WebkitTextSizeAdjust: '100%'
      }
    })
  };
}

/**
 * Utility function to get anti-zoom CSS classes
 */
export const getAntiZoomClasses = (type: 'input' | 'textarea' | 'select' = 'input') => {
  const baseClasses = 'no-zoom';
  
  switch (type) {
    case 'textarea':
      return `${baseClasses} no-zoom-textarea`;
    case 'input':
      return `${baseClasses} no-zoom-input`;
    case 'select':
      return `${baseClasses} no-zoom-input`;
    default:
      return baseClasses;
  }
};
