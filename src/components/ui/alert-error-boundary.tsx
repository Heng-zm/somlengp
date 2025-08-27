"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorHandler, AppError, ErrorType, ErrorSeverity } from '@/lib/error-utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  allowRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string | null;
}

/**
 * Error boundary specifically designed for alert components
 * Provides graceful degradation when alert rendering fails
 */
export class AlertErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `alert-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error using our centralized error handler
    const appError = new AppError(
      `Alert Error Boundary caught error: ${error.message}`,
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      {
        errorBoundary: 'AlertErrorBoundary',
        componentStack: errorInfo.componentStack,
        errorStack: error.stack,
        retryCount: this.state.retryCount,
        props: this.props,
      },
      'An error occurred while displaying alerts. This has been reported.',
      true
    );

    errorHandler.handle(appError);

    this.setState({
      error,
      errorInfo,
    });

    // Call the custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state when props change (if enabled)
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    // Reset error state when specific keys change
    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some((key, idx) => key !== prevResetKeys[idx]);
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: null,
    });
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }));

    // Add a small delay before retrying to avoid immediate re-error
    this.retryTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, 250);
  };

  render() {
    const { hasError, error, errorInfo, retryCount, errorId } = this.state;
    const { 
      children, 
      fallback, 
      showErrorDetails = false, 
      allowRetry = true, 
      maxRetries = 3 
    } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Determine error message based on error type
      const getErrorMessage = () => {
        if (error.message.includes('description')) {
          return 'Invalid alert content provided. Please check your alert configuration.';
        }
        if (error.message.includes('timeout')) {
          return 'Alert timeout value is invalid. Using default timeout instead.';
        }
        if (error.message.includes('type')) {
          return 'Unknown alert type specified. Falling back to info alert.';
        }
        return 'An unexpected error occurred while displaying the alert.';
      };

      const errorMessage = getErrorMessage();
      const canRetry = allowRetry && retryCount < maxRetries;

      return (
        <Alert 
          variant="destructive"
          className="border-red-500 bg-red-50 dark:bg-red-950/20"
          role="alert"
          aria-live="assertive"
          data-error-boundary="alert-error-boundary"
          data-error-id={errorId}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Alert Display Error</span>
            {canRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleRetry}
                className="h-6 px-2 py-0 text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/30"
                aria-label="Retry displaying alert"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry ({maxRetries - retryCount} left)
              </Button>
            )}
          </AlertTitle>
          
          <AlertDescription>
            <div className="space-y-2">
              <p>{errorMessage}</p>
              
              {retryCount > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Retry attempt: {retryCount}/{maxRetries}
                </p>
              )}
              
              {showErrorDetails && process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-300">
                    Technical Details (Development Only)
                  </summary>
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-xs font-mono">
                    <div><strong>Error:</strong> {error.message}</div>
                    {error.stack && (
                      <div className="mt-1">
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap break-all">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo && (
                      <div className="mt-1">
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap break-all">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              {!canRetry && maxRetries > 0 && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Maximum retry attempts reached. Please refresh the page or contact support if the problem persists.
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return children;
  }
}

/**
 * HOC to wrap components with AlertErrorBoundary
 */
export function withAlertErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <AlertErrorBoundary {...errorBoundaryProps}>
      <Component {...(props as P)} ref={ref} />
    </AlertErrorBoundary>
  ));

  WrappedComponent.displayName = `withAlertErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook to provide error boundary functionality to functional components
 */
export function useAlertErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    
    // Log error using our centralized handler
    errorHandler.handle(error, {
      source: 'useAlertErrorHandler',
      timestamp: Date.now(),
    });
  }, []);

  // Reset error when component unmounts
  React.useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  return {
    error,
    handleError,
    resetError,
    hasError: error !== null,
  };
}

/**
 * Safe wrapper function for alert operations
 * Catches errors and provides fallback behavior
 */
export function safeAlertOperation<T>(
  operation: () => T,
  fallback: T,
  context: Record<string, any> = {}
): T {
  try {
    return operation();
  } catch (error) {
    const appError = new AppError(
      `Safe alert operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      {
        ...context,
        operation: 'safeAlertOperation',
        originalError: error,
      },
      'An error occurred while processing alert operation.',
      true
    );

    errorHandler.handle(appError);
    return fallback;
  }
}

export default AlertErrorBoundary;
