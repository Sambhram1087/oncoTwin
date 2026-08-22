"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/use-require-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import {
  Upload,
  FileScan,
  ChevronRight,
  ArrowLeft,
  User2,
  Calendar,
  Activity,
  BadgeInfo,
} from "lucide-react";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const patientId = Number(id);
  const { ready } = useRequireAuth();

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => api.patients.get(patientId),
    enabled: ready,
  });

  const { data: scans, isLoading: scansLoading } = useQuery({
    queryKey: ["scans", patientId],
    queryFn: () => api.scans.list(patientId),
    enabled: ready,
  });

  if (!ready || patientLoading) {
    return (
      <AppShell>
        <Skeleton className="h-8 w-24 mb-6 rounded-lg" />
        <Skeleton className="h-32 w-full mb-6 rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* ── Back link ─────────────────────────────────────────── */}
      <Link
        href="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All patients
      </Link>

      {/* ── Patient header card ───────────────────────────────── */}
      <div className="gradient-border rounded-2xl p-6 mb-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/20 border border-primary/25 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0 shadow-glow-sm">
              {patient?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{patient?.full_name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="badge badge-info">MRN: {patient?.mrn}</span>
                {patient?.sex && (
                  <span className="badge badge-info">{patient.sex}</span>
                )}
                {patient?.diagnosis && (
                  <span className="badge badge-warning">{patient.diagnosis}</span>
                )}
              </div>
            </div>
          </div>

          <Link href={`/upload?patient=${patientId}`}>
            <Button className="gap-2 shadow-glow-sm">
              <Upload className="h-4 w-4" />
              Upload scan
            </Button>
          </Link>
        </div>

        {/* Patient meta row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-border/50">
          {[
            {
              icon: User2,
              label: "Patient ID",
              value: `#${patientId}`,
            },
            {
              icon: Calendar,
              label: "Date of birth",
              value: patient?.date_of_birth
                ? new Date(patient.date_of_birth).toLocaleDateString()
                : "—",
            },
            {
              icon: Activity,
              label: "MRI scans",
              value: scans?.length ?? "—",
            },
            {
              icon: BadgeInfo,
              label: "Registry status",
              value: "Active",
            },
          ].map((meta) => (
            <div key={meta.label} className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <meta.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {meta.label}
                </p>
                <p className="text-sm font-semibold">{meta.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Timeline card ────────────────────────────────────────── */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2">
              <FileScan className="h-4 w-4 text-primary" />
              Digital twin timeline
            </CardTitle>
            <span className="badge badge-info">
              {scans?.length ?? 0} scan{scans?.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {scansLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : scans && scans.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[13px] top-4 bottom-4 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent" />

              <ol className="space-y-4 pl-8">
                {scans.map((scan, idx) => (
                  <li key={scan.id} className="relative animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
                    {/* Timeline dot */}
                    <div className="absolute -left-[29px] top-3.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background shadow-glow-sm" />

                    <Link
                      href={`/results/${scan.job_id ?? ""}`}
                      className="group flex items-center justify-between rounded-2xl border border-border bg-muted/30 p-4 hover:bg-card-hover hover:border-primary/30 hover:shadow-card transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <FileScan className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {scan.visit_label || "Visit"} ·{" "}
                            <span className="badge badge-info text-[10px]">
                              {scan.modality}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {scan.original_filename} ·{" "}
                            {new Date(scan.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 animate-float">
                <FileScan className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No scans yet</p>
              <p className="text-sm text-muted-foreground mb-5">
                Upload the first MRI to start building this patient&apos;s digital twin
              </p>
              <Link href={`/upload?patient=${patientId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload first MRI
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
