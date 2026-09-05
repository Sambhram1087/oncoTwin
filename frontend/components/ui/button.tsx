"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, useRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", onClick, children, ...props }, ref) => {
    const btnRef = useRef<HTMLButtonElement>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Ripple effect
      const btn = btnRef.current ?? (ref as React.MutableRefObject<HTMLButtonElement>)?.current;
      if (btn && variant === "primary") {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement("span");
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        ripple.className = "ripple";
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref ?? btnRef}
        className={cn(
          "ripple-container inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97] select-none cursor-pointer",
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
          size === "icon" && "h-10 w-10 p-0 rounded-xl",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
