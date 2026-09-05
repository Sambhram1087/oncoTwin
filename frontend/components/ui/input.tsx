import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          className={cn(
            "h-11 w-full rounded-xl border bg-muted/50 px-4 text-sm outline-none transition-all duration-200",
            "placeholder:text-muted-foreground/60",
            "focus:bg-card focus:ring-3 focus:ring-primary/15",
            "hover:bg-card/50",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error
              ? "border-danger focus:border-danger focus:ring-danger/15 animate-[shake_0.3s_ease-in-out]"
              : "border-border focus:border-primary/60 hover:border-border",
            className
          )}
          {...props}
        />
        {/* Animated focus underline */}
        <div className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-focus-within:w-full peer-focus:w-full" />
      </div>
    );
  }
);
Input.displayName = "Input";
