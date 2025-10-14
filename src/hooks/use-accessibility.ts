
// Accessibility Testing Utility
import { useEffect } from 'react';

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  suggestion?: string;
}

export function useAccessibilityChecker(enabled = process.env.NODE_ENV === 'development') {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const issues: AccessibilityIssue[] = [];

    // Check for missing alt attributes
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.getAttribute('alt')) {
        issues.push({
          type: 'error',
          message: `Image missing alt attribute`,
          element: `img[${index}]`,
          suggestion: 'Add descriptive alt text or alt="" for decorative images'
        });
      }
    });

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (index === 0 && level !== 1) {
        issues.push({
          type: 'warning',
          message: `First heading should be h1, found ${heading.tagName.toLowerCase()}`,
          element: heading.tagName.toLowerCase(),
          suggestion: 'Start with h1 for proper document outline'
        });
      } else if (level > lastLevel + 1) {
        issues.push({
          type: 'warning',
          message: `Heading level skipped: ${lastLevel} to ${level}`,
          element: heading.tagName.toLowerCase(),
          suggestion: 'Use consecutive heading levels for better structure'
        });
      }
      lastLevel = level;
    });

    // Check for interactive elements without proper roles
    const interactiveElements = document.querySelectorAll('[onclick], [onkeydown]');
    interactiveElements.forEach((element, index) => {
      if (!element.getAttribute('role') && 
          !['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
        issues.push({
          type: 'error',
          message: `Interactive element missing role attribute`,
          element: `${element.tagName.toLowerCase()}[${index}]`,
          suggestion: 'Add role="button" or appropriate ARIA role'
        });
      }

      if (!element.hasAttribute('tabindex') && 
          !['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
        issues.push({
          type: 'warning',
          message: `Interactive element not keyboard accessible`,
          element: `${element.tagName.toLowerCase()}[${index}]`,
          suggestion: 'Add tabindex="0" for keyboard navigation'
        });
      }
    });

    // Check for form labels
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea, select');
    inputs.forEach((input, index) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      
      if (!ariaLabel && !ariaLabelledby && (!id || !document.querySelector(`label[for="${id}"]`))) {
        issues.push({
          type: 'error',
          message: `Form control missing accessible label`,
          element: `${input.tagName.toLowerCase()}[${index}]`,
          suggestion: 'Add aria-label, aria-labelledby, or associate with a label element'
        });
      }
    });

    // Report issues
    if (issues.length > 0) {
      console.group('🔍 Accessibility Issues Found');
      issues.forEach(issue => {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} ${issue.message}`);
        if (issue.element) console.log(`   Element: ${issue.element}`);
        if (issue.suggestion) console.log(`   💡 ${issue.suggestion}`);
      });
      console.groupEnd();
    } else {
      console.log('✅ No accessibility issues found');
    }
  }, [enabled]);
}

// Keyboard navigation helper
export function useKeyboardNavigation(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const focusableArray = Array.from(focusableElements) as HTMLElement[];
      const currentIndex = focusableArray.indexOf(document.activeElement as HTMLElement);

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % focusableArray.length;
          focusableArray[nextIndex]?.focus();
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          const prevIndex = currentIndex <= 0 ? focusableArray.length - 1 : currentIndex - 1;
          focusableArray[prevIndex]?.focus();
          break;
        case 'Home':
          event.preventDefault();
          focusableArray[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          focusableArray[focusableArray.length - 1]?.focus();
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);
}
