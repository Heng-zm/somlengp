
import { memo } from 'react';
import * as React from "react"

import { cn } from "@/lib/utils"

// Static variants to avoid re-creation on each render
const cardVariants = {
  default: "rounded-lg border bg-card text-card-foreground shadow-sm",
  elevated: "rounded-xl border bg-card text-card-foreground shadow-lg hover:shadow-xl",
  glass: "rounded-xl border border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl text-card-foreground shadow-xl",
  interactive: "rounded-xl border bg-card text-card-foreground shadow-md hover:shadow-xl cursor-pointer transition-all duration-300",
};

const animationVariants = {
  none: "",
  hover: "hover:scale-[1.01] hover:-translate-y-1 transition-all duration-300 will-change-transform",
  float: "hover:scale-[1.02] hover:-translate-y-2 transition-all duration-300 will-change-transform",
};

const Card = React.memo(React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "glass" | "interactive";
    animation?: "none" | "hover" | "float";
  }
>(({ className, variant = "default", animation = "hover", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        cardVariants[variant],
        animationVariants[animation],
        className
      )}
      {...props}
    />
  );
}));
Card.displayName = "Card"

const CardHeader = React.memo(React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
)));
CardHeader.displayName = "CardHeader"

const CardTitle = React.memo(React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
)));
CardTitle.displayName = "CardTitle"

const CardDescription = React.memo(React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
)));
CardDescription.displayName = "CardDescription"

const CardContent = React.memo(React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
)));
CardContent.displayName = "CardContent"

const CardFooter = React.memo(React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
)));
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
