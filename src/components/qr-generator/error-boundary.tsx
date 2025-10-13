'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Bug, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

interface QRGeneratorErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  showDetails: boolean;
}

interface QRGeneratorErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  enableReporting?: boolean;
}

// Error types specific to QR Generator
export enum QRErrorType {
  GENERATION_FAILED = 'GENERATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  COPY_FAILED = 'COPY_FAILED',
  SHARE_FAILED = 'SHARE_FAILED',
  STORAGE_FAILED = 'STORAGE_FAILED',
  CANVAS_ERROR = 'CANVAS_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BROWSER_COMPATIBILITY = 'BROWSER_COMPATIBILITY',
  MEMORY_ERROR = 'MEMORY_ERROR'
}

export class QRGeneratorError extends Error {
  public readonly type: QRErrorType;
  public readonly context?: any;
  public readonly userMessage: string;
  public readonly recoverable: boolean;

  constructor(
    type: QRErrorType,
    message: string,
    userMessage: string,
    context?: any,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'QRGeneratorError';
    this.type = type;
    this.context = context;
    this.userMessage = userMessage;
    this.recoverable = recoverable;
  }
}

// Error reporting service
class ErrorReportingService {
  private static instance: ErrorReportingService;
  private reports: Array<{
    id: string;
    timestamp: number;
    error: Error;
    errorInfo?: ErrorInfo;
    userAgent: string;
    url: string;
    context?: any;
  }> = [];

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  report(error: Error, errorInfo?: ErrorInfo, context?: any): string {
    const errorId = `qr_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report = {
      id: errorId,
      timestamp: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      context
    };

    // Store locally (in a real app, you'd send this to an error reporting service)
    this.reports.push(report as any);
    
    // Keep only last 100 reports
    if (this.reports.length > 100) {
      this.reports = this.reports.slice(-100);
    }

    // Save to localStorage for persistence
    try {
      localStorage.setItem('qr_error_reports', JSON.stringify(this.reports));
    } catch (e) {
      console.warn('Failed to save error reports to localStorage:', e);
    }

    console.error('QR Generator Error Reported:', report);
    
    return errorId;
  }

  getReports() {
    return [...this.reports];
  }

  clearReports() {
    this.reports = [];
    try {
      localStorage.removeItem('qr_error_reports');
    } catch (e) {
      console.warn('Failed to clear error reports from localStorage:', e);
    }
  }

  exportReports() {
    const data = {
      reports: this.reports,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-error-reports-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    showSuccessToast('Error reports exported successfully');
  }
}

// Error boundary component
export class QRGeneratorErrorBoundary extends Component<
  QRGeneratorErrorBoundaryProps,
  QRGeneratorErrorBoundaryState
> {
  private errorReporting: ErrorReportingService;

  constructor(props: QRGeneratorErrorBoundaryProps) {
    super(props);
    this.errorReporting = ErrorReportingService.getInstance();
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<QRGeneratorErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.errorReporting.report(error, errorInfo);
    
    this.setState({
      errorInfo,
      errorId
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        retryCount: prevState.retryCount + 1
      }));
    } else {
      showErrorToast('Maximum retry attempts reached');
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      showDetails: false
    });
  };

  handleReportIssue = () => {
    if (this.state.error && this.state.errorInfo) {
      // In a real app, this would open a bug report form or send to an issue tracker
      const bugReport = {
        errorId: this.state.errorId,
        errorType: this.state.error.name,
        errorMessage: this.state.error.message,
        componentStack: this.state.errorInfo.componentStack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // Copy to clipboard for now
      navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2))
        .then(() => showSuccessToast('Bug report copied to clipboard'))
        .catch(() => showErrorToast('Failed to copy bug report'));
    }
  };

  copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => showSuccessToast('Error details copied'))
      .catch(() => showErrorToast('Failed to copy error details'));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const isQRError = error instanceof QRGeneratorError;
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.state.retryCount < maxRetries && (!isQRError || isQRError.recoverable);

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-800">
                    {isQRError ? 'QR Generator Error' : 'Something went wrong'}
                  </CardTitle>
                  <CardDescription>
                    {isQRError ? error.userMessage : 'An unexpected error occurred while generating your QR code'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error type badge */}
              {isQRError && (
                <Badge variant={isQRError.recoverable ? 'destructive' : 'outline'} className="mb-4">
                  {isQRError.type.replace(/_/g, ' ')}
                </Badge>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {canRetry && (
                  <Button onClick={this.handleRetry} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try Again {this.state.retryCount > 0 && `(${this.state.retryCount}/${maxRetries})`}
                  </Button>
                )}
                
                <Button variant="outline" onClick={this.handleReset}>
                  Reset Component
                </Button>
                
                <Button variant="outline" onClick={this.handleReportIssue}>
                  <Bug className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </div>

              {/* Error details (collapsible) */}
              <Collapsible open={this.state.showDetails} onOpenChange={(open) => this.setState({ showDetails: open })}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Error ID</h4>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {this.state.errorId}
                      </code>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-1">Error Message</h4>
                      <p className="text-sm text-gray-700">{error?.message}</p>
                    </div>
                    
                    {error?.stack && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Stack Trace</h4>
                        <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {isQRError && error.context && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Context</h4>
                        <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto max-h-32">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={this.copyErrorDetails}
                      className="w-full"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Error Details
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Help text */}
              <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                <p className="mb-2"><strong>What can you do?</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Try refreshing the page</li>
                  <li>Check your internet connection</li>
                  <li>Try with different content or settings</li>
                  <li>Clear your browser cache</li>
                  {this.props.enableReporting && <li>Report this issue to help us improve</li>}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper functions for creating QR-specific errors
export function createQRError(
  type: QRErrorType,
  message: string,
  context?: any
): QRGeneratorError {
  const userMessages: Record<QRErrorType, string> = {
    [QRErrorType.GENERATION_FAILED]: 'Failed to generate QR code. Please try again.',
    [QRErrorType.INVALID_INPUT]: 'Invalid input provided. Please check your content.',
    [QRErrorType.DOWNLOAD_FAILED]: 'Failed to download QR code. Please try again.',
    [QRErrorType.COPY_FAILED]: 'Failed to copy QR code to clipboard.',
    [QRErrorType.SHARE_FAILED]: 'Failed to share QR code. Sharing may not be supported.',
    [QRErrorType.STORAGE_FAILED]: 'Failed to save QR code data.',
    [QRErrorType.CANVAS_ERROR]: 'Canvas rendering error occurred.',
    [QRErrorType.NETWORK_ERROR]: 'Network error occurred. Check your connection.',
    [QRErrorType.BROWSER_COMPATIBILITY]: 'Browser compatibility issue detected.',
    [QRErrorType.MEMORY_ERROR]: 'Insufficient memory to complete operation.'
  };

  const recoverable = [
    QRErrorType.GENERATION_FAILED,
    QRErrorType.DOWNLOAD_FAILED,
    QRErrorType.COPY_FAILED,
    QRErrorType.SHARE_FAILED,
    QRErrorType.NETWORK_ERROR
  ].includes(type);

  return new QRGeneratorError(
    type,
    message,
    userMessages[type],
    context,
    recoverable
  );
}

// Error reporting hook
export function useQRErrorReporting() {
  const errorReporting = ErrorReportingService.getInstance();

  const reportError = (error: Error, context?: any) => {
    return errorReporting.report(error, undefined, context);
  };

  const getReports = () => errorReporting.getReports();
  const clearReports = () => errorReporting.clearReports();
  const exportReports = () => errorReporting.exportReports();

  return {
    reportError,
    getReports,
    clearReports,
    exportReports
  };
}

// Higher-order component for error handling
export function withQRErrorHandling<P extends object>(
  Component: React.ComponentType<P>
) {
  return function QRErrorWrappedComponent(props: P) {
    return (
      <QRGeneratorErrorBoundary enableReporting={true}>
        <Component {...props} />
      </QRGeneratorErrorBoundary>
    );
  };
}

export default QRGeneratorErrorBoundary;