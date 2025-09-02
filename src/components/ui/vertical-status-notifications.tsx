'use client'

import React from 'react'
import { StatusNotification } from './status-notification'
import { Card, CardContent } from './card'
import { cn } from '@/lib/utils'

interface VerticalStatusNotificationsProps {
  className?: string
  notifications?: Array<{
    id: string
    status: 'pending' | 'submitted' | 'success' | 'failed' | 'expired'
    label?: string
  }>
}

export function VerticalStatusNotifications({ 
  className,
  notifications 
}: VerticalStatusNotificationsProps) {
  
  // Default notifications if none provided
  const defaultNotifications = [
    { id: 'success', status: 'success' as const, label: 'Success' },
    { id: 'pending', status: 'pending' as const, label: 'Pending' },
    { id: 'submitted', status: 'submitted' as const, label: 'Submitted' },
    { id: 'failed', status: 'failed' as const, label: 'Failed' },
    { id: 'expired', status: 'expired' as const, label: 'Expired' },
  ]

  const items = notifications || defaultNotifications

  return (
    <Card className={cn("w-fit", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {items.map((notification) => (
            <div key={notification.id} className="flex justify-center">
              <StatusNotification 
                status={notification.status}
                className="min-w-[140px] justify-center"
              >
                {notification.label}
              </StatusNotification>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Standalone version without card wrapper (for more flexibility)
export function SimpleVerticalStatusNotifications({ 
  className,
  notifications 
}: VerticalStatusNotificationsProps) {
  
  const defaultNotifications = [
    { id: 'success', status: 'success' as const, label: 'Success' },
    { id: 'pending', status: 'pending' as const, label: 'Pending' },
    { id: 'submitted', status: 'submitted' as const, label: 'Submitted' },
    { id: 'failed', status: 'failed' as const, label: 'Failed' },
    { id: 'expired', status: 'expired' as const, label: 'Expired' },
  ]

  const items = notifications || defaultNotifications

  return (
    <div className={cn("flex flex-col space-y-4 p-6 bg-white rounded-2xl shadow-lg", className)}>
      {items.map((notification) => (
        <div key={notification.id} className="flex justify-center">
          <StatusNotification 
            status={notification.status}
            className="min-w-[140px] justify-center"
          >
            {notification.label}
          </StatusNotification>
        </div>
      ))}
    </div>
  )
}
