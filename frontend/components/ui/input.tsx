import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm outline-none transition-all duration-200",
          "placeholder:text-muted-foreground/60",
          "focus:border-primary/60 focus:bg-card focus:ring-3 focus:ring-primary/15",
          "hover:border-border hover:bg-card/50",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
