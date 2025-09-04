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
  public readonly context: Record<string, unknown>;
  public readonly timestamp: number;
  public readonly userMessage: string;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Record<string, unknown> = {},
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
  constructor(message: string, context: Record<string, unknown> = {}, userMessage?: string) {
    super(message, ErrorType.NETWORK, ErrorSeverity.HIGH, context, userMessage);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}, userMessage?: string) {
    super(message, ErrorType.VALIDATION, ErrorSeverity.MEDIUM, context, userMessage);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}, userMessage?: string) {
    super(message, ErrorType.AUTH, ErrorSeverity.HIGH, context, userMessage);
    this.name = 'AuthError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}, userMessage?: string) {
    super(message, ErrorType.STORAGE, ErrorSeverity.MEDIUM, context, userMessage);
    this.name = 'StorageError';
  }
}

export class ClipboardError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}, userMessage?: string) {
    super(message, ErrorType.CLIPBOARD, ErrorSeverity.LOW, context, userMessage);
    this.name = 'ClipboardError';
  }
}

export class MediaError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}, userMessage?: string) {
    super(message, ErrorType.MEDIA, ErrorSeverity.HIGH, context, userMessage);
    this.name = 'MediaError';
  }
}

export class ParserError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}, userMessage?: string) {
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
  handle(error: unknown, context: Record<string, unknown> = {}): AppError {
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
  private normalizeError(error: unknown, context: Record<string, unknown> = {}): AppError {
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
  context: Record<string, unknown> = {}
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
  context: Record<string, unknown> = {}
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
 * Creates a retry function with exponential backoff and user feedback
 */
export function createRetryFunction<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    jitter?: boolean;
    onRetry?: (attempt: number, error: AppError) => void;
    shouldRetry?: (error: AppError) => boolean;
    abortSignal?: AbortSignal;
  } = {}
) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitter = true,
    onRetry,
    shouldRetry,
    abortSignal
  } = options;

  return async (): Promise<T> => {
    let lastError: AppError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Check if operation was aborted
      if (abortSignal?.aborted) {
        throw new AppError(
          'Operation was aborted',
          ErrorType.UNKNOWN,
          ErrorSeverity.LOW,
          { aborted: true },
          'Operation was cancelled'
        );
      }

      try {
        return await fn();
      } catch (error) {
        lastError = ErrorHandler.getInstance().handle(error, {
          attempt,
          maxAttempts,
          function: fn.name || 'anonymous',
          retryable: true
        });

        // Check if we should retry this specific error
        if (shouldRetry && !shouldRetry(lastError)) {
          throw lastError;
        }

        // Don't retry certain error types
        if ([ErrorType.AUTH, ErrorType.VALIDATION].includes(lastError.type)) {
          throw lastError;
        }

        if (attempt === maxAttempts) {
          throw lastError;
        }

        // Call retry callback for user feedback
        onRetry?.(attempt, lastError);

        // Calculate delay with exponential backoff and optional jitter
        let delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
        if (jitter) {
          delay += Math.random() * Math.min(1000, delay * 0.1);
        }

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
  value: unknown,
  validations: Array<{
    condition: (val: unknown) => boolean;
    message: string;
    userMessage?: string;
  }>,
  context: Record<string, unknown> = {}
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
  context: Record<string, unknown> = {}
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    interface NetworkErrorObj {
      code?: string;
      message?: string;
      status?: number;
    }
    const errorObj = error as NetworkErrorObj;
    
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

    if (errorObj.status != null && errorObj.status >= 400 && errorObj.status < 500) {
      throw new ValidationError(
        'Client error',
        { ...context, status: errorObj.status }
      );
    }

    if (errorObj.status != null && errorObj.status >= 500) {
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
    condition: (value: unknown) => value != null && value !== '',
    message,
    userMessage: message
  }),
  
  string: (message: string = 'Must be a string') => ({
    condition: (value: unknown) => typeof value === 'string',
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

// Advanced async error handling utilities

/**
 * Circuit breaker pattern implementation for preventing cascading failures
 */
export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private resetTimeout: number = 60000,
    private monitoringPeriod: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new AppError(
          'Circuit breaker is OPEN',
          ErrorType.NETWORK,
          ErrorSeverity.HIGH,
          { 
            failureCount: this.failureCount,
            nextAttempt: this.nextAttempt
          },
          'Service is temporarily unavailable. Please try again later.'
        );
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.successCount++;
    if (this.state === 'HALF_OPEN') {
      this.failureCount = 0;
      this.state = 'CLOSED';
    }
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.nextAttempt
    };
  }

  reset() {
    this.failureCount = 0;
    this.successCount = 0;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
  }
}

/**
 * Advanced async operation with timeout, cancellation, and progress tracking
 */
export async function executeWithOptions<T>({
  operation,
  timeout = 30000,
  signal,
  onProgress,
  retries = 0,
  context = {}
}: {
  operation: (signal?: AbortSignal) => Promise<T>;
  timeout?: number;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
  retries?: number;
  context?: Record<string, unknown>;
}): Promise<T> {
  // Create combined abort controller
  const combinedController = new AbortController();
  const timeoutId = setTimeout(() => combinedController.abort(), timeout);

  // Listen for external cancellation
  signal?.addEventListener('abort', () => combinedController.abort());

  try {
    // Progress tracking
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      if (progressValue < 90) {
        progressValue += Math.random() * 10;
        onProgress?.(Math.min(progressValue, 90));
      }
    }, 500);

    const result = await operation(combinedController.signal);
    
    clearInterval(progressInterval);
    onProgress?.(100);
    
    return result;
  } catch (error) {
    if (combinedController.signal.aborted) {
      if (signal?.aborted) {
        throw new AppError(
          'Operation cancelled by user',
          ErrorType.UNKNOWN,
          ErrorSeverity.LOW,
          context,
          'Operation was cancelled'
        );
      } else {
        throw new AppError(
          'Operation timed out',
          ErrorType.NETWORK,
          ErrorSeverity.HIGH,
          { ...context, timeout },
          `Operation timed out after ${timeout / 1000} seconds`
        );
      }
    }

    // Retry logic if specified
    if (retries > 0) {
      return executeWithOptions({
        operation,
        timeout,
        signal,
        onProgress,
        retries: retries - 1,
        context: { ...context, attempt: ((context.attempt as number) || 0) + 1 }
      });
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Batch operation handler with error recovery
 */
export async function executeBatch<T, R>({
  items,
  operation,
  batchSize = 5,
  onProgress,
  onError,
  continueOnError = true,
  context = {}
}: {
  items: T[];
  operation: (item: T, index: number) => Promise<R>;
  batchSize?: number;
  onProgress?: (completed: number, total: number, errors: number) => void;
  onError?: (error: AppError, item: T, index: number) => void;
  continueOnError?: boolean;
  context?: Record<string, any>;
}): Promise<{
  results: (R | null)[];
  errors: Array<{ index: number; item: T; error: AppError }>;
  completed: number;
}> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  const errors: Array<{ index: number; item: T; error: AppError }> = [];
  let completed = 0;

  // Process items in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(async (item, batchIndex) => {
      const globalIndex = i + batchIndex;
      
      try {
        const result = await operation(item, globalIndex);
        results[globalIndex] = result;
        completed++;
        onProgress?.(completed, items.length, errors.length);
        return result;
      } catch (error) {
        const appError = ErrorHandler.getInstance().handle(error, {
          ...context,
          batchIndex: globalIndex,
          item
        });
        
        errors.push({ index: globalIndex, item, error: appError });
        onError?.(appError, item, globalIndex);
        
        if (!continueOnError) {
          throw appError;
        }
        
        completed++;
        onProgress?.(completed, items.length, errors.length);
        return null;
      }
    });

    // Wait for batch to complete
    await Promise.all(batchPromises);
  }

  return { results, errors, completed };
}

/**
 * Queue-based operation processor with concurrency control
 */
export class OperationQueue {
  private queue: Array<{
    id: string;
    operation: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: number;
    context: Record<string, any>;
  }> = [];
  private running = 0;
  private stats = {
    processed: 0,
    failed: 0,
    pending: 0
  };

  constructor(
    private maxConcurrency: number = 3,
    private onProgress?: (stats: typeof this.stats) => void
  ) {}

  async add<T>({
    operation,
    priority = 0,
    context = {}
  }: {
    operation: () => Promise<T>;
    priority?: number;
    context?: Record<string, any>;
  }): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.queue.push({
        id,
        operation,
        resolve,
        reject,
        priority,
        context
      });

      // Sort by priority (higher first)
      this.queue.sort((a, b) => b.priority - a.priority);
      
      this.stats.pending = this.queue.length;
      this.onProgress?.(this.stats);
      
      this.processNext();
    });
  }

  private async processNext() {
    if (this.running >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.running++;
    this.stats.pending = this.queue.length;
    
    try {
      const result = await item.operation();
      item.resolve(result);
      this.stats.processed++;
    } catch (error) {
      const appError = ErrorHandler.getInstance().handle(error, {
        ...item.context,
        operationId: item.id
      });
      item.reject(appError);
      this.stats.failed++;
    } finally {
      this.running--;
      this.onProgress?.(this.stats);
      
      // Process next item
      setImmediate(() => this.processNext());
    }
  }

  getStats() {
    return {
      ...this.stats,
      running: this.running,
      pending: this.queue.length
    };
  }

  clear() {
    this.queue.forEach(item => {
      item.reject(new AppError(
        'Queue cleared',
        ErrorType.UNKNOWN,
        ErrorSeverity.LOW,
        {},
        'Operation was cancelled due to queue clearing'
      ));
    });
    this.queue = [];
    this.stats = { processed: 0, failed: 0, pending: 0 };
  }
}

/**
 * Rate-limited operation executor
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private waitingQueue: Array<{
    resolve: () => void;
    reject: (error: AppError) => void;
  }> = [];

  constructor(
    private maxTokens: number = 10,
    private refillRate: number = 1, // tokens per second
    private burstAllowance: number = maxTokens
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquire();
    return operation();
  }

  private async acquire(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.refillTokens();
      
      if (this.tokens > 0) {
        this.tokens--;
        resolve();
      } else {
        this.waitingQueue.push({ resolve, reject });
        
        // Set timeout for queued requests
        setTimeout(() => {
          const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
          if (index !== -1) {
            this.waitingQueue.splice(index, 1);
            reject(new AppError(
              'Rate limit timeout',
              ErrorType.NETWORK,
              ErrorSeverity.HIGH,
              { queueLength: this.waitingQueue.length },
              'Request was rate limited. Please try again later.'
            ));
          }
        }, 30000); // 30 second timeout
      }
    });
  }

  private refillTokens() {
    const now = Date.now();
    const timeSinceRefill = now - this.lastRefill;
    const tokensToAdd = Math.floor((timeSinceRefill / 1000) * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
      
      // Process waiting queue
      while (this.tokens > 0 && this.waitingQueue.length > 0) {
        const item = this.waitingQueue.shift();
        if (item) {
          this.tokens--;
          item.resolve();
        }
      }
    }
  }

  getStats() {
    return {
      tokens: this.tokens,
      maxTokens: this.maxTokens,
      queueLength: this.waitingQueue.length,
      refillRate: this.refillRate
    };
  }
}

// Export instances for common use cases
export const defaultCircuitBreaker = new CircuitBreaker();
export const defaultOperationQueue = new OperationQueue();
export const defaultRateLimiter = new RateLimiter();
