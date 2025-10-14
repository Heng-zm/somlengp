'use client';

import React, { 
  forwardRef, 
  HTMLAttributes, 
  ReactNode, 
  ElementType,
  ComponentPropsWithRef
} from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// CONTAINER COMPONENT
// ============================================================================

const containerVariants = cva(
  'mx-auto w-full',
  {
    variants: {
      size: {
        sm: 'max-w-screen-sm', // ~640px
        md: 'max-w-screen-md', // ~768px
        lg: 'max-w-screen-lg', // ~1024px
        xl: 'max-w-screen-xl', // ~1280px
        '2xl': 'max-w-screen-2xl', // ~1536px
        '3xl': 'max-w-[1600px]',
        '4xl': 'max-w-[1800px]',
        '5xl': 'max-w-[2000px]',
        full: 'max-w-full',
        none: 'max-w-none'
      },
      padding: {
        none: 'px-0',
        sm: 'px-4 sm:px-6',
        md: 'px-4 sm:px-6 lg:px-8',
        lg: 'px-6 sm:px-8 lg:px-12',
        xl: 'px-8 sm:px-12 lg:px-16'
      },
      center: {
        true: 'mx-auto',
        false: ''
      }
    },
    defaultVariants: {
      size: 'xl',
      padding: 'md',
      center: true
    }
  }
);

export interface ContainerProps 
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: ElementType;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, center, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(containerVariants({ size, padding, center }), className)}
        {...props}
      />
    );
  }
);

Container.displayName = 'Container';

// ============================================================================
// SECTION COMPONENT
// ============================================================================

const sectionVariants = cva(
  'relative',
  {
    variants: {
      spacing: {
        none: 'py-0',
        xs: 'py-4',
        sm: 'py-8',
        md: 'py-12',
        lg: 'py-16',
        xl: 'py-20',
        '2xl': 'py-24',
        '3xl': 'py-32'
      },
      width: {
        full: 'w-full',
        container: 'w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8'
      },
      background: {
        none: '',
        muted: 'bg-muted/30',
        accent: 'bg-accent/5',
        primary: 'bg-primary/5',
        secondary: 'bg-secondary/30',
        gradient: 'bg-gradient-to-b from-background to-muted/20'
      },
      border: {
        none: '',
        top: 'border-t border-border',
        bottom: 'border-b border-border',
        both: 'border-y border-border'
      }
    },
    defaultVariants: {
      spacing: 'lg',
      width: 'full',
      background: 'none',
      border: 'none'
    }
  }
);

export interface SectionProps 
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: ElementType;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, width, background, border, as: Component = 'section', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(sectionVariants({ spacing, width, background, border }), className)}
        {...props}
      />
    );
  }
);

Section.displayName = 'Section';

// ============================================================================
// GRID COMPONENT
// ============================================================================

const gridVariants = cva(
  'grid',
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
        12: 'grid-cols-12'
      },
      gap: {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
        '2xl': 'gap-10',
        '3xl': 'gap-12'
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch'
      },
      justify: {
        start: 'justify-items-start',
        center: 'justify-items-center',
        end: 'justify-items-end',
        stretch: 'justify-items-stretch'
      }
    },
    defaultVariants: {
      cols: 1,
      gap: 'md',
      align: 'start',
      justify: 'stretch'
    }
  }
);

export interface GridProps 
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, align, justify, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridVariants({ cols, gap, align, justify }), className)}
        {...props}
      />
    );
  }
);

Grid.displayName = 'Grid';

// ============================================================================
// GRID ITEM COMPONENT
// ============================================================================

const gridItemVariants = cva(
  '',
  {
    variants: {
      span: {
        1: 'col-span-1',
        2: 'col-span-2',
        3: 'col-span-3',
        4: 'col-span-4',
        5: 'col-span-5',
        6: 'col-span-6',
        7: 'col-span-7',
        8: 'col-span-8',
        9: 'col-span-9',
        10: 'col-span-10',
        11: 'col-span-11',
        12: 'col-span-12',
        full: 'col-span-full'
      },
      start: {
        1: 'col-start-1',
        2: 'col-start-2',
        3: 'col-start-3',
        4: 'col-start-4',
        5: 'col-start-5',
        6: 'col-start-6',
        7: 'col-start-7',
        8: 'col-start-8',
        9: 'col-start-9',
        10: 'col-start-10',
        11: 'col-start-11',
        12: 'col-start-12',
        auto: 'col-start-auto'
      },
      end: {
        1: 'col-end-1',
        2: 'col-end-2',
        3: 'col-end-3',
        4: 'col-end-4',
        5: 'col-end-5',
        6: 'col-end-6',
        7: 'col-end-7',
        8: 'col-end-8',
        9: 'col-end-9',
        10: 'col-end-10',
        11: 'col-end-11',
        12: 'col-end-12',
        13: 'col-end-13',
        auto: 'col-end-auto'
      }
    },
    defaultVariants: {
      span: 1
    }
  }
);

export interface GridItemProps 
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridItemVariants> {}

export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span, start, end, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridItemVariants({ span, start, end }), className)}
        {...props}
      />
    );
  }
);

GridItem.displayName = 'GridItem';

// ============================================================================
// FLEX COMPONENT
// ============================================================================

const flexVariants = cva(
  'flex',
  {
    variants: {
      direction: {
        row: 'flex-row',
        'row-reverse': 'flex-row-reverse',
        col: 'flex-col',
        'col-reverse': 'flex-col-reverse'
      },
      wrap: {
        nowrap: 'flex-nowrap',
        wrap: 'flex-wrap',
        'wrap-reverse': 'flex-wrap-reverse'
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
        baseline: 'items-baseline'
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly'
      },
      gap: {
        none: 'gap-0',
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
        '2xl': 'gap-10'
      }
    },
    defaultVariants: {
      direction: 'row',
      wrap: 'nowrap',
      align: 'start',
      justify: 'start',
      gap: 'none'
    }
  }
);

export interface FlexProps 
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {
  as?: ElementType;
}

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({ className, direction, wrap, align, justify, gap, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(flexVariants({ direction, wrap, align, justify, gap }), className)}
        {...props}
      />
    );
  }
);

Flex.displayName = 'Flex';

// ============================================================================
// STACK COMPONENT (Vertical Flex)
// ============================================================================

export interface StackProps extends Omit<FlexProps, 'direction'> {
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ spacing = 'md', gap, ...props }, ref) => {
    const stackGap = gap || spacing;
    return (
      <Flex
        ref={ref}
        direction="col"
        gap={stackGap}
        {...props}
      />
    );
  }
);

Stack.displayName = 'Stack';

// ============================================================================
// INLINE COMPONENT (Horizontal Flex)
// ============================================================================

export interface InlineProps extends Omit<FlexProps, 'direction'> {
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Inline = forwardRef<HTMLDivElement, InlineProps>(
  ({ spacing = 'md', gap, wrap = 'wrap', ...props }, ref) => {
    const inlineGap = gap || spacing;
    return (
      <Flex
        ref={ref}
        direction="row"
        wrap={wrap}
        gap={inlineGap}
        {...props}
      />
    );
  }
);

Inline.displayName = 'Inline';

// ============================================================================
// CENTER COMPONENT
// ============================================================================

export interface CenterProps extends HTMLAttributes<HTMLDivElement> {
  axis?: 'both' | 'horizontal' | 'vertical';
  as?: ElementType;
}

export const Center = forwardRef<HTMLDivElement, CenterProps>(
  ({ className, axis = 'both', as: Component = 'div', ...props }, ref) => {
    const centerClasses = {
      both: 'flex items-center justify-center',
      horizontal: 'flex justify-center',
      vertical: 'flex items-center'
    };

    return (
      <Component
        ref={ref}
        className={cn(centerClasses[axis], className)}
        {...props}
      />
    );
  }
);

Center.displayName = 'Center';

// ============================================================================
// ASPECT RATIO COMPONENT
// ============================================================================

const aspectRatioVariants = cva(
  'relative overflow-hidden',
  {
    variants: {
      ratio: {
        '1/1': 'aspect-square',
        '4/3': 'aspect-[4/3]',
        '3/2': 'aspect-[3/2]',
        '16/9': 'aspect-video',
        '21/9': 'aspect-[21/9]',
        '3/4': 'aspect-[3/4]',
        '2/3': 'aspect-[2/3]',
        '9/16': 'aspect-[9/16]'
      }
    },
    defaultVariants: {
      ratio: '16/9'
    }
  }
);

export interface AspectRatioProps 
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof aspectRatioVariants> {}

export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ className, ratio, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(aspectRatioVariants({ ratio }), className)}
        {...props}
      />
    );
  }
);

AspectRatio.displayName = 'AspectRatio';

// ============================================================================
// SPACER COMPONENT
// ============================================================================

export interface SpacerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number;
  axis?: 'horizontal' | 'vertical' | 'both';
}

export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
  ({ className, size = 'md', axis = 'vertical', ...props }, ref) => {
    const getSizeClass = (s: SpacerProps['size']): string => {
      if (typeof s === 'number') {
        return axis === 'horizontal' ? `w-[${s}px]` : 
               axis === 'vertical' ? `h-[${s}px]` : 
               `w-[${s}px] h-[${s}px]`;
      }
      
      const sizeMap = {
        xs: axis === 'horizontal' ? 'w-1' : axis === 'vertical' ? 'h-1' : 'w-1 h-1',
        sm: axis === 'horizontal' ? 'w-2' : axis === 'vertical' ? 'h-2' : 'w-2 h-2',
        md: axis === 'horizontal' ? 'w-4' : axis === 'vertical' ? 'h-4' : 'w-4 h-4',
        lg: axis === 'horizontal' ? 'w-6' : axis === 'vertical' ? 'h-6' : 'w-6 h-6',
        xl: axis === 'horizontal' ? 'w-8' : axis === 'vertical' ? 'h-8' : 'w-8 h-8',
        '2xl': axis === 'horizontal' ? 'w-12' : axis === 'vertical' ? 'h-12' : 'w-12 h-12',
        '3xl': axis === 'horizontal' ? 'w-16' : axis === 'vertical' ? 'h-16' : 'w-16 h-16'
      };
      
      return sizeMap[s as keyof typeof sizeMap] || sizeMap.md;
    };

    return (
      <div
        ref={ref}
        className={cn('flex-shrink-0', getSizeClass(size), className)}
        {...props}
      />
    );
  }
);

Spacer.displayName = 'Spacer';

// ============================================================================
// DIVIDER COMPONENT
// ============================================================================

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'dashed' | 'dotted' | 'gradient';
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ className, orientation = 'horizontal', size = 'md', variant = 'solid', ...props }, ref) => {
    const orientationClasses = {
      horizontal: 'w-full h-px border-t',
      vertical: 'h-full w-px border-l'
    };

    const sizeClasses = {
      sm: orientation === 'horizontal' ? 'my-2' : 'mx-2',
      md: orientation === 'horizontal' ? 'my-4' : 'mx-4',
      lg: orientation === 'horizontal' ? 'my-6' : 'mx-6'
    };

    const variantClasses = {
      solid: 'border-solid border-border',
      dashed: 'border-dashed border-border',
      dotted: 'border-dotted border-border',
      gradient: 'border-none bg-gradient-to-r from-transparent via-border to-transparent'
    };

    return (
      <hr
        ref={ref}
        className={cn(
          'border-0',
          orientationClasses[orientation],
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

export interface ResponsiveProps {
  children: ReactNode;
  breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  direction?: 'up' | 'down' | 'only';
}

export const Responsive = ({ children, breakpoint, direction = 'up' }: ResponsiveProps) => {
  const getResponsiveClass = () => {
    const classes = {
      up: {
        sm: 'sm:block',
        md: 'md:block',
        lg: 'lg:block',
        xl: 'xl:block',
        '2xl': '2xl:block'
      },
      down: {
        sm: 'max-sm:block',
        md: 'max-md:block',
        lg: 'max-lg:block',
        xl: 'max-xl:block',
        '2xl': 'max-2xl:block'
      },
      only: {
        sm: 'sm:block md:hidden',
        md: 'md:block lg:hidden',
        lg: 'lg:block xl:hidden',
        xl: 'xl:block 2xl:hidden',
        '2xl': '2xl:block'
      }
    };
    
    return classes[direction][breakpoint];
  };

  return (
    <div className={cn('hidden', getResponsiveClass())}>
      {children}
    </div>
  );
};

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================

export const Layout = {
  Container,
  Section,
  Grid,
  GridItem,
  Flex,
  Stack,
  Inline,
  Center,
  AspectRatio,
  Spacer,
  Divider,
  Responsive
};

export default Layout;