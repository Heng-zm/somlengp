'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { ValidationError, commonValidations, errorHandler, AppError } from '@/lib/error-utils';
import { useAccessibility } from '@/lib/accessibility-manager';
import { toast } from '@/hooks/use-toast';

// Types
export interface ValidationRule {
  validate: (value: any, formData?: any) => boolean | Promise<boolean>;
  message: string;
  userMessage?: string;
  severity: 'error' | 'warning' | 'info';
  async?: boolean;
  debounceMs?: number;
}

export interface FieldValidationConfig {
  rules: ValidationRule[];
  required?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  accessibleErrorId?: string;
  liveRegion?: 'polite' | 'assertive';
}

export interface FormValidationConfig {
  validateOnSubmit?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  stopOnFirstError?: boolean;
  focusFirstError?: boolean;
  announceErrors?: boolean;
  showErrorCount?: boolean;
  enableAccessibility?: boolean;
}

export interface FormValidationError {
  field: string;
  message: string;
  userMessage: string;
  severity: 'error' | 'warning' | 'info';
  value?: any;
  timestamp: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormValidationError[];
  warnings: FormValidationError[];
  fieldErrors: Record<string, FormValidationError[]>;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    fieldsWithErrors: string[];
  };
}

export interface AccessibilityValidationFeatures {
  errorAnnouncement: boolean;
  focusManagement: boolean;
  liveRegions: boolean;
  keyboardShortcuts: boolean;
  progressiveEnhancement: boolean;
}

const DEFAULT_FORM_CONFIG: Required<FormValidationConfig> = {
  validateOnSubmit: true,
  validateOnChange: false,
  validateOnBlur: true,
  stopOnFirstError: false,
  focusFirstError: true,
  announceErrors: true,
  showErrorCount: true,
  enableAccessibility: true
};

// Built-in validation rules with accessibility considerations
export const accessibleValidationRules = {
  required: (customMessage?: string): ValidationRule => ({
    validate: (value) => value != null && value !== '' && String(value).trim() !== '',
    message: customMessage || 'This field is required',
    userMessage: customMessage || 'Please fill out this field',
    severity: 'error' as const
  }),

  minLength: (min: number, customMessage?: string): ValidationRule => ({
    validate: (value) => typeof value === 'string' && value.length >= min,
    message: customMessage || `Must be at least ${min} characters`,
    userMessage: customMessage || `Please enter at least ${min} characters`,
    severity: 'error' as const
  }),

  maxLength: (max: number, customMessage?: string): ValidationRule => ({
    validate: (value) => typeof value === 'string' && value.length <= max,
    message: customMessage || `Must be no more than ${max} characters`,
    userMessage: customMessage || `Please enter no more than ${max} characters`,
    severity: 'error' as const
  }),

  email: (customMessage?: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true; // Let required rule handle empty values
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof value === 'string' && emailRegex.test(value.trim());
    },
    message: customMessage || 'Must be a valid email address',
    userMessage: customMessage || 'Please enter a valid email address (example: user@domain.com)',
    severity: 'error' as const
  })
};

// Validation Engine
export class FormValidator {
  private fieldConfigs: Map<string, FieldValidationConfig> = new Map();
  private config: Required<FormValidationConfig>;

  constructor(config: Partial<FormValidationConfig> = {}) {
    this.config = { ...DEFAULT_FORM_CONFIG, ...config };
  }

  // Configure field validation
  configureField(fieldName: string, config: FieldValidationConfig): void {
    this.fieldConfigs.set(fieldName, {
      ...config,
      validateOnChange: config.validateOnChange ?? this.config.validateOnChange,
      validateOnBlur: config.validateOnBlur ?? this.config.validateOnBlur
    });
  }

  // Validate single field
  async validateField(
    fieldName: string,
    value: any,
    formData?: Record<string, any>,
    options: { trigger?: 'change' | 'blur' | 'submit'; signal?: AbortSignal } = {}
  ): Promise<FormValidationError[]> {
    const config = this.fieldConfigs.get(fieldName);
    if (!config) return [];

    const { trigger = 'submit' } = options;
    const errors: FormValidationError[] = [];

    // Check if validation should run for this trigger
    const shouldValidate = 
      trigger === 'submit' ||
      (trigger === 'change' && config.validateOnChange) ||
      (trigger === 'blur' && config.validateOnBlur);

    if (!shouldValidate) return [];

    for (const rule of config.rules) {
      try {
        const isValid = rule.async 
          ? await Promise.resolve(rule.validate(value, formData))
          : rule.validate(value, formData);

        if (!isValid) {
          const error: FormValidationError = {
            field: fieldName,
            message: rule.message,
            userMessage: rule.userMessage || rule.message,
            severity: rule.severity,
            value,
            timestamp: Date.now()
          };

          errors.push(error);

          // Stop on first error if configured
          if (this.config.stopOnFirstError) {
            break;
          }
        }
      } catch (validationError) {
        const appError = errorHandler.handle(validationError, {
          field: fieldName,
          rule: rule.message,
          value
        });

        errors.push({
          field: fieldName,
          message: appError.message,
          userMessage: appError.userMessage,
          severity: 'error',
          value,
          timestamp: Date.now()
        });
      }
    }

    return errors;
  }

  // Validate entire form
  async validateForm(
    formData: Record<string, any>,
    options: { signal?: AbortSignal } = {}
  ): Promise<ValidationResult> {
    const allErrors: FormValidationError[] = [];
    const fieldErrors: Record<string, FormValidationError[]> = {};

    // Validate each configured field
    for (const [fieldName] of this.fieldConfigs.entries()) {
      const fieldValue = formData[fieldName];
      const errors = await this.validateField(
        fieldName,
        fieldValue,
        formData,
        { trigger: 'submit', signal: options.signal }
      );
      
      if (errors.length > 0) {
        fieldErrors[fieldName] = errors;
        allErrors.push(...errors);
      }
    }

    const errors = allErrors.filter(e => e.severity === 'error');
    const warnings = allErrors.filter(e => e.severity === 'warning');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fieldErrors,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        fieldsWithErrors: Object.keys(fieldErrors)
      }
    };
  }

  // Get validation config for a field
  getFieldConfig(fieldName: string): FieldValidationConfig | undefined {
    return this.fieldConfigs.get(fieldName);
  }
}

// React Hook for Form Validation with Accessibility
export function useFormValidation(
  config: Partial<FormValidationConfig> = {}
) {
  const validator = useRef(new FormValidator(config));
  const [fieldErrors, setFieldErrors] = useState<Record<string, FormValidationError[]>>({});
  const [isValidating, setIsValidating] = useState(false);
  const { announce } = useAccessibility();
  const finalConfig = { ...DEFAULT_FORM_CONFIG, ...config };

  // Configure field validation
  const configureField = useCallback((fieldName: string, config: FieldValidationConfig) => {
    validator.current.configureField(fieldName, config);
  }, []);

  // Validate single field with accessibility
  const validateField = useCallback(async (
    fieldName: string,
    value: any,
    formData?: Record<string, any>,
    trigger: 'change' | 'blur' | 'submit' = 'submit'
  ): Promise<FormValidationError[]> => {
    try {
      setIsValidating(true);
      const errors = await validator.current.validateField(
        fieldName,
        value,
        formData,
        { trigger }
      );

      // Update field errors state
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: errors
      }));

      // Accessibility: Announce field-specific errors
      if (errors.length > 0) {
        const errorMessages = errors.map(e => e.userMessage).join('. ');
        announce(`${fieldName} field errors: ${errorMessages}`, 'assertive');
      }

      return errors;
    } catch (error) {
      const appError = errorHandler.handle(error, {
        field: fieldName,
        trigger,
        value
      });

      const validationError: FormValidationError = {
        field: fieldName,
        message: appError.message,
        userMessage: appError.userMessage,
        severity: 'error',
        value,
        timestamp: Date.now()
      };

      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: [validationError]
      }));

      return [validationError];
    } finally {
      setIsValidating(false);
    }
  }, [announce]);

  // Validate entire form with accessibility
  const validateForm = useCallback(async (
    formData: Record<string, any>
  ): Promise<ValidationResult> => {
    try {
      setIsValidating(true);

      const result = await validator.current.validateForm(formData);
      
      // Update all field errors
      setFieldErrors(result.fieldErrors);

      // Accessibility: Announce validation results
      if (finalConfig.announceErrors) {
        if (result.isValid) {
          announce('Form validation passed successfully', 'polite');
        } else {
          const errorSummary = finalConfig.showErrorCount
            ? `Form validation failed with ${result.summary.totalErrors} error${result.summary.totalErrors !== 1 ? 's' : ''}`
            : 'Form validation failed';
          
          announce(errorSummary, 'assertive');
        }
      }

      return result;
    } catch (error) {
      const appError = errorHandler.handle(error, {
        operation: 'formValidation',
        formData
      });

      // Return error result
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          field: 'form',
          message: appError.message,
          userMessage: appError.userMessage,
          severity: 'error',
          timestamp: Date.now()
        }],
        warnings: [],
        fieldErrors: {},
        summary: {
          totalErrors: 1,
          totalWarnings: 0,
          fieldsWithErrors: []
        }
      };

      announce(`Form validation error: ${appError.userMessage}`, 'assertive');

      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, [announce, finalConfig]);

  // Clear field errors
  const clearFieldErrors = useCallback((fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    announce('All form errors cleared', 'polite');
  }, [announce]);

  // Get field error messages for accessibility
  const getFieldErrorMessage = useCallback((fieldName: string): string => {
    const errors = fieldErrors[fieldName];
    if (!errors || errors.length === 0) return '';
    
    return errors.map(e => e.userMessage).join('. ');
  }, [fieldErrors]);

  // Check if field has errors
  const hasFieldError = useCallback((fieldName: string): boolean => {
    return !!(fieldErrors[fieldName]?.length);
  }, [fieldErrors]);

  return {
    configureField,
    validateField,
    validateForm,
    clearFieldErrors,
    clearAllErrors,
    getFieldErrorMessage,
    hasFieldError,
    fieldErrors,
    isValidating
  };
}

