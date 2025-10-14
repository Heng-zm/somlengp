'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
// Memory leak prevention: Event listeners need cleanup, Timers need cleanup, Observers need cleanup
// Add cleanup in useEffect return function

// Types for accessibility management
interface AccessibilityConfig {
  enableFocusManagement: boolean;
  enableKeyboardShortcuts: boolean;
  enableScreenReaderSupport: boolean;
  enableHighContrastMode: boolean;
  enableReducedMotion: boolean;
  announcePageChanges: boolean;
  focusOnError: boolean;
  skipLinksEnabled: boolean;
}
interface FocusableElement extends HTMLElement {
  tabIndex: number;
}
interface AccessibilityReport {
  id: string;
  timestamp: number;
  url: string;
  issues: AccessibilityIssue[];
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}
interface AccessibilityIssue {
  type: 'error' | 'warning' | 'notice';
  category: 'focus' | 'aria' | 'keyboard' | 'color' | 'structure' | 'content';
  element?: HTMLElement;
  selector?: string;
  message: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}
interface SkipLink {
  id: string;
  text: string;
  target: string;
  shortcut?: string;
}
const DEFAULT_CONFIG: AccessibilityConfig = {
  enableFocusManagement: true,
  enableKeyboardShortcuts: true,
  enableScreenReaderSupport: true,
  enableHighContrastMode: false,
  enableReducedMotion: false,
  announcePageChanges: true,
  focusOnError: true,
  skipLinksEnabled: true,
};
const DEFAULT_SKIP_LINKS: SkipLink[] = [
  { id: 'skip-main', text: 'Skip to main content', target: '#main' },
  { id: 'skip-nav', text: 'Skip to navigation', target: '#navigation' },
  { id: 'skip-search', text: 'Skip to search', target: '#search' },
  { id: 'skip-footer', text: 'Skip to footer', target: '#footer' },
];
class AccessibilityManager {
  private config: AccessibilityConfig;
  private focusStack: HTMLElement[] = [];
  private announcer: HTMLElement | null = null;
  private skipLinksContainer: HTMLElement | null = null;
  private observers: Array<MutationObserver | IntersectionObserver> = [];
  private keyboardShortcuts: Map<string, () => void> = new Map();
  private isInitialized = false;
  private reports: AccessibilityReport[] = [];
  private focusTrapActive = false;
  private lastAnnouncementTime = 0;
  private pendingAnnouncements: string[] = [];
  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }
  private initialize() {
    if (this.isInitialized) return;
    try {
      this.setupAnnouncer();
      this.setupSkipLinks();
      this.setupKeyboardShortcuts();
      this.setupFocusManagement();
      this.setupAriaLiveRegions();
      this.setupPreferenceDetection();
      this.setupAccessibilityObservers();
      this.isInitialized = true;
      this.announce('Accessibility features enabled', 'polite');
    } catch (error) {
    }
  }
  private setupAnnouncer() {
    // Create aria-live region for announcements
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.id = 'accessibility-announcer';
    document.body.appendChild(this.announcer);
  }
  private setupSkipLinks() {
    if (!this.config.skipLinksEnabled) return;
    // Create skip links container
    this.skipLinksContainer = document.createElement('nav');
    this.skipLinksContainer.className = 'skip-links';
    this.skipLinksContainer.setAttribute('aria-label', 'Skip navigation links');
    // Style skip links to be hidden until focused
    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -1000px;
        left: -1000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
        z-index: 10000;
      }
      .skip-links:focus-within {
        position: fixed;
        top: 0;
        left: 0;
        width: auto;
        height: auto;
        padding: 8px;
        background: #000;
        color: #fff;
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      }
      .skip-link {
        display: block;
        padding: 8px 12px;
        color: #fff;
        text-decoration: none;
        margin: 2px 0;
        border-radius: 4px;
        background: transparent;
        border: 1px solid transparent;
      }
      .skip-link:focus {
        outline: 2px solid #fff;
        background: rgba(255,255,255,0.1);
        border-color: #fff;
      }
    `;
    document.head.appendChild(style);
    // Add skip links
    DEFAULT_SKIP_LINKS.forEach(link => {
      const skipLink = document.createElement('a');
      skipLink.href = link.target;
      skipLink.textContent = link.text;
      skipLink.className = 'skip-link';
      skipLink.id = link.id;
      if (link.shortcut) {
        skipLink.title = `Shortcut: ${link.shortcut}`;
      }
      this.skipLinksContainer!.appendChild(skipLink);
    });
    document.body.insertBefore(this.skipLinksContainer, document.body.firstChild);
  }
  private setupKeyboardShortcuts() {
    if (!this.config.enableKeyboardShortcuts) return;
    // Default keyboard shortcuts
    const shortcuts = new Map([
      ['Alt+1', () => this.focusElement('#main')],
      ['Alt+2', () => this.focusElement('#navigation')],
      ['Alt+3', () => this.focusElement('#search')],
      ['Alt+/', () => this.showKeyboardShortcutsHelp()],
      ['Alt+H', () => this.focusElement('h1, h2, h3, h4, h5, h6')],
      ['Alt+L', () => this.focusElement('[role="main"] a, main a')],
      ['Escape', () => this.handleEscape()],
    ]);
    shortcuts.forEach((action, shortcut) => {
      this.keyboardShortcuts.set(shortcut, action);
    });
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }
  private setupFocusManagement() {
    if (!this.config.enableFocusManagement) return;
    // Track focus changes
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target && this.isFocusable(target)) {
        this.focusStack.push(target);
        // Limit focus stack size
        if (this.focusStack.length > 10) {
          this.focusStack = this.focusStack.slice(-10);
        }
      }
    });
    // Handle focus traps
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab' && this.focusTrapActive) {
        this.handleFocusTrap(event);
      }
    });
  }
  private setupAriaLiveRegions() {
    // Create different types of live regions
    const regions = [
      { id: 'aria-status', live: 'polite', atomic: 'true', label: 'Status messages' },
      { id: 'aria-alert', live: 'assertive', atomic: 'true', label: 'Important alerts' },
      { id: 'aria-log', live: 'polite', atomic: 'false', label: 'Activity log' },
    ];
    regions.forEach(region => {
      if (!document.getElementById(region.id)) {
        const element = document.createElement('div');
        element.id = region.id;
        element.setAttribute('aria-live', region.live);
        element.setAttribute('aria-atomic', region.atomic);
        element.setAttribute('aria-label', region.label);
        element.className = 'sr-only';
        document.body.appendChild(element);
      }
    });
  }
  private setupPreferenceDetection() {
    // Detect and apply user preferences
    const mediaQueries = [
      { query: '(prefers-reduced-motion: reduce)', property: 'enableReducedMotion' },
      { query: '(prefers-contrast: high)', property: 'enableHighContrastMode' },
      { query: '(prefers-color-scheme: dark)', property: 'darkMode' },
    ];
    mediaQueries.forEach(({ query, property }) => {
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia(query);
        const handleChange = () => {
          (this.config as any)[property] = mediaQuery.matches;
          this.applyPreferences();
        };
        handleChange(); // Apply initial state
        mediaQuery.addListener(handleChange);
      }
    });
  }
  private setupAccessibilityObservers() {
    // Monitor DOM changes for accessibility issues
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.auditElement(node as HTMLElement);
            }
          });
        }
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-*', 'role', 'tabindex', 'alt'],
    });
    this.observers.push(observer);
  }
  private handleKeydown(event: KeyboardEvent) {
    const key = this.getShortcutKey(event);
    const action = this.keyboardShortcuts.get(key);
    if (action) {
      event.preventDefault();
      action();
    }
  }
  private getShortcutKey(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    if (event.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      parts.push(event.key);
    }
    return parts.join('+');
  }
  private handleEscape() {
    // Close modals, dropdowns, etc.
    const activeElement = document.activeElement as HTMLElement;
    // Check for modal
    const modal = activeElement?.closest('[role="dialog"], .modal');
    if (modal) {
      const closeButton = modal.querySelector('[data-dismiss], [aria-label*="close" i], .close');
      if (closeButton) {
        (closeButton as HTMLElement).click();
        return;
      }
    }
    // Check for dropdown
    const dropdown = activeElement?.closest('[role="listbox"], .dropdown-menu, [aria-expanded="true"]');
    if (dropdown) {
      const trigger = document.querySelector(`[aria-controls="${dropdown.id}"]`);
      if (trigger) {
        (trigger as HTMLElement).focus();
        trigger.setAttribute('aria-expanded', 'false');
        return;
      }
    }
    // Return to previous focus
    this.restorePreviousFocus();
  }
  private handleFocusTrap(event: KeyboardEvent) {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const currentElement = document.activeElement as HTMLElement;
    if (event.shiftKey) {
      if (currentElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (currentElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
  private applyPreferences() {
    document.documentElement.classList.toggle('reduce-motion', this.config.enableReducedMotion);
    document.documentElement.classList.toggle('high-contrast', this.config.enableHighContrastMode);
  }
  private auditElement(element: HTMLElement) {
    const issues: AccessibilityIssue[] = [];
    // Check for missing alt text on images
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push({
          type: 'error',
          category: 'content',
          element,
          message: 'Image missing alternative text',
          suggestion: 'Add alt attribute or aria-label to describe the image',
          priority: 'high',
        });
      }
    }
    // Check for missing form labels
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
      const input = element as HTMLInputElement;
      if (!input.labels?.length && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        issues.push({
          type: 'error',
          category: 'content',
          element,
          message: 'Form control missing label',
          suggestion: 'Add a label element or aria-label attribute',
          priority: 'high',
        });
      }
    }
    // Check for keyboard accessibility
    if (element.onclick && !this.isFocusable(element) && element.tagName !== 'BUTTON' && element.tagName !== 'A') {
      issues.push({
        type: 'warning',
        category: 'keyboard',
        element,
        message: 'Interactive element not keyboard accessible',
        suggestion: 'Add tabindex="0" and keyboard event handlers',
        priority: 'medium',
      });
    }
    // Report issues if any
    if (issues.length > 0) {
    }
  }
  // Public methods
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcer || !this.config.enableScreenReaderSupport) return;
    // Throttle announcements
    const now = Date.now();
    if (now - this.lastAnnouncementTime < 1000) {
      this.pendingAnnouncements.push(message);
      return;
    }
    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;
    this.lastAnnouncementTime = now;
    // Process pending announcements
    setTimeout(() => {
      if (this.pendingAnnouncements.length > 0) {
        const nextMessage = this.pendingAnnouncements.shift();
        if (nextMessage) this.announce(nextMessage, priority);
      }
    }, 1500);
  }
  public focusElement(selector: string): boolean {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && this.isFocusable(element)) {
      element.focus();
      this.announce(`Focused on ${this.getElementDescription(element)}`);
      return true;
    }
    return false;
  }
  public createFocusTrap(container: HTMLElement): () => void {
    this.focusTrapActive = true;
    // Focus first focusable element
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
    return () => {
      this.focusTrapActive = false;
    };
  }
  public restorePreviousFocus(): void {
    if (this.focusStack.length > 1) {
      // Remove current focus and focus previous
      this.focusStack.pop();
      const previousElement = this.focusStack[this.focusStack.length - 1];
      if (previousElement && document.body.contains(previousElement)) {
        previousElement.focus();
      }
    }
  }
  public addKeyboardShortcut(key: string, action: () => void, description?: string): void {
    this.keyboardShortcuts.set(key, action);
    if (description) {
      this.announce(`Keyboard shortcut registered: ${key} - ${description}`);
    }
  }
  public removeKeyboardShortcut(key: string): void {
    this.keyboardShortcuts.delete(key);
  }
  public getAccessibilityScore(): number {
    const report = this.generateAccessibilityReport();
    return report.score;
  }
  public generateAccessibilityReport(): AccessibilityReport {
    const issues: AccessibilityIssue[] = [];
    // Audit entire document
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      this.auditElement(element as HTMLElement);
    });
    // Calculate score based on issues
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    let score = 100;
    score -= errorCount * 10; // 10 points per error
    score -= warningCount * 5; // 5 points per warning
    score = Math.max(0, score);
    const grade = this.calculateGrade(score);
    const report: AccessibilityReport = {
      id: `a11y_report_${Date.now()}`,
      timestamp: Date.now(),
      url: window.location.href,
      issues,
      score,
      grade,
      recommendations: this.generateRecommendations(issues),
    };
    this.reports.push(report);
    return report;
  }
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 95) return 'A';
    if (score >= 85) return 'B';
    if (score >= 75) return 'C';
    if (score >= 65) return 'D';
    return 'F';
  }
  private generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations = new Set<string>();
    issues.forEach(issue => {
      switch (issue.category) {
        case 'content':
          recommendations.add('Review content for clarity and proper labeling');
          break;
        case 'keyboard':
          recommendations.add('Ensure all interactive elements are keyboard accessible');
          break;
        case 'focus':
          recommendations.add('Improve focus management and visual indicators');
          break;
        case 'aria':
          recommendations.add('Review ARIA attributes and roles for correctness');
          break;
        case 'color':
          recommendations.add('Check color contrast ratios and avoid color-only information');
          break;
        case 'structure':
          recommendations.add('Review document structure and heading hierarchy');
          break;
      }
    });
    return Array.from(recommendations);
  }
  private isFocusable(element: HTMLElement): boolean {
    if (element.tabIndex < 0) return false;
    if (element.hasAttribute('disabled')) return false;
    if (element.hidden) return false;
    const focusableTags = ['input', 'button', 'select', 'textarea', 'a'];
    const tagName = element.tagName.toLowerCase();
    if (focusableTags.includes(tagName)) return true;
    if (element.tabIndex >= 0) return true;
    if (element.contentEditable === 'true') return true;
    return false;
  }
  private getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    return elements.filter(element => 
      this.isFocusable(element) && 
      this.isVisible(element)
    );
  }
  private isVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      parseFloat(style.opacity) > 0
    );
  }
  private getElementDescription(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const label = element.getAttribute('aria-label') || 
                  element.getAttribute('alt') ||
                  element.textContent?.trim().substring(0, 50);
    let description = role || tagName;
    if (label) description += `: ${label}`;
    return description;
  }
  private showKeyboardShortcutsHelp(): void {
    const shortcuts = Array.from(this.keyboardShortcuts.entries())
      .map(([key, _]) => key)
      .join(', ');
    this.announce(`Available keyboard shortcuts: ${shortcuts}`, 'assertive');
  }
  public updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyPreferences();
  }
  public cleanup(): void {
    // Remove event listeners and observers
    this.observers.forEach(observer => observer.disconnect());
    // Remove created elements
    if (this.announcer) {
      this.announcer.remove();
    }
    if (this.skipLinksContainer) {
      this.skipLinksContainer.remove();
    }
  }
}
// Singleton instance
let accessibilityManager: AccessibilityManager | null = null;
export function getAccessibilityManager(config?: Partial<AccessibilityConfig>): AccessibilityManager {
  if (!accessibilityManager && typeof window !== 'undefined') {
    accessibilityManager = new AccessibilityManager(config);
  }
  return accessibilityManager!;
}
// React hooks
export function useAccessibility() {
  const manager = getAccessibilityManager();
  return {
    announce: (message: string, priority?: 'polite' | 'assertive') => 
      manager.announce(message, priority),
    focusElement: (selector: string) => manager.focusElement(selector),
    createFocusTrap: (container: HTMLElement) => manager.createFocusTrap(container),
    restorePreviousFocus: () => manager.restorePreviousFocus(),
    addKeyboardShortcut: (key: string, action: () => void, description?: string) =>
      manager.addKeyboardShortcut(key, action, description),
    getAccessibilityScore: () => manager.getAccessibilityScore(),
    generateReport: () => manager.generateAccessibilityReport(),
  };
}
export function useAnnouncer() {
  const { announce } = useAccessibility();
  const announcePolite = useCallback((message: string) => 
    announce(message, 'polite'), [announce]);
  const announceAssertive = useCallback((message: string) => 
    announce(message, 'assertive'), [announce]);
  return { announcePolite, announceAssertive, announce };
}
export function useFocusManagement() {
  const manager = getAccessibilityManager();
  const [focusTrap, setFocusTrap] = useState<(() => void) | null>(null);
  const trapFocus = useCallback((container: HTMLElement) => {
    if (focusTrap) focusTrap(); // Release previous trap
    const releaseTrap = manager.createFocusTrap(container);
    setFocusTrap(() => releaseTrap);
    return releaseTrap;
  }, [focusTrap, manager]);
  const releaseFocusTrap = useCallback(() => {
    if (focusTrap) {
      focusTrap();
      setFocusTrap(null);
    }
  }, [focusTrap]);
  useEffect(() => {
    return () => {
      if (focusTrap) focusTrap();
    };
  }, [focusTrap]);
  return {
    trapFocus,
    releaseFocusTrap,
    focusElement: manager.focusElement.bind(manager),
    restorePreviousFocus: manager.restorePreviousFocus.bind(manager),
  };
}
export { AccessibilityManager, type AccessibilityConfig, type AccessibilityReport, type AccessibilityIssue };


// TODO: Memory leak fix needed - Add cleanup for event listeners:
// useEffect(() => {
//   const cleanup = () => {
//     // Add removeEventListener calls here
//   };
//   return cleanup;
// }, []);