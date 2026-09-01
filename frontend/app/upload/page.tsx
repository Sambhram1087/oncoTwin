"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/use-require-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import {
  UploadCloud,
  FileText,
  Loader2,
  AlertCircle,
  Cpu,
  ScanLine,
} from "lucide-react";

const MODALITIES = ["T1", "T1ce", "T2", "FLAIR"];

function UploadForm() {
  const { ready } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patient");

  const [patientId, setPatientId] = useState<string>(patientIdParam || "");
  const [modality, setModality] = useState("T1");
  const [visitLabel, setVisitLabel] = useState("Baseline");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.patients.list(),
    enabled: ready,
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Select a file first");
      return api.scans.upload(Number(patientId), file, modality, visitLabel);
    },
    onSuccess: (job) => {
      router.push(`/results/${job.id}`);
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.message
          : (err as Error)?.message || "Upload failed"
      );
    },
  });

  const handleFile = (f: File | null) => {
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (
      !lower.endsWith(".nii") &&
      !lower.endsWith(".nii.gz") &&
      !lower.endsWith(".zip")
    ) {
      setError("Only .nii, .nii.gz, or .zip files are supported");
      return;
    }
    setError(null);
    setFile(f);
  };

  if (!ready) return null;

  const selectClass =
    "h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm outline-none transition-all duration-200 focus:border-primary/60 focus:ring-3 focus:ring-primary/15 cursor-pointer";

  return (
    <AppShell>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ScanLine className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            AI Processing
          </span>
        </div>
        <h1 className="text-3xl font-bold">Upload MRI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a scan to start automated segmentation and analysis
        </p>
      </div>

      <div className="max-w-2xl">
        <Card className="animate-fade-in shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              New scan submission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Patient select */}
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Patient <span className="text-danger">*</span>
              </label>
              <select
                className={selectClass}
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                <option value="">Select a patient</option>
                {patients?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>

            {/* Modality + visit label */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Modality
                </label>
                <select
                  className={selectClass}
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                >
                  {MODALITIES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Visit label
                </label>
                <input
                  className={selectClass}
                  value={visitLabel}
                  onChange={(e) => setVisitLabel(e.target.value)}
                  placeholder="e.g. 3-month follow-up"
                />
              </div>
            </div>

            {/* Drop zone */}
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                MRI file <span className="text-danger">*</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0] || null);
                }}
                className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
                  dragOver
                    ? "border-primary bg-primary/5 shadow-inner-glow"
                    : file
                    ? "border-accent/50 bg-accent/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs text-muted-foreground hover:text-danger transition-colors underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${dragOver ? "bg-primary/20 scale-110" : "bg-muted"}`}>
                      <UploadCloud className={`h-7 w-7 transition-colors duration-300 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Drop your MRI file here
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Supports .nii, .nii.gz, .zip
                      </p>
                    </div>
                  </div>
                )}

                <label className="absolute inset-0 cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".nii,.gz,.zip"
                    onChange={(e) => handleFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {!file && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  or{" "}
                  <label className="text-primary font-medium cursor-pointer hover:underline">
                    browse files
                    <input
                      type="file"
                      className="hidden"
                      accept=".nii,.gz,.zip"
                      onChange={(e) => handleFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              size="lg"
              className="w-full h-12 rounded-xl shadow-glow-sm"
              disabled={!file || !patientId || uploadMutation.isPending}
              onClick={() => uploadMutation.mutate()}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading & queuing AI job…
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Upload & start AI processing
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Files are processed asynchronously. You&apos;ll be redirected to the results page when processing begins.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={null}>
      <UploadForm />
    </Suspense>
  );
}
