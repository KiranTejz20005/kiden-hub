import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[13px] font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#e8e8e8] text-[#0a0a0a] hover:bg-[#d0d0d0]",
        secondary: "bg-[var(--bg-4)] border border-white/[0.06] text-[var(--text-primary)] hover:bg-[var(--bg-5)]",
        outline: "border border-white/[0.06] bg-transparent hover:bg-[var(--bg-4)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        ghost: "hover:bg-[var(--bg-4)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        link: "text-[var(--text-primary)] underline-offset-4 hover:underline",
        destructive: "bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/20 hover:bg-[#ff4d4d]/20",
      },
      size: {
        default: "h-8 px-4",
        sm: "h-7 px-3",
        lg: "h-10 px-6 text-sm",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
