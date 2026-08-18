"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRequireAuth } from "@/lib/use-require-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { UploadCloud, FileText, Loader2 } from "lucide-react";

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
      setError(err instanceof ApiError ? err.message : "Upload failed");
    },
  });

  const handleFile = (f: File | null) => {
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (!lower.endsWith(".nii") && !lower.endsWith(".nii.gz") && !lower.endsWith(".zip")) {
      setError("Only .nii, .nii.gz, or .zip files are supported");
      return;
    }
    setError(null);
    setFile(f);
  };

  if (!ready) return null;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Upload MRI</h1>

      <Card>
        <CardHeader>
          <CardTitle>New scan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-1 block">Patient</label>
            <select
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Modality</label>
              <select
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
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
              <label className="text-sm font-medium mb-1 block">Visit label</label>
              <input
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={visitLabel}
                onChange={(e) => setVisitLabel(e.target.value)}
                placeholder="e.g. 3-month follow-up"
              />
            </div>
          </div>

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
            className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag & drop a .nii, .nii.gz, or .zip file here
                </p>
              </>
            )}
            <label className="inline-block mt-3">
              <span className="text-sm text-primary font-medium cursor-pointer">
                Browse files
              </span>
              <input
                type="file"
                className="hidden"
                accept=".nii,.gz,.zip"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {error && (
            <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!file || !patientId || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              "Upload & start AI processing"
            )}
          </Button>
        </CardContent>
      </Card>
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
