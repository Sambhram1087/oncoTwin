import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Activity, Shield, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Brain className="h-6 w-6 text-primary" />
          OncoTwin
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button>Get started</Button>
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto text-center px-6 pt-20 pb-24 animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm mb-6">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          AI-assisted neuro-oncology digital twin
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
          A living digital twin
          <br />
          <span className="gradient-text">for every brain tumor patient</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload MRI timepoints, track tumor evolution automatically, simulate
          growth and resection scenarios, and generate clinical reports — all
          in one platform.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Create free account</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              I already have an account
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <Activity className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Automated segmentation</h3>
            <p className="text-sm text-muted-foreground">
              Every uploaded scan is queued for background processing —
              tumor volume, confidence and radiomics computed automatically.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Brain className="h-8 w-8 text-accent mb-4" />
            <h3 className="font-semibold text-lg mb-2">Longitudinal timeline</h3>
            <p className="text-sm text-muted-foreground">
              Each visit becomes a timepoint in the patient&apos;s digital
              twin, so you can see the tumor evolve visit over visit.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Shield className="h-8 w-8 text-success mb-4" />
            <h3 className="font-semibold text-lg mb-2">Secure by default</h3>
            <p className="text-sm text-muted-foreground">
              Token-based authentication, per-clinician data isolation, and
              a modular architecture ready for HIPAA-grade infrastructure.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
