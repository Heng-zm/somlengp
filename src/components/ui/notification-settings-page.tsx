"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Switch } from "./switch"
import { Slider } from "./slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Badge } from "./badge"
import { 
  Settings, 
  Bell, 
  Volume2, 
  VolumeX, 
  Clock, 
  Monitor,
  Smartphone,
  Speaker,
  Moon,
  Sun,
  Save,
  RotateCcw,
  TestTube,
  Check,
  X,
  Info,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "./alert"
import { showSuccessToast, showInfoToast, showWarningToast, showErrorToast } from "@/lib/toast-utils"

interface NotificationPreferences {
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
  notificationTypes: {
    success: boolean
    error: boolean
    warning: boolean
    info: boolean
    system: boolean
  }
  soundTypes: {
    success: string
    error: string
    warning: string
    info: string
    system: string
  }
  vibration: boolean
  emailNotifications: boolean
  desktopNotifications: boolean
  mobileNotifications: boolean
  priorityFilter: 'all' | 'medium' | 'high' | 'critical'
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  soundEnabled: true,
  volume: 0.5,
  position: 'bottom-right',
  maxNotifications: 5,
  autoClose: true,
  autoCloseDelay: 5000,
  enablePersistence: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  notificationTypes: {
    success: true,
    error: true,
    warning: true,
    info: true,
    system: true
  },
  soundTypes: {
    success: 'chime',
    error: 'alert',
    warning: 'attention',
    info: 'notification',
    system: 'system'
  },
  vibration: true,
  emailNotifications: false,
  desktopNotifications: true,
  mobileNotifications: true,
  priorityFilter: 'all'
}

const soundOptions = [
  { value: 'chime', label: 'Chime' },
  { value: 'bell', label: 'Bell' },
  { value: 'alert', label: 'Alert' },
  { value: 'attention', label: 'Attention' },
  { value: 'notification', label: 'Notification' },
  { value: 'system', label: 'System' },
  { value: 'none', label: 'None' }
]

export function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setSaving] = useState(false)
  const [testingSound, setTestingSound] = useState<string | null>(null)

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notification-preferences')
      if (saved) {
        const parsed = JSON.parse(saved)
        setPreferences({ ...defaultPreferences, ...parsed })
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error)
    }
  }, [])

  // Track changes
  useEffect(() => {
    const saved = localStorage.getItem('notification-preferences')
    const currentSettings = JSON.stringify(preferences)
    const savedSettings = saved || JSON.stringify(defaultPreferences)
    setHasChanges(currentSettings !== savedSettings)
  }, [preferences])

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K, 
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const updateNestedPreference = <T extends keyof NotificationPreferences>(
    parent: T,
    key: keyof NotificationPreferences[T],
    value: any
  ) => {
    setPreferences(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as Record<string, any>),
        [key]: value
      }
    }))
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      localStorage.setItem('notification-preferences', JSON.stringify(preferences))
      setHasChanges(false)
      showSuccessToast('Settings Saved', 'Your notification preferences have been updated successfully.')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      showErrorToast('Save Failed', 'Unable to save your preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setPreferences(defaultPreferences)
    showInfoToast('Settings Reset', 'Notification preferences have been reset to default values.')
  }

  const testSound = async (soundType: string) => {
    setTestingSound(soundType)
    try {
      // Simulate playing sound
      await new Promise(resolve => setTimeout(resolve, 1000))
      showInfoToast('Sound Test', `Playing ${soundType} sound at ${Math.round(preferences.volume * 100)}% volume`)
    } catch (error) {
      showErrorToast('Sound Test Failed', 'Unable to play test sound. Please check your audio settings.')
    } finally {
      setTestingSound(null)
    }
  }

  const testNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    const testMessages = {
      success: { title: 'Test Success', description: 'This is a test success notification!' },
      error: { title: 'Test Error', description: 'This is a test error notification!' },
      warning: { title: 'Test Warning', description: 'This is a test warning notification!' },
      info: { title: 'Test Info', description: 'This is a test info notification!' }
    }

    const message = testMessages[type]
    
    switch (type) {
      case 'success':
        showSuccessToast(message.title, message.description)
        break
      case 'error':
        showErrorToast(message.title, message.description)
        break
      case 'warning':
        showWarningToast(message.title, message.description)
        break
      case 'info':
        showInfoToast(message.title, message.description)
        break
    }
  }

  const isInQuietHours = () => {
    if (!preferences.quietHours.enabled) return false
    
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number)
    const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number)
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime
    } else {
      return currentTime >= startTime || currentTime <= endTime
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Notification Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize how you receive notifications and alerts
        </p>
      </div>

      {/* Save/Reset Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved Changes
            </Badge>
          )}
          {isInQuietHours() && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Moon className="h-3 w-3" />
              Quiet Hours Active
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button
            onClick={savePreferences}
            disabled={!hasChanges || isLoading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Enable Notifications</h4>
              <p className="text-sm text-muted-foreground">Master toggle for all notifications</p>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={(enabled) => updatePreference('enabled', enabled)}
            />
          </div>

          {/* Position */}
          <div>
            <label className="text-sm font-medium">Position</label>
            <Select
              value={preferences.position}
              onValueChange={(position: any) => updatePreference('position', position)}
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
            <label className="text-sm font-medium">Maximum Visible Notifications</label>
            <Slider
              value={[preferences.maxNotifications]}
              onValueChange={(value) => updatePreference('maxNotifications', value[0])}
              min={1}
              max={10}
              step={1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Currently: {preferences.maxNotifications}
            </p>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-sm font-medium">Priority Filter</label>
            <Select
              value={preferences.priorityFilter}
              onValueChange={(filter: any) => updatePreference('priorityFilter', filter)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Show All</SelectItem>
                <SelectItem value="medium">Medium and Above</SelectItem>
                <SelectItem value="high">High and Critical Only</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Speaker className="h-5 w-5" />
            Sound Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Sounds */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Enable Sounds</h4>
              <p className="text-sm text-muted-foreground">Play audio for notifications</p>
            </div>
            <Switch
              checked={preferences.soundEnabled}
              onCheckedChange={(soundEnabled) => updatePreference('soundEnabled', soundEnabled)}
            />
          </div>

          {preferences.soundEnabled && (
            <>
              {/* Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Volume</label>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(preferences.volume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[preferences.volume * 100]}
                  onValueChange={(value) => updatePreference('volume', value[0] / 100)}
                  max={100}
                  step={1}
                />
              </div>

              {/* Sound Types */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Sound Types</h4>
                {Object.entries(preferences.soundTypes).map(([type, sound]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm capitalize">{type}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testSound(sound)}
                        disabled={testingSound === sound}
                        className="h-6 px-2 text-xs"
                      >
                        {testingSound === sound ? (
                          <>
                            <Volume2 className="h-3 w-3 animate-pulse mr-1" />
                            Playing...
                          </>
                        ) : (
                          <>
                            <TestTube className="h-3 w-3 mr-1" />
                            Test
                          </>
                        )}
                      </Button>
                    </div>
                    <Select
                      value={sound}
                      onValueChange={(value) => 
                        updateNestedPreference('soundTypes', type as keyof typeof preferences.soundTypes, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {soundOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Auto-Close Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Auto-Close Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Auto Close Notifications</h4>
              <p className="text-sm text-muted-foreground">Automatically dismiss notifications after a delay</p>
            </div>
            <Switch
              checked={preferences.autoClose}
              onCheckedChange={(autoClose) => updatePreference('autoClose', autoClose)}
            />
          </div>

          {preferences.autoClose && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Auto Close Delay</label>
                <span className="text-sm text-muted-foreground">
                  {preferences.autoCloseDelay / 1000}s
                </span>
              </div>
              <Slider
                value={[preferences.autoCloseDelay / 1000]}
                onValueChange={(value) => updatePreference('autoCloseDelay', value[0] * 1000)}
                min={1}
                max={30}
                step={1}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Enable Quiet Hours</h4>
              <p className="text-sm text-muted-foreground">Pause notifications during specified hours</p>
            </div>
            <Switch
              checked={preferences.quietHours.enabled}
              onCheckedChange={(enabled) => 
                updateNestedPreference('quietHours', 'enabled', enabled)
              }
            />
          </div>

          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <input
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={(e) =>
                    updateNestedPreference('quietHours', 'start', e.target.value)
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <input
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={(e) =>
                    updateNestedPreference('quietHours', 'end', e.target.value)
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(preferences.notificationTypes).map(([type, enabled]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {type === 'error' && <X className="h-4 w-4 text-red-500" />}
                  {type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                  {type === 'system' && <Settings className="h-4 w-4 text-gray-500" />}
                  <span className="text-sm capitalize font-medium">{type}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotification(type as any)}
                  className="h-6 px-2 text-xs"
                >
                  <TestTube className="h-3 w-3 mr-1" />
                  Test
                </Button>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(value) => 
                  updateNestedPreference('notificationTypes', type as keyof typeof preferences.notificationTypes, value)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Platform Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <div>
                <h4 className="text-sm font-medium">Desktop Notifications</h4>
                <p className="text-sm text-muted-foreground">Show browser notifications</p>
              </div>
            </div>
            <Switch
              checked={preferences.desktopNotifications}
              onCheckedChange={(value) => updatePreference('desktopNotifications', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <div>
                <h4 className="text-sm font-medium">Mobile Notifications</h4>
                <p className="text-sm text-muted-foreground">Vibration and mobile alerts</p>
              </div>
            </div>
            <Switch
              checked={preferences.mobileNotifications}
              onCheckedChange={(value) => updatePreference('mobileNotifications', value)}
            />
          </div>

          {preferences.mobileNotifications && (
            <div className="ml-6 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Vibration</h4>
                <p className="text-sm text-muted-foreground">Vibrate device for important notifications</p>
              </div>
              <Switch
                checked={preferences.vibration}
                onCheckedChange={(value) => updatePreference('vibration', value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => testNotification('success')}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Success
            </Button>
            <Button
              variant="outline"
              onClick={() => testNotification('error')}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4 text-red-500" />
              Error
            </Button>
            <Button
              variant="outline"
              onClick={() => testNotification('warning')}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Warning
            </Button>
            <Button
              variant="outline"
              onClick={() => testNotification('info')}
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4 text-blue-500" />
              Info
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      {preferences.enabled && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Notifications Active</AlertTitle>
          <AlertDescription>
            Your notification system is configured and active. 
            {isInQuietHours() && " Currently in quiet hours - notifications are paused."}
          </AlertDescription>
        </Alert>
      )}

      {!preferences.enabled && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Notifications Disabled</AlertTitle>
          <AlertDescription>
            You won&apos;t receive any notifications while they are disabled.
            Enable notifications above to stay informed about important events.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default NotificationSettingsPage
