import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

const alertVariants = cva(
  "relative w-full rounded-xl border shadow-sm transition-all duration-300 ease-in-out [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border hover:shadow-md",
        destructive:
          "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200/50 dark:border-red-800/50 text-red-900 dark:text-red-100 [&>svg]:text-red-600 dark:[&>svg]:text-red-400 animate-pulse-subtle hover:from-red-100 hover:to-rose-100 dark:hover:from-red-950/30 dark:hover:to-rose-950/30",
        success:
          "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200/50 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-100 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-950/30 dark:hover:to-green-950/30",
        warning:
          "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200/50 dark:border-amber-800/50 text-amber-900 dark:text-amber-100 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400 hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-950/30 dark:hover:to-yellow-950/30",
        info:
          "bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-200/50 dark:border-blue-800/50 text-blue-900 dark:text-blue-100 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400 hover:from-blue-100 hover:to-sky-100 dark:hover:from-blue-950/30 dark:hover:to-sky-950/30",
        outline:
          "border-2 border-gray-200 dark:border-gray-700 bg-transparent text-foreground hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:border-gray-300 dark:hover:border-gray-600",
        glass:
          "bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border-white/20 dark:border-gray-700/30 text-foreground shadow-lg hover:bg-white/20 dark:hover:bg-gray-900/20",
        neon:
          "bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/50 text-purple-100 shadow-lg shadow-purple-500/25 [&>svg]:text-purple-400 hover:shadow-purple-500/40 hover:from-purple-900/30 hover:to-pink-900/30",
        minimal:
          "bg-transparent border-l-4 border-l-blue-500 border-t-0 border-r-0 border-b-0 rounded-none pl-6 text-foreground hover:bg-gray-50 dark:hover:bg-gray-900/50",
        elevated:
          "bg-white dark:bg-gray-900 border-0 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 text-foreground hover:shadow-2xl hover:scale-[1.01] transform",
      },
      size: {
        xs: "p-2 text-xs",
        sm: "p-3 text-sm",
        default: "p-4",
        lg: "p-6 text-lg",
        xl: "p-8 text-xl",
      },
      animation: {
        none: "",
        slideIn: "animate-slide-in-from-left",
        fadeIn: "animate-fade-in",
        bounceIn: "animate-bounce-in",
        scaleIn: "animate-scale-in",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "fadeIn",
    },
  }
)
interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean;
  onDismiss?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  playSound?: boolean;
  soundType?: 'success' | 'error' | 'warning' | 'info' | 'notification';
  persistent?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }>;
  progress?: number;
  showProgress?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}
// Sound utility functions
const playAlertSound = (soundType: string) => {
  if (typeof window === 'undefined') return;
  try {
    const soundMap: Record<string, string> = {
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      warning: '/sounds/warning.mp3',
      info: '/sounds/info.mp3',
      notification: '/sounds/notification.mp3',
    };
    const soundFile = soundMap[soundType];
    if (soundFile) {
      const audio = new Audio(soundFile);
      audio.volume = 0.3;
      audio.play().catch(console.warn);
    }
  } catch (error) {
  }
};
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    dismissible, 
    onDismiss, 
    autoClose = false,
    autoCloseDelay = 5000,
    playSound = false,
    soundType = 'notification',
    persistent = false,
    priority = 'medium',
    actions,
    progress,
    showProgress = false,
    icon: IconComponent,
    children, 
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const [soundEnabled, setSoundEnabled] = React.useState(true);
    const timeoutRef = React.useRef<NodeJS.Timeout>();
    const progressRef = React.useRef<number>(progress || 0);
    const [currentProgress, setCurrentProgress] = React.useState(progress || 0);
    // Handle sound on mount
    React.useEffect(() => {
      if (playSound && soundEnabled && isVisible) {
        playAlertSound(soundType);
      }
    }, [playSound, soundEnabled, soundType, isVisible]);
    // Handle auto close
    React.useEffect(() => {
      if (autoClose && !persistent && isVisible && autoCloseDelay > 0) {
        timeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, autoCloseDelay);
      }
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [autoClose, persistent, isVisible, autoCloseDelay]);
    // Handle progress updates
    React.useEffect(() => {
      if (progress !== undefined && progress !== currentProgress) {
        setCurrentProgress(progress);
      }
    }, [progress]);
    const handleDismiss = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
      onDismiss?.();
    };
    const toggleSound = () => {
      setSoundEnabled(!soundEnabled);
    };
    if (!isVisible) return null;
    const priorityStyles = {
      low: '',
      medium: '',
      high: 'ring-2 ring-yellow-400/50 dark:ring-yellow-500/50',
      critical: 'ring-2 ring-red-500/75 dark:ring-red-400/75 shadow-lg shadow-red-500/25',
    };
    return (
      <div
        ref={ref}
        role="alert"
        aria-live={priority === 'critical' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className={cn(
          alertVariants({ variant, size, animation }), 
          priorityStyles[priority],
          className
        )}
        {...props}
      >
        {/* Custom Icon */}
        {IconComponent && (
          <IconComponent className="h-4 w-4 absolute left-4 top-4" />
        )}
        <div className="flex-1">
          {children}
          {/* Progress Bar */}
          {showProgress && (
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600" 
                style={{ width: `${Math.min(Math.max(currentProgress, 0), 100)}%` }}
              />
            </div>
          )}
          {/* Action Buttons */}
          {actions && actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={action.onClick}
                  className="h-8 text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        {/* Control buttons */}
        <div className="absolute right-2 top-2 flex gap-1">
          {/* Sound toggle */}
          {playSound && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
              onClick={toggleSound}
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? (
                <Volume2 className="h-3 w-3" />
              ) : (
                <VolumeX className="h-3 w-3" />
              )}
              <span className="sr-only">
                {soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              </span>
            </Button>
          )}
          {/* Dismiss button */}
          {(dismissible || (!persistent && !autoClose)) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
              onClick={handleDismiss}
              title="Dismiss alert"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss alert</span>
            </Button>
          )}
        </div>
        {/* Auto-close indicator */}
        {autoClose && !persistent && autoCloseDelay > 0 && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-xl overflow-hidden"
          >
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-shrink-width"
              style={{
                animationDuration: `${autoCloseDelay}ms`,
                animationTimingFunction: 'linear'
              }}
            />
          </div>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert"
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "mb-2 font-semibold leading-none tracking-tight text-current",
      "flex items-center gap-2",
      className
    )}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm leading-relaxed text-current/80 [&_p]:leading-relaxed",
      className
    )}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"
export { Alert, AlertTitle, AlertDescription, type AlertProps }
