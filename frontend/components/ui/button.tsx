import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97] select-none",
          variant === "primary" &&
            "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-glow hover:shadow-glow-lg hover:brightness-110",
          variant === "secondary" &&
            "bg-muted text-foreground border border-border hover:bg-card-hover hover:border-border",
          variant === "ghost" &&
            "text-muted-foreground hover:bg-muted hover:text-foreground",
          variant === "danger" &&
            "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
          variant === "outline" &&
            "border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/60",
          size === "sm" && "h-8 px-3 text-xs",
          size === "md" && "h-10 px-4 text-sm",
          size === "lg" && "h-12 px-6 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
