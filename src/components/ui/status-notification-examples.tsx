'use client'

import React, { useState } from 'react'
import { StatusNotification } from './status-notification'
import { Button } from './button'
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function


// Example 1: Static Status Display
export function OrderStatusDisplay({ orderStatus }: { orderStatus: string }) {
  const getStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
      case 'pending':
        return 'pending' as const
      case 'shipped':
      case 'submitted':
        return 'submitted' as const
      case 'delivered':
      case 'completed':
        return 'success' as const
      case 'cancelled':
      case 'failed':
        return 'failed' as const
      case 'expired':
        return 'expired' as const
      default:
        return 'pending' as const
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Order Status</h3>
      <StatusNotification status={getStatus(orderStatus)}>
        {orderStatus}
      </StatusNotification>
    </div>
  )
}

// Example 2: Interactive Status Simulator
export function StatusSimulator() {
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'submitted' | 'success' | 'failed' | 'expired'>('pending')

  const statusFlow = ['pending', 'submitted', 'success'] as const
  const [step, setStep] = useState(0)

  const nextStep = () => {
    if (step < statusFlow.length - 1) {
      setStep(step + 1)
      setCurrentStatus(statusFlow[step + 1])
    }
  }

  const simulateFailure = () => {
    setCurrentStatus('failed')
    setStep(0)
  }

  const simulateExpired = () => {
    setCurrentStatus('expired')
    setStep(0)
  }

  const reset = () => {
    setCurrentStatus('pending')
    setStep(0)
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Status Flow Simulator</h3>
      
      <div className="flex justify-center mb-6">
        <StatusNotification status={currentStatus} />
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        <Button onClick={nextStep} disabled={step >= statusFlow.length - 1}>
          Next Step
        </Button>
        <Button onClick={simulateFailure} variant="destructive">
          Simulate Failure
        </Button>
        <Button onClick={simulateExpired} variant="outline">
          Simulate Expired
        </Button>
        <Button onClick={reset} variant="secondary">
          Reset
        </Button>
      </div>
    </div>
  )
}

// Example 3: Form Submission Status
export function FormSubmissionStatus() {
  const [status, setStatus] = useState<'pending' | 'submitted' | 'success' | 'failed' | 'expired'>('pending')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setStatus('pending')

    // Simulate API call
    setTimeout(() => {
      setStatus('submitted')
      
      setTimeout(() => {
        // Random success/failure
        if (Math.random() > 0.3) {
          setStatus('success')
        } else {
          setStatus('failed')
        }
        setIsSubmitting(false)
      }, 2000)
    }, 1000)
  }

  const reset = () => {
    setStatus('pending')
    setIsSubmitting(false)
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Form Submission Example</h3>
      
      <div className="flex justify-center mb-6">
        {status === 'pending' && !isSubmitting ? (
          <div className="text-gray-500">Ready to submit</div>
        ) : (
          <StatusNotification status={status} />
        )}
      </div>

      <div className="flex gap-2 justify-center">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || status === 'success'}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Form'}
        </Button>
        <Button onClick={reset} variant="outline">
          Reset
        </Button>
      </div>
    </div>
  )
}

// Example 4: Multiple Notifications List
export function NotificationsList() {
  const notifications = [
    { id: 1, message: "Payment processed", status: 'success' as const },
    { id: 2, message: "Order confirmation pending", status: 'pending' as const },
    { id: 3, message: "Document uploaded", status: 'submitted' as const },
    { id: 4, message: "Verification failed", status: 'failed' as const },
    { id: 5, message: "Session expired", status: 'expired' as const },
  ]

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Notifications List</h3>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>{notification.message}</span>
            <StatusNotification status={notification.status} showIcon={true} />
          </div>
        ))}
      </div>
    </div>
  )
}
