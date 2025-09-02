import React from 'react'
import { StatusNotification } from './status-notification'

export function StatusNotificationDemo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <div className="bg-gray-200 rounded-3xl p-12 shadow-xl max-w-md w-full">
        <div className="space-y-6 flex flex-col items-center">
          <StatusNotification status="pending" />
          <StatusNotification status="submitted" />
          <StatusNotification status="success" />
          <StatusNotification status="failed" />
          <StatusNotification status="expired" />
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-center">With Custom Text</h3>
          <div className="space-y-4 flex flex-col items-center">
            <StatusNotification status="pending">Processing...</StatusNotification>
            <StatusNotification status="submitted">Form Submitted</StatusNotification>
            <StatusNotification status="success">Payment Complete</StatusNotification>
            <StatusNotification status="failed">Upload Error</StatusNotification>
            <StatusNotification status="expired">Session Timeout</StatusNotification>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-center">Without Icons</h3>
          <div className="space-y-4 flex flex-col items-center">
            <StatusNotification status="pending" showIcon={false} />
            <StatusNotification status="submitted" showIcon={false} />
            <StatusNotification status="success" showIcon={false} />
            <StatusNotification status="failed" showIcon={false} />
            <StatusNotification status="expired" showIcon={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
