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
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline styles
// Use useMemo for objects/arrays and useCallback for functions

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
  Settings,
  Volume2,
  VolumeX,
  Play,
  Pause,
  TestTube,
  Sparkles,
  Loader
} from 'lucide-react';
// Predefined alert examples
const alertExamples = [
  {
    variant: 'success' as const,
    icon: CheckCircle2,
    title: 'Success!',
    description: 'Your profile has been updated successfully.',
    dismissible: true,
    autoClose: true,
    playSound: true,
    soundType: 'success' as const,
  },
  {
    variant: 'destructive' as const,
    icon: X,
    title: 'Critical Error',
    description: 'Something went wrong. Please try again later.',
    dismissible: true,
    priority: 'critical' as const,
    persistent: true,
    playSound: true,
    soundType: 'error' as const,
  },
  {
    variant: 'warning' as const,
    icon: AlertTriangle,
    title: 'Session Expiring',
    description: 'Your session will expire in 5 minutes. Please save your work.',
    dismissible: false,
    priority: 'high' as const,
    autoClose: true,
    autoCloseDelay: 10000,
    playSound: true,
    soundType: 'warning' as const,
  },
  {
    variant: 'info' as const,
    icon: Info,
    title: 'New Features Available',
    description: 'Check out the latest updates and improvements!',
    dismissible: true,
    autoClose: true,
    actions: [
      { label: 'Learn More', onClick: () => console.log('Learn More clicked'), variant: 'outline' as const },
      { label: 'Got it', onClick: () => console.log('Got it clicked'), variant: 'default' as const }
    ]
  },
  {
    variant: 'outline' as const,
    icon: Bell,
    title: 'Notification',
    description: 'You have 3 unread messages.',
    dismissible: true,
    autoClose: true,
  },
  {
    variant: 'glass' as const,
    icon: Star,
    title: 'Premium Feature',
    description: 'This feature is available for premium users only.',
    dismissible: false,
    actions: [
      { label: 'Upgrade', onClick: () => console.log('Upgrade clicked'), variant: 'default' as const }
    ]
  },
  {
    variant: 'neon' as const,
    icon: Star,
    title: 'Special Event',
    description: 'Limited time offer - 50% off premium features!',
    dismissible: true,
    priority: 'high' as const,
    autoClose: false,
  },
  {
    variant: 'minimal' as const,
    icon: Info,
    title: 'System Update',
    description: 'A system update is available for download.',
    dismissible: true,
  },
  {
    variant: 'elevated' as const,
    icon: CheckCircle2,
    title: 'Backup Complete',
    description: 'Your data has been backed up successfully.',
    dismissible: true,
    showProgress: true,
    progress: 100,
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [progressDemo, setProgressDemo] = useState(0);
  const handleDismiss = (index: number) => {
    setDismissedAlerts(prev => new Set([...prev, index]));
  };
  const resetAlerts = () => {
    setDismissedAlerts(new Set());
  };
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };
  // Progress demo effect
  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgressDemo(prev => (prev >= 100 ? 0 : prev + 10));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Alert Components
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enhanced alert messages with modern Tailwind CSS styling
        </p>
        <div className="flex gap-2">
          <Button onClick={resetAlerts} variant="outline" size="sm">
            Reset Dismissed Alerts
          </Button>
          <Button onClick={toggleSound} variant="outline" size="sm" className="flex items-center gap-2">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundEnabled ? 'Sounds On' : 'Sounds Off'}
          </Button>
        </div>
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
      {/* Advanced Features Demo */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Advanced Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Priority Alert */}
          <Alert variant="destructive" priority="critical" className="animate-pulse">
            <X className="h-4 w-4" />
            <AlertTitle>Critical System Error</AlertTitle>
            <AlertDescription>
              Database connection lost. Immediate attention required!
            </AlertDescription>
          </Alert>
          {/* Progress Alert */}
          <Alert 
            variant="info" 
            showProgress 
            progress={progressDemo}
            dismissible={false}
          >
            <Loader className="h-4 w-4 animate-spin" />
            <AlertTitle>Processing Data</AlertTitle>
            <AlertDescription>
              {progressDemo < 100 ? `Processing your request... ${progressDemo}%` : 'Processing complete!'}
            </AlertDescription>
          </Alert>
          {/* Action Alert */}
          <Alert 
            variant="warning" 
            actions={[
              { label: 'Backup Now', onClick: () => alert('Backup started'), variant: 'default' as const },
              { label: 'Remind Later', onClick: () => alert('Reminder set'), variant: 'outline' as const }
            ]}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Storage Almost Full</AlertTitle>
            <AlertDescription>
              You have used 95% of your storage space. Consider backing up your data.
            </AlertDescription>
          </Alert>
          {/* Auto-Close Demo */}
          <Alert 
            variant="success" 
            autoClose 
            autoCloseDelay={8000}
            playSound={soundEnabled}
            soundType="success"
          >
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Auto-Close Demo</AlertTitle>
            <AlertDescription>
              This alert will automatically close in 8 seconds with a progress indicator.
            </AlertDescription>
          </Alert>
          {/* Sound Alert */}
          <Alert 
            variant="info" 
            playSound={soundEnabled}
            soundType="notification"
            actions={[
              { label: 'Play Sound', onClick: () => console.log('Play Sound clicked'), variant: 'default' as const }
            ]}
          >
            <Volume2 className="h-4 w-4" />
            <AlertTitle>Sound Notification</AlertTitle>
            <AlertDescription>
              This alert {soundEnabled ? 'will play' : 'would play'} a sound when shown.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      {/* New Alert Variants */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 shadow-sm">
              <TestTube className="h-4 w-4 text-white" />
            </div>
            New Alert Variants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Neon Alert */}
          <Alert variant="neon" size="lg">
            <Star className="h-5 w-5" />
            <AlertTitle>Neon Style Alert</AlertTitle>
            <AlertDescription>
              A futuristic neon-themed alert with glowing effects and vibrant colors.
            </AlertDescription>
          </Alert>
          {/* Minimal Alert */}
          <Alert variant="minimal">
            <Info className="h-4 w-4" />
            <AlertTitle>Minimal Design</AlertTitle>
            <AlertDescription>
              Clean, minimal alert with subtle left border styling.
            </AlertDescription>
          </Alert>
          {/* Elevated Alert */}
          <Alert variant="elevated" className="transform hover:scale-[1.02] transition-transform">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Elevated Alert</AlertTitle>
            <AlertDescription>
              Features elevated shadow and subtle hover effects for modern UI.
            </AlertDescription>
          </Alert>
          {/* Glass Morphism */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl opacity-20"></div>
            <Alert variant="glass" className="relative">
              <Star className="h-4 w-4" />
              <AlertTitle>Glass Morphism</AlertTitle>
              <AlertDescription>
                Beautiful glass morphism effect with backdrop blur and transparency.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
      {/* Animation Examples */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 shadow-sm">
              <Play className="h-4 w-4 text-white" />
            </div>
            Animation Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success" animation="fadeIn">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Fade In Animation</AlertTitle>
            <AlertDescription>This alert fades in smoothly when displayed.</AlertDescription>
          </Alert>
          <Alert variant="info" animation="slideIn">
            <Info className="h-4 w-4" />
            <AlertTitle>Slide In Animation</AlertTitle>
            <AlertDescription>This alert slides in from the left side.</AlertDescription>
          </Alert>
          <Alert variant="warning" animation="bounceIn">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Bounce In Animation</AlertTitle>
            <AlertDescription>This alert bounces in with a playful effect.</AlertDescription>
          </Alert>
          <Alert variant="destructive" animation="scaleIn">
            <X className="h-4 w-4" />
            <AlertTitle>Scale In Animation</AlertTitle>
            <AlertDescription>This alert scales up from the center.</AlertDescription>
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
