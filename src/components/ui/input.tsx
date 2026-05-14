import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-md border border-white/[0.06] bg-[var(--bg-2)] px-3 py-1 text-[13px] text-[var(--text-primary)] transition-all placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:border-white/20 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
