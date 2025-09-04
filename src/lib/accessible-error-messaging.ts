'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppError, ErrorType, ErrorSeverity, errorHandler } from '@/lib/error-utils';
import { useAccessibility } from '@/lib/accessibility-manager';
import { toast } from '@/hooks/use-toast';

// Types
export interface ErrorMessage {
  id: string;
  error: AppError;
  userMessage: string;
  title: string;
  description: string;
  actions: ErrorAction[];
  timestamp: number;
  context: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  persistent: boolean;
  dismissible: boolean;
  autoHide?: number; // milliseconds
  category: ErrorCategory;
}

export interface ErrorAction {
  id: string;
  label: string;
  description: string;
  handler: () => void | Promise<void>;
  primary?: boolean;
  destructive?: boolean;
  keyboardShortcut?: string;
  icon?: React.ComponentType<any>;
}

export interface ErrorMessagingConfig {
  enableKeyboardShortcuts: boolean;
  enableScreenReaderSupport: boolean;
  enableFocusManagement: boolean;
  enableToastIntegration: boolean;
  enableErrorHistory: boolean;
  maxHistorySize: number;
  defaultAutoHide: number;
  enableErrorGrouping: boolean;
  enableProgressiveDisclosure: boolean;
}

export type ErrorCategory = 
  | 'validation'
  | 'network'
  | 'auth'
  | 'permission'
  | 'storage'
  | 'media'
  | 'system'
  | 'user';

export interface ErrorContext {
  component?: string;
  feature?: string;
  action?: string;
  user?: string;
  session?: string;
}

export interface ErrorMessageTemplate {
  title: string;
  description: string;
  actions: Omit<ErrorAction, 'id' | 'handler'>[];
  category: ErrorCategory;
  priority: ErrorMessage['priority'];
  persistent: boolean;
  dismissible: boolean;
  autoHide?: number;
}

const DEFAULT_CONFIG: ErrorMessagingConfig = {
  enableKeyboardShortcuts: true,
  enableScreenReaderSupport: true,
  enableFocusManagement: true,
  enableToastIntegration: true,
  enableErrorHistory: true,
  maxHistorySize: 50,
  defaultAutoHide: 5000,
  enableErrorGrouping: true,
  enableProgressiveDisclosure: true
};

// Error message templates by type
const ERROR_TEMPLATES: Record<ErrorType, ErrorMessageTemplate> = {
  [ErrorType.NETWORK]: {
    title: 'Connection Problem',
    description: 'Unable to connect to our servers. Please check your internet connection and try again.',
    actions: [
      {
        label: 'Retry',
        description: 'Attempt the operation again',
        primary: true,
        keyboardShortcut: 'r'
      },
      {
        label: 'Go Offline',
        description: 'Continue working in offline mode',
        keyboardShortcut: 'o'
      }
    ],
    category: 'network',
    priority: 'high',
    persistent: false,
    dismissible: true,
    autoHide: 8000
  },
  
  [ErrorType.AUTH]: {
    title: 'Authentication Required',
    description: 'Your session has expired or you need to sign in to continue.',
    actions: [
      {
        label: 'Sign In',
        description: 'Sign in to your account',
        primary: true,
        keyboardShortcut: 's'
      },
      {
        label: 'Continue as Guest',
        description: 'Continue with limited functionality',
        keyboardShortcut: 'g'
      }
    ],
    category: 'auth',
    priority: 'high',
    persistent: true,
    dismissible: false
  },
  
  [ErrorType.VALIDATION]: {
    title: 'Invalid Information',
    description: 'Some of the information you provided is invalid or incomplete.',
    actions: [
      {
        label: 'Review Form',
        description: 'Go back and review your input',
        primary: true,
        keyboardShortcut: 'r'
      },
      {
        label: 'Clear Form',
        description: 'Start over with a blank form',
        destructive: true,
        keyboardShortcut: 'c'
      }
    ],
    category: 'validation',
    priority: 'medium',
    persistent: true,
    dismissible: true
  },
  
  [ErrorType.STORAGE]: {
    title: 'Storage Issue',
    description: 'Unable to save your information. Your changes may be lost.',
    actions: [
      {
        label: 'Try Again',
        description: 'Attempt to save again',
        primary: true,
        keyboardShortcut: 't'
      },
      {
        label: 'Download Data',
        description: 'Download your data as a backup',
        keyboardShortcut: 'd'
      }
    ],
    category: 'storage',
    priority: 'high',
    persistent: true,
    dismissible: true
  },
  
  [ErrorType.MEDIA]: {
    title: 'Media Access Error',
    description: 'Unable to access your camera or microphone. Please check your permissions.',
    actions: [
      {
        label: 'Check Permissions',
        description: 'Review and update browser permissions',
        primary: true,
        keyboardShortcut: 'p'
      },
      {
        label: 'Use Alternative',
        description: 'Try a different method',
        keyboardShortcut: 'a'
      }
    ],
    category: 'media',
    priority: 'medium',
    persistent: false,
    dismissible: true,
    autoHide: 10000
  },
  
  [ErrorType.CLIPBOARD]: {
    title: 'Clipboard Access',
    description: 'Unable to access clipboard. You can copy manually.',
    actions: [
      {
        label: 'Copy Manually',
        description: 'Select and copy the text manually',
        primary: true,
        keyboardShortcut: 'm'
      }
    ],
    category: 'system',
    priority: 'low',
    persistent: false,
    dismissible: true,
    autoHide: 5000
  },
  
  [ErrorType.PARSER]: {
    title: 'Data Processing Error',
    description: 'Unable to process the provided information.',
    actions: [
      {
        label: 'Try Different Format',
        description: 'Try using a different data format',
        primary: true,
        keyboardShortcut: 'f'
      },
      {
        label: 'Get Help',
        description: 'View supported formats and examples',
        keyboardShortcut: 'h'
      }
    ],
    category: 'user',
    priority: 'medium',
    persistent: false,
    dismissible: true
  },
  
  [ErrorType.UNKNOWN]: {
    title: 'Unexpected Error',
    description: 'Something unexpected happened. Our team has been notified.',
    actions: [
      {
        label: 'Reload Page',
        description: 'Reload the page to start fresh',
        primary: true,
        keyboardShortcut: 'r'
      },
      {
        label: 'Report Details',
        description: 'Send additional details to help us fix this',
        keyboardShortcut: 'd'
      }
    ],
    category: 'system',
    priority: 'high',
    persistent: true,
    dismissible: true
  }
};

// React hook for accessible error messaging
export function useAccessibleErrorMessaging(
  config: Partial<ErrorMessagingConfig> = {}
) {
  const [currentErrors, setCurrentErrors] = useState<ErrorMessage[]>([]);
  const [errorHistory, setErrorHistory] = useState<ErrorMessage[]>([]);

  const showError = useCallback((
    error: AppError | unknown,
    context: ErrorContext = {},
    template?: Partial<ErrorMessageTemplate>
  ) => {
    const appError = error instanceof AppError ? error : errorHandler.handle(error);
    const messageId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorTemplate = template 
      ? { ...ERROR_TEMPLATES[appError.type], ...template }
      : ERROR_TEMPLATES[appError.type] || ERROR_TEMPLATES[ErrorType.UNKNOWN];

    const errorMessage: ErrorMessage = {
      id: messageId,
      error: appError,
      userMessage: appError.userMessage,
      title: errorTemplate.title,
      description: errorTemplate.description,
      actions: [], // Simplified for now
      timestamp: Date.now(),
      context,
      priority: errorTemplate.priority,
      persistent: errorTemplate.persistent,
      dismissible: errorTemplate.dismissible,
      autoHide: errorTemplate.autoHide,
      category: errorTemplate.category
    };

    setCurrentErrors(prev => [errorMessage, ...prev]);
    setErrorHistory(prev => [errorMessage, ...prev.slice(0, 49)]);
    
    return messageId;
  }, []);

  const dismissError = useCallback((messageId: string) => {
    setCurrentErrors(prev => prev.filter(error => error.id !== messageId));
    return true;
  }, []);

  const clearAllErrors = useCallback(() => {
    const count = currentErrors.length;
    setCurrentErrors([]);
    return count;
  }, [currentErrors.length]);

  const showValidationErrors = useCallback((
    validationErrors: Record<string, string[]>,
    formContext?: ErrorContext
  ) => {
    const errorCount = Object.values(validationErrors).flat().length;
    if (errorCount === 0) return null;

    const validationError = new AppError(
      `Form validation failed with ${errorCount} errors`,
      ErrorType.VALIDATION,
      ErrorSeverity.MEDIUM,
      { validationErrors, formContext },
      `Please fix ${errorCount} field error${errorCount !== 1 ? 's' : ''} and try again`
    );

    return showError(validationError, formContext);
  }, [showError]);

  const showNetworkError = useCallback((
    operation: string,
    retryFunction?: () => void | Promise<void>,
    context?: ErrorContext
  ) => {
    const networkError = new AppError(
      `Network error during ${operation}`,
      ErrorType.NETWORK,
      ErrorSeverity.HIGH,
      { operation },
      `Unable to ${operation}. Please check your connection and try again.`
    );

    return showError(networkError, context);
  }, [showError]);

  const showPermissionError = useCallback((
    permission: string,
    context?: ErrorContext
  ) => {
    const permissionError = new AppError(
      `Permission denied: ${permission}`,
      ErrorType.MEDIA,
      ErrorSeverity.HIGH,
      { permission },
      `Permission to access ${permission} was denied. Please check your browser settings.`
    );

    return showError(permissionError, context);
  }, [showError]);

  return {
    showError,
    dismissError,
    clearAllErrors,
    showValidationErrors,
    showNetworkError,
    showPermissionError,
    currentErrors,
    errorHistory,
    hasErrors: currentErrors.length > 0
  };
}

// Utility hook for form integration
export function useFormErrorMessaging() {
  const { showValidationErrors, clearAllErrors } = useAccessibleErrorMessaging();
  
  const showFormErrors = useCallback((
    fieldErrors: Record<string, string[]>
  ) => {
    return showValidationErrors(fieldErrors, {
      component: 'form',
      action: 'validation'
    });
  }, [showValidationErrors]);

  const clearFormErrors = useCallback(() => {
    return clearAllErrors();
  }, [clearAllErrors]);

  return {
    showFormErrors,
    clearFormErrors
  };
}

// Export types and utilities
export {
  ERROR_TEMPLATES
};
