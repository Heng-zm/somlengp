"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, Check, AlertTriangle, Info, Loader2, Sparkles, Zap, Heart, Star, Trophy, Gift, Clock, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Advanced Toast Variants with new styles
const advancedToastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border px-6 py-4 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-out data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out hover:scale-[1.02] active:scale-[0.98] transform-gpu",
  {
    variants: {
      variant: {
        // Enhanced variants with better styling
        modern: "bg-gradient-to-br from-slate-800/95 via-slate-700/95 to-slate-600/95 text-white border-slate-500/30 shadow-slate-500/20",
        cyberpunk: "bg-gradient-to-br from-cyan-900/90 via-blue-900/90 to-purple-900/90 text-cyan-100 border-cyan-400/40 shadow-cyan-500/30 shadow-2xl",
        organic: "bg-gradient-to-br from-green-800/90 via-emerald-700/90 to-teal-600/90 text-emerald-100 border-green-400/30 shadow-green-500/25",
        sunset: "bg-gradient-to-br from-orange-600/90 via-red-500/90 to-pink-600/90 text-white border-orange-400/30 shadow-orange-500/25",
        aurora: "bg-gradient-to-br from-purple-600/80 via-blue-600/80 to-green-500/80 text-white border-purple-400/40 shadow-purple-500/30",
        cosmic: "bg-gradient-to-br from-indigo-900/90 via-purple-800/90 to-pink-700/90 text-white border-indigo-400/30 shadow-indigo-500/25",
        ethereal: "bg-white/10 backdrop-blur-3xl border-white/20 text-white shadow-white/10",
        holographic: "bg-gradient-to-r from-pink-400/80 via-purple-400/80 via-indigo-400/80 to-cyan-400/80 text-white border-2 border-white/30 shadow-2xl animate-pulse",
        retro: "bg-gradient-to-br from-yellow-600/90 via-orange-600/90 to-red-600/90 text-white border-yellow-400/30 shadow-yellow-500/25",
        midnight: "bg-gradient-to-br from-gray-900/95 via-blue-900/95 to-black/95 text-blue-100 border-blue-400/20 shadow-blue-500/20",
        // New modern variants
        glassmorphism: "bg-white/10 backdrop-blur-2xl border-white/20 text-white shadow-2xl shadow-white/10 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/10 before:to-transparent",
        neumorphism: "bg-gradient-to-br from-gray-100 to-gray-300 text-gray-800 border-gray-300/50 shadow-[8px_8px_16px_rgba(163,163,163,0.4),-8px_-8px_16px_rgba(255,255,255,0.8)] dark:from-gray-800 dark:to-gray-900 dark:text-white dark:border-gray-600/50 dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(64,64,64,0.8)]",
        minimalist: "bg-white/95 text-gray-900 border-gray-200/60 shadow-sm backdrop-blur-sm dark:bg-gray-900/95 dark:text-white dark:border-gray-700/60",
        vibrant: "bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white border-white/30 shadow-2xl shadow-purple-500/30 animate-pulse",
        ocean: "bg-gradient-to-br from-blue-600/90 via-teal-500/90 to-cyan-400/90 text-white border-cyan-400/30 shadow-cyan-500/25",
        forest: "bg-gradient-to-br from-emerald-700/90 via-green-600/90 to-lime-500/90 text-white border-green-400/30 shadow-green-500/25",
        desert: "bg-gradient-to-br from-amber-600/90 via-orange-500/90 to-yellow-500/90 text-white border-amber-400/30 shadow-amber-500/25",
        arctic: "bg-gradient-to-br from-blue-200/80 via-cyan-100/80 to-white/80 text-gray-800 border-blue-300/40 shadow-blue-200/30 backdrop-blur-xl",
        neon: "bg-black/90 border-2 border-green-400 text-green-400 shadow-2xl shadow-green-500/30 before:absolute before:inset-0 before:rounded-2xl before:bg-green-400/5 animate-pulse",
        pastel: "bg-gradient-to-br from-pink-200/80 via-purple-200/80 to-blue-200/80 text-gray-700 border-purple-300/40 shadow-purple-200/30 backdrop-blur-xl",
        // Seasonal themes
        spring: "bg-gradient-to-br from-pink-300/80 via-green-300/80 to-yellow-300/80 text-gray-800 border-green-400/40 shadow-green-300/30",
        summer: "bg-gradient-to-br from-yellow-400/90 via-orange-400/90 to-red-400/90 text-white border-orange-400/40 shadow-orange-400/30",
        autumn: "bg-gradient-to-br from-orange-600/90 via-red-600/90 to-yellow-600/90 text-white border-orange-500/40 shadow-orange-500/30",
        winter: "bg-gradient-to-br from-blue-300/80 via-gray-300/80 to-white/80 text-gray-800 border-blue-400/40 shadow-blue-300/30 backdrop-blur-xl",
      },
      size: {
        compact: "px-4 py-2 text-sm max-w-sm min-h-[2.5rem]",
        comfortable: "px-6 py-4 max-w-md min-h-[4rem]",
        spacious: "px-8 py-6 text-lg max-w-lg min-h-[5rem]",
        expansive: "px-10 py-8 text-xl max-w-xl min-h-[6rem]",
      },
      animation: {
        slide: "data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full",
        fade: "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        scale: "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
        bounce: "data-[state=open]:animate-in data-[state=open]:bounce-in",
        flip: "data-[state=open]:animate-in data-[state=open]:flip-in-y",
        elastic: "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=open]:duration-700",
        spring: "data-[state=open]:animate-in data-[state=open]:zoom-in-75 data-[state=open]:duration-500 data-[state=open]:ease-spring",
        // New advanced animations
        morphing: "data-[state=open]:animate-morph-in data-[state=closed]:animate-morph-out",
        particle: "data-[state=open]:animate-particle-in data-[state=closed]:animate-particle-out",
        ripple: "data-[state=open]:animate-ripple-in data-[state=closed]:animate-ripple-out",
        magnetic: "data-[state=open]:animate-magnetic-in data-[state=closed]:animate-magnetic-out",
        glitch: "data-[state=open]:animate-glitch-in data-[state=closed]:animate-glitch-out",
        wave: "data-[state=open]:animate-wave-in data-[state=closed]:animate-wave-out",
        spiral: "data-[state=open]:animate-spiral-in data-[state=closed]:animate-spiral-out",
        quantum: "data-[state=open]:animate-quantum-in data-[state=closed]:animate-quantum-out",
      },
      priority: {
        whisper: "opacity-80 scale-95",
        normal: "",
        attention: "ring-2 ring-white/30 shadow-xl",
        urgent: "ring-2 ring-red-400/60 shadow-2xl shadow-red-500/30 animate-pulse",
        critical: "ring-4 ring-red-500/80 shadow-2xl shadow-red-600/50 animate-bounce scale-105",
      },
      interaction: {
        static: "",
        hoverable: "hover:shadow-3xl hover:scale-[1.03] transition-all duration-300",
        clickable: "cursor-pointer hover:shadow-3xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200",
        draggable: "cursor-move hover:shadow-3xl",
      },
    },
    defaultVariants: {
      variant: "modern",
      size: "comfortable",
      animation: "slide",
      priority: "normal",
      interaction: "hoverable",
    },
  }
)

// Icon mapping for different toast types
const TOAST_ICONS = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
  premium: Trophy,
  celebration: Sparkles,
  heart: Heart,
  star: Star,
  gift: Gift,
  clock: Clock,
  sound: Volume2,
  default: Zap,
} as const

interface AdvancedToastProps extends Omit<React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>, 'title'> {
  variant?: VariantProps<typeof advancedToastVariants>['variant']
  size?: VariantProps<typeof advancedToastVariants>['size']
  animation?: VariantProps<typeof advancedToastVariants>['animation']
  priority?: VariantProps<typeof advancedToastVariants>['priority']
  interaction?: VariantProps<typeof advancedToastVariants>['interaction']
  icon?: keyof typeof TOAST_ICONS | React.ComponentType<{ className?: string }>
  title?: React.ReactNode
  description?: React.ReactNode
  progress?: number
  showProgress?: boolean
  progressType?: 'linear' | 'circular' | 'steps'
  progressSteps?: string[]
  currentStep?: number
  autoHide?: boolean
  hideDelay?: number
  soundType?: string
  customContent?: React.ReactNode
  onAction?: () => void
  actionLabel?: string
  showTimestamp?: boolean
  // Accessibility props
  announceToScreenReader?: boolean
  ariaLive?: 'polite' | 'assertive' | 'off'
  role?: string
  announceProgress?: boolean
  keyboardNavigation?: boolean
}

export const AdvancedToast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  AdvancedToastProps
>(({ 
  className, 
  variant, 
  size, 
  animation, 
  priority, 
  interaction,
  icon,
  title,
  description,
  progress,
  showProgress,
  progressType = 'linear',
  progressSteps,
  currentStep,
  autoHide = true,
  hideDelay = 5000,
  customContent,
  onAction,
  actionLabel = "Action",
  showTimestamp = false,
  // Accessibility props
  announceToScreenReader = true,
  ariaLive = 'polite',
  role = 'status',
  announceProgress = true,
  keyboardNavigation = true,
  ...props
}, ref) => {
  const [currentProgress, setCurrentProgress] = React.useState(progress || 0)
  const [timestamp] = React.useState(new Date().toLocaleTimeString())

  React.useEffect(() => {
    if (progress !== undefined) {
      setCurrentProgress(progress)
    }
  }, [progress])

  // Get the appropriate icon
  const getIcon = () => {
    if (!icon) return null
    
    if (typeof icon === 'string') {
      const IconComponent = TOAST_ICONS[icon] || TOAST_ICONS.default
      return <IconComponent className="h-5 w-5 shrink-0 mt-0.5" />
    }
    
    if (React.isValidElement(icon)) {
      return icon
    }
    
    const IconComponent = icon as React.ComponentType<{ className?: string }>
    return <IconComponent className="h-5 w-5 shrink-0 mt-0.5" />
  }

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        advancedToastVariants({ variant, size, animation, priority, interaction }),
        "advanced-toast",
        // Keyboard navigation focus styles
        keyboardNavigation && "focus-within:ring-2 focus-within:ring-white/50 focus-within:ring-offset-2",
        className
      )}
      duration={autoHide ? hideDelay : Infinity}
      // Accessibility attributes
      aria-live={ariaLive}
      role={role}
      aria-atomic="true"
      aria-relevant="additions text"
      tabIndex={keyboardNavigation ? 0 : -1}
      {...props}
    >
      {/* Background effects */}
      {variant === 'holographic' && (
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 via-purple-400/20 via-indigo-400/20 to-cyan-400/20 animate-pulse rounded-2xl" />
      )}
      
      {variant === 'aurora' && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-green-500/10 animate-pulse rounded-2xl" />
      )}

      <div className="relative flex items-start gap-3 w-full">
        {/* Icon */}
        {icon && (
          <div className={cn(
            "flex-shrink-0",
            icon === 'loading' && "animate-spin",
            icon === 'celebration' && "animate-bounce"
          )}>
            {getIcon()}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 space-y-1 min-w-0">
          {/* Title and Timestamp */}
          <div className="flex items-center justify-between gap-2">
            {title && (
              <ToastPrimitives.Title className="text-base font-semibold leading-tight truncate">
                {title}
              </ToastPrimitives.Title>
            )}
            {showTimestamp && (
              <span className="text-xs opacity-70 shrink-0">{timestamp}</span>
            )}
          </div>

          {/* Description */}
          {description && (
            <ToastPrimitives.Description className="text-sm opacity-90 leading-relaxed">
              {description}
            </ToastPrimitives.Description>
          )}

          {/* Custom Content */}
          {customContent && (
            <div className="mt-2">
              {customContent}
            </div>
          )}

          {/* Enhanced Progress Indicators */}
          {(showProgress || progress !== undefined) && progress !== null && (
            <div className="mt-3">
              {progressType === 'linear' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs opacity-80">
                    <span>Progress</span>
                    <span>{Math.round(currentProgress)}%</span>
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div 
                      className={cn(
                        "h-full bg-white/90 transition-all duration-500 ease-out rounded-full relative overflow-hidden",
                        currentProgress === 100 && "bg-emerald-400"
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, currentProgress))}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>
              )}
              
              {progressType === 'circular' && (
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8">
                    <svg 
                      className="w-8 h-8 -rotate-90 transform" 
                      viewBox="0 0 32 32"
                    >
                      <circle 
                        cx="16" 
                        cy="16" 
                        r="14" 
                        fill="none" 
                        stroke="rgba(255,255,255,0.2)" 
                        strokeWidth="2"
                      />
                      <circle 
                        cx="16" 
                        cy="16" 
                        r="14" 
                        fill="none" 
                        stroke="rgba(255,255,255,0.9)" 
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 14}`}
                        strokeDashoffset={`${2 * Math.PI * 14 - (currentProgress / 100) * 2 * Math.PI * 14}`}
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium">{Math.round(currentProgress)}%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs opacity-80">Processing...</div>
                  </div>
                </div>
              )}
              
              {progressType === 'steps' && progressSteps && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs opacity-80">
                    <span>Step Progress</span>
                    <span>{currentStep ? currentStep + 1 : 1} of {progressSteps.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {progressSteps.map((step, index) => {
                      const isCompleted = currentStep !== undefined ? index <= currentStep : false
                      const isCurrent = currentStep !== undefined ? index === currentStep : index === 0
                      
                      return (
                        <React.Fragment key={index}>
                          <div 
                            className={cn(
                              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-all duration-300",
                              isCompleted 
                                ? "bg-white text-black" 
                                : isCurrent 
                                ? "bg-white/50 text-white ring-2 ring-white/30" 
                                : "bg-white/20 text-white/60"
                            )}
                            title={step}
                          >
                            {isCompleted ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>
                          {index < progressSteps.length - 1 && (
                            <div 
                              className={cn(
                                "flex-1 h-0.5 transition-all duration-300",
                                isCompleted ? "bg-white" : "bg-white/20"
                              )}
                            />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                  {currentStep !== undefined && progressSteps[currentStep] && (
                    <div className="text-xs opacity-80 mt-1">
                      Current: {progressSteps[currentStep]}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          {onAction && (
            <div className="mt-3">
              <button
                onClick={onAction}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg",
                  "bg-white/20 hover:bg-white/30 transition-colors",
                  "border border-white/30 hover:border-white/50",
                  "backdrop-blur-sm"
                )}
              >
                {actionLabel}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Close Button */}
      <ToastPrimitives.Close
        className={cn(
          "absolute right-2 top-2 rounded-full p-1.5",
          "text-white/60 hover:text-white/90 hover:bg-white/10",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-white/30",
          "backdrop-blur-sm group-hover:opacity-100 opacity-0"
        )}
      >
        <X className="h-3.5 w-3.5" />
      </ToastPrimitives.Close>

      {/* Particle effects for special variants */}
      {icon === 'celebration' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-1 h-1 bg-yellow-400 rounded-full",
                "animate-bounce opacity-0"
              )}
              style={{
                left: `${20 + i * 12}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s',
                animationIterationCount: 'infinite'
              }}
            />
          ))}
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes morph-in {
          0% {
            transform: scale(0) rotate(180deg);
            border-radius: 50%;
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(90deg);
            border-radius: 25%;
            opacity: 0.7;
          }
          100% {
            transform: scale(1) rotate(0deg);
            border-radius: 1rem;
            opacity: 1;
          }
        }
        
        @keyframes morph-out {
          0% {
            transform: scale(1) rotate(0deg);
            border-radius: 1rem;
            opacity: 1;
          }
          50% {
            transform: scale(1.2) rotate(-90deg);
            border-radius: 25%;
            opacity: 0.7;
          }
          100% {
            transform: scale(0) rotate(-180deg);
            border-radius: 50%;
            opacity: 0;
          }
        }
        
        @keyframes particle-in {
          0% {
            transform: scale(0) translateY(100px);
            opacity: 0;
            filter: blur(10px);
          }
          50% {
            transform: scale(1.1) translateY(-10px);
            opacity: 0.8;
            filter: blur(2px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
            filter: blur(0);
          }
        }
        
        @keyframes particle-out {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
            filter: blur(0);
          }
          100% {
            transform: scale(0) translateY(-100px);
            opacity: 0;
            filter: blur(10px);
          }
        }
        
        @keyframes ripple-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
            box-shadow: 0 0 0 0 currentColor;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
            box-shadow: 0 0 0 20px transparent;
          }
        }
        
        @keyframes ripple-out {
          0% {
            transform: scale(1);
            opacity: 1;
            box-shadow: 0 0 0 0 currentColor;
          }
          100% {
            transform: scale(0.3);
            opacity: 0;
            box-shadow: 0 0 0 20px transparent;
          }
        }
        
        @keyframes magnetic-in {
          0% {
            transform: scale(0.5) translateX(-100px) rotateX(90deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.1) translateX(10px) rotateX(-10deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(1) translateX(0) rotateX(0deg);
            opacity: 1;
          }
        }
        
        @keyframes magnetic-out {
          0% {
            transform: scale(1) translateX(0) rotateX(0deg);
            opacity: 1;
          }
          40% {
            transform: scale(1.1) translateX(-10px) rotateX(10deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(0.5) translateX(100px) rotateX(-90deg);
            opacity: 0;
          }
        }
        
        @keyframes glitch-in {
          0%, 100% {
            transform: translate(0);
            filter: hue-rotate(0deg);
            opacity: 0;
          }
          10% {
            transform: translate(-2px, 2px);
            filter: hue-rotate(90deg);
            opacity: 0.3;
          }
          20% {
            transform: translate(2px, -2px);
            filter: hue-rotate(180deg);
            opacity: 0.6;
          }
          30% {
            transform: translate(-2px, -2px);
            filter: hue-rotate(270deg);
            opacity: 0.8;
          }
          40%, 60% {
            transform: translate(2px, 2px);
            filter: hue-rotate(360deg);
            opacity: 1;
          }
        }
        
        @keyframes glitch-out {
          0% {
            transform: translate(0);
            filter: hue-rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: translate(-3px, 3px);
            filter: hue-rotate(90deg);
            opacity: 0.7;
          }
          50% {
            transform: translate(3px, -3px);
            filter: hue-rotate(180deg);
            opacity: 0.4;
          }
          75% {
            transform: translate(-3px, -3px);
            filter: hue-rotate(270deg);
            opacity: 0.2;
          }
          100% {
            transform: translate(3px, 3px);
            filter: hue-rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes wave-in {
          0% {
            clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);
            opacity: 0;
          }
          50% {
            clip-path: polygon(0 60%, 100% 80%, 100% 100%, 0 100%);
            opacity: 0.7;
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            opacity: 1;
          }
        }
        
        @keyframes wave-out {
          0% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            opacity: 1;
          }
          50% {
            clip-path: polygon(0 40%, 100% 20%, 100% 100%, 0 100%);
            opacity: 0.7;
          }
          100% {
            clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);
            opacity: 0;
          }
        }
        
        @keyframes spiral-in {
          0% {
            transform: rotate(-720deg) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes spiral-out {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: rotate(720deg) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes quantum-in {
          0% {
            transform: scale(0) rotateX(90deg) rotateY(90deg);
            opacity: 0;
            filter: brightness(0) contrast(0);
          }
          25% {
            transform: scale(0.5) rotateX(45deg) rotateY(45deg);
            opacity: 0.3;
            filter: brightness(1.5) contrast(1.5);
          }
          50% {
            transform: scale(1.1) rotateX(15deg) rotateY(15deg);
            opacity: 0.7;
            filter: brightness(1.2) contrast(1.2);
          }
          100% {
            transform: scale(1) rotateX(0deg) rotateY(0deg);
            opacity: 1;
            filter: brightness(1) contrast(1);
          }
        }
        
        @keyframes quantum-out {
          0% {
            transform: scale(1) rotateX(0deg) rotateY(0deg);
            opacity: 1;
            filter: brightness(1) contrast(1);
          }
          25% {
            transform: scale(1.1) rotateX(-15deg) rotateY(-15deg);
            opacity: 0.7;
            filter: brightness(1.2) contrast(1.2);
          }
          50% {
            transform: scale(0.5) rotateX(-45deg) rotateY(-45deg);
            opacity: 0.3;
            filter: brightness(1.5) contrast(1.5);
          }
          100% {
            transform: scale(0) rotateX(-90deg) rotateY(-90deg);
            opacity: 0;
            filter: brightness(0) contrast(0);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-morph-in {
          animation: morph-in 0.6s ease-out forwards;
        }
        
        .animate-morph-out {
          animation: morph-out 0.4s ease-in forwards;
        }
        
        .animate-particle-in {
          animation: particle-in 0.8s ease-out forwards;
        }
        
        .animate-particle-out {
          animation: particle-out 0.5s ease-in forwards;
        }
        
        .animate-ripple-in {
          animation: ripple-in 0.7s ease-out forwards;
        }
        
        .animate-ripple-out {
          animation: ripple-out 0.4s ease-in forwards;
        }
        
        .animate-magnetic-in {
          animation: magnetic-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        
        .animate-magnetic-out {
          animation: magnetic-out 0.5s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
        }
        
        .animate-glitch-in {
          animation: glitch-in 0.6s linear forwards;
        }
        
        .animate-glitch-out {
          animation: glitch-out 0.4s linear forwards;
        }
        
        .animate-wave-in {
          animation: wave-in 0.8s ease-out forwards;
        }
        
        .animate-wave-out {
          animation: wave-out 0.5s ease-in forwards;
        }
        
        .animate-spiral-in {
          animation: spiral-in 1s ease-out forwards;
        }
        
        .animate-spiral-out {
          animation: spiral-out 0.6s ease-in forwards;
        }
        
        .animate-quantum-in {
          animation: quantum-in 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animate-quantum-out {
          animation: quantum-out 0.7s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
        }
        
        .ease-spring {
          transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </ToastPrimitives.Root>
  )
})

AdvancedToast.displayName = "AdvancedToast"

// Advanced Toaster Provider with enhanced features
interface AdvancedToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
  limit?: number
  expand?: boolean
  richColors?: boolean
  closeButton?: boolean
  toastOptions?: Partial<AdvancedToastProps>
}

export function AdvancedToaster({
  position = 'bottom-right',
  limit = 5,
  expand = true,
  richColors = true,
  closeButton = true,
  toastOptions,
}: AdvancedToasterProps) {
  return (
    <ToastPrimitives.Provider 
      swipeDirection={position.includes('right') ? 'right' : 'left'}
      swipeThreshold={50}
    >
      <ToastPrimitives.Viewport
        className={cn(
          "fixed z-[100] flex max-h-screen w-full flex-col gap-2 p-4",
          {
            "top-0 left-0": position === 'top-left',
            "top-0 right-0": position === 'top-right',
            "top-0 left-1/2 -translate-x-1/2": position === 'top-center',
            "bottom-0 left-0": position === 'bottom-left',
            "bottom-0 right-0": position === 'bottom-right',
            "bottom-0 left-1/2 -translate-x-1/2": position === 'bottom-center',
            "flex-col": position.startsWith('top'),
            "flex-col-reverse": position.startsWith('bottom'),
          }
        )}
        style={{ maxWidth: '480px' }}
      />
    </ToastPrimitives.Provider>
  )
}

export type { AdvancedToastProps }
