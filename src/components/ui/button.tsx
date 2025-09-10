
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] hover:scale-[1.02] will-change-transform",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200",
        destructive:
          "bg-gray-800 text-white hover:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-200",
        outline:
          "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 hover:text-black shadow-sm hover:shadow-md transition-all duration-200",
        secondary:
          "bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm hover:shadow-md transition-all duration-200",
        ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-700 transition-all duration-200",
        link: "text-gray-900 underline-offset-4 hover:underline hover:text-black transition-all duration-200",
        gradient: "bg-gradient-to-r from-gray-900 to-black text-white hover:from-gray-800 hover:to-gray-900 shadow-lg hover:shadow-xl",
        "mono-light": "bg-gradient-to-r from-gray-100 to-white text-gray-900 hover:from-gray-50 hover:to-gray-100 shadow-lg hover:shadow-xl border border-gray-200",
        "mono-dark": "bg-gradient-to-r from-black to-gray-900 text-white hover:from-gray-900 hover:to-gray-800 shadow-lg hover:shadow-xl",
        "dark": "bg-gray-900 text-white hover:bg-black shadow-md hover:shadow-lg transition-all duration-200",
        "light": "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200",
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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
));
Button.displayName = "Button"

export { Button, buttonVariants }
