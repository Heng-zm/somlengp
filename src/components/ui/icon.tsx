'use client';

import React, {
  forwardRef,
  Suspense,
  lazy,
  useEffect,
  useState,
  SVGProps,
  ElementType,
  ComponentType
} from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// ICON TYPES AND INTERFACES
// ============================================================================

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  color?: 'current' | 'primary' | 'secondary' | 'accent' | 'muted' | 'destructive' | string;
  variant?: 'outline' | 'filled' | 'duotone' | 'solid';
  animation?: 'none' | 'spin' | 'pulse' | 'bounce' | 'ping' | 'wiggle';
  loading?: boolean;
  fallback?: React.ReactNode;
  'aria-label'?: string;
}

export interface IconLibraryConfig {
  baseUrl?: string;
  format?: 'svg' | 'component';
  lazy?: boolean;
  cache?: boolean;
}

// ============================================================================
// ICON SIZE AND COLOR UTILITIES
// ============================================================================

const getIconSize = (size: IconProps['size']): string => {
  if (typeof size === 'number') {
    return `${size}px`;
  }

  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10'
  };

  return sizes[size || 'md'];
};

const getIconColor = (color: IconProps['color']): string => {
  if (!color || color === 'current') return 'text-current';
  
  if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) {
    return '';
  }

  const colors = {
    primary: 'text-primary',
    secondary: 'text-secondary-foreground',
    accent: 'text-accent-foreground',
    muted: 'text-muted-foreground',
    destructive: 'text-destructive'
  };

  return colors[color as keyof typeof colors] || `text-${color}`;
};

const getIconAnimation = (animation: IconProps['animation']): string => {
  const animations = {
    none: '',
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    ping: 'animate-ping',
    wiggle: 'animate-[wiggle_1s_ease-in-out_infinite]'
  };

  return animations[animation || 'none'];
};

// ============================================================================
// LOADING FALLBACK COMPONENT
// ============================================================================

const IconSkeleton = ({ size }: { size?: IconProps['size'] }) => (
  <div
    className={cn(
      'animate-pulse bg-muted rounded',
      getIconSize(size),
      'flex-shrink-0'
    )}
    aria-hidden="true"
  />
);

// ============================================================================
// ICON CACHE SYSTEM
// ============================================================================

class IconCache {
  private static cache = new Map<string, ComponentType<any> | string>();
  private static promises = new Map<string, Promise<any>>();

  static get(key: string) {
    return this.cache.get(key);
  }

  static set(key: string, value: ComponentType<any> | string) {
    this.cache.set(key, value);
  }

  static has(key: string) {
    return this.cache.has(key);
  }

  static getPromise(key: string) {
    return this.promises.get(key);
  }

  static setPromise(key: string, promise: Promise<any>) {
    this.promises.set(key, promise);
  }

  static clear() {
    this.cache.clear();
    this.promises.clear();
  }
}

// ============================================================================
// DYNAMIC ICON LOADER
// ============================================================================

const useDynamicIcon = (name: string, config: IconLibraryConfig = {}) => {
  const [IconComponent, setIconComponent] = useState<ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!name) return;

    const loadIcon = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        if (config.cache !== false && IconCache.has(name)) {
          const cachedIcon = IconCache.get(name) as ComponentType<any>;
          setIconComponent(() => cachedIcon);
          setLoading(false);
          return;
        }

        // Check if there's already a loading promise
        let iconPromise = IconCache.getPromise(name);
        
        if (!iconPromise) {
          // Create new loading promise
          if (config.format === 'svg') {
            iconPromise = fetch(`${config.baseUrl || '/icons'}/${name}.svg`)
              .then(res => {
                if (!res.ok) throw new Error(`Icon not found: ${name}`);
                return res.text();
              })
              .then(svgContent => {
                const Component = (props: SVGProps<SVGSVGElement>) => {
                  const { ref, ...divProps } = props as any;
                  return (
                    <div 
                      ref={ref as React.Ref<HTMLDivElement>}
                      dangerouslySetInnerHTML={{ __html: svgContent }}
                      className={divProps.className}
                      style={divProps.style}
                    />
                  );
                };
                return Component;
              });
          } else {
            // Dynamic import for component-based icons
            iconPromise = import(`@/icons/${name}`).then(module => module.default);
          }

          if (config.cache !== false) {
            IconCache.setPromise(name, iconPromise);
          }
        }

        const Component = await iconPromise;
        
        if (config.cache !== false) {
          IconCache.set(name, Component);
        }
        
        setIconComponent(() => Component);
      } catch (err) {
        setError(err as Error);
        console.warn(`Failed to load icon: ${name}`, err);
      } finally {
        setLoading(false);
      }
    };

    if (config.lazy !== false) {
      loadIcon();
    }
  }, [name, config]);

  return { IconComponent, loading, error };
};

// ============================================================================
// MAIN ICON COMPONENT
// ============================================================================

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({
    name,
    size = 'md',
    color = 'current',
    variant = 'outline',
    animation = 'none',
    loading = false,
    fallback,
    className,
    style,
    'aria-label': ariaLabel,
    children,
    ...props
  }, ref) => {
    const { IconComponent, loading: dynamicLoading, error } = useDynamicIcon(name || '', {
      lazy: true,
      cache: true
    });

    const isLoading = loading || dynamicLoading;
    const showFallback = error || (!IconComponent && name);

    // Custom color style
    const customStyle = typeof color === 'string' && (
      color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')
    ) ? { color, ...style } : style;

    const iconClasses = cn(
      'inline-flex items-center justify-center',
      getIconSize(size),
      getIconColor(color),
      getIconAnimation(animation),
      'flex-shrink-0',
      className
    );

    // Show loading state
    if (isLoading) {
      return fallback || <IconSkeleton size={size} />;
    }

    // Show fallback for errors or missing icons
    if (showFallback) {
      return (
        <div className={iconClasses} aria-label={ariaLabel} role="img">
          {fallback || (
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="2 2"
              />
              <path
                d="M9 9L15 15M15 9L9 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      );
    }

    // Render dynamic icon component
    if (IconComponent) {
      return (
        <IconComponent
          ref={ref}
          className={iconClasses}
          style={customStyle}
          aria-label={ariaLabel}
          role="img"
          {...props}
        />
      );
    }

    // Render children (for inline SVG content)
    return (
      <svg
        ref={ref}
        className={iconClasses}
        style={customStyle}
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        fill={variant === 'filled' ? 'currentColor' : 'none'}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={ariaLabel}
        role="img"
        {...props}
      >
        {children}
      </svg>
    );
  }
);

Icon.displayName = 'Icon';

// ============================================================================\n// SPECIALIZED ICON COMPONENTS\n// ============================================================================

// Icon with badge
export interface IconWithBadgeProps extends IconProps {
  badge?: string | number;
  badgeColor?: 'primary' | 'secondary' | 'destructive' | 'success' | 'warning';
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const IconWithBadge = forwardRef<SVGSVGElement, IconWithBadgeProps>(
  ({ badge, badgeColor = 'primary', badgePosition = 'top-right', className, ...props }, ref) => {
    const positionClasses = {
      'top-right': '-top-1 -right-1',
      'top-left': '-top-1 -left-1', 
      'bottom-right': '-bottom-1 -right-1',
      'bottom-left': '-bottom-1 -left-1'
    };

    const badgeColorClasses = {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      success: 'bg-green-500 text-white',
      warning: 'bg-yellow-500 text-yellow-900'
    };

    return (
      <div className={cn('relative inline-flex', className)}>
        <Icon ref={ref} {...props} />
        {badge && (
          <span className={cn(
            'absolute flex items-center justify-center',
            'min-w-[1.25rem] h-5 px-1',
            'text-xs font-bold rounded-full',
            'border-2 border-background',
            positionClasses[badgePosition],
            badgeColorClasses[badgeColor]
          )}>
            {badge}
          </span>
        )}
      </div>
    );
  }
);

IconWithBadge.displayName = 'IconWithBadge';

// Animated icon button
export interface AnimatedIconProps extends IconProps {
  hoverAnimation?: 'scale' | 'rotate' | 'bounce' | 'shake';
  clickAnimation?: 'scale' | 'rotate' | 'bounce' | 'pulse';
}

export const AnimatedIcon = forwardRef<SVGSVGElement, AnimatedIconProps>(
  ({ hoverAnimation, clickAnimation, className, ...props }, ref) => {
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
      if (clickAnimation) {
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 200);
      }
      props.onClick?.(e as any);
    };

    const hoverClasses = {
      scale: 'hover:scale-110',
      rotate: 'hover:rotate-12',
      bounce: 'hover:animate-bounce',
      shake: 'hover:animate-[shake_0.5s_ease-in-out]'
    };

    const clickClasses = {
      scale: 'active:scale-95',
      rotate: 'active:rotate-180',
      bounce: 'active:animate-bounce',
      pulse: 'active:animate-pulse'
    };

    return (
      <Icon
        ref={ref}
        className={cn(
          'transition-all duration-200 cursor-pointer',
          hoverAnimation && hoverClasses[hoverAnimation],
          clickAnimation && clickClasses[clickAnimation],
          isClicked && 'transform-gpu',
          className
        )}
        onClick={handleClick}
        {...props}
      />
    );
  }
);

AnimatedIcon.displayName = 'AnimatedIcon';

// ============================================================================
// COMMON ICONS LIBRARY
// ============================================================================

// Base icon components that don't require external loading
export const IconLibrary = {
  // Navigation
  ChevronLeft: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),
  
  ChevronRight: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  ChevronUp: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  ChevronDown: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  // Actions
  Plus: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  Minus: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  X: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  Check: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  // Status
  Loading: (props: SVGProps<SVGSVGElement>) => (
    <Icon animation="spin" {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
    </Icon>
  ),

  Warning: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 003.65 21H20.35A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  Info: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  Success: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <path d="M22 11.08V12A10 10 0 1112 2A10 10 0 0122 11.08Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12L11 14L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  Error: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  // Interface
  Menu: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  Search: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),

  Settings: (props: SVGProps<SVGSVGElement>) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15A1.65 1.65 0 0021 13.09V10.91A1.65 1.65 0 0019.4 9A1.65 1.65 0 0017.73 7.5A8.84 8.84 0 0016.5 6.23A1.65 1.65 0 0115 4.6A1.65 1.65 0 0013.09 3H10.91A1.65 1.65 0 009 4.6A1.65 1.65 0 007.27 6.27A8.84 8.84 0 006 7.5A1.65 1.65 0 004.6 9A1.65 1.65 0 003 10.91V13.09A1.65 1.65 0 004.6 15A1.65 1.65 0 006.27 16.73A8.84 8.84 0 007.5 18A1.65 1.65 0 009 19.4A1.65 1.65 0 0010.91 21H13.09A1.65 1.65 0 0015 19.4A1.65 1.65 0 0016.73 17.73A8.84 8.84 0 0018 16.5A1.65 1.65 0 0019.4 15Z" stroke="currentColor" strokeWidth="2" />
    </Icon>
  ),
};

// ============================================================================
// EXPORTS
// ============================================================================

export default Icon;
export { IconCache, IconSkeleton };
