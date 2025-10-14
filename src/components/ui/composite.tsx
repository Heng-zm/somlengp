'use client';

import React, { forwardRef, ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Button, IconButton, ButtonProps } from './button';
import { Icon, IconProps, IconLibrary } from './icon';
import { Container, Section, Grid, Flex, Stack, Inline } from './layout';
import { spacing, alignment } from '@/lib/spacing-utils';

// ============================================================================
// CARD COMPONENT
// ============================================================================

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'filled' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-card text-card-foreground border border-border',
      outlined: 'bg-transparent border-2 border-border',
      filled: 'bg-muted text-muted-foreground border border-muted',
      elevated: 'bg-card text-card-foreground shadow-lg border border-border/50',
      interactive: 'bg-card text-card-foreground border border-border hover:shadow-md transition-shadow cursor-pointer'
    };

    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg transition-all duration-200',
          variants[variant],
          paddingClasses[padding],
          hover && 'hover:shadow-md hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// CARD HEADER, CONTENT, FOOTER COMPONENTS
// ============================================================================

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between pt-4 mt-auto', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

// ============================================================================
// ACTION CARD COMPONENT
// ============================================================================

export interface ActionCardProps extends Omit<CardProps, 'variant'> {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}

export const ActionCard = forwardRef<HTMLDivElement, ActionCardProps>(
  ({ className, title, description, icon, actions, onClick, children, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        onClick && 'cursor-pointer hover:shadow-lg hover:-translate-y-1',
        className
      )}
      variant={onClick ? 'interactive' : 'elevated'}
      onClick={onClick}
      {...props}
    >
      <CardHeader>
        <Flex align="center" gap="md">
          {icon && (
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </Flex>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
      {actions && (
        <CardFooter>
          <div className="flex gap-2 ml-auto">
            {actions}
          </div>
        </CardFooter>
      )}
    </Card>
  )
);

ActionCard.displayName = 'ActionCard';

// ============================================================================
// BUTTON GROUP WITH ICONS
// ============================================================================

export interface IconButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'attached' | 'spaced';
  size?: ButtonProps['size'];
  buttons: Array<{
    icon: ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    badge?: string | number;
  }>;
}

export const IconButtonGroup = forwardRef<HTMLDivElement, IconButtonGroupProps>(
  ({ className, variant = 'spaced', size = 'default', buttons, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex',
        variant === 'attached' 
          ? '[&>button:not(:first-child)]:rounded-l-none [&>button:not(:last-child)]:rounded-r-none [&>button:not(:first-child)]:-ml-px' 
          : 'gap-2',
        className
      )}
      role="group"
      {...props}
    >
      {buttons.map((button, index) => (
        <IconButton
          key={index}
          icon={button.icon}
          aria-label={button.label}
          size={size}
          variant={button.active ? 'default' : 'outline'}
          disabled={button.disabled}
          onClick={button.onClick}
          badge={button.badge}
          className="relative"
        />
      ))}
    </div>
  )
);

IconButtonGroup.displayName = 'IconButtonGroup';

// ============================================================================
// FEATURE SHOWCASE COMPONENT
// ============================================================================

export interface FeatureShowcaseProps extends HTMLAttributes<HTMLDivElement> {
  features: Array<{
    icon: ReactNode;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  columns?: 1 | 2 | 3 | 4;
}

export const FeatureShowcase = forwardRef<HTMLDivElement, FeatureShowcaseProps>(
  ({ className, features, columns = 3, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      <Grid cols={columns} gap="lg">
        {features.map((feature, index) => (
          <ActionCard
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            actions={
              feature.action && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={feature.action.onClick}
                >
                  {feature.action.label}
                </Button>
              )
            }
          >
            <div className="text-sm text-muted-foreground">
              Additional feature details or content can go here.
            </div>
          </ActionCard>
        ))}
      </Grid>
    </div>
  )
);

FeatureShowcase.displayName = 'FeatureShowcase';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
  color?: 'default' | 'success' | 'warning' | 'error';
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, change, icon, color = 'default', ...props }, ref) => {
    const colorVariants = {
      default: 'border-border',
      success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
      warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
      error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
    };

    const iconColors = {
      default: 'text-muted-foreground',
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      error: 'text-red-600 dark:text-red-400'
    };

    return (
      <Card
        ref={ref}
        className={cn('transition-all duration-200', colorVariants[color], className)}
        hover={true}
        {...props}
      >
        <Flex justify="between" align="start">
          <Stack spacing="xs">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {change && (
              <Flex align="center" gap="xs">
                <Icon size="sm" color={change.trend === 'up' ? 'success' : change.trend === 'down' ? 'error' : 'muted'}>
                  {change.trend === 'up' ? (
                    <IconLibrary.ChevronUp />
                  ) : change.trend === 'down' ? (
                    <IconLibrary.ChevronDown />
                  ) : (
                    <div className="w-4 h-4 border border-current rounded-full" />
                  )}
                </Icon>
                <span className={cn(
                  'text-sm font-medium',
                  change.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                  change.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                  'text-muted-foreground'
                )}>
                  {change.value}
                </span>
              </Flex>
            )}
          </Stack>
          {icon && (
            <div className={cn('p-3 rounded-lg bg-muted/50', iconColors[color])}>
              {icon}
            </div>
          )}
        </Flex>
      </Card>
    );
  }
);

StatCard.displayName = 'StatCard';

// ============================================================================
// CALL TO ACTION COMPONENT
// ============================================================================

export interface CallToActionProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  primaryAction: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'gradient' | 'minimal';
}

export const CallToAction = forwardRef<HTMLDivElement, CallToActionProps>(
  ({ 
    className, 
    title, 
    description, 
    primaryAction, 
    secondaryAction, 
    variant = 'default',
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-primary/5 border border-primary/20',
      gradient: 'bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20',
      minimal: 'bg-transparent'
    };

    return (
      <Section background="none" spacing="lg" className={className} {...props}>
        <Container size="lg">
          <Card 
            ref={ref}
            className={cn('text-center', variants[variant])}
            padding="lg"
          >
            <Stack spacing="lg" align="center">
              <Stack spacing="sm" align="center">
                <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                {description && (
                  <p className="text-lg text-muted-foreground max-w-2xl">{description}</p>
                )}
              </Stack>
              
              <Inline spacing="md" justify="center">
                <Button
                  size="lg"
                  onClick={primaryAction.onClick}
                  loading={primaryAction.loading}
                  variant={variant === 'minimal' ? 'default' : 'gradient'}
                >
                  {primaryAction.label}
                </Button>
                {secondaryAction && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={secondaryAction.onClick}
                  >
                    {secondaryAction.label}
                  </Button>
                )}
              </Inline>
            </Stack>
          </Card>
        </Container>
      </Section>
    );
  }
);

CallToAction.displayName = 'CallToAction';

// ============================================================================
// NAVIGATION BREADCRUMBS
// ============================================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
}

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, items, separator = <IconLibrary.ChevronRight className="w-4 h-4" />, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
      aria-label="Breadcrumbs"
      {...props}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="mx-2 text-muted-foreground/50">
                {separator}
              </span>
            )}
            <div className="flex items-center gap-1">
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {isLast ? (
                <span className="font-medium text-foreground">{item.label}</span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  )
);

Breadcrumbs.displayName = 'Breadcrumbs';

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
  };
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant || 'default'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
);

EmptyState.displayName = 'EmptyState';

// ============================================================================
// COMPOSITE EXPORTS
// ============================================================================

export const Composite = {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  ActionCard,
  IconButtonGroup,
  FeatureShowcase,
  StatCard,
  CallToAction,
  Breadcrumbs,
  EmptyState
};

export default Composite;