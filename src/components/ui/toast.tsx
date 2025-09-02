"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

interface ToastViewportProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  ToastViewportProps
>(({ className, position = 'bottom-right', ...props }, ref) => {
  const positionStyles = {
    'top-left': 'fixed top-0 left-0 z-[100] flex max-h-screen w-full flex-col p-4 md:max-w-[440px] gap-2',
    'top-right': 'fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col p-4 md:max-w-[440px] gap-2',
    'top-center': 'fixed top-0 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen w-full flex-col p-4 md:max-w-[440px] gap-2',
    'bottom-left': 'fixed bottom-0 left-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 md:max-w-[440px] gap-2',
    'bottom-right': 'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 md:max-w-[440px] gap-2',
    'bottom-center': 'fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen w-full flex-col-reverse p-4 md:max-w-[440px] gap-2',
  };
  
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        positionStyles[position],
        className
      )}
      {...props}
    />
  );
})
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-full border-0 px-6 py-4 shadow-lg transition-all duration-300 ease-in-out data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-green-200/50 hover:shadow-green-300/60",
        success: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-green-200/50 hover:shadow-green-300/60",
        error: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200/50 hover:shadow-red-300/60",
        warning: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-200/50 hover:shadow-amber-300/60",
        info: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200/50 hover:shadow-blue-300/60",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200/50 hover:shadow-red-300/60",
        loading: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200/50 hover:shadow-blue-300/60 animate-pulse",
        premium: "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-purple-200/50 hover:shadow-purple-300/60",
        glass: "bg-white/20 dark:bg-gray-900/20 backdrop-blur-md border border-white/30 dark:border-gray-700/30 text-white shadow-xl",
        neon: "bg-gradient-to-r from-purple-900/80 to-pink-900/80 border border-purple-500/50 text-purple-100 shadow-lg shadow-purple-500/25 backdrop-blur-sm",
      },
      size: {
        sm: "p-3 text-sm max-w-xs",
        default: "p-4 max-w-md",
        lg: "p-6 text-lg max-w-lg",
      },
      priority: {
        low: "",
        medium: "ring-1 ring-gray-200 dark:ring-gray-700",
        high: "ring-2 ring-yellow-400/50 dark:ring-yellow-500/50",
        critical: "ring-2 ring-red-500/75 dark:ring-red-400/75 shadow-xl shadow-red-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      priority: "medium",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/80 opacity-0 transition-all hover:text-white hover:bg-white/20 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/40 group-hover:opacity-100 backdrop-blur-sm",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3 w-3" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-none tracking-tight text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90 leading-relaxed mt-1 text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
