"use client"

import React, { useMemo, memo, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

// Memoized individual toast component for better performance
const MemoizedToast = memo(function MemoizedToast({
  id,
  title,
  description,
  action,
  variant,
  className,
  onOpenChange,
  ...props
}: any) {
  const handleOpenChange = useCallback((open: boolean) => {
    onOpenChange?.(open)
  }, [onOpenChange])

  return (
    <Toast 
      key={id} 
      variant={variant}
      className={cn(
        "toast-optimized",
        "will-change-transform", // Optimize for animations
        className
      )}
      onOpenChange={handleOpenChange}
      {...props}
    >
      <div className="grid gap-1 flex-1">
        {title && (
          <ToastTitle className="toast-title-optimized">
            {title}
          </ToastTitle>
        )}
        {description && (
          <ToastDescription className="toast-description-optimized">
            {description}
          </ToastDescription>
        )}
      </div>
      {action && (
        <div className="toast-action-wrapper">
          {action}
        </div>
      )}
      <ToastClose className="toast-close-optimized" />
    </Toast>
  )
})

// Performance optimized toaster with virtual scrolling for large numbers of toasts
export function Toaster() {
  const { toasts } = useToast()

  // Memoize toast rendering to prevent unnecessary re-renders
  const renderedToasts = useMemo(() => {
    // Limit visible toasts for performance (show max 5, stack others)
    const maxVisible = 5
    const visibleToasts = toasts.slice(0, maxVisible)
    
    return visibleToasts.map(function ({ id, title, description, action, ...props }) {
      return (
        <MemoizedToast
          key={`toast-${id}`}
          id={id}
          title={title}
          description={description}
          action={action}
          {...props}
        />
      )
    })
  }, [toasts])

  // Memoize hidden toast count
  const hiddenCount = useMemo(() => {
    return Math.max(0, toasts.length - 5)
  }, [toasts.length])

  return (
    <ToastProvider 
      swipeDirection="right"
      swipeThreshold={50}
    >
      {/* Show hidden toast count indicator */}
      {hiddenCount > 0 && (
        <div className={cn(
          "fixed bottom-2 right-2 z-[201]",
          "px-3 py-1 bg-gray-900/80 backdrop-blur-sm text-white text-xs rounded-full",
          "border border-gray-700/50 shadow-lg",
          "animate-in fade-in-0 zoom-in-95 duration-300"
        )}>
          +{hiddenCount} more
        </div>
      )}
      
      {renderedToasts}
      
      <ToastViewport 
        position="bottom-right" 
        className={cn(
          "toast-viewport-optimized",
          "transform-gpu", // Use GPU acceleration
        )}
      />

      {/* Performance optimization styles */}
      <style jsx global>{`
        .toast-optimized {
          contain: layout style paint;
          will-change: transform, opacity;
        }
        
        .toast-title-optimized,
        .toast-description-optimized {
          contain: layout style;
        }
        
        .toast-viewport-optimized {
          contain: layout;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        
        .toast-close-optimized {
          will-change: transform;
        }
        
        /* Optimize animations for 60fps */
        .toast-optimized[data-state="open"] {
          animation-duration: 300ms;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .toast-optimized[data-state="closed"] {
          animation-duration: 200ms;
          animation-timing-function: ease-in;
        }
        
        /* Reduce paint area during animations */
        .toast-optimized[data-swipe="move"] {
          will-change: transform;
        }
        
        /* Memory optimization - remove animations on low-end devices */
        @media (max-width: 768px) and (max-height: 1024px) {
          .toast-optimized {
            animation-duration: 150ms !important;
          }
        }
        
        /* Battery optimization - reduce animations on low battery */
        @media (prefers-reduced-motion: reduce) {
          .toast-optimized,
          .toast-optimized * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </ToastProvider>
  )
}
