'use client';
import React, { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import { useEnhancedProgressiveAccessibility } from '@/lib/progressive-enhancement-core';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Info, AlertTriangle, ChevronDown } from 'lucide-react';
// Enhanced Skip Navigation Component
export interface SkipNavigationProps {
  links: Array<{
    href: string;
    label: string;
    accessKey?: string;
  }>;
  className?: string;
}
const ProgressiveSkipNavigation = forwardRef<HTMLElement, SkipNavigationProps>(
  ({ links, className }, ref) => {
    const {} = useEnhancedProgressiveAccessibility();
    return (
      <nav 
        ref={ref}
        className={cn("skip-navigation", className)}
        aria-label="Skip navigation links"
      >
        <div className="skip-links-container">
          {links.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className="skip-link"
              accessKey={link.accessKey}
              data-index={index}
            >
              {link.label}
              {link.accessKey && (
                <span className="sr-only"> (Access key: {link.accessKey})</span>
              )}
            </a>
          ))}
        </div>
        <style jsx>{`
          .skip-navigation {
            position: absolute;
            top: -1000px;
            left: -1000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
            z-index: 10000;
          }
          .skip-navigation:focus-within {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            width: auto;
            height: auto;
            padding: 8px;
            background: #000;
            color: #fff;
            border-bottom: 2px solid #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.8);
          }
          .skip-links-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
          }
          .skip-link {
            display: block;
            padding: 8px 12px;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.2s ease;
          }
          .skip-link:focus {
            outline: 2px solid #fff;
            outline-offset: 2px;
            background: rgba(255,255,255,0.2);
            transform: scale(1.05);
          }
          .skip-link:hover {
            background: rgba(255,255,255,0.2);
          }
          /* High contrast mode support */
          @media (prefers-contrast: high) {
            .skip-navigation:focus-within {
              background: ButtonFace;
              color: ButtonText;
              border-color: ButtonText;
            }
            .skip-link {
              background: ButtonFace;
              color: ButtonText;
              border-color: ButtonText;
            }
            .skip-link:focus {
              outline-color: Highlight;
              background: Highlight;
              color: HighlightText;
            }
          }
          /* No-script fallback */
          .no-js .skip-navigation {
            position: static;
            width: auto;
            height: auto;
            background: #f0f0f0;
            border: 1px solid #ccc;
            padding: 8px;
            margin-bottom: 16px;
          }
          .no-js .skip-link {
            color: #0066cc;
            background: transparent;
            border-color: #0066cc;
          }
        `}</style>
        {/* No-script alternative */}
        <noscript>
          <div className="no-js-skip-navigation">
            <h2>Quick Navigation</h2>
            <ul>
              {links.map(link => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </noscript>
      </nav>
    );
  }
);
ProgressiveSkipNavigation.displayName = 'ProgressiveSkipNavigation';
// Progressive Focus Management Component
export interface FocusManagementProps {
  children: React.ReactNode;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  className?: string;
  onFocusEnter?: () => void;
  onFocusLeave?: () => void;
}
const ProgressiveFocusManager = forwardRef<HTMLDivElement, FocusManagementProps>(
  ({ children, trapFocus = false, restoreFocus = true, className, onFocusEnter, onFocusLeave }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastFocusedElement = useRef<HTMLElement | null>(null);
    const [isActive, setIsActive] = useState(false);
    const { baseline } = useEnhancedProgressiveAccessibility();
    const getFocusableElements = useCallback(() => {
      if (!containerRef.current) return [];
      const selector = `
        button:not([disabled]),
        [href]:not([disabled]),
        input:not([disabled]),
        select:not([disabled]),
        textarea:not([disabled]),
        [tabindex]:not([tabindex="-1"]):not([disabled]),
        [contenteditable="true"]:not([disabled])
      `;
      return Array.from(containerRef.current.querySelectorAll(selector)) as HTMLElement[];
    }, []);
    const handleFocusLeave = useCallback(() => {
      setIsActive(false);
      onFocusLeave?.();
      // Restore previous focus if enabled and available
      if (restoreFocus && lastFocusedElement.current) {
        try {
          lastFocusedElement.current.focus();
        } catch (error) {
        }
        lastFocusedElement.current = null;
      }
    }, [restoreFocus, onFocusLeave]);
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
      if (!trapFocus || !isActive) return;
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
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
      if (event.key === 'Escape' && trapFocus) {
        event.preventDefault();
        handleFocusLeave();
      }
    }, [trapFocus, isActive, getFocusableElements, handleFocusLeave]);
    const handleFocusEnter = useCallback(() => {
      if (restoreFocus) {
        lastFocusedElement.current = document.activeElement as HTMLElement;
      }
      setIsActive(true);
      onFocusEnter?.();
      // Auto-focus first element if baseline supports it
      if (baseline?.supportsAria) {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          setTimeout(() => focusableElements[0].focus(), 0);
        }
      }
    }, [restoreFocus, onFocusEnter, getFocusableElements, baseline]);
    useEffect(() => {
      if (trapFocus) {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    }, [trapFocus, handleKeyDown]);
    return (
      <div
        ref={containerRef}
        className={cn(
          'progressive-focus-manager',
          trapFocus && 'focus-trap-active',
          isActive && 'focus-active',
          className
        )}
        onFocus={handleFocusEnter}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            handleFocusLeave();
          }
        }}
      >
        {children}
        {/* Screen reader instructions */}
        <div className="sr-only" role="note">
          {trapFocus && "Use Tab to navigate within this section, Escape to exit."}
        </div>
      </div>
    );
  }
);
ProgressiveFocusManager.displayName = 'ProgressiveFocusManager';
// Progressive Announcement Component
export interface ProgressiveAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  temporary?: boolean;
  timeout?: number;
  fallback?: string;
}
const ProgressiveAnnouncement: React.FC<ProgressiveAnnouncementProps> = ({
  message,
  priority = 'polite',
  temporary = true,
  timeout = 5000,
  fallback
}) => {
  const { baseline } = useEnhancedProgressiveAccessibility();
  const [currentMessage, setCurrentMessage] = useState(message);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setCurrentMessage(message);
    setIsVisible(true);
    if (temporary) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setCurrentMessage('');
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [message, temporary, timeout]);
  // Use fallback for non-ARIA environments
  const displayMessage = baseline?.supportsAria ? currentMessage : (fallback || currentMessage);
  if (!isVisible || !displayMessage) return null;
  return (
    <>
      {/* ARIA Live Region */}
      {baseline?.supportsAria && (
        <div
          role="status"
          aria-live={priority}
          aria-atomic="true"
          className="sr-only"
        >
          {displayMessage}
        </div>
      )}
      {/* Fallback for non-ARIA environments */}
      {!baseline?.supportsAria && fallback && (
        <div 
          className="accessibility-announcement-fallback"
          role="alert"
        >
          <div className="announcement-content">
            <Info className="w-4 h-4" />
            {fallback}
          </div>
        </div>
      )}
      <style jsx>{`
        .accessibility-announcement-fallback {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #333;
          color: #fff;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          max-width: 300px;
        }
        .announcement-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </>
  );
};
// Progressive Adaptive Button Component
export interface ProgressiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg';
  isLoading?: boolean;
  adaptiveMode?: boolean;
  touchOptimized?: boolean;
}
const ProgressiveButton = forwardRef<HTMLButtonElement, ProgressiveButtonProps>(
  ({ 
    children, 
    variant = 'default', 
    size = 'default', 
    className, 
    isLoading = false,
    adaptiveMode = true,
    touchOptimized,
    ...props 
  }, ref) => {
    const { baseline, adaptiveSettings } = useEnhancedProgressiveAccessibility();
    const [focusVisible, setFocusVisible] = useState(false);
    const shouldUseTouchOptimization = touchOptimized ?? 
      (adaptiveMode && baseline?.touchDevice);
    const shouldReduceMotion = adaptiveMode && 
      (baseline?.reducedMotion || !adaptiveSettings?.animations);
    const handleFocus = useCallback(() => {
      setFocusVisible(true);
    }, []);
    const handleBlur = useCallback(() => {
      setFocusVisible(false);
    }, []);
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          // Adaptive classes
          shouldUseTouchOptimization && 'touch-optimized',
          shouldReduceMotion && 'reduced-motion',
          baseline?.highContrastMode && 'high-contrast',
          focusVisible && 'focus-visible-enhanced',
          isLoading && 'loading',
          className
        )}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isLoading || props.disabled}
        aria-disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <span className="loading-indicator sr-only">
            Loading...
          </span>
        )}
        {children}
        <style jsx>{`
          :global(.touch-optimized) {
            min-width: 44px !important;
            min-height: 44px !important;
            padding: 12px 16px !important;
          }
          :global(.reduced-motion) {
            transition: none !important;
            animation: none !important;
          }
          :global(.focus-visible-enhanced) {
            outline: 3px solid #0066cc !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 5px rgba(0, 102, 204, 0.3) !important;
          }
          :global(.loading) {
            opacity: 0.7;
            cursor: not-allowed;
          }
          @media (prefers-contrast: high) {
            :global(.high-contrast) {
              border: 2px solid ButtonText !important;
              background: ButtonFace !important;
              color: ButtonText !important;
            }
            :global(.high-contrast:focus) {
              background: Highlight !important;
              color: HighlightText !important;
            }
          }
        `}</style>
      </Button>
    );
  }
);
ProgressiveButton.displayName = 'ProgressiveButton';
// Progressive Collapsible Component with Enhanced Keyboard Navigation
export interface ProgressiveCollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  onToggle?: (open: boolean) => void;
}
const ProgressiveCollapsible: React.FC<ProgressiveCollapsibleProps> = ({
  title,
  children,
  defaultOpen = false,
  disabled = false,
  icon,
  className,
  onToggle
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [focused, setFocused] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { baseline, adaptiveSettings } = useEnhancedProgressiveAccessibility();
  const handleToggle = useCallback(() => {
    if (disabled) return;
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
    // Announce state change
    const message = `${title} ${newState ? 'expanded' : 'collapsed'}`;
    // Use different announcement methods based on baseline
    if (baseline?.supportsAria) {
      // Create temporary announcement
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.className = 'sr-only';
      announcer.textContent = message;
      document.body.appendChild(announcer);
      setTimeout(() => announcer.remove(), 1000);
    }
  }, [disabled, isOpen, title, onToggle, baseline]);
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!focused) return;
    switch (event.key) {
      case 'ArrowDown':
        if (isOpen && contentRef.current) {
          const firstFocusable = contentRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          firstFocusable?.focus();
          event.preventDefault();
        }
        break;
      case 'ArrowUp':
        buttonRef.current?.focus();
        event.preventDefault();
        break;
      case 'Home':
      case 'End':
        // Navigate to first/last collapsible in a group
        const container = buttonRef.current?.closest('[role="group"], .collapsible-group');
        if (container) {
          const collapsibles = container.querySelectorAll('.progressive-collapsible button');
          const target = event.key === 'Home' ? collapsibles[0] : collapsibles[collapsibles.length - 1];
          (target as HTMLElement)?.focus();
          event.preventDefault();
        }
        break;
    }
  }, [focused, isOpen]);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  return (
    <div className={cn('progressive-collapsible', className)}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={cn(
          'collapsible-trigger',
          'w-full flex items-center justify-between p-4',
          'text-left border-0 bg-transparent',
          'hover:bg-secondary/50 focus-visible:outline-2 focus-visible:outline-primary',
          baseline?.touchDevice && 'touch-optimized',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="flex items-center gap-2">
          {icon && <span className="collapsible-icon">{icon}</span>}
          {title}
        </span>
        <span 
          className={cn(
            'collapsible-chevron transition-transform',
            !adaptiveSettings?.transitions && 'no-transition',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>
      <div
        ref={contentRef}
        id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={cn(
          'collapsible-content',
          'overflow-hidden',
          !adaptiveSettings?.transitions && 'no-transition'
        )}
        style={{
          height: isOpen ? 'auto' : '0',
          opacity: isOpen ? '1' : '0',
          transition: adaptiveSettings?.transitions 
            ? 'height 0.3s ease, opacity 0.2s ease' 
            : 'none'
        }}
        aria-hidden={!isOpen}
      >
        <div className="p-4 pt-0">
          {children}
        </div>
      </div>
      {/* No-script fallback */}
      <noscript>
        <div className="no-js-collapsible">
          <h3>{title}</h3>
          <div>{children}</div>
        </div>
      </noscript>
      <style jsx>{`
        .no-js-collapsible {
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 16px;
          padding: 16px;
        }
        .no-js-collapsible h3 {
          margin: 0 0 12px 0;
          padding: 0;
        }
        .touch-optimized {
          min-height: 48px !important;
          padding: 16px !important;
        }
        .no-transition,
        .no-transition * {
          transition: none !important;
          animation: none !important;
        }
      `}</style>
    </div>
  );
};
// Progressive Navigation Component
export interface ProgressiveNavigationProps {
  items: Array<{
    href?: string;
    label: string;
    children?: Array<{ href: string; label: string }>;
    current?: boolean;
  }>;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onNavigate?: (href: string, label: string) => void;
}
const ProgressiveNavigation: React.FC<ProgressiveNavigationProps> = ({
  items,
  orientation = 'horizontal',
  className,
  onNavigate
}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [expandedSubmenu, setExpandedSubmenu] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const { baseline, adaptiveSettings } = useEnhancedProgressiveAccessibility();
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!navRef.current?.contains(document.activeElement)) return;
    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const expandKey = isHorizontal ? 'ArrowDown' : 'ArrowRight';
    const collapseKey = isHorizontal ? 'ArrowUp' : 'ArrowLeft';
    switch (event.key) {
      case nextKey:
        event.preventDefault();
        setFocusedIndex(prev => (prev + 1) % items.length);
        break;
      case prevKey:
        event.preventDefault();
        setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case expandKey:
        event.preventDefault();
        if (items[focusedIndex].children) {
          setExpandedSubmenu(focusedIndex);
        }
        break;
      case collapseKey:
        event.preventDefault();
        setExpandedSubmenu(null);
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        setExpandedSubmenu(null);
        break;
    }
  }, [orientation, items, focusedIndex]);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  // Focus management
  useEffect(() => {
    const activeLink = navRef.current?.querySelector(`[data-index="${focusedIndex}"]`) as HTMLElement;
    activeLink?.focus();
  }, [focusedIndex]);
  return (
    <nav
      ref={navRef}
      className={cn(
        'progressive-navigation',
        `orientation-${orientation}`,
        baseline?.touchDevice && 'touch-device',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <ul
        className={cn(
          'navigation-list',
          orientation === 'horizontal' ? 'flex flex-wrap' : 'flex flex-col'
        )}
        role="menubar"
        aria-orientation={orientation}
      >
        {items.map((item, index) => (
          <li 
            key={item.href || item.label}
            className="navigation-item"
            role="none"
          >
            {item.href ? (
              <a
                href={item.href}
                data-index={index}
                className={cn(
                  'navigation-link',
                  'focus:outline-2 focus:outline-primary',
                  item.current && 'current-page',
                  baseline?.touchDevice && 'touch-optimized'
                )}
                role="menuitem"
                aria-current={item.current ? 'page' : undefined}
                tabIndex={index === focusedIndex ? 0 : -1}
                onClick={() => {
                  onNavigate?.(item.href!, item.label);
                }}
              >
                {item.label}
              </a>
            ) : (
              <button
                data-index={index}
                className={cn(
                  'navigation-button',
                  'focus:outline-2 focus:outline-primary'
                )}
                role="menuitem"
                aria-haspopup={item.children ? 'menu' : undefined}
                aria-expanded={expandedSubmenu === index}
                tabIndex={index === focusedIndex ? 0 : -1}
                onClick={() => {
                  if (item.children) {
                    setExpandedSubmenu(expandedSubmenu === index ? null : index);
                  }
                }}
              >
                {item.label}
                {item.children && (
                  <ChevronDown 
                    className={cn(
                      'w-4 h-4 ml-1',
                      !adaptiveSettings?.transitions && 'no-transition',
                      expandedSubmenu === index && 'rotate-180'
                    )} 
                  />
                )}
              </button>
            )}
            {/* Submenu */}
            {item.children && expandedSubmenu === index && (
              <ul
                className="submenu"
                role="menu"
                aria-label={`${item.label} submenu`}
              >
                {item.children.map((subItem) => (
                  <li key={subItem.href} role="none">
                    <a
                      href={subItem.href}
                      className="submenu-link"
                      role="menuitem"
                      onClick={() => {
                        onNavigate?.(subItem.href, subItem.label);
                        setExpandedSubmenu(null);
                      }}
                    >
                      {subItem.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {/* Keyboard shortcuts help */}
      <div className="sr-only">
        <h3>Navigation Keyboard Shortcuts</h3>
        <ul>
          <li>Arrow keys: Navigate between items</li>
          <li>Enter/Space: Activate item or toggle submenu</li>
          <li>Home/End: Jump to first/last item</li>
          <li>Escape: Close submenu</li>
        </ul>
      </div>
      <style jsx>{`
        .navigation-link,
        .navigation-button,
        .submenu-link {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          text-decoration: none;
          color: inherit;
          background: transparent;
          border: none;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        .navigation-link:hover,
        .navigation-button:hover,
        .submenu-link:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        .navigation-link:focus,
        .navigation-button:focus,
        .submenu-link:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
          background: rgba(0, 102, 204, 0.1);
        }
        .current-page {
          background: #0066cc;
          color: white;
          font-weight: bold;
        }
        .submenu {
          position: absolute;
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          z-index: 1000;
          min-width: 200px;
          padding: 4px 0;
        }
        .touch-optimized .navigation-link,
        .touch-optimized .navigation-button {
          padding: 12px 20px;
          min-height: 44px;
        }
        /* No-script fallback */
        .no-js .navigation-list {
          flex-direction: column;
        }
        .no-js .submenu {
          position: static;
          display: block;
          box-shadow: none;
          border: none;
          background: rgba(0, 0, 0, 0.05);
          margin-left: 20px;
        }
      `}</style>
    </nav>
  );
};
// Progressive Form Field Component
export interface ProgressiveFormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}
const ProgressiveFormField: React.FC<ProgressiveFormFieldProps> = ({
  label,
  children,
  error,
  hint,
  required = false,
  className
}) => {
  const fieldId = `field-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const { baseline } = useEnhancedProgressiveAccessibility();
  return (
    <div className={cn('progressive-form-field', className)}>
      <label 
        htmlFor={fieldId}
        className={cn(
          'form-label',
          'block mb-2 font-medium',
          required && 'required',
          baseline?.highContrastMode && 'high-contrast'
        )}
      >
        {label}
        {required && (
          <span className="required-indicator" aria-label="required">
            <span aria-hidden="true">*</span>
          </span>
        )}
      </label>
      <div className="form-control-wrapper">
        {React.isValidElement(children) ? 
          React.cloneElement(children, {
            id: fieldId,
            'aria-required': required,
            'aria-invalid': !!error,
            'aria-describedby': [errorId, hintId].filter(Boolean).join(' ') || undefined,
            className: cn(
              children.props.className,
              error && 'error',
              baseline?.touchDevice && 'touch-optimized'
            )
          }) :
          <div 
            id={fieldId}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
            className={cn(
              error && 'error',
              baseline?.touchDevice && 'touch-optimized'
            )}
          >
            {children}
          </div>
        }
      </div>
      {hint && (
        <div 
          id={hintId}
          className="form-hint text-sm text-muted-foreground mt-1"
          role="note"
        >
          {hint}
        </div>
      )}
      {error && (
        <div 
          id={errorId}
          className="form-error text-sm text-destructive mt-1"
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="w-4 h-4 inline mr-1" aria-hidden="true" />
          {error}
        </div>
      )}
      <style jsx>{`
        .form-label.required::after {
          content: ' *';
          color: #ef4444;
        }
        .form-control-wrapper :global(.error) {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 1px #ef4444 !important;
        }
        .form-control-wrapper :global(.touch-optimized) {
          min-height: 44px !important;
          padding: 12px !important;
        }
        @media (prefers-contrast: high) {
          .form-label.high-contrast {
            color: ButtonText;
            font-weight: bold;
          }
          .form-control-wrapper :global(*) {
            border: 2px solid ButtonText !important;
            background: ButtonFace !important;
            color: ButtonText !important;
          }
        }
      `}</style>
    </div>
  );
};
// Progressive Alert Component with Adaptive Behavior
export interface ProgressiveAlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  dismissible?: boolean;
  autoFocus?: boolean;
  className?: string;
  onDismiss?: () => void;
}
const ProgressiveAlert: React.FC<ProgressiveAlertProps> = ({
  children,
  variant = 'default',
  dismissible = false,
  autoFocus = false,
  className,
  onDismiss
}) => {
  const alertRef = useRef<HTMLDivElement>(null);
  const { baseline } = useEnhancedProgressiveAccessibility();
  const [announced, setAnnounced] = useState(false);
  useEffect(() => {
    if (autoFocus && alertRef.current && baseline?.supportsAria) {
      alertRef.current.focus();
    }
    // Announce alert for screen readers
    if (!announced && baseline?.supportsAria) {
      const severity = variant === 'destructive' ? 'Error' : 
                     variant === 'warning' ? 'Warning' :
                     variant === 'success' ? 'Success' : 'Notice';
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', variant === 'destructive' ? 'assertive' : 'polite');
      announcer.className = 'sr-only';
      announcer.textContent = `${severity}: ${alertRef.current?.textContent}`;
      document.body.appendChild(announcer);
      setTimeout(() => announcer.remove(), 2000);
      setAnnounced(true);
    }
  }, [autoFocus, baseline, variant, announced]);
  const handleDismiss = useCallback(() => {
    onDismiss?.();
    // Announce dismissal
    if (baseline?.supportsAria) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.className = 'sr-only';
      announcer.textContent = 'Alert dismissed';
      document.body.appendChild(announcer);
      setTimeout(() => announcer.remove(), 1000);
    }
  }, [onDismiss, baseline]);
  const alertRole = variant === 'destructive' ? 'alert' : 'status';
  return (
    <div
      ref={alertRef}
      role={alertRole}
      aria-live={variant === 'destructive' ? 'assertive' : 'polite'}
      tabIndex={autoFocus ? 0 : -1}
      className={cn(
        'progressive-alert',
        `alert-${variant}`,
        'p-4 border rounded-lg',
        baseline?.touchDevice && 'touch-optimized',
        baseline?.highContrastMode && 'high-contrast',
        className
      )}
    >
      <div className="alert-content flex items-start justify-between gap-3">
        <div className="alert-message flex-1">
          {children}
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className={cn(
              'alert-dismiss',
              baseline?.touchDevice && 'touch-optimized'
            )}
            aria-label="Dismiss alert"
          >
            <span aria-hidden="true">×</span>
          </Button>
        )}
      </div>
      <style jsx>{`
        .progressive-alert {
          --alert-border: #e2e8f0;
          --alert-bg: #f8fafc;
          --alert-text: #334155;
        }
        .alert-destructive {
          --alert-border: #fecaca;
          --alert-bg: #fef2f2;
          --alert-text: #991b1b;
        }
        .alert-warning {
          --alert-border: #fde68a;
          --alert-bg: #fefbf2;
          --alert-text: #92400e;
        }
        .alert-success {
          --alert-border: #bbf7d0;
          --alert-bg: #f0fdf4;
          --alert-text: #166534;
        }
        .progressive-alert {
          border-color: var(--alert-border);
          background-color: var(--alert-bg);
          color: var(--alert-text);
        }
        .touch-optimized .alert-dismiss {
          min-width: 44px !important;
          min-height: 44px !important;
        }
        @media (prefers-contrast: high) {
          .high-contrast {
            border: 2px solid ButtonText !important;
            background: ButtonFace !important;
            color: ButtonText !important;
          }
        }
      `}</style>
    </div>
  );
};
// Progressive Modal Component
export interface ProgressiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  autoFocus?: boolean;
}
const ProgressiveModal: React.FC<ProgressiveModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  autoFocus = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const { baseline } = useEnhancedProgressiveAccessibility();
  useEffect(() => {
    if (isOpen) {
      // Store previous focus
      previousFocus.current = document.activeElement as HTMLElement;
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      // Focus modal if auto-focus is enabled
      if (autoFocus && modalRef.current) {
        modalRef.current.focus();
      }
      // Announce modal opening
      if (baseline?.supportsAria) {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'assertive');
        announcer.className = 'sr-only';
        announcer.textContent = `${title} dialog opened`;
        document.body.appendChild(announcer);
        setTimeout(() => announcer.remove(), 1000);
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      // Restore focus
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title, autoFocus, baseline]);
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;
    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      onClose();
    }
  }, [isOpen, closeOnEscape, onClose]);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  if (!isOpen) return null;
  return (
    <div
      className="progressive-modal-overlay"
      onClick={closeOnOverlayClick ? onClose : undefined}
      onKeyDown={(e) => e.key === 'Escape' && closeOnEscape && onClose()}
    >
      <ProgressiveFocusManager
        trapFocus={true}
        restoreFocus={false}
      >
        <div
          ref={modalRef}
          className={cn(
            'progressive-modal',
            baseline?.touchDevice && 'touch-optimized',
            baseline?.highContrastMode && 'high-contrast',
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`modal-title-${title.replace(/\s+/g, '-')}`}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="modal-header">
            <h2 id={`modal-title-${title.replace(/\s+/g, '-')}`}>
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="modal-close"
              aria-label="Close dialog"
            >
              <span aria-hidden="true">×</span>
            </Button>
          </header>
          <div className="modal-content">
            {children}
          </div>
        </div>
      </ProgressiveFocusManager>
      <style jsx>{`
        .progressive-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
        }
        .progressive-modal {
          background: white;
          border-radius: 8px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: between;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        .modal-header h2 {
          flex: 1;
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }
        .modal-content {
          padding: 20px;
          overflow: auto;
          flex: 1;
        }
        .touch-optimized .modal-close {
          min-width: 44px !important;
          min-height: 44px !important;
        }
        @media (prefers-contrast: high) {
          .high-contrast {
            border: 2px solid ButtonText !important;
            background: ButtonFace !important;
            color: ButtonText !important;
          }
          .high-contrast .modal-header {
            border-bottom-color: ButtonText !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .progressive-modal-overlay {
            animation: none !important;
          }
          .progressive-modal {
            animation: none !important;
            transform: none !important;
// Memory leak prevention: Event listeners need cleanup, Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline styles, inline event handlers
// Use useMemo for objects/arrays and useCallback for functions

          }
        }
      `}</style>
    </div>
  );
};
// Export all components
export {
  ProgressiveSkipNavigation,
  ProgressiveFocusManager,
  ProgressiveAnnouncement,
  ProgressiveButton,
  ProgressiveCollapsible,
  ProgressiveNavigation,
  ProgressiveFormField,
  ProgressiveAlert,
  ProgressiveModal
};
// Utility function for creating no-script alternatives
export const createNoScriptFallback = (content: string, description: string) => {
  return (
    <noscript>
      <div className="no-js-fallback" role="alert">
        <h3>JavaScript Required</h3>
        <p>{description}</p>
        <div>{content}</div>
        <p>
          <em>Please enable JavaScript for enhanced accessibility features and full functionality.</em>
        </p>
      </div>
    </noscript>
  );
};
// Default export
export default {
  ProgressiveSkipNavigation,
  ProgressiveFocusManager,
  ProgressiveAnnouncement,
  ProgressiveButton,
  ProgressiveCollapsible,
  ProgressiveNavigation,
  ProgressiveFormField,
  ProgressiveAlert,
  ProgressiveModal,
  createNoScriptFallback
};
