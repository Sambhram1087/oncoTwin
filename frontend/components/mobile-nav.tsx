"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Brain,
  LayoutDashboard,
  Users,
  Upload,
  LogOut,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Overview & stats" },
  { href: "/patients", label: "Patients", icon: Users, desc: "Patient registry" },
  { href: "/upload", label: "Upload MRI", icon: Upload, desc: "AI segmentation" },
];

export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl glass-strong border-t border-border shadow-float p-6 pb-10"
          >
            {/* Handle + close */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-sm">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold gradient-text">OncoTwin</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Nav items */}
            <nav className="space-y-1.5">
              {NAV.map((item, idx) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-primary/15 text-primary border border-primary/20 shadow-glow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center",
                        active ? "bg-primary/20" : "bg-muted"
                      )}>
                        <Icon className={cn("h-4 w-4", active && "text-primary")} />
                      </div>
                      <div>
                        <p>{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Divider + sign out */}
            <div className="border-t border-border/50 mt-4 pt-4">
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                  onClose();
                }}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium text-muted-foreground hover:bg-danger/10 hover:text-danger transition-all duration-200"
              >
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                  <LogOut className="h-4 w-4" />
                </div>
                Sign out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
