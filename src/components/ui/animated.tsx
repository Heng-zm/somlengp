'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { animations, transitionClasses } from '@/lib/animations';
import { cn } from '@/lib/utils';

// Animated container with stagger children
interface AnimatedContainerProps extends HTMLMotionProps<'div'> {
  stagger?: boolean;
  fast?: boolean;
}

export function AnimatedContainer({ 
  children, 
  stagger = false, 
  fast = false,
  className,
  ...props 
}: AnimatedContainerProps) {
  const variant = stagger 
    ? (fast ? animations.variants.staggerFast : animations.variants.stagger)
    : animations.variants.fadeIn;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variant}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated card with hover effects
interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
}

export function AnimatedCard({ 
  children, 
  hover = true, 
  className,
  ...props 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.variants.scale}
      whileHover={hover ? animations.interactions.card : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      className={cn('card-hover-effect', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Fade in animation
export function FadeIn({ 
  children, 
  className, 
  ...props 
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.variants.fadeIn}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Slide up animation
export function SlideUp({ 
  children, 
  className, 
  ...props 
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.variants.slideUp}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Slide down animation
export function SlideDown({ 
  children, 
  className, 
  ...props 
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.variants.slideDown}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Scale animation
export function ScaleIn({ 
  children, 
  className, 
  ...props 
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.variants.scale}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated button with smooth interactions
interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  glow?: boolean;
}

export function AnimatedButton({ 
  children, 
  className, 
  glow = false,
  ...props 
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'safe-transition-transform safe-transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        glow && 'hover:shadow-lg hover:shadow-primary/50',
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Animated list item
export function AnimatedListItem({ 
  children, 
  className, 
  ...props 
}: HTMLMotionProps<'li'>) {
  return (
    <motion.li
      variants={animations.variants.slideUp}
      className={className}
      {...props}
    >
      {children}
    </motion.li>
  );
}

// Page wrapper with smooth transitions
export function AnimatedPage({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Blur animation
export function BlurIn({ 
  children, 
  className, 
  ...props 
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.variants.blur}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Hover lift effect
export function HoverLift({ 
  children, 
  className, 
  ...props 
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      whileHover={animations.interactions.lift}
      className={cn('safe-transition-transform', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated input with smooth focus
export function AnimatedInput({ 
  className, 
  ...props 
}: HTMLMotionProps<'input'>) {
  return (
    <motion.input
      whileFocus={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'safe-transition-transform safe-transition-colors',
        'focus:ring-2 focus:ring-primary focus:border-transparent',
        className
      )}
      {...props}
    />
  );
}

// Skeleton loader with pulse animation
export function AnimatedSkeleton({ 
  className 
}: { 
  className?: string;
}) {
  return (
    <motion.div
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={cn('bg-muted rounded', className)}
    />
  );
}

// Floating animation
export function FloatingElement({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Progress bar animation
export function AnimatedProgress({ 
  value, 
  className 
}: { 
  value: number; 
  className?: string;
}) {
  return (
    <div className={cn('w-full h-2 bg-muted rounded-full overflow-hidden', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-full bg-primary rounded-full"
      />
    </div>
  );
}

// Shake animation for errors
export function ShakeOnError({ 
  children, 
  trigger, 
  className 
}: { 
  children: ReactNode; 
  trigger: boolean; 
  className?: string;
}) {
  return (
    <motion.div
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      } : {}}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Bounce in animation
export function BounceIn({ 
  children, 
  className, 
  ...props 
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.variants.scaleUp}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
