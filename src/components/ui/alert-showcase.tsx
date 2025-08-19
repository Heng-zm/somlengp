"use client";

import React, { useState } from 'react';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X, 
  Bell,
  Shield,
  Zap,
  Heart,
  Star,
  Wifi,
  Download,
  Upload,
  Clock,
  Users,
  Settings
} from 'lucide-react';

// Predefined alert examples
const alertExamples = [
  {
    variant: 'success' as const,
    icon: CheckCircle2,
    title: 'Success!',
    description: 'Your profile has been updated successfully.',
    dismissible: true,
  },
  {
    variant: 'destructive' as const,
    icon: X,
    title: 'Error',
    description: 'Something went wrong. Please try again later.',
    dismissible: true,
  },
  {
    variant: 'warning' as const,
    icon: AlertTriangle,
    title: 'Warning',
    description: 'Your session will expire in 5 minutes. Please save your work.',
    dismissible: false,
  },
  {
    variant: 'info' as const,
    icon: Info,
    title: 'Information',
    description: 'New features are now available. Check them out!',
    dismissible: true,
  },
  {
    variant: 'outline' as const,
    icon: Bell,
    title: 'Notification',
    description: 'You have 3 unread messages.',
    dismissible: true,
  },
  {
    variant: 'glass' as const,
    icon: Star,
    title: 'Premium Feature',
    description: 'This feature is available for premium users only.',
    dismissible: false,
  },
];

// Advanced alert examples
const advancedAlerts = [
  {
    variant: 'success' as const,
    icon: Shield,
    title: 'Security Alert',
    description: 'Two-factor authentication has been enabled for your account.',
    actions: [
      { label: 'View Settings', variant: 'outline' as const },
      { label: 'Got it', variant: 'default' as const }
    ]
  },
  {
    variant: 'info' as const,
    icon: Download,
    title: 'Update Available',
    description: 'A new version of the app is available for download.',
    actions: [
      { label: 'Later', variant: 'outline' as const },
      { label: 'Update Now', variant: 'default' as const }
    ]
  },
  {
    variant: 'warning' as const,
    icon: Clock,
    title: 'Maintenance Notice',
    description: 'Scheduled maintenance will begin in 30 minutes. The service will be unavailable for approximately 1 hour.',
    actions: [
      { label: 'Learn More', variant: 'outline' as const },
      { label: 'Dismiss', variant: 'ghost' as const }
    ]
  }
];

export function AlertShowcase() {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());

  const handleDismiss = (index: number) => {
    setDismissedAlerts(prev => new Set([...prev, index]));
  };

  const resetAlerts = () => {
    setDismissedAlerts(new Set());
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Alert Components
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enhanced alert messages with modern Tailwind CSS styling
        </p>
        <Button onClick={resetAlerts} variant="outline" size="sm">
          Reset Dismissed Alerts
        </Button>
      </div>

      {/* Basic Alert Variants */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-sm">
              <Bell className="h-4 w-4 text-white" />
            </div>
            Basic Alert Variants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alertExamples.map((alert, index) => {
            if (alert.dismissible && dismissedAlerts.has(index)) {
              return (
                <div key={index} className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center text-gray-500 dark:text-gray-400">
                  Alert dismissed
                </div>
              );
            }

            const IconComponent = alert.icon;
            return (
              <Alert
                key={index}
                variant={alert.variant}
                dismissible={alert.dismissible}
                onDismiss={() => handleDismiss(index)}
                className="group hover:shadow-md transition-shadow duration-200"
              >
                <IconComponent className="h-4 w-4" />
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>{alert.description}</AlertDescription>
              </Alert>
            );
          })}
        </CardContent>
      </Card>

      {/* Alert Sizes */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 shadow-sm">
              <Settings className="h-4 w-4 text-white" />
            </div>
            Alert Sizes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="info" size="sm">
            <Info className="h-3 w-3" />
            <AlertTitle>Small Alert</AlertTitle>
            <AlertDescription>This is a small alert message.</AlertDescription>
          </Alert>

          <Alert variant="success" size="default">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>This is a default size alert message.</AlertDescription>
          </Alert>

          <Alert variant="warning" size="lg">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Large Alert</AlertTitle>
            <AlertDescription>This is a large alert message with more prominent styling.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Advanced Alerts with Actions */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 shadow-sm">
              <Zap className="h-4 w-4 text-white" />
            </div>
            Advanced Alerts with Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {advancedAlerts.map((alert, index) => {
            const IconComponent = alert.icon;
            return (
              <Alert
                key={index}
                variant={alert.variant}
                className="group hover:shadow-md transition-all duration-200"
              >
                <IconComponent className="h-4 w-4" />
                <div className="flex-1">
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription className="mb-3">{alert.description}</AlertDescription>
                  <div className="flex gap-2">
                    {alert.actions?.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant={action.variant}
                        size="sm"
                        className="h-8 text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </Alert>
            );
          })}
        </CardContent>
      </Card>

      {/* Custom Styled Alerts */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm">
              <Heart className="h-4 w-4 text-white" />
            </div>
            Custom Styled Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gradient Alert */}
          <Alert className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
            <Heart className="h-4 w-4" />
            <AlertTitle>Special Offer!</AlertTitle>
            <AlertDescription className="text-purple-100">
              Get 50% off on premium features this week only!
            </AlertDescription>
          </Alert>

          {/* Status Alert */}
          <Alert variant="success" className="border-l-4 border-l-emerald-500 rounded-l-none">
            <Wifi className="h-4 w-4" />
            <div className="flex items-center justify-between w-full">
              <div>
                <AlertTitle className="flex items-center gap-2">
                  Connection Status
                  <Badge className="bg-emerald-500 text-white">Online</Badge>
                </AlertTitle>
                <AlertDescription>All systems are operational.</AlertDescription>
              </div>
            </div>
          </Alert>

          {/* Progress Alert */}
          <Alert variant="info" className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <Upload className="h-4 w-4" />
            <div className="w-full">
              <AlertTitle className="flex items-center justify-between">
                <span>Uploading Files</span>
                <span className="text-sm font-normal">75%</span>
              </AlertTitle>
              <AlertDescription className="mb-2">3 of 4 files uploaded successfully.</AlertDescription>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
              </div>
            </div>
          </Alert>

          {/* Team Alert */}
          <Alert variant="outline" className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 dark:hover:from-gray-900/50 dark:hover:to-slate-900/50">
            <Users className="h-4 w-4" />
            <div className="flex items-center justify-between w-full">
              <div>
                <AlertTitle>Team Collaboration</AlertTitle>
                <AlertDescription>5 team members are currently online.</AlertDescription>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-semibold">
                    {i}
                  </div>
                ))}
              </div>
            </div>
          </Alert>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <pre className="text-sm overflow-x-auto">
              <code>{`// Basic Alert
<Alert variant="success">
  <CheckCircle2 className="h-4 w-4" />
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>Your changes have been saved.</AlertDescription>
</Alert>

// Dismissible Alert
<Alert variant="warning" dismissible onDismiss={() => {/* handle dismiss */}}>
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>Please review your settings.</AlertDescription>
</Alert>

// Large Glass Alert
<Alert variant="glass" size="lg">
  <Star className="h-5 w-5" />
  <AlertTitle>Premium Feature</AlertTitle>
  <AlertDescription>Unlock advanced features with premium.</AlertDescription>
</Alert>`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AlertShowcase;
