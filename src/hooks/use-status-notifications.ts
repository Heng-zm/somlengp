'use client'

import { useCallback } from 'react'
import { useNotifications, notifications } from '@/components/ui/notification-manager'
import { 
  AlertCircle, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Timer 
} from 'lucide-react'

export type StatusType = 'pending' | 'submitted' | 'success' | 'failed' | 'expired'

interface StatusNotificationOptions {
  persistent?: boolean
  autoClose?: boolean
  autoCloseDelay?: number
  showActions?: boolean
  onRetry?: () => void
  onDismiss?: () => void
}

export function useStatusNotifications() {
  const { addNotification } = useNotifications()

  const showStatus = useCallback((
    status: StatusType,
    title: string,
    description?: string,
    options: StatusNotificationOptions = {}
  ) => {
    const {
      persistent = false,
      autoClose = true,
      autoCloseDelay = 500,
      showActions = false,
      onRetry,
      onDismiss
    } = options

    const iconMap = {
      pending: AlertCircle,
      submitted: Send,
      success: CheckCircle2,
      failed: XCircle,
      expired: Timer
    }

    const getNotificationConfig = () => {
      const baseConfig = {
        icon: iconMap[status],
        persistent,
        autoClose,
        autoCloseDelay,
        actions: showActions && (status === 'failed' || status === 'expired') && onRetry ? [
          {
            label: 'Retry',
            onClick: onRetry,
            variant: 'default' as const
          },
          {
            label: 'Dismiss',
            onClick: onDismiss || (() => {}),
            variant: 'outline' as const
          }
        ] : undefined
      }

      switch (status) {
        case 'pending':
          return notifications.info(title, undefined, {
            ...baseConfig,
            persistent: true, // Pending should be persistent until resolved
            autoClose: false,
            soundType: 'info'
          })
        
        case 'submitted':
          return notifications.info(title, undefined, {
            ...baseConfig,
            soundType: 'info'
          })
        
        case 'success':
          return notifications.success(title, undefined, baseConfig)
        
        case 'failed':
          return notifications.error(title, undefined, {
            ...baseConfig,
            persistent: true, // Errors should persist until acknowledged
            autoClose: false
          })
        
        case 'expired':
          return notifications.warning(title, undefined, {
            ...baseConfig,
            persistent: true, // Expiry warnings should persist
            autoClose: false
          })
        
        default:
          return notifications.info(title, undefined, baseConfig)
      }
    }

    addNotification(getNotificationConfig())
  }, [addNotification])

  // Convenience methods for common use cases
  const pending = useCallback((title: string, description?: string, options?: StatusNotificationOptions) => {
    showStatus('pending', title, description, options)
  }, [showStatus])

  const submitted = useCallback((title: string, description?: string, options?: StatusNotificationOptions) => {
    showStatus('submitted', title, description, options)
  }, [showStatus])

  const success = useCallback((title: string, description?: string, options?: StatusNotificationOptions) => {
    showStatus('success', title, description, options)
  }, [showStatus])

  const failed = useCallback((title: string, description?: string, options?: StatusNotificationOptions) => {
    showStatus('failed', title, description, options)
  }, [showStatus])

  // Alias for failed for common usage
  const error = useCallback((title: string, description?: string, options?: StatusNotificationOptions) => {
    showStatus('failed', title, description, options)
  }, [showStatus])

  // Additional convenience methods for common notification types
  const warning = useCallback((title: string, description?: string, options?: StatusNotificationOptions) => {
    showStatus('expired', title, description, options) // Using 'expired' status for warnings
  }, [showStatus])

  const info = useCallback((title: string, description?: string, options?: StatusNotificationOptions) => {
    showStatus('pending', title, description, { ...options, persistent: false, autoClose: true }) // Using 'pending' status for info
  }, [showStatus])

  const expired = useCallback((title: string, description?: string, options?: StatusNotificationOptions) => {
    showStatus('expired', title, description, options)
  }, [showStatus])

  // Status flow helpers
  const startProcess = useCallback((processName: string, description?: string) => {
    pending(`${processName} Started`, description || `${processName} is now in progress...`)
  }, [pending])

  const completeProcess = useCallback((processName: string, description?: string) => {
    success(`${processName} Complete`, description || `${processName} has been completed successfully!`)
  }, [success])

  const failProcess = useCallback((processName: string, description?: string, onRetry?: () => void) => {
    failed(`${processName} Failed`, description || `${processName} could not be completed.`, {
      showActions: !!onRetry,
      onRetry
    })
  }, [failed])

  // Common workflows
  const apiRequest = useCallback(async (
    requestName: string,
    requestFn: () => Promise<any>,
    options: {
      onSuccess?: (result: any) => void
      onError?: (error: any) => void
      successMessage?: string
      errorMessage?: string
    } = {}
  ) => {
    const {
      onSuccess,
      onError,
      successMessage = `${requestName} completed successfully`,
      errorMessage = `${requestName} failed`
    } = options

    try {
      pending(requestName, 'Processing request...')
      const result = await requestFn()
      success(requestName, successMessage)
      onSuccess?.(result)
      return result
    } catch (error) {
      failed(requestName, errorMessage, {
        showActions: true,
        onRetry: () => apiRequest(requestName, requestFn, options)
      })
      onError?.(error)
      throw error
    }
  }, [pending, success, failed])

  const uploadFile = useCallback(async (
    fileName: string,
    uploadFn: () => Promise<any>
  ) => {
    return apiRequest(
      'File Upload',
      uploadFn,
      {
        successMessage: `${fileName} uploaded successfully`,
        errorMessage: `Failed to upload ${fileName}`
      }
    )
  }, [apiRequest])

  const formSubmission = useCallback(async (
    formName: string,
    submitFn: () => Promise<any>
  ) => {
    try {
      submitted(`${formName} Submitted`, 'Your form has been submitted for processing')
      const result = await submitFn()
      success(`${formName} Processed`, 'Your submission has been processed successfully')
      return result
    } catch (error) {
      failed(`${formName} Error`, 'There was an error processing your submission', {
        showActions: true,
        onRetry: () => formSubmission(formName, submitFn)
      })
      throw error
    }
  }, [submitted, success, failed])

  return {
    // Direct status methods
    showStatus,
    pending,
    submitted,
    success,
    failed,
    error, // Alias for failed
    expired,
    
    // Common convenience methods
    warning,
    info,
    
    // Process flow methods
    startProcess,
    completeProcess,
    failProcess,
    
    // Common workflow methods
    apiRequest,
    uploadFile,
    formSubmission
  }
}
