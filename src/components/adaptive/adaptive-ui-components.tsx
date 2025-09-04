'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEnhancedProgressiveAccessibility } from '@/lib/progressive-enhancement-core';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, Sun, Moon, Type, Contrast, Zap, Smartphone, Wifi, WifiOff } from 'lucide-react';

// Adaptive Container Component
export interface AdaptiveContainerProps {
  children: React.ReactNode;
  className?: string;
  adaptToMotion?: boolean;
  adaptToContrast?: boolean;
  adaptToDevice?: boolean;
  adaptToConnection?: boolean;
  fallbackContent?: React.ReactNode;
}

const AdaptiveContainer: React.FC<AdaptiveContainerProps> = ({
  children,
  className,
  adaptToMotion = true,
  adaptToContrast = true,
  adaptToDevice = true,
  adaptToConnection = true,
  fallbackContent
}) => {
  const { baseline, adaptiveSettings } = useEnhancedProgressiveAccessibility();
  const [containerClasses, setContainerClasses] = useState<string[]>([]);

  useEffect(() => {
    if (!baseline) return;

    const classes = [];

    // Motion adaptations
    if (adaptToMotion && baseline.reducedMotion) {
      classes.push('reduced-motion', 'no-animations');
    }

    // Contrast adaptations  
    if (adaptToContrast && baseline.highContrastMode) {
      classes.push('high-contrast', 'enhanced-borders');
    }

    // Device adaptations
    if (adaptToDevice) {
      if (baseline.touchDevice) {
        classes.push('touch-device', 'large-targets');
      }
      if (baseline.deviceMemory < 4) {
        classes.push('low-memory', 'simplified-layout');
      }
    }

    // Connection adaptations
    if (adaptToConnection && baseline.connectionSpeed === 'slow') {
      classes.push('slow-connection', 'optimized-content');
    }

    setContainerClasses(classes);
  }, [baseline, adaptToMotion, adaptToContrast, adaptToDevice, adaptToConnection]);

  return (
    <div 
      className={cn(
        'adaptive-container',
        ...containerClasses,
        className
      )}
      data-adaptive-features={containerClasses.join(' ')}
    >
      {baseline && adaptiveSettings ? children : fallbackContent}
      
      <style jsx>{`
        .adaptive-container.reduced-motion * {
          transition: none !important;
          animation: none !important;
        }
        
        .adaptive-container.high-contrast {
          border: 2px solid currentColor;
          background: Window;
          color: WindowText;
        }
        
        .adaptive-container.touch-device button,
        .adaptive-container.touch-device a,
        .adaptive-container.touch-device [role="button"] {
          min-height: 48px;
          min-width: 48px;
          padding: 12px;
        }
        
        .adaptive-container.low-memory .complex-animation,
        .adaptive-container.low-memory .parallax-element {
          transform: none !important;
          animation: none !important;
        }
        
        .adaptive-container.slow-connection .heavy-content {
          display: none;
        }
        
        .adaptive-container.simplified-layout > * {
          display: block !important;
          float: none !important;
          position: static !important;
        }
      `}</style>
    </div>
  );
};

// Adaptive Text Component
export interface AdaptiveTextProps {
  children: React.ReactNode;
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div';
  className?: string;
  scaleWithPreferences?: boolean;
  enhanceContrast?: boolean;
}

const AdaptiveText: React.FC<AdaptiveTextProps> = ({
  children,
  as: Component = 'p',
  className,
  scaleWithPreferences = true,
  enhanceContrast = true
}) => {
  const { baseline } = useEnhancedProgressiveAccessibility();
  const [textSize, setTextSize] = useState('base');
  const [contrastLevel, setContrastLevel] = useState('normal');

  useEffect(() => {
    if (!baseline || !scaleWithPreferences) return;

    // Adjust text size based on device and preferences
    let size = 'base';
    if (baseline.largeTextMode) {
      size = 'large';
    } else if (baseline.touchDevice) {
      size = 'medium';
    }
    setTextSize(size);

    // Adjust contrast
    if (enhanceContrast && baseline.highContrastMode) {
      setContrastLevel('high');
    }
  }, [baseline, scaleWithPreferences, enhanceContrast]);

  return (
    <Component
      className={cn(
        'adaptive-text',
        `text-size-${textSize}`,
        `contrast-${contrastLevel}`,
        baseline?.screenReaderDetected && 'screen-reader-optimized',
        className
      )}
    >
      {children}
      
      <style jsx>{`
        .adaptive-text.text-size-base {
          font-size: 1rem;
          line-height: 1.5;
        }
        
        .adaptive-text.text-size-medium {
          font-size: 1.125rem;
          line-height: 1.6;
        }
        
        .adaptive-text.text-size-large {
          font-size: 1.25rem;
          line-height: 1.7;
        }
        
        .adaptive-text.contrast-high {
          color: #000;
          font-weight: 600;
          text-shadow: none;
        }
        
        .adaptive-text.screen-reader-optimized {
          /* Optimizations for screen readers */
          word-spacing: 0.1em;
          letter-spacing: 0.02em;
        }
      `}</style>
    </Component>
  );
};

// Adaptive Media Component
export interface AdaptiveMediaProps {
  src: string;
  alt: string;
  className?: string;
  respectDataSaver?: boolean;
  adaptToConnection?: boolean;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
}

const AdaptiveMedia: React.FC<AdaptiveMediaProps> = ({
  src,
  alt,
  className,
  respectDataSaver = true,
  adaptToConnection = true,
  fallbackSrc,
  placeholder
}) => {
  const { baseline } = useEnhancedProgressiveAccessibility();
  const [shouldLoadImage, setShouldLoadImage] = useState(true);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    if (!baseline) return;

    // Respect data saver preference
    if (respectDataSaver && baseline.connectionSpeed === 'slow') {
      setShouldLoadImage(false);
      return;
    }

    // Use appropriate image source based on connection
    if (adaptToConnection) {
      if (baseline.connectionSpeed === 'slow' && fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        setImageSrc(src);
      }
    }

    setShouldLoadImage(true);
  }, [baseline, respectDataSaver, adaptToConnection, src, fallbackSrc]);

  if (!shouldLoadImage) {
    return (
      <div 
        className={cn('adaptive-media-placeholder', className)}
        role="img" 
        aria-label={alt}
      >
        {placeholder || (
          <div className="placeholder-content">
            <span className="sr-only">{alt}</span>
            <div className="placeholder-icon">📷</div>
            <p className="placeholder-text">Image loading disabled for slow connection</p>
          </div>
        )}
        
        <style jsx>{`
          .adaptive-media-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f3f4f6;
            border: 1px dashed #d1d5db;
            border-radius: 4px;
            min-height: 200px;
            text-align: center;
            padding: 2rem;
          }
          
          .placeholder-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          }
          
          .placeholder-icon {
            font-size: 2rem;
            opacity: 0.5;
          }
          
          .placeholder-text {
            font-size: 0.875rem;
            color: #6b7280;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={cn(
        'adaptive-media',
        baseline?.reducedMotion && 'no-animation',
        className
      )}
      loading="lazy"
    />
  );
};

// Adaptive Animation Component
export interface AdaptiveAnimationProps {
  children: React.ReactNode;
  animation?: string;
  duration?: number;
  delay?: number;
  respectMotionPreference?: boolean;
  fallbackContent?: React.ReactNode;
  className?: string;
}

const AdaptiveAnimation: React.FC<AdaptiveAnimationProps> = ({
  children,
  animation = 'fadeIn',
  duration = 300,
  delay = 0,
  respectMotionPreference = true,
  fallbackContent,
  className
}) => {
  const { baseline, adaptiveSettings } = useEnhancedProgressiveAccessibility();
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    if (!baseline || !respectMotionPreference) return;

    const canAnimate = !!(adaptiveSettings?.animations && 
                        !baseline.reducedMotion && 
                        baseline.connectionSpeed !== 'slow');
                      
    setShouldAnimate(canAnimate);
  }, [baseline, adaptiveSettings, respectMotionPreference]);

  if (!shouldAnimate) {
    return (
      <div className={cn('adaptive-animation-disabled', className)}>
        {fallbackContent || children}
      </div>
    );
  }

  return (
    <div
      className={cn('adaptive-animation', className)}
      style={{
        animationName: animation,
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        /* Disable animations for reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .adaptive-animation {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// Adaptive Navigation Component
export interface AdaptiveNavigationProps {
  items: Array<{
    href: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  layout?: 'horizontal' | 'vertical' | 'adaptive';
  enableKeyboardShortcuts?: boolean;
  className?: string;
}

const AdaptiveNavigation: React.FC<AdaptiveNavigationProps> = ({
  items,
  layout = 'adaptive',
  enableKeyboardShortcuts = true,
  className
}) => {
  const { baseline } = useEnhancedProgressiveAccessibility();
  const [currentLayout, setCurrentLayout] = useState(layout);
  const [focusIndex, setFocusIndex] = useState(0);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!baseline || layout !== 'adaptive') return;

    // Determine optimal layout based on device and preferences
    let optimalLayout = 'horizontal';
    
    if (baseline.touchDevice) {
      optimalLayout = 'vertical'; // Better for touch navigation
    }
    
    if (baseline.screenReaderDetected) {
      optimalLayout = 'vertical'; // Linear navigation for screen readers
    }

    setCurrentLayout(optimalLayout as 'horizontal' | 'vertical');
  }, [baseline, layout]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardShortcuts || !navRef.current?.contains(document.activeElement)) {
      return;
    }

    const isVertical = currentLayout === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        setFocusIndex((prev) => (prev + 1) % items.length);
        break;
      
      case prevKey:
        event.preventDefault();
        setFocusIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      
      case 'Home':
        event.preventDefault();
        setFocusIndex(0);
        break;
      
      case 'End':
        event.preventDefault();
        setFocusIndex(items.length - 1);
        break;
    }
  }, [enableKeyboardShortcuts, currentLayout, items.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus management
  useEffect(() => {
    const activeItem = navRef.current?.querySelector(`[data-nav-index="${focusIndex}"]`) as HTMLElement;
    activeItem?.focus();
  }, [focusIndex]);

  return (
    <nav
      ref={navRef}
      className={cn(
        'adaptive-navigation',
        `layout-${currentLayout}`,
        baseline?.touchDevice && 'touch-optimized',
        baseline?.screenReaderDetected && 'screen-reader-optimized',
        className
      )}
      role="navigation"
      aria-label="Adaptive navigation"
    >
      <ul
        className={cn(
          'nav-list',
          currentLayout === 'horizontal' ? 'flex space-x-2' : 'flex flex-col space-y-1'
        )}
        role="menubar"
        aria-orientation={currentLayout === 'adaptive' ? 'horizontal' : currentLayout}
      >
        {items.map((item, index) => (
          <li key={item.href} role="none">
            <a
              href={item.href}
              data-nav-index={index}
              className={cn(
                'nav-item',
                'focus:outline-2 focus:outline-primary',
                'hover:bg-secondary/50 px-3 py-2 rounded-md',
                baseline?.touchDevice && 'touch-target',
                index === focusIndex && 'active'
              )}
              role="menuitem"
              tabIndex={index === focusIndex ? 0 : -1}
              onFocus={() => setFocusIndex(index)}
            >
              {item.icon && (
                <span className="nav-icon mr-2" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Keyboard shortcuts help */}
      <div className="sr-only">
        <h3>Navigation Shortcuts</h3>
        <ul>
          <li>Arrow keys: Navigate between items</li>
          <li>Home/End: Jump to first/last item</li>
          <li>Enter: Activate item</li>
        </ul>
      </div>

      <style jsx>{`
        .nav-item.touch-target {
          min-height: 48px;
          min-width: 48px;
          display: flex;
          align-items: center;
        }
        
        .nav-item.active {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid #3b82f6;
        }
        
        .screen-reader-optimized .nav-icon {
          display: none;
        }
      `}</style>
    </nav>
  );
};

// Adaptive Form Component
export interface AdaptiveFormProps {
  children: React.ReactNode;
  onSubmit?: (data: FormData) => void;
  className?: string;
  adaptToDevice?: boolean;
  enhanceValidation?: boolean;
  enableAutoSave?: boolean;
}

const AdaptiveForm: React.FC<AdaptiveFormProps> = ({
  children,
  onSubmit,
  className,
  adaptToDevice = true,
  enhanceValidation = true,
  enableAutoSave = true
}) => {
  const { baseline } = useEnhancedProgressiveAccessibility();
  const formRef = useRef<HTMLFormElement>(null);
  const [hasEnhancements, setHasEnhancements] = useState(false);

  useEffect(() => {
    if (!baseline) return;

    // Enable enhancements based on capabilities
    const shouldEnhance = baseline.jsEnabled && baseline.supportsLocalStorage;
    setHasEnhancements(shouldEnhance);
  }, [baseline]);

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    if (onSubmit && hasEnhancements) {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      onSubmit(formData);
    }
    // Otherwise, let the form submit naturally
  }, [onSubmit, hasEnhancements]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(
        'adaptive-form',
        baseline?.touchDevice && 'touch-optimized',
        baseline?.highContrastMode && 'high-contrast',
        hasEnhancements && 'enhanced-form',
        className
      )}
      noValidate={hasEnhancements}
    >
      {children}

      {/* Form submission instructions for no-JS */}
      <noscript>
        <div className="no-js-form-instructions">
          <h3>Form Instructions</h3>
          <p>JavaScript is disabled. This form will be submitted directly to the server.</p>
          <p>Please ensure all required fields are completed before submitting.</p>
        </div>
      </noscript>

      <style jsx>{`
        .adaptive-form.touch-optimized input,
        .adaptive-form.touch-optimized select,
        .adaptive-form.touch-optimized textarea,
        .adaptive-form.touch-optimized button {
          min-height: 48px;
          padding: 12px;
          font-size: 16px; /* Prevent zoom on iOS */
        }
        
        .adaptive-form.high-contrast input,
        .adaptive-form.high-contrast select,
        .adaptive-form.high-contrast textarea {
          border: 2px solid ButtonText;
          background: ButtonFace;
          color: ButtonText;
        }
        
        .no-js-form-instructions {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 4px;
        }
      `}</style>
    </form>
  );
};

// Adaptive Button Group Component
export interface AdaptiveButtonGroupProps {
  buttons: Array<{
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    disabled?: boolean;
  }>;
  orientation?: 'horizontal' | 'vertical' | 'adaptive';
  className?: string;
}

const AdaptiveButtonGroup: React.FC<AdaptiveButtonGroupProps> = ({
  buttons,
  orientation = 'adaptive',
  className
}) => {
  const { baseline } = useEnhancedProgressiveAccessibility();
  const [layout, setLayout] = useState(orientation);
  const [focusIndex, setFocusIndex] = useState(0);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!baseline || orientation !== 'adaptive') return;

    // Determine optimal layout
    let optimalLayout = 'horizontal';
    
    if (baseline.touchDevice) {
      optimalLayout = 'vertical'; // Easier touch targets
    }
    
    if (buttons.length > 3) {
      optimalLayout = 'vertical'; // Better for many buttons
    }

    setLayout(optimalLayout as 'horizontal' | 'vertical');
  }, [baseline, buttons.length, orientation]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!groupRef.current?.contains(document.activeElement)) return;

    const isVertical = layout === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        setFocusIndex((prev) => (prev + 1) % buttons.length);
        break;
      
      case prevKey:
        event.preventDefault();
        setFocusIndex((prev) => (prev - 1 + buttons.length) % buttons.length);
        break;
    }
  }, [layout, buttons.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      ref={groupRef}
      className={cn(
        'adaptive-button-group',
        `layout-${layout}`,
        layout === 'horizontal' ? 'flex space-x-2' : 'flex flex-col space-y-2',
        baseline?.touchDevice && 'touch-optimized',
        className
      )}
      role="group"
      aria-label="Button group"
    >
      {buttons.map((button, index) => {
        const ButtonComponent = button.href ? 'a' : 'button';
        
        return (
          <ButtonComponent
            key={button.label}
            href={button.href}
            onClick={button.onClick}
            disabled={button.disabled}
            className={cn(
              'adaptive-button',
              `variant-${button.variant || 'secondary'}`,
              baseline?.touchDevice && 'touch-target',
              index === focusIndex && 'focused'
            )}
            tabIndex={index === focusIndex ? 0 : -1}
            onFocus={() => setFocusIndex(index)}
          >
            {button.label}
          </ButtonComponent>
        );
      })}

      <style jsx>{`
        .adaptive-button {
          padding: 8px 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #fff;
          color: #333;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .adaptive-button.variant-primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .adaptive-button.variant-outline {
          background: transparent;
          border-color: #3b82f6;
          color: #3b82f6;
        }
        
        .adaptive-button:hover,
        .adaptive-button.focused {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .adaptive-button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        .adaptive-button.touch-target {
          min-height: 48px;
          min-width: 48px;
          padding: 12px 20px;
        }
        
        .touch-optimized .adaptive-button:hover {
          transform: none; /* Remove hover effects on touch */
        }
        
        @media (prefers-reduced-motion: reduce) {
          .adaptive-button {
            transition: none !important;
          }
          
          .adaptive-button:hover {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// User Preference Controls Component
export interface UserPreferenceControlsProps {
  className?: string;
  onPreferenceChange?: (preference: string, value: boolean) => void;
}

const UserPreferenceControls: React.FC<UserPreferenceControlsProps> = ({
  className,
  onPreferenceChange
}) => {
  const { baseline, updateAdaptiveSettings } = useEnhancedProgressiveAccessibility();
  const [preferences, setPreferences] = useState({
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    simplifyLayout: false
  });

  useEffect(() => {
    if (!baseline) return;

    setPreferences({
      reduceMotion: baseline.reducedMotion,
      highContrast: baseline.highContrastMode,
      largeText: baseline.largeTextMode,
      simplifyLayout: baseline.connectionSpeed === 'slow' || baseline.deviceMemory < 4
    });
  }, [baseline]);

  const handlePreferenceToggle = useCallback((preference: keyof typeof preferences) => {
    const newValue = !preferences[preference];
    
    setPreferences(prev => ({
      ...prev,
      [preference]: newValue
    }));

    // Apply changes to adaptive settings
    switch (preference) {
      case 'reduceMotion':
        updateAdaptiveSettings({ animations: !newValue, transitions: !newValue });
        document.body.classList.toggle('reduced-motion', newValue);
        break;
      
      case 'highContrast':
        document.body.classList.toggle('high-contrast', newValue);
        break;
      
      case 'largeText':
        document.body.classList.toggle('large-text', newValue);
        break;
      
      case 'simplifyLayout':
        document.body.classList.toggle('simplified-layout', newValue);
        updateAdaptiveSettings({ complexLayouts: !newValue });
        break;
    }

    onPreferenceChange?.(preference, newValue);
  }, [preferences, updateAdaptiveSettings, onPreferenceChange]);

  return (
    <Card className={cn('user-preference-controls p-4', className)}>
      <h3 className="text-lg font-semibold mb-4">Accessibility Preferences</h3>
      
      <div className="preference-grid space-y-3">
        <label className="preference-item flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4" aria-hidden="true" />
            Reduce motion and animations
          </span>
          <input
            type="checkbox"
            checked={preferences.reduceMotion}
            onChange={() => handlePreferenceToggle('reduceMotion')}
            className="preference-toggle"
            aria-describedby="reduce-motion-desc"
          />
        </label>
        <div id="reduce-motion-desc" className="preference-description">
          Disables animations and transitions for a calmer experience
        </div>

        <label className="preference-item flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Contrast className="w-4 h-4" aria-hidden="true" />
            High contrast mode
          </span>
          <input
            type="checkbox"
            checked={preferences.highContrast}
            onChange={() => handlePreferenceToggle('highContrast')}
            className="preference-toggle"
            aria-describedby="high-contrast-desc"
          />
        </label>
        <div id="high-contrast-desc" className="preference-description">
          Increases color contrast for better visibility
        </div>

        <label className="preference-item flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Type className="w-4 h-4" aria-hidden="true" />
            Large text mode
          </span>
          <input
            type="checkbox"
            checked={preferences.largeText}
            onChange={() => handlePreferenceToggle('largeText')}
            className="preference-toggle"
            aria-describedby="large-text-desc"
          />
        </label>
        <div id="large-text-desc" className="preference-description">
          Increases text size and touch target areas
        </div>

        <label className="preference-item flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" aria-hidden="true" />
            Simplified layout
          </span>
          <input
            type="checkbox"
            checked={preferences.simplifyLayout}
            onChange={() => handlePreferenceToggle('simplifyLayout')}
            className="preference-toggle"
            aria-describedby="simple-layout-desc"
          />
        </label>
        <div id="simple-layout-desc" className="preference-description">
          Uses simpler layouts for better performance and focus
        </div>
      </div>

      {/* Connection status indicator */}
      {baseline && (
        <div className="connection-status mt-4 p-2 bg-secondary rounded text-sm">
          <div className="flex items-center gap-2">
            {baseline.connectionSpeed === 'slow' ? (
              <WifiOff className="w-4 h-4 text-orange-500" />
            ) : (
              <Wifi className="w-4 h-4 text-green-500" />
            )}
            Connection: {baseline.connectionSpeed || 'Unknown'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Device Memory: {baseline.deviceMemory}GB
          </div>
        </div>
      )}

      <style jsx>{`
        .preference-item {
          display: flex;
          align-items: center;
          justify-content: between;
          padding: 8px 0;
          cursor: pointer;
        }
        
        .preference-toggle {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        
        .preference-toggle:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        .preference-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        @media (prefers-contrast: high) {
          .preference-toggle {
            border: 2px solid ButtonText;
          }
        }
      `}</style>
    </Card>
  );
};

// Adaptive Loading Component
export interface AdaptiveLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  respectMotionPreference?: boolean;
}

const AdaptiveLoading: React.FC<AdaptiveLoadingProps> = ({
  isLoading,
  children,
  loadingText = 'Loading...',
  className,
  respectMotionPreference = true
}) => {
  const { baseline } = useEnhancedProgressiveAccessibility();
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    if (!baseline || !respectMotionPreference) return;

    setShowAnimation(!baseline.reducedMotion);
  }, [baseline, respectMotionPreference]);

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div 
      className={cn(
        'adaptive-loading',
        showAnimation && 'with-animation',
        baseline?.highContrastMode && 'high-contrast',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={loadingText}
    >
      <div className="loading-content">
        {showAnimation ? (
          <div className="loading-spinner" aria-hidden="true"></div>
        ) : (
          <div className="loading-indicator" aria-hidden="true">⏳</div>
        )}
        <span className="loading-text">{loadingText}</span>
      </div>

      <style jsx>{`
        .adaptive-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
        }
        
        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .loading-indicator {
          font-size: 2rem;
        }
        
        .loading-text {
          font-size: 1rem;
          color: #6b7280;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* No animation for reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
            border-top-color: #3b82f6;
          }
        }
        
        .adaptive-loading:not(.with-animation) .loading-spinner {
          animation: none;
          border-top-color: #3b82f6;
        }
        
        .high-contrast .loading-spinner {
          border-color: ButtonText;
          border-top-color: Highlight;
        }
        
        .high-contrast .loading-text {
          color: ButtonText;
        }
      `}</style>
    </div>
  );
};

// Adaptive Card Component
export interface AdaptiveCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  adaptLayout?: boolean;
  simplifyOnLowPerformance?: boolean;
}

const AdaptiveCard: React.FC<AdaptiveCardProps> = ({
  children,
  className,
  interactive = false,
  adaptLayout = true,
  simplifyOnLowPerformance = true
}) => {
  const { baseline } = useEnhancedProgressiveAccessibility();
  const [isSimplified, setIsSimplified] = useState(false);

  useEffect(() => {
    if (!baseline || !adaptLayout) return;

    const shouldSimplify = simplifyOnLowPerformance && (
      baseline.connectionSpeed === 'slow' ||
      baseline.deviceMemory < 4 ||
      baseline.screenReaderDetected
    );

    setIsSimplified(shouldSimplify);
  }, [baseline, adaptLayout, simplifyOnLowPerformance]);

  return (
    <Card
      className={cn(
        'adaptive-card',
        interactive && 'interactive-card',
        isSimplified && 'simplified-card',
        baseline?.touchDevice && 'touch-optimized',
        baseline?.highContrastMode && 'high-contrast',
        className
      )}
      {...(interactive && {
        role: 'button',
        tabIndex: 0
      })}
    >
      {children}

      <style jsx>{`
        .adaptive-card.interactive-card {
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .adaptive-card.interactive-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .adaptive-card.interactive-card:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        .adaptive-card.simplified-card {
          box-shadow: none;
          border: 1px solid #e5e7eb;
        }
        
        .adaptive-card.simplified-card:hover {
          transform: none;
          box-shadow: none;
          background: #f9fafb;
        }
        
        .adaptive-card.touch-optimized {
          min-height: 48px;
          padding: 16px;
        }
        
        .adaptive-card.high-contrast {
          border: 2px solid ButtonText;
          background: ButtonFace;
          color: ButtonText;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .adaptive-card {
            transition: none !important;
          }
          
          .adaptive-card:hover {
            transform: none !important;
          }
        }
      `}</style>
    </Card>
  );
};

// Export all adaptive components
export {
  AdaptiveContainer,
  AdaptiveText,
  AdaptiveMedia,
  AdaptiveAnimation,
  AdaptiveNavigation,
  AdaptiveForm,
  AdaptiveButtonGroup,
  UserPreferenceControls,
  AdaptiveLoading,
  AdaptiveCard
};

// Default export
export default {
  AdaptiveContainer,
  AdaptiveText,
  AdaptiveMedia,
  AdaptiveAnimation,
  AdaptiveNavigation,
  AdaptiveForm,
  AdaptiveButtonGroup,
  UserPreferenceControls,
  AdaptiveLoading,
  AdaptiveCard
};
