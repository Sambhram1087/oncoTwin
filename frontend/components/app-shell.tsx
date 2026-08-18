"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/providers";
import { useAuthStore } from "@/lib/auth-store";
import {
  Brain,
  LayoutDashboard,
  Users,
  Upload,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/upload", label: "Upload MRI", icon: Upload },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-border hidden md:flex flex-col p-4 gap-1 glass sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 py-3 mb-4 font-semibold">
          <Brain className="h-5 w-5 text-primary" />
          OncoTwin
        </div>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-auto space-y-1">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
          {user && (
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">
              {user.full_name || user.email}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full animate-fade-in">
        {children}
      </main>
    </div>
  );
}
