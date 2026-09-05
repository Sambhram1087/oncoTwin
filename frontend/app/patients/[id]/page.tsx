"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, Patient, Scan, Job } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, Calendar, FileScan, ArrowLeft, Clock, 
  Activity, AlertCircle, Eye
} from "lucide-react";
import { motion } from "framer-motion";

export default function PatientDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [scans, setScans] = useState<(Scan & { job?: Job })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const patientId = parseInt(id, 10);
    if (isNaN(patientId)) {
      router.push("/patients");
      return;
    }

    Promise.all([
      api.patients.get(patientId).catch(() => null),
      api.scans.list(patientId).catch(() => []),
    ]).then(async ([p, s]) => {
      if (!p) {
        router.push("/patients");
        return;
      }
      setPatient(p);
      
      // Fetch job status for each scan
      const scansWithJobs = await Promise.all(
        s.map(async (scan) => {
          if (scan.job_id) {
            try {
              const job = await api.jobs.get(scan.job_id);
              return { ...scan, job };
            } catch {
              return scan;
            }
          }
          return scan;
        })
      );
      
      // Sort scans by date descending
      setScans(scansWithJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setLoading(false);
    });
  }, [id, router]);

  // Volume trend logic (simplified sparkline)
  const completedScans = scans.filter(s => s.job?.status === 'complete' && s.job?.result?.tumor_volume_ml !== undefined).reverse(); // oldest first for trend
  const hasTrend = completedScans.length > 1;
  const latestVol = hasTrend ? completedScans[completedScans.length - 1].job?.result?.tumor_volume_ml : null;
  const prevVol = hasTrend ? completedScans[completedScans.length - 2].job?.result?.tumor_volume_ml : null;
  const volDiff = hasTrend && latestVol !== null && latestVol !== undefined && prevVol !== null && prevVol !== undefined ? latestVol - prevVol : 0;
  const trendPercent = prevVol && prevVol > 0 ? (volDiff / prevVol) * 100 : 0;

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading patient record...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <Link href="/patients" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Registry
        </Link>

        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5 neon-card">
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner-glow relative">
                  <User className="h-10 w-10" />
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-background rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-success rounded-full" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">{patient?.mrn}</h1>
                  <p className="text-muted-foreground text-sm font-mono flex items-center gap-2">
                    ID: {patient?.id}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="neutral">
                      <Calendar className="h-3 w-3 mr-1" />
                      Added {new Date(patient?.created_at || "").toLocaleDateString()}
                    </Badge>
                    <Badge variant="info">
                      <FileScan className="h-3 w-3 mr-1" />
                      {scans.length} Scans
                    </Badge>
                  </div>
                </div>
              </div>

              {hasTrend && latestVol !== null && latestVol !== undefined && (
                <div className="glass rounded-xl p-4 min-w-[200px] border border-border/50 text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Latest Volume</p>
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-2xl font-bold gradient-text">{latestVol.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground font-medium">mL</span>
                  </div>
                  <div className={`text-xs font-medium mt-1 flex items-center justify-end gap-1 ${volDiff > 0 ? 'text-danger' : volDiff < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                    {volDiff > 0 ? '↑' : volDiff < 0 ? '↓' : ''} 
                    {Math.abs(volDiff).toFixed(2)} mL ({Math.abs(trendPercent).toFixed(1)}%)
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold tracking-tight">Longitudinal Scans</h2>
            <Link href="/upload">
              <Button size="sm" className="shadow-glow-sm">
                <UploadIcon className="h-4 w-4 mr-2" /> Upload New
              </Button>
            </Link>
          </div>

          {scans.length === 0 ? (
            <Card className="border-dashed bg-muted/10">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileScan className="h-12 w-12 text-muted-foreground/50 mb-4 animate-float" />
                <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-6">
                  Upload the first MRI timepoint for this patient to begin longitudinal tracking.
                </p>
                <Link href="/upload">
                  <Button variant="outline">Upload Scan</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="relative pl-4 sm:pl-8 space-y-6">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="absolute left-[15px] sm:left-[31px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary via-secondary to-transparent -z-10"
              />

              {scans.map((scan, i) => {
                const status = scan.job?.status || 'queued';
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 + 0.3 }}
                    key={scan.id}
                    className="relative group"
                  >
                    <div className={`absolute -left-4 sm:-left-8 top-6 h-4 w-4 rounded-full border-2 border-background shadow-sm ${
                      status === 'complete' ? 'bg-success' : 
                      status === 'failed' ? 'bg-danger' : 'bg-warning animate-pulse'
                    }`} />

                    <Card className={`transition-all duration-300 hover:shadow-card hover:-translate-y-1 ${
                      status === 'running' ? 'border-warning/40 bg-warning/5' : ''
                    }`}>
                      <div className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">Scan Timepoint</h3>
                            <Badge 
                              variant={status === 'complete' ? 'success' : status === 'failed' ? 'danger' : 'warning'}
                              pulse={status === 'running' || status === 'queued'}
                            >
                              {status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 opacity-70" />
                              {new Date(scan.created_at).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1.5 font-mono text-xs">
                              ID: {scan.id}
                            </span>
                          </div>

                          {status === 'complete' && scan.job?.result?.tumor_volume_ml !== undefined && (
                            <div className="mt-4 inline-flex items-center gap-2 glass rounded-lg px-3 py-1.5 border border-primary/20 bg-primary/5">
                              <Activity className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Volume: <span className="text-foreground">{scan.job.result.tumor_volume_ml.toFixed(2)} mL</span></span>
                            </div>
                          )}
                          {status === 'failed' && scan.job?.error && (
                            <div className="mt-3 text-sm text-danger flex items-start gap-1.5 bg-danger/10 p-2.5 rounded-lg border border-danger/20">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{scan.job.error}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-4 sm:mt-0">
                          {status === 'complete' && scan.job_id && (
                            <Link href={`/results/${scan.job_id}`}>
                              <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                                <Eye className="h-4 w-4 mr-2" /> View Results
                              </Button>
                            </Link>
                          )}
                          {(status === 'running' || status === 'queued') && (
                            <Button variant="outline" disabled className="opacity-70">
                              Processing...
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function UploadIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
}
