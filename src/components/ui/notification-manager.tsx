"use client"
import * as React from "react"
import { createContext, useContext, useReducer, useCallback, useEffect } from "react"
import { Alert, AlertTitle, AlertDescription } from "./alert"
import { ButtonNotification } from "./button-notification"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X, 
  Volume2, 
  VolumeX,
  Settings,
  Trash2,
  Clock
} from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Switch } from "./switch"
import { Slider } from "./slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
// Performance optimization needed: Consider memoizing inline styles, inline event handlers
// Use useMemo for objects/arrays and useCallback for functions

// Types
interface NotificationSettings {
  enabled: boolean
  soundEnabled: boolean
  volume: number
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
  maxNotifications: number
  autoClose: boolean
  autoCloseDelay: number
  enablePersistence: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}
interface NotificationItem {
  id: string
  type: 'alert' | 'toast'
  variant: 'default' | 'success' | 'error' | 'warning' | 'info' | 'destructive'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description?: string
  timestamp: number
  persistent: boolean
  autoClose: boolean
  autoCloseDelay: number
  soundType?: 'success' | 'error' | 'warning' | 'info' | 'notification'
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  }>
  progress?: number
  showProgress?: boolean
  icon?: React.ComponentType<{ className?: string }>
  dismissed: boolean
  read: boolean
}
interface NotificationState {
  notifications: NotificationItem[]
  settings: NotificationSettings
  history: NotificationItem[]
  unreadCount: number
}
// Initial state
const defaultSettings: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  volume: 0.5,
  position: 'bottom-right',
  maxNotifications: 5,
  autoClose: true,
  autoCloseDelay: 500,
  enablePersistence: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
}
const initialState: NotificationState = {
  notifications: [],
  settings: defaultSettings,
  history: [],
  unreadCount: 0
}
// Actions
type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Omit<NotificationItem, 'id' | 'timestamp' | 'dismissed' | 'read'> }
  | { type: 'DISMISS_NOTIFICATION'; payload: { id: string } }
  | { type: 'MARK_AS_READ'; payload: { id: string } }
  | { type: 'CLEAR_ALL' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationSettings> }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'UPDATE_PROGRESS'; payload: { id: string; progress: number } }
// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotification: NotificationItem = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        dismissed: false,
        read: false
      }
      // Check if notifications are disabled
      if (!state.settings.enabled) {
        return state
      }
      // Check quiet hours
      if (state.settings.quietHours.enabled && isInQuietHours(new Date(), state.settings.quietHours)) {
        // Store in history for later
        return {
          ...state,
          history: [...state.history, newNotification]
        }
      }
      // Limit max notifications
      const notifications = [...state.notifications, newNotification]
      if (notifications.length > state.settings.maxNotifications) {
        notifications.shift()
      }
      return {
        ...state,
        notifications,
        history: [...state.history, newNotification],
        unreadCount: state.unreadCount + 1
      }
    }
    case 'DISMISS_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload.id)
      }
    }
    case 'MARK_AS_READ': {
      const notification = state.notifications.find(n => n.id === action.payload.id)
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.id ? { ...n, read: true } : n
        ),
        unreadCount: notification && !notification.read ? state.unreadCount - 1 : state.unreadCount
      }
    }
    case 'CLEAR_ALL': {
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      }
    }
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      }
    }
    case 'CLEAR_HISTORY': {
      return {
        ...state,
        history: []
      }
    }
    case 'UPDATE_PROGRESS': {
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.id ? { ...n, progress: action.payload.progress } : n
        )
      }
    }
    default:
      return state
  }
}
// Helper functions
function isInQuietHours(date: Date, quietHours: { start: string; end: string }): boolean {
  const currentTime = date.getHours() * 60 + date.getMinutes()
  const [startHour, startMin] = quietHours.start.split(':').map(Number)
  const [endHour, endMin] = quietHours.end.split(':').map(Number)
  const startTime = startHour * 60 + startMin
  const endTime = endHour * 60 + endMin
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime
  } else {
    return currentTime >= startTime || currentTime <= endTime
  }
}
function playNotificationSound(soundType: string, volume: number): void {
  if (typeof window === 'undefined') return
  try {
    const soundMap: Record<string, string> = {
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      warning: '/sounds/warning.mp3',
      info: '/sounds/info.mp3',
      notification: '/sounds/notification.mp3',
    }
    const soundFile = soundMap[soundType] || soundMap.notification
    const audio = new Audio(soundFile)
    audio.volume = Math.max(0, Math.min(1, volume))
    audio.play().catch(console.warn)
  } catch (error) {
  }
}
// Context
interface NotificationContextValue {
  state: NotificationState
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'dismissed' | 'read'>) => void
  dismissNotification: (id: string) => void
  markAsRead: (id: string) => void
  clearAll: () => void
  updateSettings: (settings: Partial<NotificationSettings>) => void
  clearHistory: () => void
  updateProgress: (id: string, progress: number) => void
}
const NotificationContext = createContext<NotificationContextValue | null>(null)
// Provider component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState)
  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('notification-settings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
      }
    } catch (error) {
    }
  }, [])
  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notification-settings', JSON.stringify(state.settings))
    } catch (error) {
    }
  }, [state.settings])
  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp' | 'dismissed' | 'read'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
    // Play sound if enabled
    if (state.settings.soundEnabled && notification.soundType) {
      playNotificationSound(notification.soundType, state.settings.volume)
    }
    // Create toast if type is toast
    if (notification.type === 'toast') {
      toast({
        variant: notification.variant as any,
        title: notification.title,
        description: notification.description,
      })
    }
  }, [state.settings.soundEnabled, state.settings.volume])
  const dismissNotification = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_NOTIFICATION', payload: { id } })
  }, [])
  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: { id } })
  }, [])
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' })
  }, [])
  const updateSettings = useCallback((settings: Partial<NotificationSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
  }, [])
  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' })
  }, [])
  const updateProgress = useCallback((id: string, progress: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { id, progress } })
  }, [])
  const value = {
    state,
    addNotification,
    dismissNotification,
    markAsRead,
    clearAll,
    updateSettings,
    clearHistory,
    updateProgress
  }
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}
// Hook to use notifications
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
// Notification container component
function NotificationContainer() {
  const { state, dismissNotification, markAsRead } = useNotifications()
  if (!state.settings.enabled) {
    return null
  }
  return (
    <div
      className={cn(
        "fixed z-[100] flex max-h-screen w-full flex-col gap-2 p-4",
        {
          "top-0 left-0": state.settings.position === 'top-left',
          "top-0 right-0": state.settings.position === 'top-right',
          "top-0 left-1/2 -translate-x-1/2": state.settings.position === 'top-center',
          "bottom-0 left-0": state.settings.position === 'bottom-left',
          "bottom-0 right-0": state.settings.position === 'bottom-right',
          "bottom-0 left-1/2 -translate-x-1/2": state.settings.position === 'bottom-center',
          "flex-col": state.settings.position.startsWith('top'),
          "flex-col-reverse": state.settings.position.startsWith('bottom'),
        }
      )}
      style={{ maxWidth: '440px' }}
    >
      {state.notifications
        .filter(n => n.type === 'alert')
        .map((notification) => (
          <ButtonNotification
            key={notification.id}
            variant={notification.variant === 'destructive' ? 'error' : notification.variant}
            title={notification.title}
            icon={notification.icon}
            dismissible={!notification.persistent}
            autoClose={notification.autoClose && state.settings.autoClose}
            autoCloseDelay={notification.autoCloseDelay || state.settings.autoCloseDelay}
            onDismiss={() => dismissNotification(notification.id)}
            onClick={() => markAsRead(notification.id)}
            className={cn(
              "transition-all duration-300 hover:scale-105",
              !notification.read && "ring-2 ring-blue-400/30 shadow-lg"
            )}
          />
        ))}
    </div>
  )
}
// Notification settings component
export function NotificationSettings() {
  const { state, updateSettings } = useNotifications()
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Enable Notifications</h4>
            <p className="text-sm text-muted-foreground">Receive system notifications</p>
          </div>
          <Switch
            checked={state.settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
          />
        </div>
        {/* Sound Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Sound Notifications</h4>
              <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
            </div>
            <Switch
              checked={state.settings.soundEnabled}
              onCheckedChange={(soundEnabled) => updateSettings({ soundEnabled })}
            />
          </div>
          {state.settings.soundEnabled && (
            <div>
              <label className="text-sm font-medium">Volume</label>
              <Slider
                value={[state.settings.volume * 100]}
                onValueChange={(value) => updateSettings({ volume: value[0] / 100 })}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>
          )}
        </div>
        {/* Position Settings */}
        <div>
          <label className="text-sm font-medium">Position</label>
          <Select
            value={state.settings.position}
            onValueChange={(position: any) => updateSettings({ position })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top-left">Top Left</SelectItem>
              <SelectItem value="top-right">Top Right</SelectItem>
              <SelectItem value="top-center">Top Center</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
              <SelectItem value="bottom-center">Bottom Center</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Max Notifications */}
        <div>
          <label className="text-sm font-medium">Maximum Notifications</label>
          <Slider
            value={[state.settings.maxNotifications]}
            onValueChange={(value) => updateSettings({ maxNotifications: value[0] })}
            min={1}
            max={10}
            step={1}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Currently: {state.settings.maxNotifications}
          </p>
        </div>
        {/* Auto Close Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Auto Close</h4>
              <p className="text-sm text-muted-foreground">Automatically dismiss notifications</p>
            </div>
            <Switch
              checked={state.settings.autoClose}
              onCheckedChange={(autoClose) => updateSettings({ autoClose })}
            />
          </div>
          {state.settings.autoClose && (
            <div>
              <label className="text-sm font-medium">Auto Close Delay (seconds)</label>
              <Slider
                value={[state.settings.autoCloseDelay / 1000]}
                onValueChange={(value) => updateSettings({ autoCloseDelay: value[0] * 1000 })}
                min={0.5}
                max={30}
                step={0.5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Currently: {state.settings.autoCloseDelay / 1000} seconds
              </p>
            </div>
          )}
        </div>
        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Quiet Hours</h4>
              <p className="text-sm text-muted-foreground">Pause notifications during specific hours</p>
            </div>
            <Switch
              checked={state.settings.quietHours.enabled}
              onCheckedChange={(enabled) => 
                updateSettings({ 
                  quietHours: { ...state.settings.quietHours, enabled } 
                })
              }
            />
          </div>
          {state.settings.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <input
                  type="time"
                  value={state.settings.quietHours.start}
                  onChange={(e) =>
                    updateSettings({
                      quietHours: { ...state.settings.quietHours, start: e.target.value }
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <input
                  type="time"
                  value={state.settings.quietHours.end}
                  onChange={(e) =>
                    updateSettings({
                      quietHours: { ...state.settings.quietHours, end: e.target.value }
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
// Quick notification helpers
export const notifications = {
  success: (title: string, description?: string, options?: Partial<NotificationItem>) => ({
    type: 'alert' as const,
    variant: 'success' as const,
    title,
    description: undefined, // Remove description
    priority: 'medium' as const,
    persistent: false,
    autoClose: true,
    autoCloseDelay: 500,
    soundType: 'success' as const,
    icon: CheckCircle2,
    ...options
  }),
  error: (title: string, description?: string, options?: Partial<NotificationItem>) => ({
    type: 'alert' as const,
    variant: 'error' as const,
    title,
    description: undefined, // Remove description
    priority: 'high' as const,
    persistent: true,
    autoClose: false,
    autoCloseDelay: 0,
    soundType: 'error' as const,
    icon: AlertTriangle,
    ...options
  }),
  warning: (title: string, description?: string, options?: Partial<NotificationItem>) => ({
    type: 'alert' as const,
    variant: 'warning' as const,
    title,
    description: undefined, // Remove description
    priority: 'medium' as const,
    persistent: false,
    autoClose: true,
    autoCloseDelay: 500,
    soundType: 'warning' as const,
    icon: AlertTriangle,
    ...options
  }),
  info: (title: string, description?: string, options?: Partial<NotificationItem>) => ({
    type: 'alert' as const,
    variant: 'info' as const,
    title,
    description: undefined, // Remove description
    priority: 'low' as const,
    persistent: false,
    autoClose: true,
    autoCloseDelay: 500,
    soundType: 'info' as const,
    icon: Info,
    ...options
  })
}
