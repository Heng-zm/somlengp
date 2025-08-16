"use client";

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X,
  Loader2,
  Clock,
  Shield,
  Zap
} from 'lucide-react';

// Quick Alert Components for Common Scenarios

export function SuccessAlert({ 
  title, 
  description, 
  dismissible = false,
  onDismiss,
  className 
}: {
  title?: string;
  description: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Alert 
      variant="success" 
      dismissible={dismissible} 
      onDismiss={onDismiss}
      className={className}
    >
      <CheckCircle2 className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export function ErrorAlert({ 
  title = "Error", 
  description, 
  dismissible = true,
  onDismiss,
  className 
}: {
  title?: string;
  description: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Alert 
      variant="destructive" 
      dismissible={dismissible} 
      onDismiss={onDismiss}
      className={className}
    >
      <X className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export function WarningAlert({ 
  title = "Warning", 
  description, 
  dismissible = true,
  onDismiss,
  className 
}: {
  title?: string;
  description: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Alert 
      variant="warning" 
      dismissible={dismissible} 
      onDismiss={onDismiss}
      className={className}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export function InfoAlert({ 
  title = "Information", 
  description, 
  dismissible = true,
  onDismiss,
  className 
}: {
  title?: string;
  description: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Alert 
      variant="info" 
      dismissible={dismissible} 
      onDismiss={onDismiss}
      className={className}
    >
      <Info className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export function LoadingAlert({ 
  title = "Loading", 
  description, 
  className 
}: {
  title?: string;
  description: string;
  className?: string;
}) {
  return (
    <Alert variant="info" className={className}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export function SecurityAlert({ 
  title = "Security Notice", 
  description, 
  dismissible = false,
  onDismiss,
  className 
}: {
  title?: string;
  description: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Alert 
      variant="warning" 
      dismissible={dismissible} 
      onDismiss={onDismiss}
      className={className}
    >
      <Shield className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export function MaintenanceAlert({ 
  title = "Maintenance Notice", 
  description, 
  dismissible = false,
  onDismiss,
  className 
}: {
  title?: string;
  description: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Alert 
      variant="warning" 
      dismissible={dismissible} 
      onDismiss={onDismiss}
      className={`border-l-4 border-l-amber-500 ${className}`}
    >
      <Clock className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export function PremiumAlert({ 
  title = "Premium Feature", 
  description, 
  dismissible = true,
  onDismiss,
  className 
}: {
  title?: string;
  description: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Alert 
      variant="glass" 
      dismissible={dismissible} 
      onDismiss={onDismiss}
      className={`bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-700/30 ${className}`}
    >
      <Zap className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">{title}</AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">{description}</AlertDescription>
    </Alert>
  );
}

// Alert Container Component for managing multiple alerts
export function AlertContainer({ 
  alerts, 
  className 
}: {
  alerts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'security' | 'maintenance' | 'premium';
    title?: string;
    description: string;
    dismissible?: boolean;
    onDismiss?: () => void;
  }>;
  className?: string;
}) {
  const renderAlert = (alert: typeof alerts[0]) => {
    const baseProps = {
      key: alert.id,
      title: alert.title,
      description: alert.description,
      dismissible: alert.dismissible,
      onDismiss: alert.onDismiss,
    };

    switch (alert.type) {
      case 'success':
        return <SuccessAlert {...baseProps} />;
      case 'error':
        return <ErrorAlert {...baseProps} />;
      case 'warning':
        return <WarningAlert {...baseProps} />;
      case 'info':
        return <InfoAlert {...baseProps} />;
      case 'loading':
        return <LoadingAlert {...baseProps} />;
      case 'security':
        return <SecurityAlert {...baseProps} />;
      case 'maintenance':
        return <MaintenanceAlert {...baseProps} />;
      case 'premium':
        return <PremiumAlert {...baseProps} />;
      default:
        return <InfoAlert {...baseProps} />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {alerts.map(renderAlert)}
    </div>
  );
}

// Hook for managing alert state
export function useAlerts() {
  const [alerts, setAlerts] = React.useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'security' | 'maintenance' | 'premium';
    title?: string;
    description: string;
    dismissible?: boolean;
    timeout?: number;
  }>>([]);

  const removeAlert = React.useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const addAlert = React.useCallback((alert: Omit<typeof alerts[0], 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert = { ...alert, id, dismissible: alert.dismissible ?? true };
    
    setAlerts(prev => [...prev, newAlert]);

    // Auto-dismiss after timeout
    if (alert.timeout) {
      setTimeout(() => {
        removeAlert(id);
      }, alert.timeout);
    }
  }, [removeAlert]);

  const clearAllAlerts = React.useCallback(() => {
    setAlerts([]);
  }, []);

  const alertsWithDismiss = React.useMemo(() => 
    alerts.map(alert => ({
      ...alert,
      onDismiss: () => removeAlert(alert.id)
    })), [alerts, removeAlert]
  );

  return {
    alerts: alertsWithDismiss,
    addAlert,
    removeAlert,
    clearAllAlerts
  };
}
