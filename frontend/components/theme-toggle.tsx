"use client";

import { useTheme } from "@/lib/theme-provider";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative p-2 rounded-xl border border-border/60 transition-all duration-200 hover:scale-105 active:scale-95",
        "bg-card/60 hover:bg-card hover:border-primary/30 text-muted-foreground hover:text-foreground shadow-sm",
        className
      )}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={cn(
            "h-4 w-4 transition-all duration-300 transform",
            resolvedTheme === "dark"
              ? "opacity-0 rotate-90 scale-0 absolute"
              : "opacity-100 rotate-0 scale-100 text-amber-500"
          )}
        />
        <Moon
          className={cn(
            "h-4 w-4 transition-all duration-300 transform",
            resolvedTheme === "dark"
              ? "opacity-100 rotate-0 scale-100 text-cyan-400"
              : "opacity-0 -rotate-90 scale-0 absolute"
          )}
        />
      </div>
    </button>
  );
}
