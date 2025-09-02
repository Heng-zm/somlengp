import { EnhancedNotificationDemo } from '@/components/ui/enhanced-notification-demo'
import { StatusNotificationDemo } from '@/components/ui/status-notification-demo'
import { NotificationTestPanel } from '@/components/ui/notification-test-panel'
import { NotificationProvider } from '@/components/ui/notification-manager'
import { 
  StatusSimulator, 
  FormSubmissionStatus, 
  NotificationsList,
  OrderStatusDisplay 
} from '@/components/ui/status-notification-examples'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, TestTube, Gamepad2, Settings, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Enhanced Notifications Demo | Somlengp',
  description: 'Beautiful status notifications with modern design and smooth animations',
}

export default function NotificationsDemoPage() {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Notification System Demo
            </h1>
            <p className="text-xl text-gray-600">
              Complete notification testing suite with enhanced status indicators
            </p>
          </div>

          <Tabs defaultValue="enhanced" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-sm">
              <TabsTrigger value="enhanced" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Enhanced
              </TabsTrigger>
              <TabsTrigger value="test-panel" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Test Panel
              </TabsTrigger>
              <TabsTrigger value="status-demo" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Status Demo
              </TabsTrigger>
              <TabsTrigger value="interactive" className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                Interactive
              </TabsTrigger>
              <TabsTrigger value="examples" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Examples
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enhanced">
              <EnhancedNotificationDemo />
            </TabsContent>

            <TabsContent value="test-panel">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6">
                <NotificationTestPanel />
              </div>
            </TabsContent>

            <TabsContent value="status-demo">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6">
                <StatusNotificationDemo />
              </div>
            </TabsContent>

            <TabsContent value="interactive">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StatusSimulator />
                <FormSubmissionStatus />
              </div>
            </TabsContent>

            <TabsContent value="examples">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6">
                  <NotificationsList />
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6">
                  <OrderStatusDisplay orderStatus="Processing" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </NotificationProvider>
  )
}
