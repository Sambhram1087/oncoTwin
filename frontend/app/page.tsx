import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brain, Activity, Shield, Sparkles, ChevronRight, Zap, Lock, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5 font-semibold text-base">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-sm">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="gradient-text">OncoTwin</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="glass rounded-2xl flex items-center gap-1 p-1">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-xl">
                Get started
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Background mesh orbs */}
        <div className="mesh-orb w-[600px] h-[600px] bg-primary top-[-10%] left-[-10%]" />
        <div className="mesh-orb w-[500px] h-[500px] bg-secondary bottom-[-5%] right-[-5%]" />
        <div className="mesh-orb w-[300px] h-[300px] bg-accent top-[40%] left-[60%]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm mb-8">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-muted-foreground">AI-powered neuro-oncology platform</span>
            <span className="text-accent font-medium">v2.0</span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
            A living digital twin
            <br />
            <span className="gradient-text">for every patient</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12">
            Upload MRI timepoints, track tumor evolution automatically, simulate
            growth &amp; resection scenarios — all in one clinical AI platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base rounded-2xl shadow-glow animate-pulse-glow"
              >
                <Zap className="h-5 w-5" />
                Start for free
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto h-14 px-8 text-base rounded-2xl border border-border"
              >
                Sign in to dashboard
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-16">
            {[
              { value: "98.2%", label: "Segmentation accuracy" },
              { value: "<2s", label: "Avg. processing time" },
              { value: "HIPAA", label: "Ready infrastructure" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl px-4 py-4 text-center">
                <p className="text-2xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature cards ───────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-6 pb-32">
        {/* Section label */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Core capabilities
          </p>
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything you need to{" "}
            <span className="gradient-text">move faster</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {[
            {
              icon: Activity,
              color: "from-primary/20 to-primary/5",
              iconColor: "text-primary",
              title: "Automated segmentation",
              desc: "Every uploaded scan is queued for background processing — tumor volume, confidence score, and radiomics computed automatically with state-of-the-art AI.",
            },
            {
              icon: Brain,
              color: "from-secondary/20 to-secondary/5",
              iconColor: "text-secondary",
              title: "Longitudinal timeline",
              desc: "Each visit becomes a timepoint in the patient's digital twin, letting you visualize tumor evolution across visits with 3D rendering.",
            },
            {
              icon: Shield,
              color: "from-accent/20 to-accent/5",
              iconColor: "text-accent",
              title: "Secure by design",
              desc: "Token-based authentication, per-clinician data isolation, and a modular architecture ready for HIPAA-grade production infrastructure.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="group gradient-border relative p-6 rounded-2xl bg-card hover:bg-card-hover transition-all duration-300 shadow-card hover:shadow-card-hover hover:-translate-y-1 animate-fade-in-up"
            >
              <div
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <div className="mt-16 glass rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="mesh-orb w-[400px] h-[200px] bg-primary -top-10 -left-10 opacity-10" />
          <div className="mesh-orb w-[300px] h-[200px] bg-secondary -bottom-10 -right-10 opacity-10" />
          <div className="relative">
            <BarChart3 className="h-10 w-10 text-primary mx-auto mb-4 animate-float" />
            <h3 className="text-2xl font-bold mb-2">Ready to build your first digital twin?</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Join clinicians using OncoTwin to make faster, more confident treatment decisions.
            </p>
            <Link href="/signup">
              <Button size="lg" className="rounded-2xl shadow-glow h-12 px-8">
                Create free account
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Brain className="h-3 w-3 text-background" />
            </div>
            <span>OncoTwin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            <span>HIPAA-ready · SOC 2 planned · All data encrypted</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
