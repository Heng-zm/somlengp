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
    'top-left': 'fixed top-4 left-4 z-[200] flex max-h-[calc(100vh-2rem)] w-full flex-col p-2 max-w-[85vw] sm:max-w-[320px] md:max-w-[360px] gap-2 pointer-events-none',
    'top-right': 'fixed top-4 right-4 z-[200] flex max-h-[calc(100vh-2rem)] w-full flex-col p-2 max-w-[85vw] sm:max-w-[320px] md:max-w-[360px] gap-2 pointer-events-none',
    'top-center': 'fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex max-h-[calc(100vh-2rem)] w-full flex-col p-2 max-w-[85vw] sm:max-w-[320px] md:max-w-[360px] gap-2 pointer-events-none',
    'bottom-left': 'fixed bottom-4 left-4 z-[200] flex max-h-[calc(100vh-2rem)] w-full flex-col-reverse p-2 max-w-[85vw] sm:max-w-[320px] md:max-w-[360px] gap-2 pointer-events-none',
    'bottom-right': 'fixed bottom-4 right-4 z-[200] flex max-h-[calc(100vh-2rem)] w-full flex-col-reverse p-2 max-w-[85vw] sm:max-w-[320px] md:max-w-[360px] gap-2 pointer-events-none',
    'bottom-center': 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex max-h-[calc(100vh-2rem)] w-full flex-col-reverse p-2 max-w-[85vw] sm:max-w-[320px] md:max-w-[360px] gap-2 pointer-events-none',
  };
  
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        positionStyles[position],
        'toast-viewport',
        className
      )}
      {...props}
      style={{
        ...props.style,
        '--toast-viewport-padding': '1rem',
      } as React.CSSProperties}
    />
  );
})
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-lg border border-white/20 dark:border-gray-700/20 px-4 py-3 shadow-lg backdrop-blur-md transition-all duration-300 ease-out data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] transform-gpu before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/5 before:to-transparent before:backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-emerald-500/90 via-green-500/90 to-teal-600/90 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 border-emerald-400/30",
        success: "bg-gradient-to-br from-emerald-500/90 via-green-500/90 to-teal-600/90 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 border-emerald-400/30",
        error: "bg-gradient-to-br from-red-500/90 via-rose-500/90 to-pink-600/90 text-white shadow-red-500/25 hover:shadow-red-500/40 border-red-400/30",
        warning: "bg-gradient-to-br from-amber-400/90 via-yellow-500/90 to-orange-500/90 text-white shadow-amber-500/25 hover:shadow-amber-500/40 border-amber-400/30",
        info: "bg-gradient-to-br from-blue-500/90 via-cyan-500/90 to-sky-600/90 text-white shadow-blue-500/25 hover:shadow-blue-500/40 border-blue-400/30",
        destructive: "bg-gradient-to-br from-red-600/90 via-red-500/90 to-rose-600/90 text-white shadow-red-600/25 hover:shadow-red-600/40 border-red-500/30",
        loading: "bg-gradient-to-br from-blue-500/90 via-indigo-500/90 to-purple-600/90 text-white shadow-blue-500/25 hover:shadow-blue-500/40 border-blue-400/30 animate-pulse",
        premium: "bg-gradient-to-br from-purple-600/90 via-violet-500/90 to-fuchsia-600/90 text-white shadow-purple-500/25 hover:shadow-purple-500/40 border-purple-400/30",
        glass: "bg-white/10 dark:bg-gray-900/10 backdrop-blur-2xl border-white/40 dark:border-gray-600/40 text-gray-800 dark:text-white shadow-xl hover:shadow-2xl",
        neon: "bg-gradient-to-br from-purple-900/80 to-pink-900/80 border-2 border-purple-400/60 text-purple-100 shadow-2xl shadow-purple-500/30 backdrop-blur-xl hover:shadow-purple-500/50 animate-pulse",
        celebration: "bg-gradient-to-br from-yellow-400/90 via-orange-500/90 to-red-500/90 text-white shadow-yellow-500/25 hover:shadow-yellow-500/40 border-yellow-400/30 animate-bounce",
        urgent: "bg-gradient-to-br from-red-600/90 via-red-500/90 to-rose-600/90 text-white shadow-red-600/25 hover:shadow-red-600/40 border-red-500/30 animate-pulse shadow-2xl",
        minimal: "bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 text-gray-800 dark:text-white shadow-lg",
        frosted: "bg-white/20 dark:bg-gray-900/20 backdrop-blur-3xl border-white/30 dark:border-gray-600/30 text-white shadow-2xl",
        rainbow: "bg-gradient-to-r from-pink-500 via-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 text-white shadow-2xl animate-pulse border-2 border-white/40",
      },
      size: {
        xs: "px-3 py-1.5 text-xs max-w-[280px] min-h-[2rem]",
        sm: "px-3 py-2 text-sm max-w-[320px] min-h-[2.5rem]",
        default: "px-4 py-3 max-w-md min-h-[3rem]",
        lg: "px-6 py-4 text-lg max-w-lg min-h-[4rem]",
        xl: "px-8 py-6 text-xl max-w-xl min-h-[5rem]",
      },
      priority: {
        low: "opacity-90",
        medium: "ring-1 ring-white/20 dark:ring-gray-600/20",
        high: "ring-2 ring-yellow-400/60 dark:ring-yellow-500/60 shadow-yellow-400/20 animate-pulse",
        critical: "ring-2 ring-red-500/80 dark:ring-red-400/80 shadow-2xl shadow-red-500/30 animate-bounce",
        urgent: "ring-4 ring-red-600/80 dark:ring-red-400/80 shadow-2xl shadow-red-600/50 animate-pulse",
      },
      animation: {
        slide: "data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full",
        fade: "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        scale: "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
        bounce: "data-[state=open]:animate-in data-[state=open]:bounce-in",
        flip: "data-[state=open]:animate-in data-[state=open]:flip-in-x",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
      priority: "medium",
      animation: "slide",
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
      "inline-flex h-6 shrink-0 items-center justify-center rounded border bg-transparent px-2 text-xs font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
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
      "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/80 opacity-0 transition-all hover:text-white hover:bg-white/20 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-white/40 group-hover:opacity-100 backdrop-blur-sm",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-2.5 w-2.5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-xs font-semibold leading-tight tracking-tight text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]", className)}
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
    className={cn("text-xs opacity-90 leading-snug mt-0.5 text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]", className)}
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
