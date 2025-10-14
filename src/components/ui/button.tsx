"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] hover:scale-[1.02] will-change-transform",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg transition-all duration-200",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md transition-all duration-200",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md transition-all duration-200",
        ghost: "hover:bg-accent hover:text-accent-foreground text-foreground transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline transition-all duration-200",
        gradient: "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl",
        "mono-light": "bg-gradient-to-r from-muted to-background text-foreground hover:from-muted/80 hover:to-background/80 shadow-lg hover:shadow-xl border border-border",
        "mono-dark": "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl",
        "dark": "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200",
        "light": "bg-background text-foreground hover:bg-muted border border-border shadow-sm hover:shadow-md transition-all duration-200",
      },
      size: {
        xs: "h-8 px-2 text-xs",
        sm: "h-9 px-3 text-sm",
        default: "h-10 px-4 py-2",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      animation: {
        none: "",
        scale: "hover:scale-[1.02] active:scale-[0.98]",
        lift: "hover:-translate-y-0.5 hover:shadow-lg",
        glow: "hover:shadow-lg hover:shadow-primary/25",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "scale",
    },
  }
)

// ============================================================================
// LOADING SPINNER COMPONENT
// ============================================================================

const LoadingSpinner = ({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// ============================================================================
// RIPPLE EFFECT HOOK
// ============================================================================

const useRipple = () => {
  const [ripples, setRipples] = React.useState<Array<{ id: string; x: number; y: number }>>([]);

  const addRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now().toString();

    setRipples(prev => [...prev, { id, x, y }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  };

  const RippleEffect = () => (
    <>
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none rounded-full bg-current opacity-20 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </>
  );

  return { addRipple, RippleEffect };
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ripple?: boolean;
  tooltip?: string;
  badge?: string | number;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    animation,
    asChild = false,
    loading = false,
    disabled,
    children,
    leftIcon,
    rightIcon,
    ripple = false,
    tooltip,
    badge,
    fullWidth = false,
    onClick,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { addRipple, RippleEffect } = useRipple();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      
      if (ripple && mounted) {
        addRipple(event);
      }
      
      onClick?.(event);
    };

    const isIconOnly = !children && (leftIcon || rightIcon);
    const effectiveSize = isIconOnly && size === 'default' ? 'icon' : size;

    // When using asChild, we need to ensure only one child is passed to Slot
    if (asChild) {
      return (
        <Comp
          className={cn(
            buttonVariants({ variant, size: effectiveSize, animation }),
            fullWidth && 'w-full',
            loading && 'cursor-wait relative overflow-hidden',
            className
          )}
          ref={ref}
          disabled={disabled || loading}
          onClick={handleClick}
          title={tooltip}
          aria-label={tooltip || (typeof children === 'string' ? children : undefined)}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size: effectiveSize, animation }),
          fullWidth && 'w-full',
          loading && 'cursor-wait relative overflow-hidden',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        title={tooltip}
        aria-label={tooltip || (typeof children === 'string' ? children : undefined)}
        {...props}
      >
        {/* Ripple Effect */}
        {ripple && <RippleEffect />}

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <LoadingSpinner 
              size={
                effectiveSize === 'xs' ? 'xs' : 
                effectiveSize === 'sm' || effectiveSize === 'icon-sm' ? 'sm' :
                effectiveSize === 'lg' || effectiveSize === 'xl' || effectiveSize === 'icon-lg' ? 'lg' : 
                'sm'
              } 
            />
          </div>
        )}

        {/* Content wrapper */}
        <div className={cn(
          'flex items-center justify-center gap-2',
          loading && 'opacity-0'
        )}>
          {/* Left Icon */}
          {leftIcon && (
            <span className="flex-shrink-0">
              {leftIcon}
            </span>
          )}

          {/* Button Content */}
          {children && (
            <span className="truncate">
              {children}
            </span>
          )}

          {/* Right Icon */}
          {rightIcon && (
            <span className="flex-shrink-0">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Badge */}
        {badge && (
          <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
            {badge}
          </span>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// ============================================================================
// SPECIALIZED BUTTON COMPONENTS
// ============================================================================

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = 'icon', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={className}
        size={size}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Floating Action Button
export interface FABProps extends ButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, position = 'bottom-right', size = 'icon-lg', variant = 'default', ...props }, ref) => {
    const positionClasses = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'top-right': 'fixed top-6 right-6',
      'top-left': 'fixed top-6 left-6'
    };

    return (
      <Button
        ref={ref}
        className={cn(
          'rounded-full shadow-xl hover:shadow-2xl z-50',
          'transition-all duration-300 hover:scale-110',
          positionClasses[position],
          className
        )}
        size={size}
        variant={variant}
        animation="lift"
        {...props}
      />
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

// Button Group
export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  attached?: boolean;
}

export const ButtonGroup = ({
  children,
  className,
  orientation = 'horizontal',
  attached = false
}: ButtonGroupProps) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        attached && orientation === 'horizontal' && '[&>button:not(:first-child)]:rounded-l-none [&>button:not(:last-child)]:rounded-r-none [&>button:not(:first-child)]:-ml-px',
        attached && orientation === 'vertical' && '[&>button:not(:first-child)]:rounded-t-none [&>button:not(:last-child)]:rounded-b-none [&>button:not(:first-child)]:-mt-px',
        !attached && (orientation === 'horizontal' ? 'gap-2' : 'gap-1'),
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
};

export { Button, buttonVariants }
