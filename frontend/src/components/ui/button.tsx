import * as React from "react";
import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  
  "inline-flex items-center justify-center rounded-md text-sm font-medium " +
    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring " +
    "focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
    
      variant: {
        default:
          "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200",
        outline:
          "border border-zinc-700 bg-transparent text-white hover:bg-zinc-800",
        gradientOutline:
          "relative isolate overflow-hidden text-white " +
          "before:absolute before:inset-0 before:-z-10 before:rounded-md before:p-[1px] " +
          "before:bg-[linear-gradient(135deg,var(--brand-from),var(--brand-to))] " +
          "hover:before:opacity-100 before:opacity-80 transition",
        
        brandBlue:
          "bg-[linear-gradient(135deg,#008cff,#0062ff)] text-white shadow-lg " +
          "hover:brightness-110",
      },

      
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
