"use client";
import React from 'react';
import { Alert, AlertTitle, AlertDescription, type AlertProps } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X,
  Loader2,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { 
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

  validateInput, 
  commonValidations, 
  errorHandler,
  ValidationError,
  safeSync
} from '@/lib/error-utils';
// Quick Alert Components for Common Scenarios
// Enhanced with comprehensive error handling and validation
// Constants for validation
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MIN_TITLE_LENGTH = 1;
const DEFAULT_TIMEOUT = 5000;
const MAX_TIMEOUT = 30000;
const MAX_ALERTS_COUNT = 50;
// Enhanced type definitions
export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'security' | 'maintenance' | 'premium';
export interface SafeAlertProps {
  title?: string;
  description: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  timeout?: number;
  ariaLabel?: string;
  id?: string;
}
export interface AlertContainerAlert {
  id: string;
  type: AlertType;
  title?: string;
  description: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  timeout?: number;
  ariaLabel?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}
// Validation utilities for alert inputs
const validateAlertProps = (props: SafeAlertProps, context: Record<string, any> = {}): SafeAlertProps => {
  const { title, description, dismissible, timeout, className, ariaLabel } = props;
  // Validate description (required)
  validateInput(description, [
    commonValidations.required('Description is required'),
    commonValidations.string('Description must be a string'),
    {
      condition: (val: unknown) => typeof val === 'string' && val.length >= MIN_TITLE_LENGTH,
      message: 'Description cannot be empty',
      userMessage: 'Description cannot be empty'
    },
    {
      condition: (val: unknown) => typeof val === 'string' && val.length <= MAX_DESCRIPTION_LENGTH,
      message: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      userMessage: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`
    }
  ], { ...context, field: 'description' });
  // Validate title if provided
  if (title !== undefined) {
    validateInput(title, [
      commonValidations.string('Title must be a string'),
      {
        condition: (val: unknown) => typeof val === 'string' && val.length <= MAX_TITLE_LENGTH,
        message: `Title cannot exceed ${MAX_TITLE_LENGTH} characters`,
        userMessage: `Title cannot exceed ${MAX_TITLE_LENGTH} characters`
      }
    ], { ...context, field: 'title' });
    if (title.trim().length === 0) {
      throw new ValidationError('Title cannot be empty after trimming', { title, ...context });
    }
  }
  // Validate timeout if provided
  if (timeout !== undefined) {
    validateInput(timeout, [
      {
        condition: (val: any) => typeof val === 'number' && Number.isInteger(val),
        message: 'Timeout must be a positive integer',
        userMessage: 'Invalid timeout value'
      },
      {
        condition: (val: unknown) => typeof val === 'number' && val > 0 && val <= MAX_TIMEOUT,
        message: `Timeout must be between 1 and ${MAX_TIMEOUT}ms`,
        userMessage: `Timeout must be between 1 and ${MAX_TIMEOUT}ms`
      }
    ], { ...context, field: 'timeout' });
  }
  // Validate dismissible
  if (dismissible !== undefined && typeof dismissible !== 'boolean') {
    throw new ValidationError('dismissible must be a boolean', { dismissible, ...context });
  }
  // Validate className
  if (className !== undefined && typeof className !== 'string') {
    throw new ValidationError('className must be a string', { className, ...context });
  }
  // Validate ariaLabel
  if (ariaLabel !== undefined && typeof ariaLabel !== 'string') {
    throw new ValidationError('ariaLabel must be a string', { ariaLabel, ...context });
  }
  // Sanitize and return validated props
  return {
    title: title?.trim(),
    description: description.trim(),
    dismissible: dismissible ?? true,
    timeout: timeout,
    className: className?.trim(),
    ariaLabel: ariaLabel?.trim(),
    onDismiss: props.onDismiss,
    id: props.id
  };
};
// Safe wrapper for creating alert components
const createSafeAlertComponent = (
  componentName: string,
  variant: string,
  defaultTitle: string,
  defaultDismissible: boolean,
  icon: React.ComponentType<{ className?: string }>
) => {
  const SafeAlertComponent = React.forwardRef<HTMLDivElement, SafeAlertProps>(
    (props, ref) => {
      const { data: validatedProps, error } = safeSync(
        () => validateAlertProps(props, { component: componentName }),
        null,
        { operation: 'validateAlertProps', component: componentName }
      );
      if (error || !validatedProps) {
        // Fallback error alert
        console.error(`Failed to render ${componentName}:`, error);
        return (
          <Alert variant="destructive" className="border-red-500">
            <X className="h-4 w-4" />
            <AlertTitle>Alert Error</AlertTitle>
            <AlertDescription>
              Failed to display alert. Please check the console for details.
            </AlertDescription>
          </Alert>
        );
      }
      const IconComponent = icon;
      const title = validatedProps.title || defaultTitle;
      const dismissible = validatedProps.dismissible ?? defaultDismissible;
      return (
        <Alert
          ref={ref}
          variant={variant as any}
          dismissible={dismissible}
          onDismiss={validatedProps.onDismiss}
          className={validatedProps.className}
          aria-label={validatedProps.ariaLabel || `${title} alert`}
          role="alert"
          aria-live="polite"
        >
          <IconComponent className="h-4 w-4" />
          {title && <AlertTitle>{title}</AlertTitle>}
          <AlertDescription>{validatedProps.description}</AlertDescription>
        </Alert>
      );
    }
  );
  SafeAlertComponent.displayName = componentName;
  return SafeAlertComponent;
};
// Enhanced safe alert components with validation and error handling
export const SuccessAlert = createSafeAlertComponent(
  'SuccessAlert',
  'success',
  'Success',
  false,
  CheckCircle2
);
export const ErrorAlert = createSafeAlertComponent(
  'ErrorAlert',
  'destructive',
  'Error',
  true,
  X
);
export const WarningAlert = createSafeAlertComponent(
  'WarningAlert',
  'warning',
  'Warning',
  true,
  AlertTriangle
);
export const InfoAlert = createSafeAlertComponent(
  'InfoAlert',
  'info',
  'Information',
  true,
  Info
);
export const SecurityAlert = createSafeAlertComponent(
  'SecurityAlert',
  'warning',
  'Security Notice',
  false,
  Shield
);
// Specialized LoadingAlert with additional loading state handling
export const LoadingAlert = React.forwardRef<HTMLDivElement, SafeAlertProps>(
  (props, ref) => {
    const { data: validatedProps, error } = safeSync(
      () => validateAlertProps(props, { component: 'LoadingAlert' }),
      null,
      { operation: 'validateAlertProps', component: 'LoadingAlert' }
    );
    if (error || !validatedProps) {
      console.error('Failed to render LoadingAlert:', error);
      return (
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertTitle>Loading</AlertTitle>
          <AlertDescription>Loading...</AlertDescription>
        </Alert>
      );
    }
    const title = validatedProps.title || 'Loading';
    return (
      <Alert 
        ref={ref}
        variant="info" 
        className={validatedProps.className}
        aria-label={validatedProps.ariaLabel || `${title} loading alert`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{validatedProps.description}</AlertDescription>
      </Alert>
    );
  }
);
LoadingAlert.displayName = 'LoadingAlert';
// Specialized MaintenanceAlert with border styling
export const MaintenanceAlert = React.forwardRef<HTMLDivElement, SafeAlertProps>(
  (props, ref) => {
    const { data: validatedProps, error } = safeSync(
      () => validateAlertProps(props, { component: 'MaintenanceAlert' }),
      null,
      { operation: 'validateAlertProps', component: 'MaintenanceAlert' }
    );
    if (error || !validatedProps) {
      console.error('Failed to render MaintenanceAlert:', error);
      return (
        <Alert variant="warning">
          <Clock className="h-4 w-4" />
          <AlertTitle>Maintenance Notice</AlertTitle>
          <AlertDescription>System maintenance in progress.</AlertDescription>
        </Alert>
      );
    }
    const title = validatedProps.title || 'Maintenance Notice';
    const dismissible = validatedProps.dismissible ?? false;
    return (
      <Alert
        ref={ref}
        variant="warning"
        dismissible={dismissible}
        onDismiss={validatedProps.onDismiss}
        className={`border-l-4 border-l-amber-500 ${validatedProps.className || ''}`}
        aria-label={validatedProps.ariaLabel || `${title} maintenance alert`}
        role="alert"
        aria-live="assertive"
      >
        <Clock className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{validatedProps.description}</AlertDescription>
      </Alert>
    );
  }
);
MaintenanceAlert.displayName = 'MaintenanceAlert';
// Specialized PremiumAlert with gradient styling
export const PremiumAlert = React.forwardRef<HTMLDivElement, SafeAlertProps>(
  (props, ref) => {
    const { data: validatedProps, error } = safeSync(
      () => validateAlertProps(props, { component: 'PremiumAlert' }),
      null,
      { operation: 'validateAlertProps', component: 'PremiumAlert' }
    );
    if (error || !validatedProps) {
      console.error('Failed to render PremiumAlert:', error);
      return (
        <Alert variant="glass">
          <Zap className="h-4 w-4" />
          <AlertTitle>Premium Feature</AlertTitle>
          <AlertDescription>Premium feature access required.</AlertDescription>
        </Alert>
      );
    }
    const title = validatedProps.title || 'Premium Feature';
    const dismissible = validatedProps.dismissible ?? true;
    return (
      <Alert
        ref={ref}
        variant="glass"
        dismissible={dismissible}
        onDismiss={validatedProps.onDismiss}
        className={`bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-700/30 ${validatedProps.className || ''}`}
        aria-label={validatedProps.ariaLabel || `${title} premium alert`}
        role="alert"
        aria-live="polite"
      >
        <Zap className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">{title}</AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          {validatedProps.description}
        </AlertDescription>
      </Alert>
    );
  }
);
PremiumAlert.displayName = 'PremiumAlert';
// Enhanced Alert Container Component with error handling and validation
export function AlertContainer({ 
  alerts, 
  className,
  maxAlerts = MAX_ALERTS_COUNT,
  onError
}: {
  alerts: AlertContainerAlert[];
  className?: string;
  maxAlerts?: number;
  onError?: (error: Error, alertId?: string) => void;
}) {
  // Validate and sanitize alerts input
  const { data: validatedAlerts, error: validationError } = safeSync(
    () => {
      if (!Array.isArray(alerts)) {
        throw new ValidationError('alerts must be an array', { alerts });
      }
      if (alerts.length > maxAlerts) {
        console.warn(`Alert count ${alerts.length} exceeds maximum (${maxAlerts}). Truncating.`);
        return alerts.slice(0, maxAlerts);
      }
      // Validate each alert
      return alerts.map((alert, index) => {
        if (!alert.id || typeof alert.id !== 'string') {
          throw new ValidationError(`Alert at index ${index} must have a valid string id`, { alert, index });
        }
        if (!alert.type || !['success', 'error', 'warning', 'info', 'loading', 'security', 'maintenance', 'premium'].includes(alert.type)) {
          throw new ValidationError(`Alert at index ${index} must have a valid type`, { alert, index });
        }
        if (!alert.description || typeof alert.description !== 'string') {
          throw new ValidationError(`Alert at index ${index} must have a valid description`, { alert, index });
        }
        return alert;
      });
    },
    [],
    { operation: 'validateAlerts', alertCount: alerts.length }
  );
  // Sort alerts by priority if specified - moved before conditional returns
  const sortedAlerts = React.useMemo(() => {
    return validatedAlerts?.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return bPriority - aPriority;
    }) || [];
  }, [validatedAlerts]);
  if (validationError) {
    console.error('AlertContainer validation error:', validationError);
    onError?.(validationError);
    // Return fallback error alert
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <ErrorAlert 
          title="Alert Container Error"
          description="Failed to display alerts. Please check the console for details."
        />
      </div>
    );
  }
  const renderAlert = (alert: AlertContainerAlert) => {
    const { data: renderedAlert, error: renderError } = safeSync(
      () => {
        const baseProps = {
          title: alert.title,
          description: alert.description,
          dismissible: alert.dismissible,
          onDismiss: alert.onDismiss,
          ariaLabel: alert.ariaLabel,
          id: alert.id
        };
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
      },
      null,
      { operation: 'renderAlert', alertId: alert.id, alertType: alert.type }
    );
    if (renderError) {
      console.error(`Failed to render alert ${alert.id}:`, renderError);
      onError?.(renderError, alert.id);
      // Return fallback alert
      return (
        <ErrorAlert 
          key={`error-${alert.id}`}
          title="Alert Render Error"
          description={`Failed to render alert: ${alert.description.substring(0, 50)}...`}
        />
      );
    }
    return renderedAlert;
  };
  return (
    <div 
      className={`space-y-4 ${className || ''}`}
      role="region"
      aria-label="Alerts container"
      aria-live="polite"
    >
      {sortedAlerts.map(renderAlert)}
    </div>
  );
}
// Enhanced Hook for managing alert state with comprehensive error handling
export function useAlerts() {
  const [alerts, setAlerts] = React.useState<AlertContainerAlert[]>([]);
  const [timeouts, setTimeouts] = React.useState<Map<string, NodeJS.Timeout>>(new Map());
  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [timeouts]);
  const removeAlert = React.useCallback((id: string) => {
    const { error } = safeSync(
      () => {
        if (!id || typeof id !== 'string') {
          throw new ValidationError('Alert ID must be a non-empty string', { id });
        }
        setAlerts(prev => prev.filter(alert => alert.id !== id));
        // Clear associated timeout
        setTimeouts(prev => {
          const newTimeouts = new Map(prev);
          const timeout = newTimeouts.get(id);
          if (timeout) {
            clearTimeout(timeout);
            newTimeouts.delete(id);
          }
          return newTimeouts;
        });
      },
      undefined,
      { operation: 'removeAlert', alertId: id }
    );
    if (error) {
      console.error('Failed to remove alert:', error);
      errorHandler.handle(error, { operation: 'removeAlert', alertId: id });
    }
  }, []);
  const addAlert = React.useCallback((alert: Omit<AlertContainerAlert, 'id'>) => {
    const { data: validatedAlert, error } = safeSync(
      () => {
        // Validate alert input
        if (!alert.type || !['success', 'error', 'warning', 'info', 'loading', 'security', 'maintenance', 'premium'].includes(alert.type)) {
          throw new ValidationError('Alert type is required and must be valid', { alertType: alert.type });
        }
        if (!alert.description || typeof alert.description !== 'string' || alert.description.trim().length === 0) {
          throw new ValidationError('Alert description is required and cannot be empty', { description: alert.description });
        }
        if (alert.title !== undefined && (typeof alert.title !== 'string' || alert.title.trim().length === 0)) {
          throw new ValidationError('Alert title must be a non-empty string if provided', { title: alert.title });
        }
        if (alert.timeout !== undefined) {
          if (!Number.isInteger(alert.timeout) || alert.timeout <= 0 || alert.timeout > MAX_TIMEOUT) {
            throw new ValidationError(`Alert timeout must be a positive integer between 1 and ${MAX_TIMEOUT}ms`, { timeout: alert.timeout });
          }
        }
        // Generate unique ID
        const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const validatedAlert: AlertContainerAlert = {
          id,
          type: alert.type,
          title: alert.title?.trim(),
          description: alert.description.trim(),
          dismissible: alert.dismissible ?? true,
          timeout: alert.timeout || (alert.type === 'error' ? DEFAULT_TIMEOUT * 2 : DEFAULT_TIMEOUT),
          ariaLabel: alert.ariaLabel?.trim(),
          priority: alert.priority || 'medium',
          onDismiss: alert.onDismiss
        };
        return validatedAlert;
      },
      null,
      { operation: 'addAlert', alertType: alert.type }
    );
    if (error || !validatedAlert) {
      console.error('Failed to add alert:', error);
      errorHandler.handle(error || new Error('Failed to validate alert'), { operation: 'addAlert' });
      // Add fallback error alert
      const fallbackId = `error-${Date.now()}`;
      setAlerts(prev => {
        if (prev.length >= MAX_ALERTS_COUNT) {
          return prev.slice(1).concat([{
            id: fallbackId,
            type: 'error',
            title: 'Alert Error',
            description: 'Failed to add alert. Please check your input.',
            dismissible: true,
            priority: 'high'
          }]);
        }
        return prev.concat([{
          id: fallbackId,
          type: 'error',
          title: 'Alert Error',
          description: 'Failed to add alert. Please check your input.',
          dismissible: true,
          priority: 'high'
        }]);
      });
      return;
    }
    // Add alert to state
    setAlerts(prev => {
      // Prevent too many alerts
      if (prev.length >= MAX_ALERTS_COUNT) {
        console.warn(`Maximum alert count (${MAX_ALERTS_COUNT}) reached. Removing oldest alert.`);
        return prev.slice(1).concat([validatedAlert]);
      }
      return prev.concat([validatedAlert]);
    });
    // Set timeout for auto-dismiss
    if (validatedAlert.timeout && validatedAlert.timeout > 0) {
      const timeoutId = setTimeout(() => {
        removeAlert(validatedAlert.id);
      }, validatedAlert.timeout);
      setTimeouts(prev => new Map(prev.set(validatedAlert.id, timeoutId)));
    }
  }, [removeAlert]);
  const clearAllAlerts = React.useCallback(() => {
    const { error } = safeSync(
      () => {
        // Clear all timeouts
        timeouts.forEach(timeout => clearTimeout(timeout));
        setTimeouts(new Map());
        // Clear alerts
        setAlerts([]);
      },
      undefined,
      { operation: 'clearAllAlerts' }
    );
    if (error) {
      console.error('Failed to clear alerts:', error);
      errorHandler.handle(error, { operation: 'clearAllAlerts' });
    }
  }, [timeouts]);
  const getAlertsByType = React.useCallback((type: AlertType) => {
    return alerts.filter(alert => alert.type === type);
  }, [alerts]);
  const hasAlerts = React.useMemo(() => alerts.length > 0, [alerts]);
  const alertCount = React.useMemo(() => alerts.length, [alerts]);
  const alertsWithDismiss = React.useMemo(() => 
    alerts.map(alert => ({
      ...alert,
      onDismiss: () => removeAlert(alert.id)
    })), [alerts, removeAlert]
  );
  return {
    alerts: alertsWithDismiss,
    addAlert,
    removeAlert,
    clearAllAlerts,
    getAlertsByType,
    hasAlerts,
    alertCount
  };
}
