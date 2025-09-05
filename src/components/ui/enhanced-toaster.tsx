"use client"

import { useToast } from "@/hooks/use-toast"
import React, { useEffect, useState } from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastAction,
} from "@/components/ui/toast"
import { CheckCircle, AlertTriangle, Info, AlertCircle, Loader2, Sparkles, Zap, Trophy, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced Toast with Progress Bar Component
function ToastWithProgress({ 
  id, 
  title, 
  description, 
  action, 
  progress, 
  variant,
  icon: CustomIcon,
  priority = 'medium',
  ...props 
}: any) {
  const [currentProgress, setCurrentProgress] = useState(progress || 0)

  useEffect(() => {
    if (progress !== undefined) {
      setCurrentProgress(progress)
    }
  }, [progress])

  // Icon mapping for different variants
  const getIcon = () => {
    if (CustomIcon) return <CustomIcon className="h-5 w-5 shrink-0" />
    
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5 shrink-0" />
      case 'error':
      case 'destructive':
        return <AlertCircle className="h-5 w-5 shrink-0" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 shrink-0" />
      case 'info':
        return <Info className="h-5 w-5 shrink-0" />
      case 'loading':
        return <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
      case 'premium':
        return <Trophy className="h-5 w-5 shrink-0" />
      case 'neon':
        return <Sparkles className="h-5 w-5 shrink-0" />
      default:
        return <Zap className="h-5 w-5 shrink-0" />
    }
  }

  const getPriorityStyles = () => {
    switch (priority) {
      case 'critical':
        return "animate-bounce"
      case 'high':
        return "animate-pulse"
      default:
        return ""
    }
  }

  return (
    <Toast 
      key={id} 
      variant={variant}
      className={cn(
        "toast-enhanced relative overflow-visible",
        getPriorityStyles(),
        // Stacking effect for multiple toasts
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
        "data-[state=open]:slide-in-from-bottom-full",
        "data-[state=open]:sm:slide-in-from-bottom-full"
      )}
      {...props}
    >
      {/* Background glow effect for high priority */}
      {priority === 'critical' && (
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-3xl blur-lg animate-pulse" />
      )}
      
      <div className="relative flex items-start gap-3 w-full">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 mt-0.5",
          variant === 'loading' && "animate-pulse"
        )}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          {title && (
            <ToastTitle className={cn(
              "text-base font-semibold leading-tight",
              priority === 'critical' && "animate-pulse text-red-100"
            )}>
              {title}
            </ToastTitle>
          )}
          {description && (
            <ToastDescription className="text-sm opacity-95 leading-relaxed">
              {description}
            </ToastDescription>
          )}

          {/* Progress Bar */}
          {currentProgress !== undefined && currentProgress >= 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs opacity-80">
                <span>Progress</span>
                <span>{Math.round(currentProgress)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full bg-white/90 transition-all duration-500 ease-out rounded-full",
                    currentProgress === 100 && "bg-emerald-400"
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, currentProgress))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>

      <ToastClose className={cn(
        "toast-close-enhanced",
        priority === 'critical' && "hover:bg-red-500/20"
      )} />

      {/* Floating particles effect for premium toasts */}
      {variant === 'premium' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-1 h-1 bg-white/60 rounded-full",
                "animate-pulse opacity-0 animate-float"
              )}
              style={{
                left: `${20 + i * 30}%`,
                top: `${30 + i * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
      )}
    </Toast>
  )
}

// Toast Stack Manager Component
function ToastStackManager({ toasts }: { toasts: any[] }) {
  const maxVisible = 4;
  const visibleToasts = toasts.slice(0, maxVisible);
  const hiddenCount = Math.max(0, toasts.length - maxVisible);

  return (
    <>
      {/* Stack indicator for hidden toasts */}
      {hiddenCount > 0 && (
        <div className="toast-stack-indicator pointer-events-auto mb-2 px-4 py-2 bg-gray-900/80 backdrop-blur-md text-white text-xs rounded-lg shadow-lg border border-gray-700/50">
          +{hiddenCount} more notification{hiddenCount > 1 ? 's' : ''}
        </div>
      )}

      {/* Visible toasts with stacking effect */}
      {visibleToasts.map((toast, index) => (
        <div
          key={toast.id}
          className={cn(
            "toast-stack-item transition-all duration-300 ease-out",
            index > 0 && "mt-1 scale-95 opacity-80",
            index > 1 && "scale-90 opacity-60",
            index > 2 && "scale-85 opacity-40"
          )}
          style={{
            zIndex: 1000 - index,
            transform: `translateY(${index * -2}px) scale(${1 - index * 0.05})`,
          }}
        >
          <ToastWithProgress {...toast} />
        </div>
      ))}
    </>
  )
}

// Main Enhanced Toaster Component
export function EnhancedToaster() {
  const { toasts } = useToast()
  const [toastHistory, setToastHistory] = useState<any[]>([])

  // Track toast history for analytics
  useEffect(() => {
    if (toasts.length > 0) {
      const newToasts = toasts.filter(toast => 
        !toastHistory.some(historyToast => historyToast.id === toast.id)
      )
      if (newToasts.length > 0) {
        setToastHistory(prev => [...prev, ...newToasts])
      }
    }
  }, [toasts, toastHistory])

  return (
    <ToastProvider swipeDirection="right" duration={5000}>
      <ToastStackManager toasts={toasts} />
      <ToastViewport 
        position="bottom-right" 
        className="toast-viewport-enhanced"
      />

      {/* Custom CSS for enhanced animations */}
      <style jsx global>{`
        .toast-enhanced {
          --toast-animation-duration: 400ms;
        }

        .toast-close-enhanced {
          transition: all 0.2s ease;
        }

        .toast-close-enhanced:hover {
          transform: scale(1.1);
          background: rgba(255, 255, 255, 0.2);
        }

        .toast-stack-item:hover {
          transform: translateY(0) scale(1) !important;
          opacity: 1 !important;
          z-index: 1010 !important;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
          50% { transform: translateY(-10px) rotate(180deg); opacity: 1; }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .toast-viewport-enhanced {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .toast-viewport-enhanced::-webkit-scrollbar {
          display: none;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .toast-enhanced {
            margin: 0 4px;
            max-width: calc(100vw - 2rem);
          }
          
          .toast-stack-item {
            transform: none !important;
            scale: 1 !important;
            opacity: 1 !important;
          }
        }

        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .toast-enhanced,
          .toast-stack-item,
          .toast-close-enhanced {
            transition: none !important;
            animation: none !important;
            transform: none !important;
          }

          .animate-float,
          .animate-pulse,
          .animate-bounce {
            animation: none !important;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .toast-enhanced {
            border: 2px solid currentColor !important;
            background: Canvas !important;
            color: CanvasText !important;
          }
        }

        /* Dark mode optimizations */
        @media (prefers-color-scheme: dark) {
          .toast-stack-indicator {
            background: rgba(17, 24, 39, 0.95);
            border-color: rgba(75, 85, 99, 0.5);
          }
        }
      `}</style>
    </ToastProvider>
  )
}

// Enhanced Action Button Component
export function EnhancedToastAction({ 
  children, 
  variant = 'default', 
  size = 'sm',
  className,
  ...props 
}: any) {
  return (
    <ToastAction
      className={cn(
        "toast-action-enhanced",
        "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium",
        "transition-all duration-200 ease-out",
        "hover:scale-105 active:scale-95",
        "backdrop-blur-sm",
        {
          'bg-white/20 text-white border-white/30 hover:bg-white/30': variant === 'default',
          'bg-emerald-500/20 text-emerald-100 border-emerald-400/30 hover:bg-emerald-500/30': variant === 'success',
          'bg-red-500/20 text-red-100 border-red-400/30 hover:bg-red-500/30': variant === 'error',
          'bg-amber-500/20 text-amber-100 border-amber-400/30 hover:bg-amber-500/30': variant === 'warning',
          'bg-blue-500/20 text-blue-100 border-blue-400/30 hover:bg-blue-500/30': variant === 'info',
        },
        {
          'px-2 py-1 text-xs': size === 'sm',
          'px-3 py-1.5 text-sm': size === 'default',
          'px-4 py-2 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </ToastAction>
  )
}

// Progress Toast Helper
export function createProgressToast(id: string, progress: number) {
  return {
    id,
    variant: progress === 100 ? 'success' : 'info',
    title: progress === 100 ? 'Complete!' : 'Processing...',
    description: progress === 100 ? 'Operation completed successfully' : undefined,
    progress,
    priority: progress === 100 ? 'high' : 'medium',
  }
}
