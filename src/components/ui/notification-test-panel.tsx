'use client'
import React, { useState } from 'react'
import { StatusNotification } from './status-notification'
import { useNotifications, notifications } from './notification-manager'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Separator } from './separator'
import { 
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions

  Bell, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Send,
  XCircle,
  Timer,
  AlertCircle,
  Rocket,
  MessageSquare,
  Download,
  Upload,
  WifiOff,
  Wifi,
  Battery
} from 'lucide-react'
interface TestScenario {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  execute: () => void
  category: 'status' | 'system' | 'interactive' | 'realworld'
}
export function NotificationTestPanel() {
  const { addNotification, state, clearAll } = useNotifications()
  const [isRunningSequence, setIsRunningSequence] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'all' | 'status' | 'system' | 'interactive' | 'realworld'>('all')
  // Status notification tests
  const statusTests = [
    {
      id: 'status-pending',
      name: 'Pending Status',
      description: 'Show pending operation notification',
      icon: AlertCircle,
      category: 'status' as const,
      execute: () => {
        addNotification(notifications.info(
          'Operation Pending',
          'Your request is being processed...',
          {
            persistent: true,
            icon: AlertCircle,
            soundType: 'info'
          }
        ))
      }
    },
    {
      id: 'status-submitted',
      name: 'Submitted Status',
      description: 'Show submitted form notification',
      icon: Send,
      category: 'status' as const,
      execute: () => {
        addNotification(notifications.info(
          'Form Submitted',
          'Your form has been successfully submitted for review',
          {
            icon: Send,
            soundType: 'info'
          }
        ))
      }
    },
    {
      id: 'status-success',
      name: 'Success Status',
      description: 'Show successful completion',
      icon: CheckCircle2,
      category: 'status' as const,
      execute: () => {
        addNotification(notifications.success(
          'Operation Successful',
          'Your task has been completed successfully!'
        ))
      }
    },
    {
      id: 'status-failed',
      name: 'Failed Status',
      description: 'Show operation failure',
      icon: XCircle,
      category: 'status' as const,
      execute: () => {
        addNotification(notifications.error(
          'Operation Failed',
          'The operation could not be completed. Please try again.'
        ))
      }
    },
    {
      id: 'status-expired',
      name: 'Expired Status',
      description: 'Show session/timeout expiry',
      icon: Timer,
      category: 'status' as const,
      execute: () => {
        addNotification(notifications.warning(
          'Session Expired',
          'Your session has timed out. Please log in again.',
          {
            icon: Timer,
            persistent: true
          }
        ))
      }
    }
  ]
  // System notification tests
  const systemTests = [
    {
      id: 'system-update',
      name: 'System Update',
      description: 'App update available',
      icon: Download,
      category: 'system' as const,
      execute: () => {
        addNotification(notifications.info(
          'Update Available',
          'A new version of the app is available. Update now?',
          {
            actions: [
              {
                label: 'Update Now',
                onClick: () => console.log('Update clicked'),
                variant: 'default'
              },
              {
                label: 'Later',
                onClick: () => console.log('Later clicked'),
                variant: 'outline'
              }
            ],
            persistent: true
          }
        ))
      }
    },
    {
      id: 'system-connection',
      name: 'Connection Issues',
      description: 'Network connectivity problems',
      icon: WifiOff,
      category: 'system' as const,
      execute: () => {
        addNotification(notifications.error(
          'Connection Lost',
          'Unable to connect to the server. Retrying...',
          {
            icon: WifiOff,
            persistent: true,
            showProgress: true,
            progress: 45
          }
        ))
      }
    },
    {
      id: 'system-battery',
      name: 'Low Battery',
      description: 'Device battery warning',
      icon: Battery,
      category: 'system' as const,
      execute: () => {
        addNotification(notifications.warning(
          'Low Battery',
          'Battery level is below 20%. Consider charging your device.',
          {
            icon: Battery
          }
        ))
      }
    }
  ]
  // Interactive tests
  const interactiveTests = [
    {
      id: 'interactive-progress',
      name: 'Progress Notification',
      description: 'Show upload/download progress',
      icon: Upload,
      category: 'interactive' as const,
      execute: () => {
        const notificationId = `progress-${Date.now()}`
        addNotification({
          type: 'alert',
          variant: 'info',
          title: 'Uploading Files',
          description: 'Please wait while your files are being uploaded...',
          priority: 'medium',
          persistent: true,
          autoClose: false,
          autoCloseDelay: 0,
          icon: Upload,
          showProgress: true,
          progress: 0,
          soundType: 'info'
        })
        // Simulate progress
        let progress = 0
        const interval = setInterval(() => {
          progress += Math.random() * 20
          if (progress >= 100) {
            progress = 100
            clearInterval(interval)
            // Show completion notification
            setTimeout(() => {
              addNotification(notifications.success(
                'Upload Complete',
                'All files have been uploaded successfully!'
              ))
            }, 500)
          }
          // Note: In real implementation, you'd update the existing notification's progress
        }, 500)
      }
    },
    {
      id: 'interactive-sequence',
      name: 'Notification Sequence',
      description: 'Run a sequence of status notifications',
      icon: Play,
      category: 'interactive' as const,
      execute: () => runNotificationSequence()
    }
  ]
  // Real-world scenario tests
  const realWorldTests = [
    {
      id: 'realworld-order',
      name: 'Order Flow',
      description: 'Complete order processing flow',
      icon: Rocket,
      category: 'realworld' as const,
      execute: () => {
        // Order placed
        addNotification(notifications.success(
          'Order Placed',
          'Your order #12345 has been placed successfully'
        ))
        setTimeout(() => {
          addNotification(notifications.info(
            'Order Processing',
            'Your order is being prepared for shipment',
            { icon: Clock }
          ))
        }, 2000)
        setTimeout(() => {
          addNotification(notifications.success(
            'Order Shipped',
            'Your order is on its way! Track: #TRK789',
            { icon: Send }
          ))
        }, 4000)
      }
    },
    {
      id: 'realworld-payment',
      name: 'Payment Processing',
      description: 'Payment flow notifications',
      icon: CheckCircle2,
      category: 'realworld' as const,
      execute: () => {
        addNotification(notifications.info(
          'Processing Payment',
          'Please wait while we process your payment...',
          { persistent: true, icon: Clock }
        ))
        setTimeout(() => {
          if (Math.random() > 0.3) {
            addNotification(notifications.success(
              'Payment Successful',
              'Your payment of $99.99 has been processed'
            ))
          } else {
            addNotification(notifications.error(
              'Payment Failed',
              'Payment could not be processed. Please check your card details.'
            ))
          }
        }, 3000)
      }
    },
    {
      id: 'realworld-message',
      name: 'New Messages',
      description: 'Incoming message notifications',
      icon: MessageSquare,
      category: 'realworld' as const,
      execute: () => {
        addNotification(notifications.info(
          'New Message',
          'John Doe: Hey, are we still on for the meeting?',
          {
            icon: MessageSquare,
            actions: [
              {
                label: 'Reply',
                onClick: () => console.log('Reply clicked'),
                variant: 'default'
              },
              {
                label: 'Mark as Read',
                onClick: () => console.log('Mark as read clicked'),
                variant: 'outline'
              }
            ]
          }
        ))
      }
    }
  ]
  const allTests = [...statusTests, ...systemTests, ...interactiveTests, ...realWorldTests]
  const filteredTests = activeCategory === 'all' 
    ? allTests 
    : allTests.filter(test => test.category === activeCategory)
  const runNotificationSequence = async () => {
    if (isRunningSequence) return
    setIsRunningSequence(true)
    const sequence = [
      () => addNotification(notifications.info('Process Started', 'Initializing workflow...', { icon: Play })),
      () => addNotification(notifications.info('Step 1 Complete', 'Data validation successful', { icon: CheckCircle2 })),
      () => addNotification(notifications.warning('Step 2 Warning', 'Minor issues detected, continuing...', { icon: AlertTriangle })),
      () => addNotification(notifications.info('Step 3 Processing', 'Processing data...', { icon: Clock })),
      () => addNotification(notifications.success('Workflow Complete', 'All steps completed successfully!', { icon: Zap }))
    ]
    for (let i = 0; i < sequence.length; i++) {
      sequence[i]()
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    setIsRunningSequence(false)
  }
  const categories = [
    { id: 'all', label: 'All Tests', icon: Bell },
    { id: 'status', label: 'Status', icon: AlertCircle },
    { id: 'system', label: 'System', icon: Settings },
    { id: 'interactive', label: 'Interactive', icon: Play },
    { id: 'realworld', label: 'Real World', icon: Rocket }
  ]
  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            Notification Test Panel
            <Badge variant="outline" className="ml-auto">
              {state.notifications.length} Active
            </Badge>
          </CardTitle>
          <p className="text-muted-foreground">
            Test all notification types and status indicators. Perfect for development and QA testing.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={clearAll}
                variant="outline"
                size="sm"
                disabled={state.notifications.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All ({state.notifications.length})
              </Button>
              <Button
                onClick={runNotificationSequence}
                variant="default"
                size="sm"
                disabled={isRunningSequence}
              >
                {isRunningSequence ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isRunningSequence ? 'Running...' : 'Run Sequence'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Unread:</span>
              <Badge variant="secondary">{state.unreadCount}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Status Notifications Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Status Notification Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center">
            <StatusNotification status="pending" />
            <StatusNotification status="submitted" />
            <StatusNotification status="success" />
            <StatusNotification status="failed" />
            <StatusNotification status="expired" />
          </div>
        </CardContent>
      </Card>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(category.id as any)}
            className="flex items-center gap-2"
          >
            <category.icon className="h-4 w-4" />
            {category.label}
          </Button>
        ))}
      </div>
      {/* Test Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests.map((test) => (
          <Card key={test.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <test.icon className="h-4 w-4" />
                {test.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {test.description}
              </p>
              <Button
                onClick={test.execute}
                className="w-full"
                size="sm"
                disabled={test.id === 'interactive-sequence' && isRunningSequence}
              >
                {test.id === 'interactive-sequence' && isRunningSequence ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => statusTests.forEach(test => test.execute())}
            >
              Test All Status
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => systemTests.forEach(test => test.execute())}
            >
              Test System Alerts
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => realWorldTests.forEach(test => test.execute())}
            >
              Test Real World
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Current Notifications Count */}
      <div className="text-center text-sm text-muted-foreground">
        Current active notifications: {state.notifications.length} | 
        Total unread: {state.unreadCount} |
        Settings: {state.settings.enabled ? 'Enabled' : 'Disabled'}
      </div>
    </div>
  )
}
