import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function


const buttonNotificationVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 max-w-fit",
  {
    variants: {
      variant: {
        success: 
          "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 focus:ring-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/30",
        error:
          "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 focus:ring-red-500 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/30",
        warning:
          "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 focus:ring-amber-500 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/30",
        info:
          "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 focus:ring-blue-500 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/30",
        default:
          "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-gray-900/30",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        default: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      },
      animation: {
        none: "",
        slideIn: "animate-slide-in-from-right",
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

interface ButtonNotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonNotificationVariants> {
  dismissible?: boolean;
  onDismiss?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
}

const ButtonNotification = React.forwardRef<HTMLDivElement, ButtonNotificationProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    dismissible = true,
    onDismiss,
    autoClose = true,
    autoCloseDelay = 4000,
    icon: IconComponent,
    title,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    // Handle auto close
    React.useEffect(() => {
      if (autoClose && isVisible && autoCloseDelay > 0) {
        timeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, autoCloseDelay);
      }
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [autoClose, isVisible, autoCloseDelay]);

    const handleDismiss = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
      onDismiss?.();
    };

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          buttonNotificationVariants({ variant, size, animation }),
          "relative",
          className
        )}
        {...props}
      >
        {/* Icon */}
        {IconComponent && (
          <IconComponent className="h-4 w-4 flex-shrink-0" />
        )}
        
        {/* Title */}
        <span className="font-medium">{title}</span>
        
        {/* Dismiss button */}
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 ml-2 hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-opacity"
            onClick={handleDismiss}
            title="Dismiss notification"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Dismiss notification</span>
          </Button>
        )}
        
        {/* Auto-close progress indicator */}
        {autoClose && autoCloseDelay > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-current opacity-50 animate-shrink-width"
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

ButtonNotification.displayName = "ButtonNotification";

export { ButtonNotification, buttonNotificationVariants, type ButtonNotificationProps };
