"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  dismissible?: boolean;
  onDismiss?: (id: string) => void;
}

export interface ToastNotificationContextType {
  showToast: (toast: Omit<ToastProps, 'id'>) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const ToastNotificationContext = React.createContext<ToastNotificationContextType | null>(null);

export const useToast = () => {
  const context = React.useContext(ToastNotificationContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  type = 'info',
  duration = 5000,
  dismissible = true,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss?.(id);
    }, 300); // Match animation duration
  }, [id, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "relative flex items-start gap-3 p-4 rounded-lg shadow-lg border transition-all duration-300 ease-in-out max-w-md";
    
    if (isLeaving) {
      return cn(baseStyles, "transform translate-x-full opacity-0");
    }
    
    if (isVisible) {
      return cn(baseStyles, "transform translate-x-0 opacity-100");
    }
    
    return cn(baseStyles, "transform translate-x-full opacity-0");
  };

  const getColorScheme = () => {
    switch (type) {
      case 'success':
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case 'error':
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case 'warning':
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    }
  };

  return (
    <div className={cn(getStyles(), getColorScheme())}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      <div className="flex-grow min-w-0">
        {title && (
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {title}
          </p>
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
          {message}
        </p>
      </div>
      
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      )}
    </div>
  );
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastProps = {
      ...toast,
      id,
      onDismiss: (toastId) => dismissToast(toastId)
    };

    setToasts(prev => {
      const updated = [newToast, ...prev.slice(0, maxToasts - 1)];
      return updated;
    });

    return id;
  }, [maxToasts]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastNotificationContextType = {
    showToast,
    dismissToast,
    dismissAll
  };

  return (
    <ToastNotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastNotificationContext.Provider>
  );
};

// Helper functions for common toast types
export const showSuccessToast = (message: string, title?: string) => {
  // This will be used inside components with useToast hook
  return { message, title, type: 'success' as const };
};

export const showErrorToast = (message: string, title?: string) => {
  return { message, title, type: 'error' as const };
};

export const showWarningToast = (message: string, title?: string) => {
  return { message, title, type: 'warning' as const };
};

export const showInfoToast = (message: string, title?: string) => {
  return { message, title, type: 'info' as const };
};
