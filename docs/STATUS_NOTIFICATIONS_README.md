# Status Notification Components

This directory contains a complete status notification system for your Next.js application, matching the design shown in your reference image.

## Components

### 1. StatusNotification
The main notification component with 5 different status states.

#### Usage
```tsx
import { StatusNotification } from '@/components/ui/status-notification'

// Basic usage
<StatusNotification status="success" />
<StatusNotification status="pending" />
<StatusNotification status="submitted" />
<StatusNotification status="failed" />
<StatusNotification status="expired" />

// With custom text
<StatusNotification status="success">Payment Complete</StatusNotification>

// Without icons
<StatusNotification status="pending" showIcon={false} />
```

#### Props
- `status`: Required. One of "pending" | "submitted" | "success" | "failed" | "expired"
- `showIcon`: Optional boolean (default: true). Shows/hides the status icon
- `children`: Optional. Custom text to display instead of default status text
- Standard HTML div props (className, onClick, etc.)

## Status Types

### Pending (Orange)
- **Icon**: AlertCircle
- **Color**: Orange theme
- **Use**: When an action is waiting to be processed

### Submitted (Blue)
- **Icon**: Send
- **Color**: Blue theme  
- **Use**: When an action has been submitted but not yet processed

### Success (Green)
- **Icon**: CheckCircle
- **Color**: Green theme
- **Use**: When an action completed successfully

### Failed (Red)
- **Icon**: XCircle
- **Color**: Red theme
- **Use**: When an action encountered an error

### Expired (Gray)
- **Icon**: Timer
- **Color**: Gray theme
- **Use**: When an action or session has timed out

## Files Created

1. `src/components/ui/status-notification.tsx` - Main status notification component
2. `src/components/ui/status-notification-demo.tsx` - Basic demo matching your image
3. `src/components/ui/status-notification-examples.tsx` - Interactive examples
4. `src/components/ui/notification-test-panel.tsx` - **Comprehensive test panel with all notification types**
5. `src/app/notifications-demo/page.tsx` - Complete demo page with tabbed interface
6. `src/hooks/use-status-notifications.ts` - Easy-to-use hook for status notifications

## Features

- ✅ Fully responsive design
- ✅ TypeScript support with proper type definitions
- ✅ Tailwind CSS styling
- ✅ Lucide React icons
- ✅ Hover animations (scale effect)
- ✅ Consistent with your existing UI components
- ✅ Customizable text and icons
- ✅ Accessible markup

## Comprehensive Test Panel 🚀

The **Notification Test Panel** is a complete testing suite that integrates with your existing notification system. It includes:

### Test Categories:
1. **Status Tests** - Test all 5 status notification types
2. **System Tests** - App updates, connectivity issues, battery warnings
3. **Interactive Tests** - Progress notifications, notification sequences
4. **Real-world Tests** - Order flows, payment processing, messaging

### Features:
- ✅ **Live Preview** - See your status notifications in action
- ✅ **Category Filtering** - Filter tests by type
- ✅ **Quick Actions** - Run multiple tests at once
- ✅ **Notification Sequences** - Automated test flows
- ✅ **Real-time Counters** - Track active and unread notifications
- ✅ **Integration Ready** - Works with your existing notification manager

### Usage with useStatusNotifications Hook:
```tsx
import { useStatusNotifications } from '@/hooks/use-status-notifications'

function MyComponent() {
  const { success, failed, pending, apiRequest } = useStatusNotifications()
  
  const handleSubmit = async () => {
    await apiRequest(
      'Save Data',
      () => fetch('/api/save'),
      {
        successMessage: 'Data saved successfully!',
        errorMessage: 'Failed to save data'
      }
    )
  }
  
  return (
    <button onClick={handleSubmit}>Save</button>
  )
}
```

## Demo

Visit `/notifications-demo` in your application to see:
- **Test Panel Tab** - Comprehensive testing interface
- **Status Demo Tab** - Basic status notification showcase  
- **Interactive Tab** - Status simulators and form examples
- **Examples Tab** - Real-world usage examples

## Integration Examples

### Order Status
```tsx
export function OrderStatus({ order }: { order: Order }) {
  const getStatus = (orderStatus: string) => {
    switch (orderStatus) {
      case 'processing': return 'pending'
      case 'shipped': return 'submitted'  
      case 'delivered': return 'success'
      case 'cancelled': return 'failed'
      case 'expired': return 'expired'
      default: return 'pending'
    }
  }

  return (
    <StatusNotification status={getStatus(order.status)}>
      {order.status}
    </StatusNotification>
  )
}
```

### API Request Status
```tsx
export function useApiStatus() {
  const [status, setStatus] = useState<'pending' | 'submitted' | 'success' | 'failed'>('pending')

  const makeRequest = async () => {
    setStatus('pending')
    try {
      setStatus('submitted')
      await api.submit()
      setStatus('success')
    } catch (error) {
      setStatus('failed')
    }
  }

  return { status, makeRequest }
}
```

## Customization

The component uses CSS custom properties and Tailwind classes, making it easy to customize:

```tsx
// Custom styling
<StatusNotification 
  status="success" 
  className="text-lg px-6 py-3" 
/>

// Custom colors (extend the variants in the cva definition)
```

## Dependencies

- React
- Tailwind CSS
- class-variance-authority (cva)
- lucide-react (for icons)
- Your existing `@/lib/utils` (for cn function)
