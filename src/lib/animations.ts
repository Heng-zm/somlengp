// Smooth animation utilities for consistent interface behavior

export const animations = {
  // Easing functions
  easing: {
    smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    snappy: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    slow: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },

  // Duration presets (in ms)
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 700,
  },

  // Framer Motion variants
  variants: {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' }
      },
      exit: { 
        opacity: 0,
        transition: { duration: 0.2 }
      }
    },

    slideUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3, ease: 'easeOut' }
      },
      exit: { 
        opacity: 0, 
        y: -10,
        transition: { duration: 0.2 }
      }
    },

    slideDown: {
      hidden: { opacity: 0, y: -20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3, ease: 'easeOut' }
      },
      exit: { 
        opacity: 0, 
        y: 10,
        transition: { duration: 0.2 }
      }
    },

    slideLeft: {
      hidden: { opacity: 0, x: 20 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { duration: 0.3, ease: 'easeOut' }
      },
      exit: { 
        opacity: 0, 
        x: -10,
        transition: { duration: 0.2 }
      }
    },

    slideRight: {
      hidden: { opacity: 0, x: -20 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { duration: 0.3, ease: 'easeOut' }
      },
      exit: { 
        opacity: 0, 
        x: 10,
        transition: { duration: 0.2 }
      }
    },

    scale: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      },
      exit: { 
        opacity: 0, 
        scale: 0.95,
        transition: { duration: 0.2 }
      }
    },

    scaleUp: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
      },
      exit: { 
        opacity: 0, 
        scale: 0.9,
        transition: { duration: 0.2 }
      }
    },

    blur: {
      hidden: { opacity: 0, filter: 'blur(10px)' },
      visible: { 
        opacity: 1, 
        filter: 'blur(0px)',
        transition: { duration: 0.4 }
      },
      exit: { 
        opacity: 0, 
        filter: 'blur(5px)',
        transition: { duration: 0.2 }
      }
    },

    stagger: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1
        }
      }
    },

    staggerFast: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
          delayChildren: 0.05
        }
      }
    },
  },

  // Hover/tap animations
  interactions: {
    button: {
      scale: 0.98,
      transition: { duration: 0.1 }
    },
    
    card: {
      y: -4,
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
      transition: { duration: 0.2, ease: 'easeOut' }
    },

    lift: {
      y: -2,
      transition: { duration: 0.2 }
    },

    glow: {
      boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
      transition: { duration: 0.3 }
    }
  },

  // Page transitions
  pageTransition: {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { duration: 0.3 }
    }
  }
};

// CSS Transition classes
export const transitionClasses = {
  all: 'transition-all duration-300 ease-out',
  allFast: 'transition-all duration-200 ease-out',
  allSlow: 'transition-all duration-500 ease-out',
  
  colors: 'transition-colors duration-300 ease-out',
  colorsFast: 'transition-colors duration-200 ease-out',
  
  transform: 'transition-transform duration-300 ease-out',
  transformFast: 'transition-transform duration-200 ease-out',
  
  opacity: 'transition-opacity duration-300 ease-out',
  opacityFast: 'transition-opacity duration-200 ease-out',
  
  shadow: 'transition-shadow duration-300 ease-out',
  
  smooth: 'transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)',
  bouncy: 'transition-all duration-300 cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Utility to create custom transition
export function createTransition(properties: string[], duration = 300, easing = 'ease-out') {
  return properties.map(prop => `${prop} ${duration}ms ${easing}`).join(', ');
}

// Delay utilities
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Request animation frame wrapper
export function nextFrame(callback: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback);
  });
}

// Smooth scroll utility
export function smoothScroll(element: HTMLElement | null, options?: ScrollIntoViewOptions) {
  if (!element) return;
  
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
    ...options
  });
}

// Intersection Observer for scroll animations
export function observeElement(
  element: Element,
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(callback);
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
      ...options
    }
  );

  observer.observe(element);
  return observer;
}
