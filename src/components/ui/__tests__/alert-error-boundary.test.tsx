import React, { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import {
  AlertErrorBoundary,
  withAlertErrorBoundary,
  useAlertErrorHandler,
  safeAlertOperation,
} from '../alert-error-boundary';
import { ErrorAlert } from '../alert-utils';
import { mockTimers } from '@/lib/test-setup';
import '@testing-library/jest-dom';

// Mock the error-utils module
const mockErrorHandler = {
  handle: jest.fn(),
};

jest.mock('@/lib/error-utils', () => {
  const originalModule = jest.requireActual('@/lib/error-utils');
  return {
    ...originalModule,
    errorHandler: mockErrorHandler,
    AppError: jest.fn().mockImplementation((message, type, severity, context, userMessage, reportable) => ({
      message,
      type,
      severity,
      context,
      userMessage,
      reportable,
    })),
    ErrorType: {
      UNKNOWN: 'UNKNOWN',
      VALIDATION: 'VALIDATION',
      NETWORK: 'NETWORK',
    },
    ErrorSeverity: {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
      CRITICAL: 'CRITICAL',
    },
  };
});

// Test components that throw errors
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Working component</div>;
};

const ConditionalThrowingComponent = ({ 
  errorType, 
  throwError = false 
}: { 
  errorType?: string; 
  throwError?: boolean; 
}) => {
  if (throwError) {
    if (errorType === 'description') {
      throw new Error('Invalid description provided');
    } else if (errorType === 'timeout') {
      throw new Error('Invalid timeout value');
    } else if (errorType === 'type') {
      throw new Error('Unknown alert type specified');
    } else {
      throw new Error('Generic error');
    }
  }
  return <div>Component is working</div>;
};

const AsyncThrowingComponent = ({ 
  shouldThrowAsync = false 
}: { 
  shouldThrowAsync?: boolean 
}) => {
  React.useEffect(() => {
    if (shouldThrowAsync) {
      setTimeout(() => {
        throw new Error('Async error');
      }, 100);
    }
  }, [shouldThrowAsync]);

  return <div>Async component</div>;
};

// Mock console methods
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('AlertErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
  });

  afterAll(() => {
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('Basic Error Handling', () => {
    it('catches errors and displays fallback UI', () => {
      render(
        <AlertErrorBoundary>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(screen.getByText('Alert Display Error')).toBeInTheDocument();
      expect(screen.getByText('An unexpected error occurred while displaying the alert.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });

    it('renders children when no error occurs', () => {
      render(
        <AlertErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </AlertErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
      expect(screen.queryByText('Alert Display Error')).not.toBeInTheDocument();
    });

    it('calls error handler with proper context', () => {
      render(
        <AlertErrorBoundary>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Alert Error Boundary caught error'),
          type: 'UNKNOWN',
          severity: 'HIGH',
          context: expect.objectContaining({
            errorBoundary: 'AlertErrorBoundary',
          }),
        })
      );
    });

    it('calls custom onError callback when provided', () => {
      const onError = jest.fn();

      render(
        <AlertErrorBoundary onError={onError}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('Custom Fallback UI', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <AlertErrorBoundary fallback={customFallback}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByText('Alert Display Error')).not.toBeInTheDocument();
    });
  });

  describe('Error Message Customization', () => {
    const testCases = [
      {
        errorType: 'description',
        expectedMessage: 'Invalid alert content provided. Please check your alert configuration.',
      },
      {
        errorType: 'timeout',
        expectedMessage: 'Alert timeout value is invalid. Using default timeout instead.',
      },
      {
        errorType: 'type',
        expectedMessage: 'Unknown alert type specified. Falling back to info alert.',
      },
    ];

    testCases.forEach(({ errorType, expectedMessage }) => {
      it(`shows specific error message for ${errorType} errors`, () => {
        render(
          <AlertErrorBoundary>
            <ConditionalThrowingComponent errorType={errorType} throwError={true} />
          </AlertErrorBoundary>
        );

        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      });
    });

    it('shows generic error message for unknown errors', () => {
      render(
        <AlertErrorBoundary>
          <ConditionalThrowingComponent errorType="unknown" throwError={true} />
        </AlertErrorBoundary>
      );

      expect(screen.getByText('An unexpected error occurred while displaying the alert.')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('shows retry button when allowRetry is true', () => {
      render(
        <AlertErrorBoundary allowRetry={true} maxRetries={3}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByText('Retry (3 left)')).toBeInTheDocument();
    });

    it('does not show retry button when allowRetry is false', () => {
      render(
        <AlertErrorBoundary allowRetry={false}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('handles retry attempts correctly', async () => {
      const timers = mockTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      let shouldThrow = true;
      const RetryTestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Component recovered</div>;
      };

      render(
        <AlertErrorBoundary allowRetry={true} maxRetries={3}>
          <RetryTestComponent />
        </AlertErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      // First retry
      shouldThrow = false; // Fix the component
      await user.click(retryButton);
      
      // Wait for retry delay
      timers.advanceByTime(250);

      await waitFor(() => {
        expect(screen.getByText('Component recovered')).toBeInTheDocument();
      });

      timers.restore();
    });

    it('decreases retry count with each attempt', async () => {
      const user = userEvent.setup();
      let throwCount = 2;
      
      const MultiRetryComponent = () => {
        if (throwCount > 0) {
          throwCount--;
          throw new Error('Still failing');
        }
        return <div>Finally working</div>;
      };

      const { rerender } = render(
        <AlertErrorBoundary allowRetry={true} maxRetries={3}>
          <MultiRetryComponent />
        </AlertErrorBoundary>
      );

      // Initial error - should show 3 retries left
      expect(screen.getByText('Retry (3 left)')).toBeInTheDocument();

      // First retry attempt (component still throws)
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Need to rerender to simulate the error boundary catching the new error
      rerender(
        <AlertErrorBoundary allowRetry={true} maxRetries={3}>
          <MultiRetryComponent />
        </AlertErrorBoundary>
      );

      // After first retry, should show updated count
      await waitFor(() => {
        expect(screen.getByText('Retry (2 left)')).toBeInTheDocument();
      });
    });

    it('shows max retries reached message', () => {
      render(
        <AlertErrorBoundary allowRetry={false} maxRetries={3}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(screen.getByText(/Maximum retry attempts reached/)).toBeInTheDocument();
    });

    it('hides retry button when max retries reached', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertErrorBoundary allowRetry={true} maxRetries={1}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Should not show retry button anymore
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Details Display', () => {
    beforeEach(() => {
      // Mock development environment
      jest.spyOn(process.env, 'NODE_ENV', 'get').mockReturnValue('development');
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('shows error details in development when enabled', () => {
      render(
        <AlertErrorBoundary showErrorDetails={true}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(screen.getByText('Technical Details (Development Only)')).toBeInTheDocument();
      
      // Click to expand details
      const detailsElement = screen.getByText('Technical Details (Development Only)');
      fireEvent.click(detailsElement);

      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('does not show error details when disabled', () => {
      render(
        <AlertErrorBoundary showErrorDetails={false}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(screen.queryByText('Technical Details (Development Only)')).not.toBeInTheDocument();
    });
  });

  describe('Props Change Reset', () => {
    it('resets error state when resetOnPropsChange is true and children change', () => {
      const { rerender } = render(
        <AlertErrorBoundary resetOnPropsChange={true}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(screen.getByText('Alert Display Error')).toBeInTheDocument();

      // Change children
      rerender(
        <AlertErrorBoundary resetOnPropsChange={true}>
          <ThrowingComponent shouldThrow={false} />
        </AlertErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('resets error state when reset keys change', () => {
      const { rerender } = render(
        <AlertErrorBoundary resetKeys={['key1']}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(screen.getByText('Alert Display Error')).toBeInTheDocument();

      // Change reset keys
      rerender(
        <AlertErrorBoundary resetKeys={['key2']}>
          <ThrowingComponent shouldThrow={false} />
        </AlertErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('does not reset when resetOnPropsChange is false', () => {
      const { rerender } = render(
        <AlertErrorBoundary resetOnPropsChange={false}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      expect(screen.getByText('Alert Display Error')).toBeInTheDocument();

      // Change children
      rerender(
        <AlertErrorBoundary resetOnPropsChange={false}>
          <ThrowingComponent shouldThrow={false} />
        </AlertErrorBoundary>
      );

      // Should still show error
      expect(screen.getByText('Alert Display Error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('includes proper ARIA attributes', () => {
      render(
        <AlertErrorBoundary>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(alert).toHaveAttribute('data-error-boundary', 'alert-error-boundary');
      expect(alert).toHaveAttribute('data-error-id');
    });

    it('provides proper button labels for retry', () => {
      render(
        <AlertErrorBoundary allowRetry={true}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveAttribute('aria-label', 'Retry displaying alert');
    });
  });

  describe('Cleanup', () => {
    it('cleans up retry timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(
        <AlertErrorBoundary allowRetry={true}>
          <ThrowingComponent />
        </AlertErrorBoundary>
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});

describe('withAlertErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const TestComponent = ({ message }: { message: string }) => (
      <div>{message}</div>
    );

    const WrappedComponent = withAlertErrorBoundary(TestComponent);

    render(<WrappedComponent message="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('passes error boundary props to wrapper', () => {
    const TestComponent = () => {
      throw new Error('Test error');
    };

    const WrappedComponent = withAlertErrorBoundary(TestComponent, {
      allowRetry: false,
      showErrorDetails: true,
    });

    render(<WrappedComponent />);
    expect(screen.getByText('Alert Display Error')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('forwards refs correctly', () => {
    const TestComponent = React.forwardRef<HTMLDivElement, { message: string }>(
      ({ message }, ref) => <div ref={ref}>{message}</div>
    );

    const WrappedComponent = withAlertErrorBoundary(TestComponent);
    const ref = React.createRef<HTMLDivElement>();

    render(<WrappedComponent ref={ref} message="Test" />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.textContent).toBe('Test');
  });

  it('sets correct display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';

    const WrappedComponent = withAlertErrorBoundary(TestComponent);
    
    expect(WrappedComponent.displayName).toBe('withAlertErrorBoundary(TestComponent)');
  });
});

describe('useAlertErrorHandler Hook', () => {
  const TestComponent = ({ shouldError = false }: { shouldError?: boolean }) => {
    const { error, handleError, resetError, hasError } = useAlertErrorHandler();

    React.useEffect(() => {
      if (shouldError) {
        handleError(new Error('Hook test error'));
      }
    }, [shouldError, handleError]);

    if (hasError && error) {
      return (
        <div>
          <div data-testid="error-message">{error.message}</div>
          <button onClick={resetError} data-testid="reset-button">
            Reset
          </button>
        </div>
      );
    }

    return <div data-testid="success">No error</div>;
  };

  it('handles errors and provides reset functionality', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TestComponent />);

    expect(screen.getByTestId('success')).toBeInTheDocument();

    // Trigger error
    rerender(<TestComponent shouldError={true} />);

    expect(screen.getByTestId('error-message')).toHaveTextContent('Hook test error');
    expect(mockErrorHandler.handle).toHaveBeenCalled();

    // Reset error
    await user.click(screen.getByTestId('reset-button'));

    expect(screen.getByTestId('success')).toBeInTheDocument();
  });

  it('cleans up error state on unmount', () => {
    const { unmount } = render(<TestComponent shouldError={true} />);
    
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    
    // Should not throw on unmount
    unmount();
  });
});

describe('safeAlertOperation', () => {
  it('returns operation result when no error occurs', () => {
    const result = safeAlertOperation(() => 'success', 'fallback');
    expect(result).toBe('success');
  });

  it('returns fallback when operation throws', () => {
    const result = safeAlertOperation(
      () => {
        throw new Error('Test error');
      },
      'fallback',
      { context: 'test' }
    );

    expect(result).toBe('fallback');
    expect(mockErrorHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Safe alert operation failed'),
        context: expect.objectContaining({
          context: 'test',
          operation: 'safeAlertOperation',
        }),
      })
    );
  });

  it('handles non-Error exceptions', () => {
    const result = safeAlertOperation(
      () => {
        throw 'String error';
      },
      'fallback'
    );

    expect(result).toBe('fallback');
    expect(mockErrorHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Unknown error'),
      })
    );
  });

  it('includes context in error report', () => {
    safeAlertOperation(
      () => {
        throw new Error('Test');
      },
      'fallback',
      { userId: '123', action: 'display-alert' }
    );

    expect(mockErrorHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          userId: '123',
          action: 'display-alert',
          operation: 'safeAlertOperation',
        }),
      })
    );
  });
});

describe('Integration Tests', () => {
  it('works with actual alert components', () => {
    const ProblematicAlert = () => {
      throw new Error('Alert rendering failed');
    };

    render(
      <AlertErrorBoundary>
        <ProblematicAlert />
        <ErrorAlert description="This should not render" />
      </AlertErrorBoundary>
    );

    expect(screen.getByText('Alert Display Error')).toBeInTheDocument();
    expect(screen.queryByText('This should not render')).not.toBeInTheDocument();
  });

  it('handles multiple error boundaries', () => {
    const ErrorComponent1 = () => {
      throw new Error('Error 1');
    };
    
    const ErrorComponent2 = () => {
      throw new Error('Error 2');
    };

    render(
      <div>
        <AlertErrorBoundary>
          <ErrorComponent1 />
        </AlertErrorBoundary>
        <AlertErrorBoundary>
          <ErrorComponent2 />
        </AlertErrorBoundary>
      </div>
    );

    const errorAlerts = screen.getAllByText('Alert Display Error');
    expect(errorAlerts).toHaveLength(2);
  });
});
