"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  TooltipProps,
} from "recharts";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useJobProgress } from "@/lib/use-job-progress";
import { AppShell } from "@/components/app-shell";
import { TumorVisualization } from "@/components/tumor-visualization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  BarChart3,
  TrendingUp,
  Microscope,
  Layers3,
  Activity,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// Custom tooltip for dark theme
const DarkTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs border border-border shadow-float">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">
        {payload[0]?.value}
        {payload[0]?.unit ?? ""}
      </p>
    </div>
  );
};

export default function ResultsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId: jobIdParam } = use(params);
  const jobId = Number(jobIdParam);
  const { ready } = useRequireAuth();
  const [days, setDays] = useState(30);

  const { data: job, refetch } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.jobs.get(jobId),
    enabled: ready && !!jobId,
    refetchInterval: (query) =>
      query.state.data?.status === "complete" ||
      query.state.data?.status === "failed"
        ? false
        : 2000,
  });

  const liveUpdate = useJobProgress(
    job && job.status !== "complete" && job.status !== "failed" ? jobId : null
  );

  useEffect(() => {
    if (
      liveUpdate?.status === "complete" ||
      liveUpdate?.status === "failed"
    ) {
      refetch();
    }
  }, [liveUpdate, refetch]);

  const { data: prediction } = useQuery({
    queryKey: ["prediction", jobId, days],
    queryFn: () => api.predict.growth(jobId, days),
    enabled: ready && job?.status === "complete",
  });

  const growthSeries = job?.result
    ? [0, 30, 60, 90].map((d) => {
        const months = d / 30;
        const projected =
          job.result!.tumor_volume_ml * 1.06 ** months;
        return { day: d, volume: Math.round(projected * 100) / 100 };
      })
    : [];

  if (!ready) return null;

  const displayedProgress = liveUpdate?.progress ?? job?.progress ?? 0;
  const displayedStatus = liveUpdate?.status ?? job?.status ?? "queued";
  const displayedStep = liveUpdate?.step;

  const metricCards = job?.result
    ? [
        {
          label: "Tumor volume",
          value: `${job.result.tumor_volume_ml}`,
          unit: "mL",
          icon: Layers3,
          color: "from-primary/20 to-primary/5",
          iconColor: "text-primary",
          iconBg: "bg-primary/15",
          accentClass: "stat-card-primary",
        },
        {
          label: "AI confidence",
          value: `${((job.result.confidence ?? 0) * 100).toFixed(1)}`,
          unit: "%",
          icon: Activity,
          color: "from-accent/20 to-accent/5",
          iconColor: "text-accent",
          iconBg: "bg-accent/15",
          accentClass: "stat-card-accent",
        },
        {
          label: "Voxel count",
          value: job.result.segmentation_mask_summary.voxel_count.toLocaleString(),
          unit: "",
          icon: Microscope,
          color: "from-secondary/20 to-secondary/5",
          iconColor: "text-secondary",
          iconBg: "bg-secondary/15",
          accentClass: "stat-card-secondary",
        },
      ]
    : [];

  return (
    <AppShell>
      {/* ── Back + Header ──────────────────────────────────────── */}
      <Link
        href="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to patients
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Scan analysis
            </span>
          </div>
          <h1 className="text-3xl font-bold">AI Results</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Job #{jobId} · Automated tumor segmentation &amp; prediction
          </p>
        </div>
      </div>

      {/* ── States ─────────────────────────────────────────────── */}
      {!job ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : displayedStatus !== "complete" && displayedStatus !== "failed" ? (
        /* Processing state */
        <Card className="animate-scale-in border-primary/20 shadow-glow-sm">
          <CardContent className="pt-10 pb-12 flex flex-col items-center text-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Loader2 className="h-9 w-9 text-primary animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full animate-pulse-glow" />
            </div>
            <div>
              <p className="font-semibold text-xl mb-1">Processing scan…</p>
              <p className="text-sm text-muted-foreground">
                {displayedStep || "Queued for processing"}
              </p>
            </div>
            <div className="w-full max-w-sm">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
                  style={{ width: `${displayedProgress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-medium text-primary">
                  {displayedProgress}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : displayedStatus === "failed" ? (
        /* Error state */
        <Card className="animate-scale-in border-danger/20">
          <CardContent className="pt-10 pb-12 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-danger" />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">Processing failed</p>
              <p className="text-sm text-muted-foreground">{job.error}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Success state */
        <div className="space-y-6 animate-fade-in">
          {/* Success badge */}
          <div className="flex items-center gap-2.5">
            <span className="badge badge-success text-sm py-1 px-3">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Analysis complete
            </span>
            <span className="text-xs text-muted-foreground">
              Model version: {job.result?.model_version}
            </span>
          </div>

          {/* Metric stat cards */}
          <div className="grid md:grid-cols-3 gap-4 stagger-children">
            {metricCards.map((s) => (
              <div
                key={s.label}
                className={`relative rounded-2xl border border-border bg-card shadow-card overflow-hidden ${s.accentClass} transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 animate-fade-in`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-50 pointer-events-none`}
                />
                <div className="relative p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground font-medium">
                      {s.label}
                    </p>
                    <div
                      className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center`}
                    >
                      <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-4xl font-bold">
                    {s.value}
                    <span className="text-base font-normal text-muted-foreground ml-1">
                      {s.unit}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Visualization + Radiomics */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-primary" />
                  3D tumor visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TumorVisualization
                  volumeMl={job.result?.tumor_volume_ml ?? 0}
                  meshVertices={job.result?.mesh.vertices ?? 0}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Microscope className="h-4 w-4 text-secondary" />
                  Radiomic features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={Object.entries(job.result?.radiomics || {}).map(
                      ([name, value]) => ({ name, value })
                    )}
                    layout="vertical"
                    margin={{ left: 20, right: 10 }}
                  >
                    <XAxis type="number" domain={[0, 1]} hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11, fill: "hsl(220 15% 55%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar
                      dataKey="value"
                      fill="url(#barGradient)"
                      radius={[0, 6, 6, 0]}
                    >
                      <defs>
                        <linearGradient
                          id="barGradient"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop
                            offset="0%"
                            stopColor="hsl(var(--primary))"
                          />
                          <stop
                            offset="100%"
                            stopColor="hsl(var(--secondary))"
                          />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Growth prediction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Future growth prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={growthSeries} margin={{ right: 20 }}>
                  <defs>
                    <linearGradient
                      id="lineGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--accent))"
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--primary))"
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(d) => `${d}d`}
                    tick={{ fontSize: 11, fill: "hsl(220 15% 55%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    unit=" mL"
                    width={70}
                    tick={{ fontSize: 11, fill: "hsl(220 15% 55%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="url(#lineGradient)"
                    strokeWidth={2.5}
                    dot={{
                      r: 5,
                      fill: "hsl(var(--accent))",
                      strokeWidth: 2,
                      stroke: "hsl(var(--background))",
                    }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Projection slider */}
              <div className="mt-5 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Projection horizon</span>
                  <span className="badge badge-info">{days} days</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={90}
                  step={30}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full accent-[hsl(var(--primary))]"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>30 days</span>
                  <span>60 days</span>
                  <span>90 days</span>
                </div>
                {prediction && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-muted-foreground">
                      Projected volume at {prediction.days}d:
                    </span>
                    <span className="font-semibold text-accent">
                      {prediction.projected_volume_ml} mL
                    </span>
                    <span className="text-muted-foreground">
                      · confidence{" "}
                      {(prediction.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
