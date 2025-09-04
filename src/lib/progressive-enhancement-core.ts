'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Enhanced types for progressive enhancement
export interface ProgressiveEnhancementConfig {
  enableFallbacks: boolean;
  enableNoScriptSupport: boolean;
  enableKeyboardFallbacks: boolean;
  enableReducedFunctionality: boolean;
  enableOfflineSupport: boolean;
  gracefulDegradation: boolean;
  testMode: boolean;
  enableAdaptiveUI: boolean;
  enableMotionPreferences: boolean;
  enableHighContrastMode: boolean;
  enableLargeTextMode: boolean;
  enableTouchOptimization: boolean;
}

export interface AccessibilityFeatureConfig {
  required: boolean;
  fallback?: () => void | Promise<void>;
  noScriptAlternative?: string;
  degradationStrategy: 'hide' | 'disable' | 'fallback' | 'essential' | 'adaptive';
  dependencies?: string[];
  adaptiveOptions?: {
    reducedMotion?: boolean;
    highContrast?: boolean;
    largeText?: boolean;
    touchOptimized?: boolean;
    offlineCapable?: boolean;
  };
}

export interface FeatureState {
  available: boolean;
  enabled: boolean;
  error?: string;
  fallbackActive: boolean;
  lastCheck: number;
  adaptiveMode?: string;
  performanceImpact?: number;
}

export interface AccessibilityBaseline {
  // Core browser capabilities
  supportsAria: boolean;
  supportsMediaQueries: boolean;
  supportsLocalStorage: boolean;
  supportsClipboard: boolean;
  supportsGeolocation: boolean;
  supportsNotifications: boolean;
  supportsServiceWorker: boolean;
  supportsWebGL: boolean;
  
  // Accessibility detection
  screenReaderDetected: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  largeTextMode: boolean;
  
  // User preferences
  jsEnabled: boolean;
  touchDevice: boolean;
  offlineCapable: boolean;
  
  // Performance indicators
  connectionSpeed: 'slow' | 'fast' | 'unknown';
  deviceMemory: number;
  hardwareConcurrency: number;
}

export interface AdaptiveSettings {
  animations: boolean;
  transitions: boolean;
  autoplay: boolean;
  preloading: boolean;
  backgroundProcessing: boolean;
  complexLayouts: boolean;
  imageOptimization: boolean;
}

const DEFAULT_CONFIG: ProgressiveEnhancementConfig = {
  enableFallbacks: true,
  enableNoScriptSupport: true,
  enableKeyboardFallbacks: true,
  enableReducedFunctionality: true,
  enableOfflineSupport: true,
  gracefulDegradation: true,
  testMode: false,
  enableAdaptiveUI: true,
  enableMotionPreferences: true,
  enableHighContrastMode: true,
  enableLargeTextMode: true,
  enableTouchOptimization: true,
};

// Enhanced progressive enhancement manager
export class EnhancedProgressiveAccessibilityManager {
  private config: ProgressiveEnhancementConfig;
  private features: Map<string, AccessibilityFeatureConfig> = new Map();
  private featureStates: Map<string, FeatureState> = new Map();
  private baseline: AccessibilityBaseline;
  private observers: Array<MutationObserver | ResizeObserver | IntersectionObserver | PerformanceObserver> = [];
  private fallbackStyles: HTMLStyleElement | null = null;
  private adaptiveStyles: HTMLStyleElement | null = null;
  private performanceMetrics: Map<string, number> = new Map();
  private adaptiveSettings: AdaptiveSettings;

  constructor(config: Partial<ProgressiveEnhancementConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.baseline = this.establishBaseline();
    this.adaptiveSettings = this.calculateAdaptiveSettings();
    
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    this.setupNoScriptSupport();
    this.setupFallbackStyles();
    this.setupAdaptiveStyles();
    this.setupFeatureDetection();
    this.setupKeyboardFallbacks();
    this.setupErrorRecovery();
    this.setupPerformanceMonitoring();
    this.setupUserPreferenceDetection();
    this.monitorFeatureHealth();
    
    if (this.config.testMode) {
      this.enableTestMode();
    }
  }

  private setupNoScriptSupport(): void {
    // TODO: Implement noscript support
  }

  private setupFallbackStyles(): void {
    // TODO: Implement fallback styles
  }

  private setupFeatureDetection(): void {
    // TODO: Implement feature detection
  }

  private setupKeyboardFallbacks(): void {
    // TODO: Implement keyboard fallbacks
  }

  private setupErrorRecovery(): void {
    // TODO: Implement error recovery
  }

  private monitorFeatureHealth(): void {
    // TODO: Implement feature health monitoring
  }

  private establishBaseline(): AccessibilityBaseline {
    if (typeof window === 'undefined') {
      return this.getServerSideBaseline();
    }

    const baseline: AccessibilityBaseline = {
      // Core capabilities
      supportsAria: 'setAttribute' in Element.prototype,
      supportsMediaQueries: 'matchMedia' in window,
      supportsLocalStorage: this.testLocalStorage(),
      supportsClipboard: 'clipboard' in navigator,
      supportsGeolocation: 'geolocation' in navigator,
      supportsNotifications: 'Notification' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsWebGL: this.testWebGL(),
      
      // Accessibility detection
      screenReaderDetected: this.detectScreenReader(),
      highContrastMode: this.detectHighContrast(),
      reducedMotion: this.detectReducedMotion(),
      largeTextMode: this.detectLargeText(),
      
      // User preferences
      jsEnabled: true,
      touchDevice: this.detectTouchDevice(),
      offlineCapable: this.detectOfflineCapability(),
      
      // Performance indicators
      connectionSpeed: this.detectConnectionSpeed(),
      deviceMemory: this.getDeviceMemory(),
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
    };

    if (this.config.testMode) {
      console.log('📊 Enhanced Accessibility Baseline:', baseline);
    }

    return baseline;
  }

  private getServerSideBaseline(): AccessibilityBaseline {
    return {
      supportsAria: false,
      supportsMediaQueries: false,
      supportsLocalStorage: false,
      supportsClipboard: false,
      supportsGeolocation: false,
      supportsNotifications: false,
      supportsServiceWorker: false,
      supportsWebGL: false,
      screenReaderDetected: false,
      highContrastMode: false,
      reducedMotion: false,
      largeTextMode: false,
      jsEnabled: false,
      touchDevice: false,
      offlineCapable: false,
      connectionSpeed: 'unknown',
      deviceMemory: 4,
      hardwareConcurrency: 4,
    };
  }

  private detectTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private detectOfflineCapability(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
  }

  private detectConnectionSpeed(): 'slow' | 'fast' | 'unknown' {
    const connection = (navigator as any).connection;
    if (!connection) return 'unknown';
    
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
    if (effectiveType === '3g') return 'fast';
    return 'fast'; // 4g and above
  }

  private getDeviceMemory(): number {
    return (navigator as any).deviceMemory || 4;
  }

  private detectLargeText(): boolean {
    if (!window.matchMedia) return false;
    return window.matchMedia('(min-resolution: 192dpi)').matches ||
           window.matchMedia('(-webkit-min-device-pixel-ratio: 2)').matches;
  }

  private calculateAdaptiveSettings(): AdaptiveSettings {
    const settings: AdaptiveSettings = {
      animations: true,
      transitions: true,
      autoplay: true,
      preloading: true,
      backgroundProcessing: true,
      complexLayouts: true,
      imageOptimization: true,
    };

    if (typeof window === 'undefined') return settings;

    // Reduce features based on capabilities
    if (this.baseline.connectionSpeed === 'slow') {
      settings.preloading = false;
      settings.autoplay = false;
      settings.backgroundProcessing = false;
    }

    if (this.baseline.deviceMemory < 4) {
      settings.complexLayouts = false;
      settings.backgroundProcessing = false;
    }

    if (this.baseline.reducedMotion) {
      settings.animations = false;
      settings.transitions = false;
      settings.autoplay = false;
    }

    if (this.baseline.screenReaderDetected) {
      settings.autoplay = false;
      settings.complexLayouts = false;
    }

    return settings;
  }

  private setupAdaptiveStyles(): void {
    if (!this.config.enableAdaptiveUI) return;

    this.adaptiveStyles = document.createElement('style');
    this.adaptiveStyles.id = 'adaptive-accessibility-styles';
    
    let css = `
      /* Adaptive accessibility styles */
      
      /* Reduced motion preferences */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
      
      /* High contrast mode */
      @media (prefers-contrast: high) {
        :root {
          --contrast-ratio: 7;
        }
        
        * {
          border-color: ButtonText !important;
        }
        
        button, input, select, textarea {
          border: 2px solid ButtonText !important;
          background: ButtonFace !important;
          color: ButtonText !important;
        }
        
        a {
          color: LinkText !important;
        }
        
        .btn-primary {
          background: Highlight !important;
          color: HighlightText !important;
        }
      }
      
      /* Large text mode */
      @media (min-resolution: 192dpi) {
        :root {
          --base-font-size: 18px;
        }
        
        html {
          font-size: var(--base-font-size);
        }
        
        button, input, select, textarea {
          min-height: 48px;
          padding: 12px;
        }
        
        .touch-target {
          min-width: 48px;
          min-height: 48px;
        }
      }
      
      /* Touch device optimizations */
      .touch-device {
        --touch-target-size: 44px;
      }
      
      .touch-device button,
      .touch-device [role="button"],
      .touch-device input,
      .touch-device select,
      .touch-device textarea,
      .touch-device a {
        min-width: var(--touch-target-size);
        min-height: var(--touch-target-size);
        padding: 12px;
      }
      
      /* Connection-aware styles */
      .slow-connection .lazy-load,
      .slow-connection .background-video,
      .slow-connection .autoplay-media {
        display: none;
      }
      
      .slow-connection .image-heavy {
        background-image: none !important;
      }
      
      /* Memory-constrained device styles */
      .low-memory .complex-layout {
        display: block !important;
      }
      
      .low-memory .parallax-element,
      .low-memory .complex-animation {
        transform: none !important;
        animation: none !important;
      }
      
      /* Screen reader optimizations */
      .screen-reader-active .decorative-element,
      .screen-reader-active .visual-only {
        display: none;
      }
      
      .screen-reader-active .sr-only {
        position: static !important;
        width: auto !important;
        height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
        clip: auto !important;
        white-space: normal !important;
        border: 0 !important;
      }
      
      /* Focus management enhancements */
      .enhanced-focus-mode :focus-visible {
        outline: 3px solid #0066cc;
        outline-offset: 2px;
        box-shadow: 0 0 0 5px rgba(0, 102, 204, 0.3);
      }
      
      /* Keyboard navigation indicators */
      .keyboard-user .mouse-only {
        display: none !important;
      }
      
      .keyboard-user .keyboard-hint {
        display: block !important;
      }
    `;

    // Add device-specific classes
    if (this.baseline.touchDevice) {
      css += `
        /* Touch-specific enhancements */
        .touch-device .hover-effect:hover {
          /* Remove hover effects on touch devices */
        }
      `;
    }

    if (this.baseline.connectionSpeed === 'slow') {
      css += `
        /* Slow connection optimizations */
        .fast-connection-only {
          display: none !important;
        }
      `;
    }

    this.adaptiveStyles.textContent = css;
    document.head.appendChild(this.adaptiveStyles);
    
    // Apply adaptive classes to body
    this.applyAdaptiveClasses();
  }

  private applyAdaptiveClasses(): void {
    const classes = [];
    
    if (this.baseline.touchDevice) classes.push('touch-device');
    if (this.baseline.connectionSpeed === 'slow') classes.push('slow-connection');
    if (this.baseline.deviceMemory < 4) classes.push('low-memory');
    if (this.baseline.screenReaderDetected) classes.push('screen-reader-active');
    if (this.baseline.reducedMotion) classes.push('reduced-motion');
    if (this.baseline.highContrastMode) classes.push('high-contrast');
    if (this.baseline.largeTextMode) classes.push('large-text');
    
    document.body.classList.add(...classes);
  }

  private setupPerformanceMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Monitor layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let totalShift = 0;
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            totalShift += (entry as any).value;
          }
        }
        this.performanceMetrics.set('cumulativeLayoutShift', totalShift);
      });

      layoutShiftObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(layoutShiftObserver);

      // Monitor largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.performanceMetrics.set('largestContentfulPaint', lastEntry.startTime);
      });

      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);

      // Monitor first input delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          this.performanceMetrics.set('firstInputDelay', (entry as any).processingStart - entry.startTime);
        }
      });

      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);

    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  private setupUserPreferenceDetection(): void {
    const preferences = [
      { query: '(prefers-reduced-motion: reduce)', callback: () => this.handleReducedMotion() },
      { query: '(prefers-contrast: high)', callback: () => this.handleHighContrast() },
      { query: '(prefers-color-scheme: dark)', callback: () => this.handleDarkMode() },
      { query: '(prefers-reduced-data: reduce)', callback: () => this.handleReducedData() },
    ];

    preferences.forEach(({ query, callback }) => {
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia(query);
        
        const handleChange = () => {
          if (mediaQuery.matches) callback();
        };

        handleChange(); // Apply initial state
        mediaQuery.addEventListener('change', handleChange);
      }
    });
  }

  private handleReducedMotion(): void {
    document.body.classList.add('reduced-motion');
    this.adaptiveSettings.animations = false;
    this.adaptiveSettings.transitions = false;
    this.announce('Animations disabled per user preference', 'polite');
  }

  private handleHighContrast(): void {
    document.body.classList.add('high-contrast');
    this.announce('High contrast mode enabled', 'polite');
  }

  private handleDarkMode(): void {
    document.body.classList.add('dark-mode-preferred');
  }

  private handleReducedData(): void {
    document.body.classList.add('reduced-data');
    this.adaptiveSettings.preloading = false;
    this.adaptiveSettings.backgroundProcessing = false;
    this.adaptiveSettings.imageOptimization = true;
  }

  // Enhanced feature registration with adaptive capabilities
  registerFeature(name: string, config: AccessibilityFeatureConfig): void {
    this.features.set(name, config);
    this.testFeature(name);
  }

  private async testFeature(name: string): Promise<void> {
    const config = this.features.get(name);
    if (!config) return;

    try {
      let available = true;
      let adaptiveMode = 'standard';
      const startTime = performance.now();
      
      // Enhanced feature testing with adaptive logic
      switch (name) {
        case 'aria-live':
          available = this.baseline.supportsAria;
          if (!available && this.baseline.screenReaderDetected) {
            adaptiveMode = 'essential-fallback';
          }
          break;

        case 'focus-management':
          available = typeof document.activeElement !== 'undefined';
          if (this.baseline.touchDevice) {
            adaptiveMode = 'touch-optimized';
          }
          break;

        case 'animations':
          available = 'animate' in document.createElement('div');
          if (this.baseline.reducedMotion) {
            available = false;
            adaptiveMode = 'reduced-motion';
          } else if (this.baseline.connectionSpeed === 'slow') {
            adaptiveMode = 'performance-optimized';
          }
          break;

        case 'keyboard-shortcuts':
          available = typeof KeyboardEvent !== 'undefined';
          if (this.baseline.touchDevice) {
            adaptiveMode = 'touch-alternative';
          }
          break;

        default:
          // Custom feature test
          available = true;
      }

      const performanceImpact = performance.now() - startTime;

      this.setFeatureState(name, {
        available,
        enabled: available || (config.degradationStrategy === 'essential'),
        fallbackActive: !available && config.fallback !== undefined,
        lastCheck: Date.now(),
        adaptiveMode,
        performanceImpact,
      });

      // Apply fallback or adaptive behavior
      if (!available && config.fallback && config.required) {
        await config.fallback();
        this.setFeatureState(name, {
          available: false,
          enabled: true,
          fallbackActive: true,
          lastCheck: Date.now(),
          adaptiveMode: adaptiveMode + '-fallback',
        });
      } else if (config.adaptiveOptions && this.shouldUseAdaptiveMode(config.adaptiveOptions)) {
        this.applyAdaptiveFeature(name, config.adaptiveOptions);
      }

    } catch (error) {
      console.error(`Enhanced feature test failed for ${name}:`, error);
      this.setFeatureState(name, {
        available: false,
        enabled: false,
        fallbackActive: false,
        error: String(error),
        lastCheck: Date.now(),
      });
    }
  }

  private shouldUseAdaptiveMode(options: AccessibilityFeatureConfig['adaptiveOptions']): boolean {
    if (!options) return false;
    
    return (
      !!(options.reducedMotion && this.baseline.reducedMotion) ||
      !!(options.highContrast && this.baseline.highContrastMode) ||
      !!(options.touchOptimized && this.baseline.touchDevice) ||
      !!(options.offlineCapable && !navigator.onLine)
    );
  }

  private applyAdaptiveFeature(name: string, options: AccessibilityFeatureConfig['adaptiveOptions']): void {
    if (!options) return;

    if (options.reducedMotion && this.baseline.reducedMotion) {
      document.body.classList.add(`${name}-reduced-motion`);
    }

    if (options.highContrast && this.baseline.highContrastMode) {
      document.body.classList.add(`${name}-high-contrast`);
    }

    if (options.touchOptimized && this.baseline.touchDevice) {
      document.body.classList.add(`${name}-touch-optimized`);
    }
  }

  private setFeatureState(name: string, state: FeatureState): void {
    this.featureStates.set(name, state);
    
    if (this.config.testMode) {
      console.log(`Enhanced feature state updated - ${name}:`, state);
    }

    // Emit custom event for monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('accessibility-feature-state-change', {
        detail: { featureName: name, state }
      }));
    }
  }

  // Enhanced announcement system with adaptive behavior
  private announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.baseline.supportsAria) return;

    // Create or get announcer element
    let announcer = document.getElementById('adaptive-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'adaptive-announcer';
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }

    // Adaptive announcement based on context
    let adaptedMessage = message;
    if (this.baseline.screenReaderDetected) {
      adaptedMessage = `Accessibility notice: ${message}`;
    }

    announcer.textContent = adaptedMessage;
    
    // Clear announcement after delay
    setTimeout(() => {
      if (announcer) announcer.textContent = '';
    }, 1000);
  }

  // Public API methods
  public getBaseline(): AccessibilityBaseline {
    return { ...this.baseline };
  }

  public getAdaptiveSettings(): AdaptiveSettings {
    return { ...this.adaptiveSettings };
  }

  public getPerformanceMetrics(): Map<string, number> {
    return new Map(this.performanceMetrics);
  }

  public updateAdaptiveSettings(settings: Partial<AdaptiveSettings>): void {
    this.adaptiveSettings = { ...this.adaptiveSettings, ...settings };
    this.applyAdaptiveClasses();
  }

  public isFeatureAvailable(name: string): boolean {
    const state = this.featureStates.get(name);
    return state ? state.available || state.fallbackActive : false;
  }

  public getFeatureState(name: string): FeatureState | undefined {
    return this.featureStates.get(name);
  }

  public enableTestMode(): void {
    this.config.testMode = true;
    document.documentElement.classList.add('accessibility-test-mode');
    
    // Add test mode indicators
    const testIndicator = document.createElement('div');
    testIndicator.id = 'accessibility-test-indicator';
    testIndicator.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        background: #ff6b35;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        font-family: monospace;
      ">
        🧪 A11y Test Mode
      </div>
    `;
    document.body.appendChild(testIndicator);

    console.log('🧪 Enhanced accessibility test mode enabled');
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    
    if (this.fallbackStyles) this.fallbackStyles.remove();
    if (this.adaptiveStyles) this.adaptiveStyles.remove();
    
    const testIndicator = document.getElementById('accessibility-test-indicator');
    if (testIndicator) testIndicator.remove();
    
    const announcer = document.getElementById('adaptive-announcer');
    if (announcer) announcer.remove();
  }

  // Additional methods for existing progressive-accessibility.ts compatibility
  public testLocalStorage(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  public testWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  public detectScreenReader(): boolean {
    const indicators = [
      /NVDA|JAWS|SAPI|VoiceOver|TalkBack|Orca/i.test(navigator.userAgent),
      window.matchMedia('(-ms-high-contrast: active)').matches,
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    ];

    return indicators.some(Boolean);
  }

  public detectHighContrast(): boolean {
    if (!window.matchMedia) return false;
    
    const highContrastQueries = [
      '(-ms-high-contrast: active)',
      '(prefers-contrast: high)',
      '(prefers-contrast: more)'
    ];

    return highContrastQueries.some(query => 
      window.matchMedia(query).matches
    );
  }

  public detectReducedMotion(): boolean {
    if (!window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

// React hooks for enhanced progressive accessibility
export function useEnhancedProgressiveAccessibility(
  config: Partial<ProgressiveEnhancementConfig> = {}
) {
  const manager = useRef<EnhancedProgressiveAccessibilityManager>();
  const [baseline, setBaseline] = useState<AccessibilityBaseline | null>(null);
  const [adaptiveSettings, setAdaptiveSettings] = useState<AdaptiveSettings | null>(null);
  const [featuresReady, setFeaturesReady] = useState(false);

  useEffect(() => {
    manager.current = new EnhancedProgressiveAccessibilityManager(config);
    setBaseline(manager.current.getBaseline());
    setAdaptiveSettings(manager.current.getAdaptiveSettings());
    setFeaturesReady(true);
    
    return () => {
      manager.current?.cleanup();
    };
  }, [config]);

  const registerFeature = useCallback((name: string, config: AccessibilityFeatureConfig) => {
    manager.current?.registerFeature(name, config);
  }, []);

  const isFeatureAvailable = useCallback((name: string) => {
    return manager.current?.isFeatureAvailable(name) || false;
  }, []);

  const getFeatureState = useCallback((name: string) => {
    return manager.current?.getFeatureState(name);
  }, []);

  const updateAdaptiveSettings = useCallback((settings: Partial<AdaptiveSettings>) => {
    manager.current?.updateAdaptiveSettings(settings);
    setAdaptiveSettings(manager.current?.getAdaptiveSettings() || null);
  }, []);

  const enableTestMode = useCallback(() => {
    manager.current?.enableTestMode();
  }, []);

  return {
    baseline,
    adaptiveSettings,
    featuresReady,
    registerFeature,
    isFeatureAvailable,
    getFeatureState,
    updateAdaptiveSettings,
    enableTestMode,
    getPerformanceMetrics: () => manager.current?.getPerformanceMetrics() || new Map(),
  };
}

// Export utilities
export const enhancedProgressiveAccessibilityUtils = {
  createManager: (config?: Partial<ProgressiveEnhancementConfig>) => 
    new EnhancedProgressiveAccessibilityManager(config),
  
  detectCapabilities: () => {
    const manager = new EnhancedProgressiveAccessibilityManager();
    return {
      baseline: manager.getBaseline(),
      adaptiveSettings: manager.getAdaptiveSettings(),
    };
  },
  
  generateCompatibilityReport: () => {
    const manager = new EnhancedProgressiveAccessibilityManager();
    return {
      baseline: manager.getBaseline(),
      adaptiveSettings: manager.getAdaptiveSettings(),
      performanceMetrics: manager.getPerformanceMetrics(),
    };
  }
};

