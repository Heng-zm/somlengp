"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertContainerAlert } from './alert-utils';
import {
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline styles
// Use useMemo for objects/arrays and useCallback for functions

  SuccessAlert,
  ErrorAlert,
  WarningAlert,
  InfoAlert,
  LoadingAlert,
  SecurityAlert,
  MaintenanceAlert,
  PremiumAlert,
} from './alert-utils';

// Performance optimization constants
const ALERT_HEIGHT = 72; // Estimated height per alert in pixels
const VISIBLE_RANGE_PADDING = 2; // Number of alerts to render outside visible area
const SCROLL_DEBOUNCE_MS = 16; // ~60fps for scroll handling
const RESIZE_DEBOUNCE_MS = 150; // Debounce resize events

interface VirtualizedAlertContainerProps {
  alerts: AlertContainerAlert[];
  className?: string;
  maxVisible?: number;
  height?: number;
  onError?: (error: Error, alertId?: string) => void;
  'aria-label'?: string;
}

interface VirtualItem {
  index: number;
  alert: AlertContainerAlert;
  top: number;
  height: number;
}

/**
 * Virtualized Alert Container for handling large numbers of alerts efficiently
 * Only renders visible alerts to maintain performance
 */
export function VirtualizedAlertContainer({
  alerts,
  className,
  maxVisible = 50,
  height = 400,
  onError,
  'aria-label': ariaLabel = 'Alerts container',
}: VirtualizedAlertContainerProps) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height);

  // Sorted alerts
  const sortedAlerts = alerts
    .slice(0, maxVisible)
    .sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return bPriority - aPriority;
    });

  // Calculate virtual items
  const virtualItems: VirtualItem[] = sortedAlerts.map((alert, index) => ({
    index,
    alert,
    top: index * ALERT_HEIGHT,
    height: ALERT_HEIGHT,
  }));

  const totalHeight = virtualItems.length * ALERT_HEIGHT;

  // Calculate visible range with padding
  const visibleRange = (() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / ALERT_HEIGHT) - VISIBLE_RANGE_PADDING
    );
    const endIndex = Math.min(
      virtualItems.length - 1,
      Math.ceil((scrollTop + containerHeight) / ALERT_HEIGHT) + VISIBLE_RANGE_PADDING
    );

    return { startIndex, endIndex };
  })();

  // Get visible items for rendering
  const { startIndex, endIndex } = visibleRange;
  const visibleItems = virtualItems.slice(startIndex, endIndex + 1);

  // Debounced scroll handler
  const handleScroll = debounce((target: HTMLElement) => {
    setScrollTop(target.scrollTop);
  }, SCROLL_DEBOUNCE_MS);

  // Handle scroll events
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    handleScroll(e.currentTarget);
  };

  // Handle resize events
  useEffect(() => {
    if (!containerRef) return;

    const handleResize = debounce(() => {
      const rect = containerRef.getBoundingClientRect();
      setContainerHeight(rect.height);
    }, RESIZE_DEBOUNCE_MS);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  // Render alert component based on type
  const renderAlert = (alert: AlertContainerAlert) => {
    const baseProps = {
      title: alert.title,
      description: alert.description,
      dismissible: alert.dismissible,
      onDismiss: alert.onDismiss,
      ariaLabel: alert.ariaLabel,
      id: alert.id,
    };

    try {
      switch (alert.type) {
        case 'success':
          return <SuccessAlert key={alert.id} {...baseProps} />;
        case 'error':
          return <ErrorAlert key={alert.id} {...baseProps} />;
        case 'warning':
          return <WarningAlert key={alert.id} {...baseProps} />;
        case 'info':
          return <InfoAlert key={alert.id} {...baseProps} />;
        case 'loading':
          return <LoadingAlert key={alert.id} {...baseProps} />;
        case 'security':
          return <SecurityAlert key={alert.id} {...baseProps} />;
        case 'maintenance':
          return <MaintenanceAlert key={alert.id} {...baseProps} />;
        case 'premium':
          return <PremiumAlert key={alert.id} {...baseProps} />;
        default:
          return <InfoAlert key={alert.id} {...baseProps} />;
      }
    } catch (error) {
      console.error(`Failed to render alert ${alert.id}:`, error);
      onError?.(error as Error, alert.id);

      return (
        <ErrorAlert
          key={`error-${alert.id}`}
          title="Alert Render Error"
          description={`Failed to render alert: ${alert.description.substring(0, 50)}...`}
        />
      );
    }
  };

  // Accessibility: Announce changes to screen readers
  const [liveRegionContent, setLiveRegionContent] = useState('');

  useEffect(() => {
    if (alerts.length > 0) {
      const latestAlert = alerts[alerts.length - 1];
      setLiveRegionContent(
        `New ${latestAlert.type} alert: ${latestAlert.description}`
      );

      // Clear the live region after announcement
      const timer = setTimeout(() => setLiveRegionContent(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [alerts]);

  // Virtualized item component
  const VirtualizedItem = ({ item }: { item: VirtualItem }) => (
    <div
      key={item.alert.id}
      style={{
        position: 'absolute',
        top: item.top,
        left: 0,
        right: 0,
        height: item.height,
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
      }}
    >
      {renderAlert(item.alert)}
    </div>
  );

  VirtualizedItem.displayName = 'VirtualizedItem';

  if (alerts.length === 0) {
    return (
      <div
        className={cn('text-center text-muted-foreground p-8', className)}
        role="status"
        aria-label="No alerts"
      >
        No alerts to display
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Screen reader live region */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveRegionContent}
      </div>

      {/* Alert counter for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {alerts.length} alert{alerts.length !== 1 ? 's' : ''} total
      </div>

      {/* Virtualized container */}
      <div
        ref={setContainerRef}
        className="overflow-auto border rounded-lg bg-background"
        style={{ height: `${height}px` }}
        onScroll={onScroll}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        aria-describedby="alert-container-instructions"
      >
        {/* Instructions for keyboard users */}
        <div id="alert-container-instructions" className="sr-only">
          Use arrow keys to navigate through alerts. Press Tab to interact with alert actions.
        </div>

        <div
          className="relative"
          style={{ height: `${totalHeight}px` }}
        >
          {visibleItems.map((item) => (
            <VirtualizedItem key={item.alert.id} item={item} />
          ))}
        </div>

        {/* Scroll indicator */}
        {totalHeight > containerHeight && (
          <div
            className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded pointer-events-none"
            role="status"
            aria-live="polite"
          >
            Showing {visibleItems.length} of {alerts.length} alerts
          </div>
        )}
      </div>

      {/* Keyboard navigation help */}
      <div className="sr-only">
        <h3>Keyboard Navigation</h3>
        <ul>
          <li>Use Tab to navigate between alert dismiss buttons</li>
          <li>Use Enter or Space to dismiss alerts</li>
          <li>Use Arrow keys to scroll through the alert list</li>
        </ul>
      </div>
    </div>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Hook for managing virtualized alerts with performance optimizations
 */
export function useVirtualizedAlerts() {
  const [alerts, setAlerts] = useState<AlertContainerAlert[]>([]);
  const [timeouts, setTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Batch alert operations
  const operations: (() => void)[] = [];
  let isScheduled = false;

  const flush = () => {
    operations.forEach(op => op());
    operations.length = 0;
    isScheduled = false;
  };

  const schedule = (operation: () => void) => {
    operations.push(operation);
    if (!isScheduled) {
      isScheduled = true;
      requestAnimationFrame(flush);
    }
  };

  const batchedOperations = { schedule };

  const removeAlert = (id: string) => {
    batchedOperations.schedule(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));

      setTimeouts(prev => {
        const newTimeouts = new Map(prev);
        const timeout = newTimeouts.get(id);
        if (timeout) {
          clearTimeout(timeout);
          newTimeouts.delete(id);
        }
        return newTimeouts;
      });
    });
  };

  const addAlert = (alert: Omit<AlertContainerAlert, 'id'>) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newAlert: AlertContainerAlert = {
      id,
      ...alert,
      priority: alert.priority || 'medium',
    };

    batchedOperations.schedule(() => {
      setAlerts(prev => [...prev, newAlert]);
    });

    // Set up auto-dismiss if timeout is specified
    if (alert.timeout && alert.timeout > 0) {
      const timeoutId = setTimeout(() => removeAlert(id), alert.timeout);
      setTimeouts(prev => new Map(prev.set(id, timeoutId)));
    }
  };

  const clearAllAlerts = () => {
    batchedOperations.schedule(() => {
      // Clear all timeouts
      timeouts.forEach(timeout => clearTimeout(timeout));
      setTimeouts(new Map());

      // Clear alerts
      setAlerts([]);
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout), []);
    };
  }, [timeouts]);

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAllAlerts,
    alertCount: alerts.length,
    hasAlerts: alerts.length > 0,
  };
}

export default VirtualizedAlertContainer;
