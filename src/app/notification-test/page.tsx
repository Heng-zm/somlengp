'use client'

import { ButtonNotification } from '@/components/ui/button-notification'
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStatusNotifications } from '@/hooks/use-status-notifications'
import { NotificationProvider } from '@/components/ui/notification-manager'

function NotificationTestContent() {
  const { success, warning, info, error, showStatus } = useStatusNotifications()

  const handleTestSuccess = () => {
    success('Success Notification', 'This is a test success message')
  }

  const handleTestError = () => {
    error('Error Notification', 'This is a test error message')
  }

  const handleTestWarning = () => {
    warning('Warning Notification', 'This is a test warning message')
  }

  const handleTestInfo = () => {
    info('Info Notification', 'This is a test info message')
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">Notification System Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Static Button Notifications</h2>
        <div className="flex flex-col gap-4">
          <ButtonNotification
            variant="success"
            title="Success"
            icon={CheckCircle2}
            dismissible={false}
            autoClose={false}
          />
          <ButtonNotification
            variant="error"
            title="Error"
            icon={AlertTriangle}
            dismissible={false}
            autoClose={false}
          />
          <ButtonNotification
            variant="warning"
            title="Warning"
            icon={AlertCircle}
            dismissible={false}
            autoClose={false}
          />
          <ButtonNotification
            variant="info"
            title="Info"
            icon={Info}
            dismissible={false}
            autoClose={false}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Dynamic Notifications</h2>
        <div className="flex gap-4">
          <Button onClick={handleTestSuccess} variant="default">
            Test Success
          </Button>
          <Button onClick={handleTestError} variant="destructive">
            Test Error
          </Button>
          <Button onClick={handleTestWarning} variant="outline">
            Test Warning
          </Button>
          <Button onClick={handleTestInfo} variant="secondary">
            Test Info
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function NotificationTestPage() {
  return (
    <NotificationProvider>
      <NotificationTestContent />
    </NotificationProvider>
  )
}
