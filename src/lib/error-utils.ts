/**
 * Centralized error handling utilities
 * Provides consistent error management across the application
 */

// Custom error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  STORAGE = 'STORAGE',
  CLIPBOARD = 'CLIPBOARD',
  MEDIA = 'MEDIA',
  PARSER = 'PARSER',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Base error class with additional context
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: Record<string, any>;
  public readonly timestamp: number;
  public readonly userMessage: string;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Record<string, any> = {},
    userMessage?: string,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = Date.now();
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.recoverable = recoverable;
  }

  private getDefaultUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        return 'Network error occurred. Please check your internet connection and try again.';
      case ErrorType.VALIDATION:
        return 'Invalid input provided. Please check your data and try again.';
      case ErrorType.AUTH:
        return 'Authentication error. Please sign in again.';
      case ErrorType.STORAGE:
        return 'Storage error occurred. Please try again.';
      case ErrorType.CLIPBOARD:
        return 'Unable to access clipboard. Please copy manually.';
      case ErrorType.MEDIA:
        return 'Media access error. Please check permissions and try again.';
      case ErrorType.PARSER:
        return 'Unable to process the provided data.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      userMessage: this.userMessage,
      recoverable: this.recoverable,
      stack: this.stack
    };
  }
}

// Specific error classes
export class NetworkError extends AppError {
  constructor(message: string, context: Record<string, any> = {}, userMessage?: string) {
    super(message, ErrorType.NETWORK, ErrorSeverity.HIGH, context, userMessage);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context: Record<string, any> = {}, userMessage?: string) {
    super(message, ErrorType.VALIDATION, ErrorSeverity.MEDIUM, context, userMessage);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, context: Record<string, any> = {}, userMessage?: string) {
    super(message, ErrorType.AUTH, ErrorSeverity.HIGH, context, userMessage);
    this.name = 'AuthError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, context: Record<string, any> = {}, userMessage?: string) {
    super(message, ErrorType.STORAGE, ErrorSeverity.MEDIUM, context, userMessage);
    this.name = 'StorageError';
  }
}

export class ClipboardError extends AppError {
  constructor(message: string, context: Record<string, any> = {}, userMessage?: string) {
    super(message, ErrorType.CLIPBOARD, ErrorSeverity.LOW, context, userMessage);
    this.name = 'ClipboardError';
  }
}

export class MediaError extends AppError {
  constructor(message: string, context: Record<string, any> = {}, userMessage?: string) {
    super(message, ErrorType.MEDIA, ErrorSeverity.HIGH, context, userMessage);
    this.name = 'MediaError';
  }
}

export class ParserError extends AppError {
  constructor(message: string, context: Record<string, any> = {}, userMessage?: string) {
    super(message, ErrorType.PARSER, ErrorSeverity.MEDIUM, context, userMessage);
    this.name = 'ParserError';
  }
}

// Error handling utilities
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize: number = 100;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handles an error with logging and optional recovery
   */
  handle(error: unknown, context: Record<string, any> = {}): AppError {
    const appError = this.normalizeError(error, context);
    this.logError(appError);
    
    // Report to external services in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(appError);
    }

    return appError;
  }

  /**
   * Converts any error to AppError
   */
  private normalizeError(error: unknown, context: Record<string, any> = {}): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(error.message, ErrorType.UNKNOWN, ErrorSeverity.MEDIUM, {
        ...context,
        originalError: error.name,
        stack: error.stack
      });
    }

    if (typeof error === 'string') {
      return new AppError(error, ErrorType.UNKNOWN, ErrorSeverity.MEDIUM, context);
    }

    return new AppError(
      'Unknown error occurred',
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { ...context, originalError: error }
    );
  }

  /**
   * Logs error to internal log
   */
  private logError(error: AppError): void {
    this.errorLog.unshift(error);
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${error.type}] ${error.message}`, error.context);
    }
  }

  /**
   * Reports error to external services
   */
  private reportError(error: AppError): void {
    // Implement reporting to services like Sentry, LogRocket, etc.
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: error.severity === ErrorSeverity.CRITICAL,
          error_type: error.type
        });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Gets recent errors
   */
  getRecentErrors(count: number = 10): AppError[] {
    return this.errorLog.slice(0, count);
  }

  /**
   * Gets errors by type
   */
  getErrorsByType(type: ErrorType): AppError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  /**
   * Clears error log
   */
  clearLog(): void {
    this.errorLog = [];
  }
}

// Utility functions for common error scenarios

/**
 * Safely executes an async function with error handling
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
  context: Record<string, any> = {}
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const appError = ErrorHandler.getInstance().handle(error, {
      ...context,
      function: fn.name || 'anonymous'
    });
    return { data: fallback || null, error: appError };
  }
}

/**
 * Safely executes a sync function with error handling
 */
export function safeSync<T>(
  fn: () => T,
  fallback?: T,
  context: Record<string, any> = {}
): { data: T | null; error: AppError | null } {
  try {
    const data = fn();
    return { data, error: null };
  } catch (error) {
    const appError = ErrorHandler.getInstance().handle(error, {
      ...context,
      function: fn.name || 'anonymous'
    });
    return { data: fallback || null, error: appError };
  }
}

/**
 * Creates a retry function with exponential backoff
 */
export function createRetryFunction<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
) {
  return async (): Promise<T> => {
    let lastError: AppError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = ErrorHandler.getInstance().handle(error, {
          attempt,
          maxAttempts,
          function: fn.name || 'anonymous'
        });

        if (attempt === maxAttempts) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  };
}

/**
 * Validates input and throws ValidationError if invalid
 */
export function validateInput(
  value: any,
  validations: Array<{
    condition: (val: any) => boolean;
    message: string;
    userMessage?: string;
  }>,
  context: Record<string, any> = {}
): void {
  for (const validation of validations) {
    if (!validation.condition(value)) {
      throw new ValidationError(validation.message, context, validation.userMessage);
    }
  }
}

/**
 * Handles network requests with proper error categorization
 */
export async function handleNetworkRequest<T>(
  request: () => Promise<T>,
  context: Record<string, any> = {}
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    const errorObj = error as any;
    
    // Network-specific error handling
    if (!navigator.onLine) {
      throw new NetworkError(
        'No internet connection',
        { ...context, online: false },
        'You appear to be offline. Please check your internet connection.'
      );
    }

    if (errorObj.code === 'NETWORK_ERROR' || errorObj.message?.includes('fetch')) {
      throw new NetworkError(
        'Network request failed',
        { ...context, originalError: errorObj.message }
      );
    }

    if (errorObj.status >= 400 && errorObj.status < 500) {
      throw new ValidationError(
        'Client error',
        { ...context, status: errorObj.status }
      );
    }

    if (errorObj.status >= 500) {
      throw new NetworkError(
        'Server error',
        { ...context, status: errorObj.status },
        'Server is currently unavailable. Please try again later.'
      );
    }

    throw ErrorHandler.getInstance().handle(error, context);
  }
}

/**
 * Safely accesses localStorage with error handling
 */
export function safeLocalStorage() {
  return {
    getItem: (key: string): string | null => {
      const { data, error } = safeSync(
        () => localStorage.getItem(key),
        null,
        { operation: 'getItem', key }
      );
      
      if (error) {
        console.warn(`Failed to get item from localStorage: ${key}`, error);
      }
      
      return data;
    },

    setItem: (key: string, value: string): boolean => {
      const { error } = safeSync(
        () => localStorage.setItem(key, value),
        undefined,
        { operation: 'setItem', key, valueLength: value.length }
      );
      
      if (error) {
        console.warn(`Failed to set item in localStorage: ${key}`, error);
        return false;
      }
      
      return true;
    },

    removeItem: (key: string): boolean => {
      const { error } = safeSync(
        () => localStorage.removeItem(key),
        undefined,
        { operation: 'removeItem', key }
      );
      
      if (error) {
        console.warn(`Failed to remove item from localStorage: ${key}`, error);
        return false;
      }
      
      return true;
    }
  };
}

/**
 * Safely accesses clipboard with error handling
 */
export function safeClipboard() {
  return {
    writeText: async (text: string): Promise<boolean> => {
      const { error } = await safeAsync(
        async () => {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
          }
        },
        undefined,
        { operation: 'writeText', textLength: text.length }
      );

      if (error) {
        console.warn('Failed to write to clipboard:', error);
        return false;
      }

      return true;
    },

    readText: async (): Promise<string | null> => {
      const { data, error } = await safeAsync(
        async () => {
          if (navigator.clipboard && navigator.clipboard.readText) {
            return await navigator.clipboard.readText();
          }
          return null;
        },
        null,
        { operation: 'readText' }
      );

      if (error) {
        console.warn('Failed to read from clipboard:', error);
      }

      return data;
    }
  };
}

// Export error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Export common validations
export const commonValidations = {
  required: (message: string = 'This field is required') => ({
    condition: (value: any) => value != null && value !== '',
    message,
    userMessage: message
  }),
  
  string: (message: string = 'Must be a string') => ({
    condition: (value: any) => typeof value === 'string',
    message,
    userMessage: message
  }),
  
  minLength: (min: number, message?: string) => ({
    condition: (value: string) => typeof value === 'string' && value.length >= min,
    message: message || `Must be at least ${min} characters`,
    userMessage: message || `Must be at least ${min} characters`
  }),
  
  maxLength: (max: number, message?: string) => ({
    condition: (value: string) => typeof value === 'string' && value.length <= max,
    message: message || `Must be no more than ${max} characters`,
    userMessage: message || `Must be no more than ${max} characters`
  }),
  
  email: (message: string = 'Must be a valid email address') => ({
    condition: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof value === 'string' && emailRegex.test(value);
    },
    message,
    userMessage: message
  }),
  
  url: (message: string = 'Must be a valid URL') => ({
    condition: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
    userMessage: message
  })
};
