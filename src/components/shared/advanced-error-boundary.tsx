'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Copy, ExternalLink } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  isReporting: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableReporting?: boolean;
  maxRetries?: number;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'critical';
}

export class AdvancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isReporting: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableReporting } = this.props;
    const { errorId } = this.state;

    console.group(`🚨 Error Boundary Caught Error [${errorId}]`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    this.setState({ errorInfo });

    // Call custom error handler
    onError?.(error, errorInfo, errorId);

    // Report error to analytics/monitoring service
    if (enableReporting) {
      this.reportError(error, errorInfo, errorId);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    this.setState({ isReporting: true });

    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      level: this.props.level || 'component',
      retryCount: this.state.retryCount
    };

    try {
      // Send to your error reporting service
      await fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1
    });

    // Add a small delay before retry to prevent immediate re-error
    this.retryTimeoutId = setTimeout(() => {
      // Force re-render
      this.forceUpdate();
    }, 100);
  };

  private copyErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    if (!error) return;

    const errorDetails = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    const errorText = JSON.stringify(errorDetails, null, 2);
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorText).then(() => {
        alert('Error details copied to clipboard');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error details copied to clipboard');
    }
  };

  private openGitHubIssue = () => {
    const { error, errorId } = this.state;
    if (!error) return;

    const issueTitle = encodeURIComponent(`Bug Report: ${error.message}`);
    const issueBody = encodeURIComponent(`
**Error ID:** ${errorId}
**Error Message:** ${error.message}
**Stack Trace:**
\`\`\`
${error.stack}
\`\`\`

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**

**Actual Behavior:**

**Browser:** ${navigator.userAgent}
**URL:** ${window.location.href}
**Timestamp:** ${new Date().toISOString()}
    `);

    const githubUrl = `https://github.com/your-repo/issues/new?title=${issueTitle}&body=${issueBody}`;
    window.open(githubUrl, '_blank');
  };

  private renderErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    if (!this.props.showDetails || !error) return null;

    return (
      <details className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
          Technical Details
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <strong className="text-sm text-gray-600">Error ID:</strong>
            <code className="block mt-1 p-2 bg-gray-100 rounded text-xs font-mono">
              {errorId}
            </code>
          </div>
          <div>
            <strong className="text-sm text-gray-600">Message:</strong>
            <code className="block mt-1 p-2 bg-gray-100 rounded text-xs font-mono">
              {error.message}
            </code>
          </div>
          {error.stack && (
            <div>
              <strong className="text-sm text-gray-600">Stack Trace:</strong>
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
                {error.stack}
              </pre>
            </div>
          )}
          {errorInfo?.componentStack && (
            <div>
              <strong className="text-sm text-gray-600">Component Stack:</strong>
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  };

  render() {
    const { hasError, error, retryCount, isReporting } = this.state;
    const { children, fallback, maxRetries = 3, level = 'component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Different UI based on error level
      const isPageLevel = level === 'page';
      const isCritical = level === 'critical';

      return (
        <div className={`flex flex-col items-center justify-center p-8 ${
          isPageLevel ? 'min-h-screen' : 'min-h-64'
        } bg-red-50 border-2 border-red-200 rounded-lg`}>
          <div className="flex items-center mb-4">
            <AlertTriangle className={`${
              isCritical ? 'w-16 h-16' : isPageLevel ? 'w-12 h-12' : 'w-8 h-8'
            } text-red-500 mr-3`} />
            <div>
              <h2 className={`${
                isCritical ? 'text-2xl' : isPageLevel ? 'text-xl' : 'text-lg'
              } font-bold text-red-800 mb-1`}>
                {isCritical ? 'Critical Error' : isPageLevel ? 'Page Error' : 'Component Error'}
              </h2>
              <p className="text-red-600 text-sm">
                {isCritical 
                  ? 'A critical error has occurred that requires immediate attention.' 
                  : 'Something went wrong while loading this section.'
                }
              </p>
            </div>
          </div>

          <div className="text-center mb-6 max-w-md">
            <p className="text-red-700 mb-2">
              <strong>Error:</strong> {error.message}
            </p>
            {isReporting && (
              <p className="text-blue-600 text-sm flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                Reporting error...
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center mb-4">
            <button
              onClick={this.handleRetry}
              disabled={retryCount >= maxRetries}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {retryCount >= maxRetries ? 'Max retries reached' : 'Try Again'}
            </button>

            <button
              onClick={this.copyErrorDetails}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Details
            </button>

            <button
              onClick={this.openGitHubIssue}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Bug className="w-4 h-4" />
              Report Bug
            </button>
          </div>

          {retryCount > 0 && (
            <p className="text-sm text-red-500 mb-4">
              Retry attempts: {retryCount}/{maxRetries}
            </p>
          )}

          {this.renderErrorDetails()}
        </div>
      );
    }

    return children;
  }
}

// Higher-order component wrapper
export function withErrorBoundary<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundaryComponent = React.forwardRef<any, T>((props, ref) => (
    <AdvancedErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...(props as T)} ref={ref} />
    </AdvancedErrorBoundary>
  ));

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundaryComponent;
}

// Hook for error reporting
export function useErrorReporting() {
  const reportError = React.useCallback(async (error: Error, context?: string) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }, []);

  return { reportError };
}
