"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Brain,
  LayoutDashboard,
  Users,
  Upload,
  LogOut,
  User2,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/upload", label: "Upload MRI", icon: Upload },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Derive breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    // Format UUIDs/IDs a bit nicer if they exist in path
    const displayLabel = segment.length > 15 ? `#${segment.substring(0, 4)}` : label;
    return { href, label: displayLabel };
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* ── Mobile top bar ────────────────────────────────────────── */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-border/50 glass-strong sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-sm">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm gradient-text">OncoTwin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground bg-muted/50 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <MobileNav open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <motion.aside 
        animate={{ width: sidebarCollapsed ? 80 : 256 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="hidden md:flex flex-col h-screen sticky top-0 border-r border-border/50 glass-strong z-30 overflow-hidden relative"
      >
        {/* Toggle collapse button */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute right-0 top-[22px] translate-x-1/2 h-6 w-6 rounded-full bg-border border border-background flex items-center justify-center z-50 hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all"
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
        </button>

        {/* Logo & Theme Toggle */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border/50 h-[73px]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-sm flex-shrink-0">
              <Brain className="h-4.5 w-4.5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0 flex-1">
                <span className="font-bold text-base gradient-text block truncate">OncoTwin</span>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5 truncate">Clinical AI Platform</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 relative">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 z-10",
                  active
                    ? "text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20 z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <div className="relative z-10 flex items-center gap-3 w-full">
                  <div
                    className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0",
                      active
                        ? "bg-primary text-primary-foreground shadow-glow-sm"
                        : "bg-muted/50 group-hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  {!sidebarCollapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate">
                      {item.label}
                    </motion.span>
                  )}
                  {active && !sidebarCollapsed && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
              </Link>
            );

            return sidebarCollapsed ? (
              <Tooltip key={item.href} content={item.label} side="right">
                {linkContent}
              </Tooltip>
            ) : (
              <div key={item.href}>{linkContent}</div>
            );
          })}
        </nav>

        {/* Sidebar gradient fade at bottom of nav list */}
        <div className="h-12 bg-gradient-to-t from-background to-transparent pointer-events-none absolute bottom-[100px] left-0 right-0" />

        {/* Bottom: user info + theme + logout */}
        <div className="mt-auto border-t border-border/50 p-3 space-y-1 bg-background relative z-20">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Settings</span>
              <ThemeToggle />
            </div>
          )}

          {user && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <User2 className="h-3.5 w-3.5 text-primary" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {user.full_name || "Clinician"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-muted-foreground hover:bg-danger/10 hover:text-danger transition-all duration-200",
              sidebarCollapsed ? "justify-center px-0" : "px-3"
            )}
            title={sidebarCollapsed ? "Sign out" : undefined}
          >
            <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto overflow-x-hidden bg-background dot-grid relative">
        {/* Breadcrumb top bar (desktop) */}
        <div className="hidden md:flex items-center h-14 px-8 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center text-xs text-muted-foreground gap-1.5">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Home</Link>
            {breadcrumbs.length > 0 && breadcrumbs[0].href !== "/dashboard" && (
              <>
                <ChevronRight className="h-3 w-3" />
                {breadcrumbs.map((crumb, i) => (
                  <div key={crumb.href} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="h-3 w-3" />}
                    <Link 
                      href={crumb.href} 
                      className={cn(
                        "hover:text-foreground transition-colors",
                        i === breadcrumbs.length - 1 && "text-foreground font-medium"
                      )}
                    >
                      {crumb.label}
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8 max-w-6xl w-full mx-auto animate-fade-in flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
