
import * as React from "react"

import { cn } from "@/lib/utils"

// Static variants to avoid re-creation on each render
const cardVariants = {
  default: "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
  elevated: "rounded-xl border border-border bg-card text-card-foreground shadow-md",
  glass: "rounded-xl border border-white/60 bg-white/85 text-card-foreground shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85",
  interactive: "cursor-pointer rounded-xl border border-border bg-card text-card-foreground shadow-sm transition duration-200 hover:border-primary/30 hover:shadow-md",
  centered: "center-card-content rounded-xl border border-border bg-card text-card-foreground shadow-sm",
  hero: "center-card-content min-h-[300px] rounded-2xl border border-border bg-gradient-to-b from-card to-secondary/40 text-card-foreground shadow-md"
};

const animationVariants = {
  none: "",
  hover: "transition-shadow duration-200 hover:shadow-md",
  float: "transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
};

const Card = React.memo(React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "glass" | "interactive" | "centered" | "hero";
    animation?: "none" | "hover" | "float";
    centered?: boolean;
  }
>(({ className, variant = "default", animation = "none", centered = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        cardVariants[variant],
        animationVariants[animation],
        centered && "center-card-content",
        className
      )}
      {...props}
    />
  );
}));
Card.displayName = "Card"

const CardHeader = React.memo(React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    centered?: boolean;
  }
>(({ className, centered = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      centered && "items-center text-center",
      className
    )}
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
      "text-xl font-semibold leading-6 tracking-tight",
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
  React.HTMLAttributes<HTMLDivElement> & {
    centered?: boolean;
  }
>(({ className, centered = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "p-6 pt-0",
      centered && "center-content text-center",
      className
    )} 
    {...props} 
  />
)));
CardContent.displayName = "CardContent"

const CardFooter = React.memo(React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    centered?: boolean;
  }
>(({ className, centered = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      centered ? "justify-center" : "justify-start",
      className
    )}
    {...props}
  />
)));
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
