"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertContainerAlert } from './alert-utils';
// Memory leak prevention: Event listeners need cleanup, Timers need cleanup, Observers need cleanup
// Add cleanup in useEffect return function


// Constants for accessibility
const FOCUS_TRAP_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const ANNOUNCEMENT_DELAY = 100; // Delay before announcing changes
const FOCUS_DELAY = 150; // Delay before focusing elements

interface AccessibilityManagerProps {
  alerts: AlertContainerAlert[];
  containerRef: React.RefObject<HTMLElement>;
  onAlertFocus?: (alertId: string) => void;
  onAlertDismiss?: (alertId: string) => void;
  enableFocusManagement?: boolean;
  enableKeyboardShortcuts?: boolean;
}

/**
 * Accessibility Manager for Alert Components
 * Handles focus management, keyboard navigation, and screen reader announcements
 */
export function useAlertAccessibility({
  alerts,
  containerRef,
  onAlertFocus,
  onAlertDismiss,
  enableFocusManagement = true,
  enableKeyboardShortcuts = true,
}: AccessibilityManagerProps) {
  const [focusedAlertIndex, setFocusedAlertIndex] = useState<number>(-1);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const announcementTimeout = useRef<NodeJS.Timeout>();

  // Store focusable elements for each alert
  const focusableElementsRef = useRef<Map<string, HTMLElement[]>>(new Map());

  // Update focusable elements when alerts change
  useEffect(() => {
    if (!containerRef.current || !enableFocusManagement) return;

    const updateFocusableElements = () => {
      const newFocusableElements = new Map<string, HTMLElement[]>();
      
      alerts.forEach(alert => {
        const alertElement = containerRef.current?.querySelector(`[data-alert-id="${alert.id}"]`);
        if (alertElement) {
          const focusableElements = Array.from(
            alertElement.querySelectorAll(FOCUS_TRAP_SELECTOR)
          ) as HTMLElement[];
          newFocusableElements.set(alert.id, focusableElements.filter(el => !el.hasAttribute('disabled')));
        }
      });
      
      focusableElementsRef.current = newFocusableElements;
    };

    // Update immediately and after DOM changes
    updateFocusableElements();
    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(containerRef.current, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'tabindex']
    });

    return () => observer.disconnect();
  }, [alerts, containerRef, enableFocusManagement]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardShortcuts || !containerRef.current) return;

    const { key, ctrlKey, metaKey, shiftKey } = event;
    const isModified = ctrlKey || metaKey;

    switch (key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!isModified) {
          event.preventDefault();
          const direction = key === 'ArrowDown' ? 1 : -1;
          const newIndex = Math.max(0, Math.min(alerts.length - 1, focusedAlertIndex + direction));
          
          if (newIndex !== focusedAlertIndex) {
            setFocusedAlertIndex(newIndex);
            focusAlert(newIndex);
          }
        }
        break;
      }

      case 'Home':
        if (!isModified) {
          event.preventDefault();
          setFocusedAlertIndex(0);
          focusAlert(0);
        }
        break;

      case 'End':
        if (!isModified) {
          event.preventDefault();
          const lastIndex = alerts.length - 1;
          setFocusedAlertIndex(lastIndex);
          focusAlert(lastIndex);
        }
        break;

      case 'Escape':
        if (focusedAlertIndex >= 0) {
          event.preventDefault();
          // Return focus to the original element or container
          if (lastFocusedElement.current) {
            lastFocusedElement.current.focus();
          } else {
            containerRef.current.focus();
          }
          setFocusedAlertIndex(-1);
        }
        break;

      case 'Enter':
      case ' ':
        if (focusedAlertIndex >= 0 && isModified) {
          event.preventDefault();
          const alert = alerts[focusedAlertIndex];
          if (alert?.dismissible && onAlertDismiss) {
            onAlertDismiss(alert.id);
            announceChange(`Dismissed ${alert.type} alert: ${alert.description}`);
          }
        }
        break;

      // Bulk operations with keyboard shortcuts
      case 'a':
        if (isModified) {
          event.preventDefault();
          // Select all dismissible alerts
          announceChange(`Selected all dismissible alerts`);
        }
        break;

      case 'd':
        if (isModified) {
          event.preventDefault();
          // Dismiss all dismissible alerts
          const dismissibleAlerts = alerts.filter(alert => alert.dismissible);
          dismissibleAlerts.forEach(alert => onAlertDismiss?.(alert.id));
          announceChange(`Dismissed ${dismissibleAlerts.length} alerts`);
        }
        break;
    }
  }, [alerts, focusedAlertIndex, enableKeyboardShortcuts, containerRef, onAlertDismiss]);

  // Focus specific alert
  const focusAlert = useCallback((index: number) => {
    if (!containerRef.current || index < 0 || index >= alerts.length) return;

    const alert = alerts[index];
    const focusableElements = focusableElementsRef.current.get(alert.id);
    
    if (focusableElements && focusableElements.length > 0) {
      // Focus the first focusable element (usually dismiss button)
      setTimeout(() => {
        focusableElements[0]?.focus();
        onAlertFocus?.(alert.id);
      }, FOCUS_DELAY);
    }
  }, [alerts, containerRef, onAlertFocus]);

  // Announce changes to screen readers
  const announceChange = useCallback((message: string) => {
    if (announcementTimeout.current) {
      clearTimeout(announcementTimeout.current);
    }

    announcementTimeout.current = setTimeout(() => {
      setAnnouncements(prev => [...prev.slice(-2), message]); // Keep only last 3 announcements
    }, ANNOUNCEMENT_DELAY);
  }, []);

  // Set up keyboard event listeners
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enableKeyboardShortcuts]);

  // Announce new alerts
  useEffect(() => {
    if (alerts.length === 0) return;

    const latestAlert = alerts[alerts.length - 1];
    const priority = latestAlert.priority || 'medium';
    const urgency = priority === 'critical' ? 'Critical' : priority === 'high' ? 'Important' : '';
    
    announceChange(
      `${urgency} ${latestAlert.type} alert added: ${latestAlert.description}`
    );
  }, [alerts, announceChange]);

  // Store the currently focused element when entering alert navigation
  const storeFocus = useCallback(() => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
  }, []);

  return {
    focusedAlertIndex,
    focusAlert,
    announcements,
    storeFocus,
    setFocusedAlertIndex,
  };
}

/**
 * Component for providing live announcements to screen readers
 */
export function AlertAnnouncements({ 
  announcements, 
  className = "sr-only" 
}: { 
  announcements: string[]; 
  className?: string;
}) {
  return (
    <>
      {announcements.map((announcement, index) => (
        <div
          key={`announcement-${index}`}
          className={className}
          role="status"
          aria-live={announcement.toLowerCase().includes('critical') ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          {announcement}
        </div>
      ))}
    </>
  );
}

/**
 * Enhanced Alert Container with full accessibility support
 */
interface AccessibleAlertContainerProps {
  alerts: AlertContainerAlert[];
  children: React.ReactNode;
  className?: string;
  onAlertDismiss?: (alertId: string) => void;
  'aria-label'?: string;
}

export function AccessibleAlertContainer({
  alerts,
  children,
  className,
  onAlertDismiss,
  'aria-label': ariaLabel = 'Alerts',
}: AccessibleAlertContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const {
    focusedAlertIndex,
    focusAlert,
    announcements,
    storeFocus,
    setFocusedAlertIndex,
  } = useAlertAccessibility({
    alerts,
    containerRef,
    onAlertFocus: (alertId) => {
      setIsNavigating(true);
    },
    onAlertDismiss,
    enableFocusManagement: true,
    enableKeyboardShortcuts: true,
  });

  // Reset navigation state when alerts change significantly
  useEffect(() => {
    if (alerts.length === 0) {
      setIsNavigating(false);
      setFocusedAlertIndex(-1);
    }
  }, [alerts.length, setFocusedAlertIndex]);

  const handleContainerFocus = useCallback(() => {
    if (!isNavigating && alerts.length > 0) {
      storeFocus();
      setFocusedAlertIndex(0);
      focusAlert(0);
      setIsNavigating(true);
    }
  }, [alerts.length, focusAlert, isNavigating, storeFocus, setFocusedAlertIndex]);

  const handleContainerBlur = useCallback((event: React.FocusEvent) => {
    // Check if focus is moving outside the container
    if (!containerRef.current?.contains(event.relatedTarget as Node)) {
      setIsNavigating(false);
      setFocusedAlertIndex(-1);
    }
  }, [setFocusedAlertIndex]);

  return (
    <div className="relative">
      {/* Live region for announcements */}
      <AlertAnnouncements announcements={announcements} />
      
      {/* Alert statistics for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'} 
        {alerts.length > 0 && (
          <>
            {' '}({alerts.filter(a => a.priority === 'critical').length} critical, {' '}
            {alerts.filter(a => a.priority === 'high').length} high priority)
          </>
        )}
      </div>

      {/* Keyboard shortcuts help */}
      <div className="sr-only">
        <h3>Alert Navigation Keyboard Shortcuts</h3>
        <ul>
          <li>Arrow Up/Down: Navigate between alerts</li>
          <li>Home/End: Jump to first/last alert</li>
          <li>Enter/Space + Ctrl: Dismiss focused alert</li>
          <li>Escape: Exit alert navigation</li>
          <li>Ctrl+A: Select all alerts</li>
          <li>Ctrl+D: Dismiss all dismissible alerts</li>
        </ul>
      </div>

      {/* Main alert container */}
      <div
        ref={containerRef}
        className={className}
        role="region"
        aria-label={ariaLabel}
        aria-describedby="alert-navigation-help"
        tabIndex={0}
        onFocus={handleContainerFocus}
        onBlur={handleContainerBlur}
      >
        {/* Hidden help text */}
        <div id="alert-navigation-help" className="sr-only">
          Press Tab to navigate alert actions, or use arrow keys to move between alerts.
          Press Escape to exit alert navigation.
        </div>

        {children}
      </div>

      {/* Focus indicator for the current alert */}
      {isNavigating && focusedAlertIndex >= 0 && (
        <div className="sr-only" role="status" aria-live="polite">
          Alert {focusedAlertIndex + 1} of {alerts.length} focused
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing focus within individual alerts
 */
export function useAlertFocus(alertId: string) {
  const alertRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const focusFirst = useCallback(() => {
    if (!alertRef.current) return;

    const focusableElements = alertRef.current.querySelectorAll(FOCUS_TRAP_SELECTOR);
    const firstFocusable = focusableElements[0] as HTMLElement;
    
    if (firstFocusable) {
      firstFocusable.focus();
      setIsFocused(true);
    }
  }, []);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (!alertRef.current || event.key !== 'Tab') return;

    const focusableElements = Array.from(
      alertRef.current.querySelectorAll(FOCUS_TRAP_SELECTOR)
    ) as HTMLElement[];

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  // Set up focus trap when alert is focused
  useEffect(() => {
    if (!isFocused) return;

    document.addEventListener('keydown', trapFocus);
    return () => document.removeEventListener('keydown', trapFocus);
  }, [isFocused, trapFocus]);

  // Handle focus/blur events
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((event: React.FocusEvent) => {
    if (!alertRef.current?.contains(event.relatedTarget as Node)) {
      setIsFocused(false);
    }
  }, []);

  return {
    alertRef,
    isFocused,
    focusFirst,
    handleFocus,
    handleBlur,
  };
}

/**
 * Utility for creating accessible alert descriptions
 */
export function createAccessibleDescription(
  alert: AlertContainerAlert,
  includeInstructions = true
): string {
  const priority = alert.priority || 'medium';
  const priorityText = priority === 'critical' ? 'Critical priority' : 
                     priority === 'high' ? 'High priority' : '';
  
  const dismissibleText = alert.dismissible ? 'Dismissible alert' : 'Non-dismissible alert';
  
  const instructions = includeInstructions && alert.dismissible ? 
    'Press Enter or Space to dismiss.' : '';
  
  return [priorityText, dismissibleText, alert.description, instructions]
    .filter(Boolean)
    .join('. ');
}

export default {
  useAlertAccessibility,
  AlertAnnouncements,
  AccessibleAlertContainer,
  useAlertFocus,
  createAccessibleDescription,
};
