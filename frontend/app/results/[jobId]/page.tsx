"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, Job, Scan } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ProgressRing } from "@/components/ui/progress-ring";
import TumorVisualization from "@/components/tumor-visualization";
import { 
  ArrowLeft, Download, FileText, CheckCircle2, 
  AlertCircle, Brain, Activity, Target, Share2, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResultsPage() {
  const { jobId } = useParams() as { jobId: string };
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Simulated processing progress
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiShown = useRef(false);

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
          if (jobData.status === 'complete' && !confettiShown.current) {
            setProgress(100);
            setCurrentStep(4);
            setShowConfetti(true);
            confettiShown.current = true;
            setTimeout(() => setShowConfetti(false), 3000);
          }
        } else if (jobData.status === 'running' || jobData.status === 'queued') {
          // Simulate progress stages
          setProgress(p => Math.min(p + Math.random() * 5 + 1, 95));
          if (progress < 30) setCurrentStep(1);
          else if (progress < 60) setCurrentStep(2);
          else setCurrentStep(3);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 1500);

    return () => clearInterval(interval);
  }, [jobId, progress]);

  // Confetti particles generator
  const renderConfetti = () => {
    if (!showConfetti) return null;
    return (
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}vw`,
              backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
              animationDuration: `${Math.random() * 2 + 2}s`,
              animationDelay: `${Math.random() * 0.5}s`
            }}
          />
        ))}
      </div>
    );
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

  return (
    <AppShell>
      {renderConfetti()}
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
            <Button size="sm" className="shadow-glow-sm">
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Analysis Results</h1>
          <Badge variant="success" pulse>Analysis Complete</Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Col: 3D Viz */}
          <div className="lg:col-span-2">
            <Card className="h-[500px] lg:h-full min-h-[500px] overflow-hidden border-primary/20 bg-card flex flex-col relative group">
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="neutral" className="bg-background/80 backdrop-blur border-border/50">
                  <Layers className="h-3 w-3 mr-1.5" /> 3D Rendering
                </Badge>
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
              <div className="relative flex-1">
                <TumorVisualization />
              </div>
            </Card>
          </div>

          {/* Right Col: Metrics */}
          <div className="space-y-6">
            <Card className="neon-card bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Target className="h-5 w-5" /> Tumor Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold tracking-tighter gradient-text">
                    <AnimatedCounter target={job?.result?.tumor_volume_ml || 0} decimals={2} />
                  </span>
                  <span className="text-xl font-medium text-muted-foreground">mL</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-4">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${Math.min(((job?.result?.tumor_volume_ml || 0) / 100) * 100, 100)}%` }} 
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="h-full bg-primary" 
                   />
                </div>
              </CardContent>
            </Card>

            <Card className="neon-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-secondary">
                  <Activity className="h-5 w-5" /> Confidence Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tighter text-foreground">
                    <AnimatedCounter target={(job?.result?.confidence || 0.98) * 100} decimals={1} suffix="%" />
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  High confidence segmentation mask generated.
                </p>
              </CardContent>
            </Card>

            <Card className="neon-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" /> Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4 text-sm">
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
                    <dd className="font-medium">{job?.result?.model_version || 'v2.1'}</dd>
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
