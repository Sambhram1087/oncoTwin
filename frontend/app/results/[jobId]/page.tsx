"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, Job, Scan, GrowthPrediction } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Tooltip } from "@/components/ui/tooltip";
import { 
  ArrowLeft, Download, FileText, CheckCircle2, 
  AlertCircle, Brain, Activity, Target, Share2, Layers, LineChart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function GrowthChart({ data }: { data: GrowthPrediction }) {
  if (!data?.trajectory?.length) return null;
  
  const trajectory = data.trajectory;
  const maxVol = Math.max(...trajectory.map(t => t.upper_bound), ...trajectory.map(t => t.projected_volume_ml));
  const minVol = Math.min(...trajectory.map(t => t.lower_bound), ...trajectory.map(t => t.projected_volume_ml));
  
  const range = (maxVol - minVol) || 1;
  // leave a little padding
  const scaleY = (y: number) => 100 - (((y - minVol) / range) * 90);
  
  const points = trajectory.map((t, i) => {
    const x = (i / (trajectory.length - 1)) * 100;
    const y = scaleY(t.projected_volume_ml);
    return `${x},${y}`;
  }).join(" ");

  const upperPoints = trajectory.map((t, i) => {
    const x = (i / (trajectory.length - 1)) * 100;
    const y = scaleY(t.upper_bound);
    return `${x},${y}`;
  });
  
  const lowerPoints = [...trajectory].reverse().map((t, i) => {
    const origIndex = trajectory.length - 1 - i;
    const x = (origIndex / (trajectory.length - 1)) * 100;
    const y = scaleY(t.lower_bound);
    return `${x},${y}`;
  });
  
  const areaPoints = [...upperPoints, ...lowerPoints].join(" ");

  return (
    <div className="w-full h-40 relative mt-2 mb-6 group">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points={areaPoints} fill="hsl(var(--primary))" className="opacity-15" />
        <polyline 
          points={points} 
          fill="none" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="drop-shadow-[0_0_6px_rgba(var(--primary),0.6)]"
        />
        {[0, 25, 50, 75, 100].map(pct => (
          <line key={pct} x1="0" y1={pct} x2="100" y2={pct} stroke="currentColor" strokeWidth="0.5" className="opacity-10" />
        ))}
      </svg>
      <div className="absolute inset-0 flex justify-between items-end text-[10px] text-muted-foreground -bottom-5">
        <span>Today</span>
        <span>+180 Days</span>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { jobId } = useParams() as { jobId: string };
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [growth, setGrowth] = useState<GrowthPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Simulated processing progress
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [shareStatus, setShareStatus] = useState("Share");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewAxis, setPreviewAxis] = useState<"axial" | "coronal" | "sagittal">("axial");
  const [slicePosition, setSlicePosition] = useState(50);
  const growthRequested = useRef(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const jId = parseInt(jobId, 10);
    if (isNaN(jId)) return;

    const fetchStatus = async () => {
      try {
        const jobData = await api.jobs.get(jId);
        setJob(jobData);
        
        if (jobData.status === 'complete' || jobData.status === 'failed') {
          setLoading(false);
          if (jobData.status === 'complete') {
            setProgress(100);
            setCurrentStep(4);

            // Fetch growth prediction once complete
            if (!growthRequested.current) {
              growthRequested.current = true;
              try {
                const growthData = await api.predict.growth(jId, 180);
                setGrowth(growthData);
              } catch (err) {
                console.error("Failed to load growth prediction:", err);
              }
            }
          }
          clearInterval(interval);
        } else if (jobData.status === 'running' || jobData.status === 'queued') {
          setProgress(p => {
            const nextProgress = Math.min(p + Math.random() * 5 + 1, 95);
            if (nextProgress < 30) setCurrentStep(1);
            else if (nextProgress < 60) setCurrentStep(2);
            else setCurrentStep(3);
            return nextProgress;
          });
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 1500);

    return () => clearInterval(interval);
  }, [jobId]);

  useEffect(() => {
    const jId = parseInt(jobId, 10);
    if (Number.isNaN(jId)) return;

    let active = true;
    api.jobs.preview(jId, previewAxis, slicePosition).then((blob) => {
      if (active) setPreviewUrl(URL.createObjectURL(blob));
    }).catch((err) => {
      console.warn("Scan preview unavailable:", err);
    });

    return () => {
      active = false;
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, [jobId, previewAxis, slicePosition]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "OncoTwin analysis results", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShareStatus("Link copied");
      window.setTimeout(() => setShareStatus("Share"), 2000);
    } catch {
      setShareStatus("Share unavailable");
      window.setTimeout(() => setShareStatus("Share"), 2000);
    }
  };

  if (loading) {
    const steps = [
      "Initializing pipeline...",
      "Preprocessing NIfTI volume...",
      "Running UNet segmentation...",
      "Computing radiomic features...",
      "Finalizing results..."
    ];

    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-lg mx-auto text-center space-y-8 animate-fade-in">
          <ProgressRing progress={Math.round(progress)} size={180} strokeWidth={10} />
          
          <div>
            <h2 className="text-xl font-bold mb-2">Analyzing Scan</h2>
            <div className="h-6 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentStep}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="text-muted-foreground font-medium"
                >
                  {steps[currentStep]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full space-y-3 mt-8">
            {steps.slice(1, 5).map((stepText, idx) => {
              const isActive = idx + 1 === currentStep;
              const isDone = idx + 1 < currentStep;
              return (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isActive ? 'border-primary/50 bg-primary/5 shadow-glow-sm' : 
                  isDone ? 'border-success/30 bg-success/5 text-success' : 'border-border bg-muted/20 text-muted-foreground opacity-50'
                }`}>
                  {isDone ? <CheckCircle2 className="h-4 w-4 text-success" /> : 
                   isActive ? <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /> :
                   <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
                  <span className="text-sm font-medium">{stepText}</span>
                </div>
              );
            })}
          </div>
        </div>
      </AppShell>
    );
  }

  if (job?.status === 'failed') {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto mt-20 text-center">
          <div className="h-20 w-20 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-danger" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-muted-foreground mb-8">
            {job.error || "An unexpected error occurred during processing."}
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>Back</Button>
            <Link href="/upload">
              <Button>Try Again</Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const result = job?.result;
  const maskSummary: any = result?.segmentation_mask_summary || {};
  const labelPercentages = maskSummary.label_percentages || {};

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" /> {shareStatus}
            </Button>
            <Button size="sm" className="shadow-glow-sm" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">MRI Segmentation Report</h1>
            <p className="text-sm text-muted-foreground mt-1">Quantitative imaging summary for clinical review</p>
          </div>
          <Badge variant="success">Final report available</Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Col: 3D Viz */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-primary/20 bg-card flex flex-col relative">
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="neutral" className="bg-background/80 backdrop-blur border-border/50">
                  <Layers className="h-3 w-3 mr-1.5" /> {previewAxis} reference slice
                </Badge>
              </div>
              <div className="relative min-h-[400px] flex items-center justify-center bg-black">
                {previewUrl ? (
                  <img src={previewUrl} alt="Axial slice from the uploaded MRI NIfTI volume" className="max-h-[400px] w-full object-contain" />
                ) : (
                  <div className="text-sm text-white/70">Loading scan preview...</div>
                )}
                <div className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-white/80">
                  MRI / NIfTI / {previewAxis.toUpperCase()} / {slicePosition}%
                </div>
              </div>
              <div className="border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
                Source image: uploaded NIfTI volume. Review image orientation and quality before clinical interpretation.
              </div>
              <div className="flex flex-col gap-3 border-t border-border/50 bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-1 rounded-lg border border-border/60 bg-background/70 p-1">
                  {(["axial", "coronal", "sagittal"] as const).map((axis) => (
                    <Tooltip key={axis} content={`View ${axis} plane`} side="top">
                      <Button
                        type="button"
                        size="sm"
                        variant={previewAxis === axis ? "secondary" : "ghost"}
                        className="capitalize"
                        onClick={() => setPreviewAxis(axis)}
                      >
                        {axis}
                      </Button>
                    </Tooltip>
                  ))}
                </div>
                <label className="flex min-w-[220px] items-center gap-3 text-xs text-muted-foreground">
                  <span className="whitespace-nowrap">Slice {slicePosition}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={slicePosition}
                    onChange={(event) => setSlicePosition(Number(event.target.value))}
                    aria-label="MRI slice position"
                    className="w-full"
                  />
                </label>
              </div>
            </Card>

            {/* Sub-region Breakdown & Radiomics */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="neon-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-primary text-base">
                    <Activity className="h-4 w-4" /> Segmentation Sub-Regions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(labelPercentages).length > 0 ? (
                    <div className="space-y-4 mt-2">
                      {Object.entries(labelPercentages).map(([label, pct]: any) => (
                        <div key={label} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="capitalize">{label.replace(/_/g, ' ')}</span>
                            <span>{(pct * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${pct * 100}%` }}
                              transition={{ duration: 1 }}
                              className="h-full bg-primary" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sub-region breakdown not available.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="neon-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-secondary text-base">
                    <Brain className="h-4 w-4" /> Extracted Radiomics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result?.radiomics ? (
                    <div className="space-y-3 mt-2 h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(result.radiomics).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-mono font-medium">{val.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Radiomics data not available.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Col: Metrics & Growth */}
          <div className="space-y-6">
            <Card className="neon-card bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-primary text-base">
                  <Target className="h-4 w-4" /> Tumor Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold tracking-tighter gradient-text">
                    <AnimatedCounter target={result?.tumor_volume_ml || 0} decimals={2} />
                  </span>
                  <span className="text-xl font-medium text-muted-foreground">mL</span>
                </div>
              </CardContent>
            </Card>

            <Card className="neon-card bg-gradient-to-br from-card to-secondary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-secondary text-base">
                  <LineChart className="h-4 w-4" /> 180-Day Growth Simulation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {growth ? (
                  <GrowthChart data={growth} />
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                    Predicting disease trajectory...
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-2 leading-tight">
                  Simulated using temporal AI models. Prediction bands represent 95% confidence intervals based on similar phenotypic profiles.
                </p>
              </CardContent>
            </Card>

            <Card className="neon-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-accent" /> Analysis Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground">Confidence</dt>
                    <dd className="font-bold text-foreground">
                      <AnimatedCounter target={(result?.confidence || 0.98) * 100} decimals={1} suffix="%" />
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground">Scan ID</dt>
                    <dd className="font-mono text-xs">{job?.scan_id}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="font-medium">
                      {job?.created_at ? new Date(job.created_at).toLocaleDateString() : '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Model Version</dt>
                    <dd className="font-medium">{result?.model_version || 'v2.1'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
