"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRequireAuth } from "@/lib/use-require-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  Users,
  FileScan,
  Activity,
  Upload as UploadIcon,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardPage() {
  const { ready, user } = useRequireAuth();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.patients.list(),
    enabled: ready,
  });

  if (!ready) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const stats = [
    {
      label: "Total patients",
      value: patients?.length ?? 0,
      icon: Users,
      gradient: "from-primary/20 via-primary/10 to-transparent",
      iconColor: "text-primary",
      iconBg: "bg-primary/15",
      accentClass: "stat-card-primary",
      trend: "+2 this week",
    },
    {
      label: "Active twins",
      value: patients?.length ?? 0,
      icon: FileScan,
      gradient: "from-secondary/20 via-secondary/10 to-transparent",
      iconColor: "text-secondary",
      iconBg: "bg-secondary/15",
      accentClass: "stat-card-secondary",
      trend: "All active",
    },
    {
      label: "AI jobs today",
      value: "—",
      icon: Activity,
      gradient: "from-accent/20 via-accent/10 to-transparent",
      iconColor: "text-accent",
      iconBg: "bg-accent/15",
      accentClass: "stat-card-accent",
      trend: "Processing queue clear",
    },
  ];

  return (
    <AppShell>
      {/* ── Page header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-accent uppercase tracking-widest">
              Live dashboard
            </span>
          </div>
          <h1 className="text-3xl font-bold">
            {user?.full_name
              ? `Hello, ${user.full_name.split(" ")[0]} 👋`
              : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here&apos;s an overview of your clinical workspace.
          </p>
        </div>
        <Link href="/upload">
          <Button className="gap-2 shadow-glow-sm">
            <UploadIcon className="h-4 w-4" />
            Upload MRI
          </Button>
        </Link>
      </div>

      {/* ── Stat cards ────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3 mb-8 stagger-children">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`relative rounded-2xl border border-border bg-card shadow-card overflow-hidden ${s.accentClass} transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 animate-fade-in`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-50 pointer-events-none`} />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                  <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
                </div>
              </div>
              <p className="text-4xl font-bold mb-2">{s.value}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-accent" />
                <span>{s.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent patients ───────────────────────────────────── */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Recent patients</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest 5 patient records
              </p>
            </div>
            <Link href="/patients">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                View all
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : patients && patients.length > 0 ? (
            <div className="space-y-1">
              {patients.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="group flex items-center justify-between py-3 px-4 -mx-4 rounded-xl hover:bg-muted/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 border border-border flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        MRN: {p.mrn}
                        {p.diagnosis ? ` · ${p.diagnosis}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No patients yet</p>
              <p className="text-sm text-muted-foreground mb-5">
                Add your first patient to start building digital twins
              </p>
              <Link href="/patients">
                <Button variant="outline" size="sm">
                  Add your first patient
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
