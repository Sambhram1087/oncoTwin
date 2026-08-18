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
import { Upload, FileScan, ChevronRight } from "lucide-react";

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
        <Skeleton className="h-10 w-72 mb-6" />
        <Skeleton className="h-40" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{patient?.full_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            MRN: {patient?.mrn} {patient?.diagnosis ? `· ${patient.diagnosis}` : ""}
          </p>
        </div>
        <Link href={`/upload?patient=${patientId}`}>
          <Button>
            <Upload className="h-4 w-4" />
            Upload new scan
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Digital twin timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {scansLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : scans && scans.length > 0 ? (
            <ol className="relative border-l border-border ml-3 space-y-6">
              {scans.map((scan) => (
                <li key={scan.id} className="ml-6">
                  <span className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary" />
                  <Link
                    href={`/results/${scan.job_id ?? ""}`}
                    className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileScan className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">
                          {scan.visit_label || "Visit"} · {scan.modality}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {scan.original_filename} ·{" "}
                          {new Date(scan.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">
                No scans uploaded yet for this patient.
              </p>
              <Link href={`/upload?patient=${patientId}`}>
                <Button variant="secondary">Upload the first MRI</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
