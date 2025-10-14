'use client'

import React, { useState, useEffect } from 'react'
import { StatusNotification } from './status-notification'
import { Button } from './button'
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions

// Demo 1: All Status Types Display
export function AllStatusDisplay() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center mb-8">Enhanced Notification Styles</h2>
      
      <div className="flex flex-col items-center gap-4 p-8 bg-gray-50 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">All Status Types</h3>
        
        <div className="flex flex-col gap-4 items-center">
          <StatusNotification status="pending">
            Pending
          </StatusNotification>
          
          <StatusNotification status="submitted">
            Submitted
          </StatusNotification>
          
          <StatusNotification status="success">
            Success
          </StatusNotification>
          
          <StatusNotification status="failed">
            Failed
          </StatusNotification>
          
          <StatusNotification status="expired">
            Expired
          </StatusNotification>
        </div>
      </div>
    </div>
  )
}

// Demo 2: Interactive Status Cycle
export function InteractiveStatusCycle() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const statuses: Array<"pending" | "submitted" | "success" | "failed" | "expired"> = [
    'pending', 'submitted', 'success', 'failed', 'expired'
  ]

  const nextStatus = () => {
    setCurrentIndex((prev) => (prev + 1) % statuses.length)
  }

  const prevStatus = () => {
    setCurrentIndex((prev) => (prev - 1 + statuses.length) % statuses.length)
  }

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-center mb-6">Interactive Status Cycle</h3>
      
      <div className="flex justify-center mb-6">
        <StatusNotification status={statuses[currentIndex]} />
      </div>

      <div className="flex gap-3 justify-center">
        <Button onClick={prevStatus} variant="outline">
          Previous
        </Button>
        <Button onClick={nextStatus}>
          Next Status
        </Button>
      </div>
    </div>
  )
}

// Demo 3: Animated Status Progression
export function AnimatedStatusProgression() {
  const [status, setStatus] = useState<"pending" | "submitted" | "success" | "failed" | "expired">('pending')
  const [isAnimating, setIsAnimating] = useState(false)

  const runProgression = async () => {
    setIsAnimating(true)
    setStatus('pending')
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    setStatus('submitted')
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    setStatus('success')
    
    setIsAnimating(false)
  }

  const simulateFailure = async () => {
    setIsAnimating(true)
    setStatus('pending')
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    setStatus('submitted')
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    setStatus('failed')
    
    setIsAnimating(false)
  }

  const simulateExpiration = () => {
    setStatus('expired')
  }

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
      <h3 className="text-xl font-semibold text-center mb-6">Animated Status Progression</h3>
      
      <div className="flex justify-center mb-6">
        <StatusNotification 
          status={status}
          className={isAnimating ? 'animate-pulse' : ''}
        />
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        <Button 
          onClick={runProgression} 
          disabled={isAnimating}
          className="bg-green-600 hover:bg-green-700"
        >
          Run Success Flow
        </Button>
        <Button 
          onClick={simulateFailure} 
          disabled={isAnimating}
          variant="destructive"
        >
          Simulate Failure
        </Button>
        <Button 
          onClick={simulateExpiration} 
          disabled={isAnimating}
          variant="outline"
        >
          Set Expired
        </Button>
      </div>
    </div>
  )
}

// Demo 4: Real-world Examples
export function RealWorldExamples() {
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "submitted" | "success" | "failed" | "expired">('pending')
  const [orderStatus, setOrderStatus] = useState<"pending" | "submitted" | "success" | "failed" | "expired">('submitted')
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "submitted" | "success" | "failed" | "expired">('success')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 bg-white rounded-xl shadow-md border">
        <h4 className="font-semibold mb-4 text-gray-800">Payment Processing</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Payment Status:</span>
            <StatusNotification status={paymentStatus} />
          </div>
          <Button 
            size="sm" 
            onClick={() => setPaymentStatus(paymentStatus === 'pending' ? 'success' : 'pending')}
            className="w-full"
          >
            Toggle Payment
          </Button>
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-md border">
        <h4 className="font-semibold mb-4 text-gray-800">Order Management</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Order Status:</span>
            <StatusNotification status={orderStatus} />
          </div>
          <Button 
            size="sm" 
            onClick={() => setOrderStatus(orderStatus === 'submitted' ? 'success' : 'submitted')}
            className="w-full"
          >
            Update Order
          </Button>
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-md border">
        <h4 className="font-semibold mb-4 text-gray-800">Account Verification</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Verification:</span>
            <StatusNotification status={verificationStatus} />
          </div>
          <Button 
            size="sm" 
            onClick={() => setVerificationStatus(verificationStatus === 'success' ? 'failed' : 'success')}
            className="w-full"
            variant="outline"
          >
            Toggle Verification
          </Button>
        </div>
      </div>
    </div>
  )
}

// Demo 5: Notification with Custom Content
export function CustomContentNotifications() {
  return (
    <div className="p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
      <h3 className="text-xl font-semibold text-center mb-6">Custom Content Examples</h3>
      
      <div className="space-y-4 flex flex-col items-center">
        <StatusNotification status="pending">
          <span>Processing payment...</span>
        </StatusNotification>
        
        <StatusNotification status="submitted">
          <span>Form submitted successfully</span>
        </StatusNotification>
        
        <StatusNotification status="success">
          <span>✨ Order completed!</span>
        </StatusNotification>
        
        <StatusNotification status="failed">
          <span>Upload failed - please retry</span>
        </StatusNotification>
        
        <StatusNotification status="expired">
          <span>Session timeout in 5 minutes</span>
        </StatusNotification>
      </div>
    </div>
  )
}

// Main Demo Component
export function EnhancedNotificationDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Enhanced UI Notifications
          </h1>
          <p className="text-lg text-gray-600">
            Beautiful status notifications with modern design and smooth animations
          </p>
        </div>

        <AllStatusDisplay />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <InteractiveStatusCycle />
          <AnimatedStatusProgression />
        </div>
        
        <RealWorldExamples />
        
        <CustomContentNotifications />
        
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Hover over any notification to see the enhanced hover effects
          </p>
        </div>
      </div>
    </div>
  )
}

export default EnhancedNotificationDemo
