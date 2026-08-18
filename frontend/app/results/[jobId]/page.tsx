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
} from "recharts";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useJobProgress } from "@/lib/use-job-progress";
import { AppShell } from "@/components/app-shell";
import { TumorVisualization } from "@/components/tumor-visualization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

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
      query.state.data?.status === "complete" || query.state.data?.status === "failed"
        ? false
        : 2000,
  });

  const liveUpdate = useJobProgress(
    job && job.status !== "complete" && job.status !== "failed" ? jobId : null
  );

  useEffect(() => {
    if (liveUpdate?.status === "complete" || liveUpdate?.status === "failed") {
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
        const projected = job.result!.tumor_volume_ml * (1.06 ** months);
        return { day: d, volume: Math.round(projected * 100) / 100 };
      })
    : [];

  if (!ready) return null;

  const displayedProgress = liveUpdate?.progress ?? job?.progress ?? 0;
  const displayedStatus = liveUpdate?.status ?? job?.status ?? "queued";
  const displayedStep = liveUpdate?.step;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Scan analysis</h1>

      {!job ? (
        <Skeleton className="h-40" />
      ) : displayedStatus !== "complete" && displayedStatus !== "failed" ? (
        <Card>
          <CardContent className="pt-8 pb-10 flex flex-col items-center text-center gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div>
              <p className="font-semibold text-lg">Processing scan…</p>
              <p className="text-sm text-muted-foreground mt-1">
                {displayedStep || "Queued for processing"}
              </p>
            </div>
            <div className="w-full max-w-md h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${displayedProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{displayedProgress}%</p>
          </CardContent>
        </Card>
      ) : displayedStatus === "failed" ? (
        <Card>
          <CardContent className="pt-8 pb-10 flex flex-col items-center text-center gap-3">
            <XCircle className="h-10 w-10 text-danger" />
            <p className="font-semibold">Processing failed</p>
            <p className="text-sm text-muted-foreground">{job.error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-success text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Analysis complete · model {job.result?.model_version}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Tumor volume</p>
                <p className="text-3xl font-bold mt-1">
                  {job.result?.tumor_volume_ml} <span className="text-base font-normal">mL</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-3xl font-bold mt-1">
                  {((job.result?.confidence ?? 0) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Voxel count</p>
                <p className="text-3xl font-bold mt-1">
                  {job.result?.segmentation_mask_summary.voxel_count.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>3D tumor visualization</CardTitle>
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
                <CardTitle>Radiomic features</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={Object.entries(job.result?.radiomics || {}).map(
                      ([name, value]) => ({ name, value })
                    )}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <XAxis type="number" domain={[0, 1]} hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Future growth prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={growthSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tickFormatter={(d) => `${d}d`} />
                  <YAxis unit=" mL" width={70} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-4">
                <label className="text-sm font-medium mb-2 flex items-center justify-between">
                  <span>Projection horizon</span>
                  <span className="text-muted-foreground">{days} days</span>
                </label>
                <input
                  type="range"
                  min={30}
                  max={90}
                  step={30}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full"
                />
                {prediction && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Projected volume at {prediction.days} days:{" "}
                    <span className="font-semibold text-foreground">
                      {prediction.projected_volume_ml} mL
                    </span>{" "}
                    (confidence {(prediction.confidence * 100).toFixed(0)}%)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
