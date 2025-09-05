"use client"

import * as React from "react"
import { Upload, Download, Check, X, AlertTriangle, Info, Clock, FileText, Image, Video, Music, Zap, Wifi, WifiOff, Battery, BatteryLow, Shield, ShieldAlert, Heart, Star, Trophy, Gift, Calendar, Mail, Phone, MapPin, CreditCard, User, Settings, HelpCircle } from "lucide-react"
import { AdvancedToast, AdvancedToastProps } from "./advanced-toast"
import { cn } from "@/lib/utils"

// Template configurations for common toast types
export const TOAST_TEMPLATES = {
  // File operations
  fileUpload: {
    variant: "organic" as const,
    icon: "default",
    animation: "spring" as const,
    progressType: "linear" as const,
    priority: "normal" as const,
    autoHide: false,
  },
  fileDownload: {
    variant: "ocean" as const,
    icon: "default",
    animation: "elastic" as const,
    progressType: "circular" as const,
    priority: "normal" as const,
    autoHide: false,
  },
  fileProcess: {
    variant: "cyberpunk" as const,
    icon: "loading",
    animation: "morphing" as const,
    progressType: "steps" as const,
    priority: "normal" as const,
    autoHide: false,
  },
  
  // Network operations
  connecting: {
    variant: "minimalist" as const,
    icon: "loading",
    animation: "ripple" as const,
    priority: "whisper" as const,
    autoHide: false,
  },
  connected: {
    variant: "forest" as const,
    icon: "success",
    animation: "bounce" as const,
    priority: "attention" as const,
  },
  disconnected: {
    variant: "sunset" as const,
    icon: "error",
    animation: "glitch" as const,
    priority: "urgent" as const,
  },
  
  // System notifications
  system: {
    variant: "midnight" as const,
    icon: "info",
    animation: "wave" as const,
    priority: "attention" as const,
    showTimestamp: true,
  },
  security: {
    variant: "neon" as const,
    icon: "warning",
    animation: "quantum" as const,
    priority: "critical" as const,
    showTimestamp: true,
  },
  
  // User interactions
  save: {
    variant: "forest" as const,
    icon: "success",
    animation: "particle" as const,
    priority: "attention" as const,
  },
  delete: {
    variant: "sunset" as const,
    icon: "error",
    animation: "spiral" as const,
    priority: "urgent" as const,
  },
  
  // Celebrations
  achievement: {
    variant: "holographic" as const,
    icon: "celebration",
    animation: "quantum" as const,
    priority: "critical" as const,
    autoHide: false,
    showTimestamp: true,
  },
  reward: {
    variant: "cosmic" as const,
    icon: "gift",
    animation: "morphing" as const,
    priority: "attention" as const,
  },
} as const

// File Upload Template Component
export interface FileUploadToastProps extends Omit<AdvancedToastProps, 'title' | 'description'> {
  fileName: string
  fileSize?: string
  progress?: number
  status?: 'uploading' | 'processing' | 'complete' | 'error'
}
export const FileUploadToast = React.forwardRef<
  HTMLLIElement,
  FileUploadToastProps
>(({ fileName, fileSize, progress = 0, status = 'uploading', ...props }, ref) => {
  const getStatusContent = () => {
    switch (status) {
      case 'uploading':
        return {
          title: "Uploading File",
          description: `${fileName}${fileSize ? ` (${fileSize})` : ''}`,
          icon: Upload,
          variant: "organic" as const,
        }
      case 'processing':
        return {
          title: "Processing File",
          description: `${fileName} is being processed...`,
          icon: "loading" as const,
          variant: "cyberpunk" as const,
        }
      case 'complete':
        return {
          title: "Upload Complete",
          description: `${fileName} has been uploaded successfully!`,
          icon: "success" as const,
          variant: "forest" as const,
        }
      case 'error':
        return {
          title: "Upload Failed",
          description: `Failed to upload ${fileName}. Please try again.`,
          icon: "error" as const,
          variant: "sunset" as const,
        }
    }
  }

  const statusContent = getStatusContent()
  
  return (
    <AdvancedToast
      ref={ref}
      {...TOAST_TEMPLATES.fileUpload}
      {...statusContent}
      progress={status === 'complete' ? 100 : progress}
      showProgress={status !== 'error' && status !== 'complete'}
      autoHide={status === 'complete' || status === 'error'}
      customContent={
        status === 'complete' && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-emerald-400/20 rounded-lg px-3 py-2">
              <div className="text-xs text-emerald-100 font-medium">Ready for use</div>
            </div>
          </div>
        )
      }
      {...props}
    />
  )
})

FileUploadToast.displayName = "FileUploadToast"

// Multi-step Process Template
export interface MultiStepToastProps extends Omit<AdvancedToastProps, 'title' | 'description' | 'progressSteps' | 'currentStep'> {
  processName: string
  steps: string[]
  currentStep: number
  status?: 'processing' | 'complete' | 'error'
  errorStep?: number
}
export const MultiStepToast = React.forwardRef<
  HTMLLIElement,
  MultiStepToastProps
>(({ processName, steps, currentStep, status = 'processing', errorStep, ...props }, ref) => {
  const getStatusContent = () => {
    switch (status) {
      case 'processing':
        return {
          title: `${processName} in Progress`,
          description: `Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]}`,
          variant: "cyberpunk" as const,
          icon: "loading" as const,
        }
      case 'complete':
        return {
          title: `${processName} Complete!`,
          description: `All ${steps.length} steps completed successfully.`,
          variant: "forest" as const,
          icon: "success" as const,
        }
      case 'error':
        return {
          title: `${processName} Failed`,
          description: `Error at step ${(errorStep ?? currentStep) + 1}: ${steps[errorStep ?? currentStep]}`,
          variant: "sunset" as const,
          icon: "error" as const,
        }
    }
  }

  const statusContent = getStatusContent()
  
  return (
    <AdvancedToast
      ref={ref}
      {...TOAST_TEMPLATES.fileProcess}
      {...statusContent}
      progressType="steps"
      progressSteps={steps}
      currentStep={status === 'complete' ? steps.length - 1 : currentStep}
      autoHide={status !== 'processing'}
      {...props}
    />
  )
})

MultiStepToast.displayName = "MultiStepToast"

// Notification Toast Template
export interface NotificationToastProps extends Omit<AdvancedToastProps, 'title' | 'description' | 'type'> {
  notificationType: 'email' | 'message' | 'call' | 'calendar' | 'system' | 'security' | 'update'
  title: string
  description?: string
  sender?: string
  time?: string
  actionLabel?: string
  onAction?: () => void
}
export const NotificationToast = React.forwardRef<
  HTMLLIElement,
  NotificationToastProps
>(({ notificationType, title, description, sender, time, actionLabel, onAction, ...props }, ref) => {
  const getTypeConfig = () => {
    switch (notificationType) {
      case 'email':
        return {
          icon: Mail,
          variant: "ocean" as const,
          animation: "spring" as const,
        }
      case 'message':
        return {
          icon: "info" as const,
          variant: "vibrant" as const,
          animation: "bounce" as const,
        }
      case 'call':
        return {
          icon: Phone,
          variant: "forest" as const,
          animation: "ripple" as const,
        }
      case 'calendar':
        return {
          icon: Calendar,
          variant: "desert" as const,
          animation: "fade" as const,
        }
      case 'system':
        return {
          icon: "info" as const,
          variant: "midnight" as const,
          animation: "wave" as const,
        }
      case 'security':
        return {
          icon: Shield,
          variant: "neon" as const,
          animation: "glitch" as const,
        }
      case 'update':
        return {
          icon: "default" as const,
          variant: "holographic" as const,
          animation: "morphing" as const,
        }
    }
  }

  const typeConfig = getTypeConfig()
  
  return (
    <AdvancedToast
      ref={ref}
      {...typeConfig}
      title={title}
      description={description}
      showTimestamp={!!time}
      onAction={onAction}
      actionLabel={actionLabel}
      priority={notificationType === 'security' ? 'urgent' : 'normal'}
      customContent={
        sender && (
          <div className="flex items-center gap-2 mt-2">
            <User className="h-3 w-3 opacity-70" />
            <span className="text-xs opacity-80">From: {sender}</span>
            {time && (
              <>
                <div className="w-1 h-1 bg-white/40 rounded-full" />
                <span className="text-xs opacity-70">{time}</span>
              </>
            )}
          </div>
        )
      }
      {...props}
    />
  )
})

NotificationToast.displayName = "NotificationToast"

// Status Update Toast Template
export interface StatusToastProps extends Omit<AdvancedToastProps, 'title' | 'description'> {
  status: 'online' | 'offline' | 'away' | 'busy' | 'connecting' | 'error'
  service?: string
  details?: string
}
export const StatusToast = React.forwardRef<
  HTMLLIElement,
  StatusToastProps
>(({ status, service = 'System', details, ...props }, ref) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          title: `${service} Online`,
          description: details || 'Connection established successfully',
          icon: Wifi,
          variant: "forest" as const,
          animation: "bounce" as const,
          priority: "attention" as const,
        }
      case 'offline':
        return {
          title: `${service} Offline`,
          description: details || 'Connection lost',
          icon: WifiOff,
          variant: "sunset" as const,
          animation: "fade" as const,
          priority: "urgent" as const,
        }
      case 'away':
        return {
          title: `${service} Away`,
          description: details || 'Status updated to away',
          icon: Clock,
          variant: "desert" as const,
          animation: "elastic" as const,
          priority: "whisper" as const,
        }
      case 'busy':
        return {
          title: `${service} Busy`,
          description: details || 'Do not disturb mode enabled',
          icon: AlertTriangle,
          variant: "autumn" as const,
          animation: "scale" as const,
          priority: "normal" as const,
        }
      case 'connecting':
        return {
          title: `Connecting to ${service}`,
          description: details || 'Establishing connection...',
          icon: "loading" as const,
          variant: "cyberpunk" as const,
          animation: "ripple" as const,
          priority: "normal" as const,
          autoHide: false,
        }
      case 'error':
        return {
          title: `${service} Error`,
          description: details || 'An error occurred',
          icon: "error" as const,
          variant: "sunset" as const,
          animation: "glitch" as const,
          priority: "critical" as const,
        }
    }
  }

  const statusConfig = getStatusConfig()
  
  return (
    <AdvancedToast
      ref={ref}
      {...statusConfig}
      showTimestamp
      {...props}
    />
  )
})

StatusToast.displayName = "StatusToast"

// Achievement Toast Template
export interface AchievementToastProps extends Omit<AdvancedToastProps, 'title' | 'description'> {
  achievementTitle: string
  description?: string
  points?: number
  level?: number
  badge?: string
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
}
export const AchievementToast = React.forwardRef<
  HTMLLIElement,
  AchievementToastProps
>(({ achievementTitle, description, points, level, badge, rarity = 'common', ...props }, ref) => {
  const getRarityConfig = () => {
    switch (rarity) {
      case 'common':
        return {
          variant: "forest" as const,
          icon: Star,
          animation: "bounce" as const,
        }
      case 'rare':
        return {
          variant: "ocean" as const,
          icon: Trophy,
          animation: "spring" as const,
        }
      case 'epic':
        return {
          variant: "cosmic" as const,
          icon: "celebration" as const,
          animation: "particle" as const,
        }
      case 'legendary':
        return {
          variant: "holographic" as const,
          icon: "star" as const,
          animation: "quantum" as const,
        }
    }
  }

  const rarityConfig = getRarityConfig()
  
  return (
    <AdvancedToast
      ref={ref}
      {...rarityConfig}
      title={`🏆 ${achievementTitle}`}
      description={description}
      priority="critical"
      size="spacious"
      autoHide={false}
      showTimestamp
      customContent={
        <div className="mt-3 space-y-2">
          {points && (
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-200">+{points} points</span>
            </div>
          )}
          {level && (
            <div className="flex items-center gap-2">
              <Star className="h-3 w-3 text-blue-400" />
              <span className="text-xs font-medium text-blue-200">Level {level}</span>
            </div>
          )}
          {badge && (
            <div className="flex items-center gap-2">
              <Gift className="h-3 w-3 text-purple-400" />
              <span className="text-xs font-medium text-purple-200">{badge} badge unlocked</span>
            </div>
          )}
          <div className="text-xs opacity-60 capitalize font-medium">
            {rarity} Achievement
          </div>
        </div>
      }
      {...props}
    />
  )
})

AchievementToast.displayName = "AchievementToast"

// Payment Toast Template
export interface PaymentToastProps extends Omit<AdvancedToastProps, 'title' | 'description' | 'type'> {
  type: 'success' | 'failed' | 'pending' | 'refund'
  amount: string
  currency?: string
  method?: string
  recipient?: string
  transactionId?: string
}

export const PaymentToast = React.forwardRef<
  HTMLLIElement,
  PaymentToastProps
>(({ type, amount, currency = 'USD', method, recipient, transactionId, ...props }, ref) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          title: "Payment Successful",
          description: `${currency} ${amount} has been sent${recipient ? ` to ${recipient}` : ''}`,
          icon: Check,
          variant: "forest" as const,
          animation: "spring" as const,
          priority: "attention" as const,
        }
      case 'failed':
        return {
          title: "Payment Failed",
          description: `Failed to send ${currency} ${amount}${recipient ? ` to ${recipient}` : ''}`,
          icon: X,
          variant: "sunset" as const,
          animation: "glitch" as const,
          priority: "urgent" as const,
        }
      case 'pending':
        return {
          title: "Payment Pending",
          description: `${currency} ${amount} payment is being processed`,
          icon: "loading" as const,
          variant: "cyberpunk" as const,
          animation: "ripple" as const,
          priority: "normal" as const,
        }
      case 'refund':
        return {
          title: "Refund Processed",
          description: `${currency} ${amount} has been refunded`,
          icon: "info" as const,
          variant: "ocean" as const,
          animation: "wave" as const,
          priority: "attention" as const,
        }
    }
  }

  const typeConfig = getTypeConfig()
  
  return (
    <AdvancedToast
      ref={ref}
      {...typeConfig}
      showTimestamp
      customContent={
        <div className="mt-3 space-y-1">
          {method && (
            <div className="flex items-center gap-2">
              <CreditCard className="h-3 w-3 opacity-70" />
              <span className="text-xs opacity-80">Method: {method}</span>
            </div>
          )}
          {transactionId && (
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3 opacity-70" />
              <span className="text-xs opacity-80">ID: {transactionId}</span>
            </div>
          )}
        </div>
      }
      {...props}
    />
  )
})

PaymentToast.displayName = "PaymentToast"

