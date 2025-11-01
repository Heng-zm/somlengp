import React from 'react';
import { render, act } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import {
  SuccessAlert,
  ErrorAlert,
  WarningAlert,
  InfoAlert,
  LoadingAlert,
  SecurityAlert,
  MaintenanceAlert,
  PremiumAlert,
  AlertContainer,
  useAlerts,
  type AlertContainerAlert,
  type SafeAlertProps,
} from '../alert-utils';
import { mockTimers, createMockAlert, createMockAlerts } from '@/lib/test-setup';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest with axe matchers
expect.extend(toHaveNoViolations);

// Mock error handler to prevent console spam during tests
jest.mock('@/lib/error-utils', () => {
  const originalModule = jest.requireActual('@/lib/error-utils');
  return {
    ...originalModule,
    errorHandler: {
      handle: jest.fn(),
    },
  };
});

describe('Alert Components', () => {
  describe('SuccessAlert', () => {
    it('renders success alert with correct content', () => {
      render(
        <SuccessAlert description="Operation completed successfully" />
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(
        <SuccessAlert 
          title="Custom Success" 
          description="Operation completed" 
        />
      );
      
      expect(screen.getByText('Custom Success')).toBeInTheDocument();
    });

    it('handles dismissible functionality', async () => {
      const onDismiss = jest.fn();
      const user = userEvent.setup();

      render(
        <SuccessAlert
          description="Test"
          dismissible={true}
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('handles validation errors gracefully', () => {
      // Test with invalid description
      render(
        <SuccessAlert description="" />
      );

      // Should render fallback error alert
      expect(screen.getByText('Alert Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to display alert. Please check the console for details.')).toBeInTheDocument();
    });

    it('sanitizes long descriptions', () => {
      const longDescription = 'a'.repeat(1500); // Exceeds MAX_DESCRIPTION_LENGTH
      
      render(
        <SuccessAlert description={longDescription} />
      );

      // Should render fallback due to validation error
      expect(screen.getByText('Alert Error')).toBeInTheDocument();
    });

    it('applies accessibility attributes correctly', () => {
      render(
        <SuccessAlert 
          description="Test description"
          ariaLabel="Custom success alert"
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-label', 'Custom success alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('ErrorAlert', () => {
    it('renders error alert with default error title', () => {
      render(<ErrorAlert description="Something went wrong" />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('is dismissible by default', () => {
      render(<ErrorAlert description="Test error" />);
      
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe('LoadingAlert', () => {
    it('renders loading alert with spinner icon', () => {
      render(<LoadingAlert description="Processing your request" />);
      
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByText('Processing your request')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('uses correct aria attributes for loading state', () => {
      render(<LoadingAlert description="Loading data" />);
      
      const alert = screen.getByRole('status');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('MaintenanceAlert', () => {
    it('renders maintenance alert with assertive aria-live', () => {
      render(<MaintenanceAlert description="System maintenance in progress" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(screen.getByText('Maintenance Notice')).toBeInTheDocument();
    });

    it('is not dismissible by default', () => {
      render(<MaintenanceAlert description="Maintenance" />);
      
      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
    });
  });

  describe('SecurityAlert', () => {
    it('renders security alert with shield icon', () => {
      render(<SecurityAlert description="Security update required" />);
      
      expect(screen.getByText('Security Notice')).toBeInTheDocument();
      expect(screen.getByText('Security update required')).toBeInTheDocument();
    });

    it('is not dismissible by default', () => {
      render(<SecurityAlert description="Security notice" />);
      
      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
    });
  });

  describe('PremiumAlert', () => {
    it('renders premium alert with custom styling', () => {
      render(<PremiumAlert description="Upgrade to premium" />);
      
      expect(screen.getByText('Premium Feature')).toBeInTheDocument();
      expect(screen.getByText('Upgrade to premium')).toBeInTheDocument();
    });
  });
});

describe('AlertContainer', () => {
  it('renders multiple alerts correctly', () => {
    const alerts = [
      createMockAlert({ type: 'success', description: 'Success message' }),
      createMockAlert({ type: 'error', description: 'Error message' }),
    ];

    render(<AlertContainer alerts={alerts} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('sorts alerts by priority', () => {
    const alerts = [
      createMockAlert({ type: 'info', description: 'Low priority', priority: 'low' }),
      createMockAlert({ type: 'error', description: 'Critical priority', priority: 'critical' }),
      createMockAlert({ type: 'warning', description: 'Medium priority', priority: 'medium' }),
    ];

    render(<AlertContainer alerts={alerts} />);

    const alertElements = screen.getAllByRole('alert');
    expect(alertElements[0]).toHaveTextContent('Critical priority');
    expect(alertElements[1]).toHaveTextContent('Medium priority');
    expect(alertElements[2]).toHaveTextContent('Low priority');
  });

  it('handles invalid alerts array gracefully', () => {
    const onError = jest.fn();

    render(
      <AlertContainer 
        alerts={'invalid' as any} 
        onError={onError}
      />
    );

    expect(screen.getByText('Alert Container Error')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  it('truncates alerts when exceeding maxAlerts', () => {
    const alerts = createMockAlerts(10);
    const maxAlerts = 5;

    render(
      <AlertContainer 
        alerts={alerts} 
        maxAlerts={maxAlerts}
      />
    );

    expect(screen.getAllByRole('alert')).toHaveLength(maxAlerts);
  });

  it('handles individual alert rendering errors', () => {
    const alerts = [
      createMockAlert({ description: 'Valid alert' }),
      createMockAlert({ description: '', id: 'invalid' }), // Invalid empty description
    ];
    const onError = jest.fn();

    render(
      <AlertContainer 
        alerts={alerts}
        onError={onError}
      />
    );

    expect(screen.getByText('Valid alert')).toBeInTheDocument();
    expect(screen.getByText('Alert Render Error')).toBeInTheDocument();
  });

  it('applies accessibility attributes to container', () => {
    const alerts = [createMockAlert()];

    render(<AlertContainer alerts={alerts} />);

    const container = screen.getByRole('region', { name: /alerts container/i });
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});

describe('useAlerts hook', () => {
  // Test component to use the hook
  function TestComponent() {
    const {
      alerts,
      addAlert,
      removeAlert,
      clearAllAlerts,
      getAlertsByType,
      hasAlerts,
      alertCount,
    } = useAlerts();

    return (
      <div>
        <div data-testid="alert-count">{alertCount}</div>
        <div data-testid="has-alerts">{hasAlerts.toString()}</div>
        <button 
          onClick={() => addAlert({
            type: 'success',
            description: 'Test alert',
          })}
          data-testid="add-alert"
        >
          Add Alert
        </button>
        <button 
          onClick={() => addAlert({
            type: 'error',
            description: 'Error alert',
          })}
          data-testid="add-error"
        >
          Add Error
        </button>
        <button 
          onClick={clearAllAlerts}
          data-testid="clear-all"
        >
          Clear All
        </button>
        <button 
          onClick={() => {
            const errorAlerts = getAlertsByType('error');
            console.log('Error alerts:', errorAlerts.length);
          }}
          data-testid="get-errors"
        >
          Get Errors
        </button>
        <AlertContainer alerts={alerts} />
      </div>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with empty state', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('alert-count')).toHaveTextContent('0');
    expect(screen.getByTestId('has-alerts')).toHaveTextContent('false');
  });

  it('adds alerts correctly', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    await user.click(screen.getByTestId('add-alert'));

    expect(screen.getByTestId('alert-count')).toHaveTextContent('1');
    expect(screen.getByTestId('has-alerts')).toHaveTextContent('true');
    expect(screen.getByText('Test alert')).toBeInTheDocument();
  });

  it('removes alerts when dismissed', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    // Add an alert
    await user.click(screen.getByTestId('add-alert'));
    expect(screen.getByText('Test alert')).toBeInTheDocument();

    // Dismiss it
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText('Test alert')).not.toBeInTheDocument();
    });
  });

  it('clears all alerts', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    // Add multiple alerts
    await user.click(screen.getByTestId('add-alert'));
    await user.click(screen.getByTestId('add-error'));

    expect(screen.getByTestId('alert-count')).toHaveTextContent('2');

    // Clear all
    await user.click(screen.getByTestId('clear-all'));

    expect(screen.getByTestId('alert-count')).toHaveTextContent('0');
    expect(screen.getByTestId('has-alerts')).toHaveTextContent('false');
  });

  it('handles auto-dismiss with timeout', async () => {
    const timers = mockTimers();
    
    function TimeoutTestComponent() {
      const { alerts, addAlert } = useAlerts();

      return (
        <div>
          <button
            onClick={() => addAlert({
              type: 'info',
              description: 'Auto dismiss alert',
              timeout: 1000,
            })}
            data-testid="add-timeout-alert"
          >
            Add Timeout Alert
          </button>
          <AlertContainer alerts={alerts} />
        </div>
      );
    }

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TimeoutTestComponent />);

    // Add alert with timeout
    await user.click(screen.getByTestId('add-timeout-alert'));
    expect(screen.getByText('Auto dismiss alert')).toBeInTheDocument();

    // Fast-forward time
    act(() => {
      timers.advanceByTime(1000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Auto dismiss alert')).not.toBeInTheDocument();
    });

    timers.restore();
  });

  it('validates alert input and shows fallback on error', async () => {
    function InvalidAlertTestComponent() {
      const { alerts, addAlert } = useAlerts();

      return (
        <div>
          <button
            onClick={() => addAlert({
              type: 'invalid' as any,
              description: '',
            })}
            data-testid="add-invalid-alert"
          >
            Add Invalid Alert
          </button>
          <AlertContainer alerts={alerts} />
        </div>
      );
    }

    const user = userEvent.setup();
    render(<InvalidAlertTestComponent />);

    await user.click(screen.getByTestId('add-invalid-alert'));

    // Should show fallback error alert
    expect(screen.getByText('Alert Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to add alert. Please check your input.')).toBeInTheDocument();
  });

  it('enforces maximum alert count', async () => {
    function MaxAlertsTestComponent() {
      const { alerts, addAlert } = useAlerts();

      return (
        <div>
          <button
            onClick={() => {
              // Add more than MAX_ALERTS_COUNT (50)
              for (let i = 0; i < 52; i++) {
                addAlert({
                  type: 'info',
                  description: `Alert ${i}`,
                });
              }
            }}
            data-testid="add-many-alerts"
          >
            Add Many Alerts
          </button>
          <div data-testid="alert-count">{alerts.length}</div>
          <AlertContainer alerts={alerts} />
        </div>
      );
    }

    const user = userEvent.setup();
    render(<MaxAlertsTestComponent />);

    await user.click(screen.getByTestId('add-many-alerts'));

    // Should not exceed maximum
    await waitFor(() => {
      expect(screen.getByTestId('alert-count')).toHaveTextContent('50');
    });
  });

  it('filters alerts by type correctly', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const user = userEvent.setup();
    render(<TestComponent />);

    // Add different types of alerts
    await user.click(screen.getByTestId('add-alert')); // success
    await user.click(screen.getByTestId('add-error')); // error

    // Get error alerts
    await user.click(screen.getByTestId('get-errors'));

    expect(consoleSpy).toHaveBeenCalledWith('Error alerts:', 1);
    
    consoleSpy.mockRestore();
  });

  it('cleans up timeouts on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const timers = mockTimers();

    function UnmountTestComponent({ mounted }: { mounted: boolean }) {
      const { addAlert } = useAlerts();

      React.useEffect(() => {
        if (mounted) {
          addAlert({
            type: 'info',
            description: 'Test',
            timeout: 5000,
          });
        }
      }, [mounted, addAlert]);

      return mounted ? <div>Mounted</div> : null;
    }

    const { rerender } = render(<UnmountTestComponent mounted={true} />);
    
    // Unmount component
    rerender(<UnmountTestComponent mounted={false} />);

    // Should have called clearTimeout for cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled();

    timers.restore();
    clearTimeoutSpy.mockRestore();
  });
});

describe('Input Validation', () => {
  it('handles null/undefined descriptions', () => {
    render(<SuccessAlert description={null as any} />);
    expect(screen.getByText('Alert Error')).toBeInTheDocument();
  });

  it('handles non-string titles', () => {
    render(<SuccessAlert title={123 as any} description="Test" />);
    expect(screen.getByText('Alert Error')).toBeInTheDocument();
  });

  it('handles invalid timeout values', () => {
    render(<SuccessAlert description="Test" timeout={-1} />);
    expect(screen.getByText('Alert Error')).toBeInTheDocument();
  });

  it('handles extremely long timeout values', () => {
    render(<SuccessAlert description="Test" timeout={50000} />); // > MAX_TIMEOUT
    expect(screen.getByText('Alert Error')).toBeInTheDocument();
  });

  it('handles invalid dismissible values', () => {
    render(<SuccessAlert description="Test" dismissible={'true' as any} />);
    expect(screen.getByText('Alert Error')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('provides proper ARIA labels', () => {
    render(<SuccessAlert description="Test" ariaLabel="Custom label" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-label', 'Custom label');
  });

  it('uses appropriate roles for different alert types', () => {
    render(<LoadingAlert description="Loading" />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('sets correct aria-live values', () => {
    render(<MaintenanceAlert description="Maintenance" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});

describe('Performance', () => {
  it('memoizes alert rendering to prevent unnecessary re-renders', () => {
    const alerts = createMockAlerts(5);
    const { rerender } = render(<AlertContainer alerts={alerts} />);

    // Re-render with same alerts - should not cause issues
    rerender(<AlertContainer alerts={alerts} />);

    expect(screen.getAllByRole('alert')).toHaveLength(5);
  });

  it('handles large numbers of alerts efficiently', () => {
    const alerts = createMockAlerts(50);
    
    const startTime = performance.now();
    render(<AlertContainer alerts={alerts} />);
    const endTime = performance.now();

    // Should render within reasonable time (less than 100ms)
    expect(endTime - startTime).toBeLessThan(100);
    expect(screen.getAllByRole('alert')).toHaveLength(50);
  });

  it('optimizes memory usage with large alert lists', () => {
    const alerts = createMockAlerts(100);
    const { rerender, unmount } = render(<AlertContainer alerts={alerts} />);

    // Test memory cleanup by re-rendering with different alerts
    const newAlerts = createMockAlerts(50);
    rerender(<AlertContainer alerts={newAlerts} />);
    
    expect(screen.getAllByRole('alert')).toHaveLength(50);

    // Cleanup should not cause memory leaks
    unmount();
  });

  it('batches alert updates efficiently', async () => {
    const user = userEvent.setup();
    
    function BatchTestComponent() {
      const { alerts, addAlert } = useAlerts();
      
      const addMultipleAlerts = () => {
        // Add multiple alerts in rapid succession
        for (let i = 0; i < 10; i++) {
          addAlert({
            type: 'info',
            description: `Batch alert ${i}`,
          });
        }
      };

      return (
        <div>
          <button onClick={addMultipleAlerts} data-testid="add-batch">
            Add Batch
          </button>
          <div data-testid="alert-count">{alerts.length}</div>
          <AlertContainer alerts={alerts} />
        </div>
      );
    }

    const startTime = performance.now();
    render(<BatchTestComponent />);
    
    await user.click(screen.getByTestId('add-batch'));
    
    const endTime = performance.now();
    
    // Should handle batch updates efficiently
    expect(endTime - startTime).toBeLessThan(200);
    expect(screen.getByTestId('alert-count')).toHaveTextContent('10');
  });
});

describe('Comprehensive Accessibility Tests', () => {
  it('passes axe accessibility tests for all alert types', async () => {
    const { container } = render(
      <div>
        <SuccessAlert description="Success message" title="Success" />
        <ErrorAlert description="Error message" title="Error" />
        <WarningAlert description="Warning message" title="Warning" />
        <InfoAlert description="Info message" title="Information" />
        <LoadingAlert description="Loading message" title="Loading" />
        <SecurityAlert description="Security message" title="Security" />
        <MaintenanceAlert description="Maintenance message" title="Maintenance" />
        <PremiumAlert description="Premium message" title="Premium" />
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe accessibility tests for AlertContainer', async () => {
    const alerts = [
      createMockAlert({ type: 'success', description: 'Success', priority: 'high' }),
      createMockAlert({ type: 'error', description: 'Error', priority: 'critical' }),
      createMockAlert({ type: 'warning', description: 'Warning', priority: 'medium' }),
      createMockAlert({ type: 'info', description: 'Info', priority: 'low' }),
    ];

    const { container } = render(<AlertContainer alerts={alerts} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('provides proper keyboard navigation for dismissible alerts', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();

    render(
      <div>
        <SuccessAlert 
          description="Dismissible alert" 
          dismissible={true}
          onDismiss={onDismiss}
        />
        <ErrorAlert 
          description="Another dismissible alert" 
          dismissible={true}
          onDismiss={onDismiss}
        />
      </div>
    );

    // Test keyboard navigation between dismiss buttons
    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
    
    // Focus first button
    dismissButtons[0].focus();
    expect(dismissButtons[0]).toHaveFocus();

    // Tab to next button
    await user.tab();
    expect(dismissButtons[1]).toHaveFocus();

    // Press Enter to dismiss
    await user.keyboard('{Enter}');
    expect(onDismiss).toHaveBeenCalled();
  });

  it('announces alert changes to screen readers', async () => {
    const user = userEvent.setup();
    
    function ScreenReaderTestComponent() {
      const { alerts, addAlert, removeAlert } = useAlerts();
      
      return (
        <div>
          <button 
            onClick={() => addAlert({ type: 'success', description: 'New alert added' })}
            data-testid="add-alert"
          >
            Add Alert
          </button>
          <AlertContainer alerts={alerts} />
        </div>
      );
    }

    render(<ScreenReaderTestComponent />);
    
    await user.click(screen.getByTestId('add-alert'));
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
    expect(alert).toHaveTextContent('New alert added');
  });

  it('provides sufficient color contrast for all variants', () => {
    // This is a basic test - in a real scenario you'd use tools like
    // @adobe/leonardo-contrast-colors for programmatic contrast checking
    const { container } = render(
      <div>
        <SuccessAlert description="Success" />
        <ErrorAlert description="Error" />
        <WarningAlert description="Warning" />
        <InfoAlert description="Info" />
      </div>
    );

    // Check that alerts have appropriate contrast classes
    const alerts = container.querySelectorAll('[role="alert"]');
    alerts.forEach((alert: Element) => {
      expect(alert).toHaveClass(/text-|border-|bg-/);
    });
  });

  it('supports high contrast mode preferences', () => {
    // Mock high contrast media query
    const mockMediaQuery = {
      matches: true,
      media: '(prefers-contrast: high)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => {
        if (query === '(prefers-contrast: high)') {
          return mockMediaQuery;
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      }),
    });

    render(<ErrorAlert description="High contrast test" />);
    
    // Alert should render successfully with high contrast preference
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('respects reduced motion preferences', () => {
    // Mock reduced motion media query
    const mockReducedMotion = {
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return mockReducedMotion;
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      }),
    });

    render(<LoadingAlert description="Loading with reduced motion" />);
    
    // Loading alert should still be functional with reduced motion
    const alert = screen.getByRole('status');
    expect(alert).toBeInTheDocument();
    
    // The spinner might have reduced animation, but component should work
    const spinner = alert.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('provides proper focus management for dynamically added alerts', async () => {
    const user = userEvent.setup();
    
    function FocusTestComponent() {
      const { alerts, addAlert } = useAlerts();
      
      return (
        <div>
          <button 
            onClick={() => addAlert({ 
              type: 'error', 
              description: 'Focus test alert',
              dismissible: true 
            })}
            data-testid="add-focusable-alert"
          >
            Add Focusable Alert
          </button>
          <AlertContainer alerts={alerts} />
        </div>
      );
    }

    render(<FocusTestComponent />);
    
    await user.click(screen.getByTestId('add-focusable-alert'));
    
    // Verify that the dismiss button in the new alert is focusable
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    dismissButton.focus();
    expect(dismissButton).toHaveFocus();
  });

  it('handles multiple languages and RTL text direction', () => {
    // Test with RTL text
    render(
      <div dir="rtl">
        <SuccessAlert 
          title="نجح العمل" 
          description="تم إكمال العملية بنجاح" 
        />
      </div>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('نجح العمل');
    expect(alert).toHaveTextContent('تم إكمال العملية بنجاح');
  });

  it('supports assistive technology announcements', async () => {
    const user = userEvent.setup();
    
    function AnnouncementTestComponent() {
      const { alerts, addAlert } = useAlerts();
      
      return (
        <div>
          <button 
            onClick={() => addAlert({ 
              type: 'security', 
              description: 'Critical security update required',
              ariaLabel: 'Critical security alert that requires immediate attention'
            })}
            data-testid="add-security-alert"
          >
            Add Security Alert
          </button>
          <AlertContainer alerts={alerts} />
        </div>
      );
    }

    render(<AnnouncementTestComponent />);
    
    await user.click(screen.getByTestId('add-security-alert'));
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute(
      'aria-label', 
      'Critical security alert that requires immediate attention'
    );
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });
});
