"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import {
  Brain,
  LayoutDashboard,
  Users,
  Upload,
  LogOut,
  User2,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/upload", label: "Upload MRI", icon: Upload },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className="w-64 hidden md:flex flex-col h-screen sticky top-0 border-r border-border/50 glass-strong">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border/50">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-sm flex-shrink-0">
            <Brain className="h-4.5 w-4.5 text-background" />
          </div>
          <div>
            <span className="font-bold text-base gradient-text">OncoTwin</span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Clinical AI Platform</p>
          </div>
        </div>

        {/* Nav section label */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Navigation
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/15 text-primary border border-primary/20 shadow-glow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200",
                    active
                      ? "bg-primary/20"
                      : "bg-muted/50 group-hover:bg-muted"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "")} />
                </div>
                {item.label}
                {active && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user info + logout */}
        <div className="mt-auto border-t border-border/50 p-3 space-y-1">
          {user && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <User2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">
                  {user.full_name || "Clinician"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-danger/10 hover:text-danger transition-all duration-200"
          >
            <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 p-6 md:p-8 max-w-6xl mx-auto w-full animate-fade-in">
        {children}
      </main>
    </div>
  );
}
