'use client';
import React, { Component, ReactNode, ErrorInfo, useState, useEffect, useCallback } from 'react';
import { ErrorHandler, AppError, ErrorType, ErrorSeverity } from '@/lib/error-utils';
import { useAccessibility } from '@/lib/accessibility-manager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

// Types
interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
  retryCount: number;
  isRecovering: boolean;
  showDetails: boolean;
}
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
  maxRetries?: number;
  enableErrorDetails?: boolean;
  level: 'page' | 'feature' | 'component';
  context?: Record<string, unknown>;
}
interface ErrorRecoveryOptions {
  canRetry: boolean;
  canNavigateHome: boolean;
  canReportError: boolean;
  customRecoveryActions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}
const ERROR_MESSAGES = {
  [ErrorType.NETWORK]: {
    title: 'Connection Problem',
    description: 'Unable to connect to our servers. Please check your internet connection.',
    instructions: 'Try refreshing the page or check your network connection.'
  },
  [ErrorType.AUTH]: {
    title: 'Authentication Required',
    description: 'Your session has expired or you need to sign in.',
    instructions: 'Please sign in again to continue.'
  },
  [ErrorType.VALIDATION]: {
    title: 'Invalid Data',
    description: 'The information provided appears to be invalid.',
    instructions: 'Please review the information and try again.'
  },
  [ErrorType.STORAGE]: {
    title: 'Storage Error',
    description: 'Unable to save or retrieve data.',
    instructions: 'Please try again or contact support if the issue persists.'
  },
  [ErrorType.CLIPBOARD]: {
    title: 'Clipboard Access Error',
    description: 'Unable to access the clipboard.',
    instructions: 'Please copy the content manually or check your browser permissions.'
  },
  [ErrorType.MEDIA]: {
    title: 'Media Access Error',
    description: 'Unable to access camera or microphone.',
    instructions: 'Please check your permissions and try again.'
  },
  [ErrorType.PARSER]: {
    title: 'Data Processing Error',
    description: 'Unable to process the provided information.',
    instructions: 'Please verify the data format and try again.'
  },
  [ErrorType.UNKNOWN]: {
    title: 'Unexpected Error',
    description: 'Something unexpected happened.',
    instructions: 'Please try again or refresh the page.'
  }
};
// Main Error Boundary Class
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandler = ErrorHandler.getInstance();
  private retryTimeout: NodeJS.Timeout | null = null;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
      showDetails: false
    };
  }
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      showDetails: false
    };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = this.errorHandler.handle(error, {
      ...this.props.context,
      componentStack: errorInfo.componentStack,
      level: this.props.level,
      retryCount: this.state.retryCount
    });
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setState({
      error: appError,
      errorId: errorId
    });
    // Call custom error handler
    this.props.onError?.(appError, errorInfo);
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary (${this.props.level})`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('App Error:', appError);
      console.groupEnd();
    }
  }
  private getRecoveryOptions(): ErrorRecoveryOptions {
    const { error, retryCount } = this.state;
    const { maxRetries = 3, level } = this.props;
    if (!error) return { canRetry: false, canNavigateHome: false, canReportError: false };
    const canRetry = error.recoverable && retryCount < maxRetries;
    const canNavigateHome = level === 'page' || level === 'feature';
    const canReportError = error.severity !== ErrorSeverity.LOW;
    return {
      canRetry,
      canNavigateHome,
      canReportError
    };
  }
  private handleRetry = async () => {
    const { error, retryCount } = this.state;
    const { maxRetries = 3 } = this.props;
    if (!error || retryCount >= maxRetries) return;
    this.setState({ isRecovering: true, retryCount: retryCount + 1 });
    try {
      // Add exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      await new Promise(resolve => {
        this.retryTimeout = setTimeout(resolve, delay);
      });
      // Reset error state to retry
      this.setState({
        hasError: false,
        error: null,
        errorId: null,
        isRecovering: false
      });
      // Log recovery attempt
    } catch (retryError) {
      console.error('Recovery failed:', retryError);
      this.setState({ isRecovering: false });
    }
  };
  private handleNavigateHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };
  private handleReportError = () => {
    const { error, errorId } = this.state;
    if (!error || !errorId) return;
    // This would integrate with your error reporting service
    console.log('Reporting error:', { error, errorId });
    // Could integrate with services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { extra: { errorId } });
  };
  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };
  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }
  render() {
    const { hasError, error, errorId, isRecovering, showDetails } = this.state;
    const { children, fallback, level, enableRecovery = true } = this.props;
    if (!hasError) {
      return children;
    }
    if (fallback) {
      return fallback;
    }
    const errorMessage = error ? ERROR_MESSAGES[error.type] || ERROR_MESSAGES[ErrorType.UNKNOWN] : ERROR_MESSAGES[ErrorType.UNKNOWN];
    const recoveryOptions = this.getRecoveryOptions();
    return (
      <ErrorBoundaryUI
        error={error}
        errorId={errorId}
        errorMessage={errorMessage}
        recoveryOptions={recoveryOptions}
        isRecovering={isRecovering}
        showDetails={showDetails}
        level={level}
        enableRecovery={enableRecovery}
        onRetry={this.handleRetry}
        onNavigateHome={this.handleNavigateHome}
        onReportError={this.handleReportError}
        onToggleDetails={this.toggleDetails}
      />
    );
  }
}
// UI Component with Accessibility Features
interface ErrorBoundaryUIProps {
  error: AppError | null;
  errorId: string | null;
  errorMessage: typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];
  recoveryOptions: ErrorRecoveryOptions;
  isRecovering: boolean;
  showDetails: boolean;
  level: string;
  enableRecovery: boolean;
  onRetry: () => void;
  onNavigateHome: () => void;
  onReportError: () => void;
  onToggleDetails: () => void;
}
function ErrorBoundaryUI({
  error,
  errorId,
  errorMessage,
  recoveryOptions,
  isRecovering,
  showDetails,
  level,
  enableRecovery,
  onRetry,
  onNavigateHome,
  onReportError,
  onToggleDetails
}: ErrorBoundaryUIProps) {
  const { announce } = useAccessibility();
  const [hasAnnounced, setHasAnnounced] = useState(false);
  // Announce error to screen readers
  useEffect(() => {
    if (!hasAnnounced && error) {
      announce(`Error occurred: ${errorMessage.description}. Recovery options are available.`, 'assertive');
      setHasAnnounced(true);
    }
  }, [error, errorMessage, announce, hasAnnounced]);
  // Focus management
  useEffect(() => {
    const errorContainer = document.getElementById(`error-boundary-${errorId}`);
    if (errorContainer) {
      // Focus the error container for screen reader navigation
      errorContainer.focus();
    }
  }, [errorId]);
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'r':
      case 'R':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (recoveryOptions.canRetry && !isRecovering) {
            onRetry();
            announce('Retrying operation...', 'polite');
          }
        }
        break;
      case 'h':
      case 'H':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (recoveryOptions.canNavigateHome) {
            onNavigateHome();
            announce('Navigating to home page...', 'polite');
          }
        }
        break;
    }
  }, [recoveryOptions, isRecovering, onRetry, onNavigateHome, announce]);
  return (
    <div
      id={`error-boundary-${errorId}`}
      className="error-boundary min-h-96 flex items-center justify-center p-6 bg-red-50 dark:bg-red-950"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-lg w-full">
        <Alert className="border-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
          <AlertTitle className="text-red-800 dark:text-red-200">
            {errorMessage.title}
            {level !== 'component' && (
              <span className="sr-only"> - {level} level error</span>
            )}
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300 mt-2">
            {errorMessage.description}
            <br />
            <span className="text-sm mt-2 block font-medium">
              {errorMessage.instructions}
            </span>
          </AlertDescription>
        </Alert>
        {enableRecovery && (
          <div className="mt-4 space-y-3">
            <div 
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Error recovery actions"
            >
              {recoveryOptions.canRetry && (
                <Button
                  onClick={onRetry}
                  disabled={isRecovering}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                  aria-describedby={errorId ? `retry-help-${errorId}` : undefined}
                >
                  <RefreshCw 
                    className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} 
                    aria-hidden="true" 
                  />
                  {isRecovering ? 'Retrying...' : 'Try Again'}
                </Button>
              )}
              {recoveryOptions.canNavigateHome && (
                <Button
                  onClick={onNavigateHome}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  aria-describedby={errorId ? `home-help-${errorId}` : undefined}
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  Go Home
                </Button>
              )}
              {recoveryOptions.canReportError && (
                <Button
                  onClick={onReportError}
                  variant="outline"
                  size="sm"
                  aria-describedby={errorId ? `report-help-${errorId}` : undefined}
                >
                  Report Issue
                </Button>
              )}
            </div>
            {/* Keyboard shortcuts help */}
            <div className="text-sm text-gray-600 dark:text-gray-400" aria-label="Keyboard shortcuts">
              <p>
                <strong>Keyboard shortcuts:</strong>
                {recoveryOptions.canRetry && ' Ctrl+R to retry,'}
                {recoveryOptions.canNavigateHome && ' Ctrl+H for home'}
              </p>
            </div>
            {/* Hidden help text for screen readers */}
            {recoveryOptions.canRetry && (
              <div id={`retry-help-${errorId}`} className="sr-only">
                Attempts to fix the error by retrying the failed operation. Keyboard shortcut: Control+R
              </div>
            )}
            {recoveryOptions.canNavigateHome && (
              <div id={`home-help-${errorId}`} className="sr-only">
                Navigate to the home page to start over. Keyboard shortcut: Control+H
              </div>
            )}
            {recoveryOptions.canReportError && (
              <div id={`report-help-${errorId}`} className="sr-only">
                Send error details to our development team to help improve the application
              </div>
            )}
          </div>
        )}
        {/* Error Details Section */}
        {error && process.env.NODE_ENV === 'development' && (
          <div className="mt-4">
            <Button
              onClick={onToggleDetails}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
              aria-expanded={showDetails}
              aria-controls={`error-details-${errorId}`}
            >
              {showDetails ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>
            {showDetails && (
              <div 
                id={`error-details-${errorId}`}
                className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded border text-xs"
                role="region"
                aria-label="Technical error details"
              >
                <div className="font-mono space-y-2">
                  <div>
                    <strong>Error ID:</strong> {errorId}
                  </div>
                  <div>
                    <strong>Type:</strong> {error.type}
                  </div>
                  <div>
                    <strong>Severity:</strong> {error.severity}
                  </div>
                  <div>
                    <strong>Message:</strong> {error.message}
                  </div>
                  <div>
                    <strong>Timestamp:</strong> {new Date(error.timestamp).toISOString()}
                  </div>
                  {error.context && Object.keys(error.context).length > 0 && (
                    <div>
                      <strong>Context:</strong>
                      <pre className="mt-1 text-xs overflow-auto">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </div>
                  )}
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                      <pre className="mt-1 text-xs overflow-auto">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// Specific Error Boundary Types
export function PageErrorBoundary(props: Omit<ErrorBoundaryProps, 'level'>) {
  return <ErrorBoundary {...props} level="page" />;
}
export function FeatureErrorBoundary(props: Omit<ErrorBoundaryProps, 'level'>) {
  return <ErrorBoundary {...props} level="feature" />;
}
export function ComponentErrorBoundary(props: Omit<ErrorBoundaryProps, 'level'>) {
  return <ErrorBoundary {...props} level="component" enableRecovery={false} />;
}
// Async Error Boundary Hook for handling async errors in components
export function useAsyncErrorBoundary() {
  const [error, setError] = useState<AppError | null>(null);
  const { announce } = useAccessibility();
  const captureAsyncError = useCallback((error: unknown, context: Record<string, unknown> = {}) => {
    const appError = ErrorHandler.getInstance().handle(error, {
      ...context,
      source: 'async-hook',
      timestamp: Date.now()
    });
    setError(appError);
    announce(`Error: ${appError.userMessage}`, 'assertive');
    return appError;
  }, [announce]);
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  const retryOperation = useCallback(async (
    operation: () => Promise<unknown>,
    context: Record<string, unknown> = {}
  ) => {
    try {
      clearError();
      announce('Retrying operation...', 'polite');
      return await operation();
    } catch (error) {
      return captureAsyncError(error, { ...context, isRetry: true });
    }
  }, [clearError, captureAsyncError, announce]);
  return {
    error,
    captureAsyncError,
    clearError,
    retryOperation,
    hasError: !!error
  };
}
// Higher-Order Component for Error Boundary
export function withErrorBoundary<T extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<T>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const WithErrorBoundaryComponent = (props: T) => {
    return (
      <ErrorBoundary {...errorBoundaryProps} level={errorBoundaryProps?.level || 'component'}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithErrorBoundaryComponent;
}
// Error Context Provider
interface ErrorContextState {
  globalError: AppError | null;
  setGlobalError: (error: AppError | null) => void;
  reportError: (error: unknown, context?: Record<string, unknown>) => AppError;
  clearGlobalError: () => void;
}
const ErrorContext = React.createContext<ErrorContextState | null>(null);
export function ErrorProvider({ children }: { children: ReactNode }) {
  const [globalError, setGlobalError] = useState<AppError | null>(null);
  const { announce } = useAccessibility();
  const reportError = useCallback((error: unknown, context: Record<string, unknown> = {}) => {
    const appError = ErrorHandler.getInstance().handle(error, {
      ...context,
      source: 'global-context'
    });
    setGlobalError(appError);
    announce(`Global error: ${appError.userMessage}`, 'assertive');
    return appError;
  }, [announce]);
  const clearGlobalError = useCallback(() => {
    setGlobalError(null);
  }, []);
  const contextValue: ErrorContextState = {
    globalError,
    setGlobalError,
    reportError,
    clearGlobalError
  };
  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      {globalError && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="global-error-title"
          aria-describedby="global-error-description"
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md mx-4">
            <Alert className="border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
              <AlertTitle id="global-error-title" className="text-red-800 dark:text-red-200">
                Critical Error
              </AlertTitle>
              <AlertDescription id="global-error-description" className="text-red-700 dark:text-red-300 mt-2">
                {globalError.userMessage}
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={clearGlobalError}
                variant="outline"
                size="sm"
                autoFocus
              >
                Acknowledge
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="default"
                size="sm"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      )}
    </ErrorContext.Provider>
  );
}
export function useErrorContext() {
  const context = React.useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}
// Utility Components
export function ErrorFallback({ 
  error, 
  resetError,
  level = 'component' 
}: { 
  error: Error; 
  resetError: () => void;
  level?: string;
}) {
  const { announce } = useAccessibility();
  useEffect(() => {
    announce(`Component error: ${error.message}`, 'assertive');
  }, [error, announce]);
  return (
    <div 
      className="p-4 border border-red-200 bg-red-50 rounded-lg"
      role="alert"
      aria-live="assertive"
    >
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Something went wrong
      </h3>
      <p className="text-red-700 mb-4">
        {level === 'component' 
          ? 'This component encountered an error and cannot be displayed.'
          : 'An error occurred that prevents this feature from working properly.'
        }
      </p>
      <Button 
        onClick={resetError}
        variant="outline" 
        size="sm"
        className="border-red-300 text-red-700 hover:bg-red-100"
      >
        Try Again
      </Button>
    </div>
  );
}
// Export types
export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorRecoveryOptions
};
