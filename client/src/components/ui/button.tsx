import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[15px] font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] ios-touch-feedback",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-lg border border-primary/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-lg border border-destructive/20",
        outline:
          "border-2 border-border bg-background hover:bg-muted hover:text-foreground hover:border-border/80 shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md border border-border/50",
        ghost: "hover:bg-muted hover:text-foreground transition-colors duration-150",
        link: "text-primary underline-offset-4 hover:underline h-auto p-0",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-lg border border-green-500/20",
        warning: "bg-orange-600 text-white hover:bg-orange-700 shadow-sm hover:shadow-lg border border-orange-500/20",
      },
      size: {
        default: "h-11 px-5 py-2.5 min-w-[80px]",
        sm: "h-9 rounded-lg px-4 py-2 text-[14px] min-w-[70px] [&_svg]:size-3.5",
        lg: "h-12 rounded-xl px-7 py-3 text-[16px] min-w-[100px] [&_svg]:size-5",
        icon: "h-11 w-11 p-0",
        "icon-sm": "h-9 w-9 p-0 rounded-lg [&_svg]:size-4",
        "icon-lg": "h-12 w-12 p-0 rounded-xl [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
)
Button.displayName = "Button"

export { Button, buttonVariants }
