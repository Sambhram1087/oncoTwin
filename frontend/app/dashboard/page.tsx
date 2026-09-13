"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, DashboardStats, RecentActivityItem, ChartDataPoint } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Activity,
  Upload,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Brain,
  BarChart3,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";

/* ─── Simple inline SVG bar chart ─────────────────────────────────────── */
function BarChart({ data, color = "var(--color-primary)" }: { data: ChartDataPoint[]; color?: string }) {
  if (!data || data.length === 0) return <div className="h-32 flex items-center justify-center text-muted-foreground text-xs">No data</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 w-full pt-2">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.name} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-[9px] font-mono text-muted-foreground">{d.value}</span>
            <div
              className="w-full rounded-t-sm transition-all duration-700"
              style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: color, opacity: 0.85 }}
            />
            <span className="text-[9px] text-muted-foreground truncate w-full text-center leading-tight">{d.name}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Sparkline ─────────────────────────────────────────────────────────── */
function Sparkline({ values, color = "currentColor" }: { values: number[]; color?: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="w-16 h-8" viewBox="0 -10 100 120" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

/* ─── Status badge helper ────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "danger" | "warning" | "neutral"> = {
    complete: "success",
    failed: "danger",
    running: "warning",
    queued: "neutral",
  };
  return <Badge variant={map[status] ?? "neutral"}>{status.toUpperCase()}</Badge>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);
  const [volDist, setVolDist] = useState<ChartDataPoint[]>([]);
  const [modalityBreak, setModalityBreak] = useState<ChartDataPoint[]>([]);
  const [confHist, setConfHist] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [s, act, vol, mod, conf] = await Promise.all([
          api.dashboard.stats(),
          api.dashboard.recentActivity(),
          api.analytics.volumeDistribution(),
          api.analytics.modalityBreakdown(),
          api.analytics.confidenceHistogram(),
        ]);
        if (cancelled) return;
        setStats(s);
        setActivity(act.activities);
        setVolDist(vol);
        setModalityBreak(mod);
        setConfHist(conf);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const stagger = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" },
    }),
  };

  const avgSec =
    stats?.avg_processing_time_ms != null
      ? stats.avg_processing_time_ms / 1000
      : null;

  const statCards = [
    {
      label: "Total Patients",
      value: stats?.total_patients ?? 0,
      icon: Users,
      color: "primary",
      spark: [12, 14, 13, 17, 16, 19, stats?.total_patients ?? 0],
      sub: `${stats?.completed_jobs ?? 0} analyses complete`,
    },
    {
      label: "Scans Analyzed",
      value: stats?.total_scans ?? 0,
      icon: Activity,
      color: "secondary",
      spark: [5, 9, 7, 11, 15, 12, stats?.total_scans ?? 0],
      sub: `${stats?.failed_jobs ?? 0} failed`,
    },
    {
      label: "Pending Jobs",
      value: stats?.pending_jobs ?? 0,
      icon: Clock,
      color: "warning",
      spark: [3, 5, 2, 6, 1, 4, stats?.pending_jobs ?? 0],
      sub: stats?.pending_jobs ? "Requires attention" : "All clear",
    },
    {
      label: "Avg Process Time",
      value: avgSec ?? 0,
      suffix: "s",
      decimals: 1,
      icon: CheckCircle2,
      color: "success",
      spark: [4.2, 3.8, 3.5, 3.1, 2.9, 2.7, avgSec ?? 0],
      sub: stats?.model_version ?? "oncotwin-v1.0",
    },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              {getTimeGreeting()}, {user?.full_name?.split(" ")[0] || "Clinician"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Here's an overview of your clinical workspace today.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-2">
            <Link href="/upload">
              <Button className="rounded-xl shadow-glow">
                <Upload className="h-4 w-4" />
                Upload Scan
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div key={i} custom={i} initial="hidden" animate="visible" variants={stagger}>
              <Card className="h-full overflow-hidden relative group">
                <div className={`absolute top-0 inset-x-0 h-1 bg-${stat.color}`} />
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`h-10 w-10 rounded-xl bg-${stat.color}/10 flex items-center justify-center text-${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <Sparkline values={stat.spark} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <h3 className="text-3xl font-bold tracking-tight">
                        {loading ? (
                          <span className="w-16 h-8 block rounded-md skeleton" />
                        ) : (
                          <AnimatedCounter target={stat.value} decimals={stat.decimals ?? 0} />
                        )}
                      </h3>
                      {stat.suffix && (
                        <span className="text-sm font-medium text-muted-foreground">{stat.suffix}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      {!loading && (
                        <>
                          <ArrowUpRight className="h-3 w-3 text-success" />
                          {stat.sub}
                        </>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Activity + Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6 pt-4">
          {/* Recent Activity */}
          <motion.div custom={4} initial="hidden" animate="visible" variants={stagger} className="lg:col-span-2">
            <Card className="h-full">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">Latest scans and analysis results</p>
                </div>
                <Link href="/patients">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground font-medium">Loading activity feed...</p>
                  </div>
                ) : activity.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Activity className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                    <Link href="/upload" className="mt-4">
                      <Button size="sm" variant="outline">Upload first scan</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {activity.map((item) => (
                      <Link
                        key={item.id}
                        href={`/results/${item.id}`}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              item.status === "complete"
                                ? "bg-success/15 text-success"
                                : item.status === "failed"
                                ? "bg-danger/15 text-danger"
                                : "bg-warning/15 text-warning"
                            }`}
                          >
                            {item.status === "complete" ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : item.status === "failed" ? (
                              <AlertCircle className="h-5 w-5" />
                            ) : (
                              <Activity className="h-5 w-5 animate-pulse" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate flex items-center gap-2">
                              {item.patient_name}
                              <span className="text-muted-foreground font-mono text-xs">({item.patient_mrn})</span>
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <StatusBadge status={item.status} />
                              <span className="text-xs text-muted-foreground">{item.modality}</span>
                              {item.volume_ml != null && (
                                <span className="text-xs font-medium text-primary">
                                  {item.volume_ml.toFixed(1)} mL
                                </span>
                              )}
                              {item.confidence != null && (
                                <span className="text-xs text-muted-foreground">
                                  {(item.confidence * 100).toFixed(0)}% conf
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(item.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div custom={5} initial="hidden" animate="visible" variants={stagger}>
            <Card className="h-full bg-gradient-to-br from-card to-primary/5">
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-1">Quick Actions</h3>
                <p className="text-sm text-muted-foreground mb-6">Common tasks for your workflow</p>
                <div className="space-y-3">
                  <Link href="/upload" className="block">
                    <div className="group flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-1 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom" />
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">Upload Scan</p>
                        <p className="text-xs text-muted-foreground">Run new analysis</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/patients" className="block">
                    <div className="group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-border hover:bg-muted/50 transition-colors cursor-pointer relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-1 bg-muted-foreground transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom" />
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">Patient Registry</p>
                        <p className="text-xs text-muted-foreground">View longitudinal data</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/patients?add=1" className="group flex items-center gap-4 p-4 rounded-xl border border-border border-dashed hover:bg-muted/30 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-transparent flex items-center justify-center text-muted-foreground border border-dashed border-muted-foreground/50">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Add Patient</p>
                      <p className="text-xs text-muted-foreground/60">Register new record</p>
                    </div>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Analytics Charts */}
        <motion.div custom={6} initial="hidden" animate="visible" variants={stagger}>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Analytics Overview</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
                  <Layers className="h-4 w-4" /> Volume Distribution
                </CardTitle>
                <p className="text-xs text-muted-foreground">Tumor volume buckets (mL)</p>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="h-28 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <BarChart data={volDist} color="hsl(var(--primary))" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-secondary">
                  <Brain className="h-4 w-4" /> Modality Breakdown
                </CardTitle>
                <p className="text-xs text-muted-foreground">Scans by MRI sequence</p>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="h-28 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                  </div>
                ) : (
                  <BarChart data={modalityBreak} color="hsl(var(--secondary))" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-accent">
                  <Activity className="h-4 w-4" /> AI Confidence
                </CardTitle>
                <p className="text-xs text-muted-foreground">Segmentation confidence bands</p>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="h-28 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  </div>
                ) : (
                  <BarChart data={confHist} color="hsl(var(--accent))" />
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
