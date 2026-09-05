"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleField } from "@/components/ui/particle-field";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Brain, Activity, Shield, Sparkles, ChevronRight, Zap, Lock,
  BarChart3, ChevronDown, Upload, Eye, TrendingUp, Layers3,
} from "lucide-react";

/* Framer helpers */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
        {/* Particle network background */}
        <ParticleField particleCount={60} connectionDistance={140} />

        {/* Soft ambient orbs behind particles */}
        <div className="mesh-orb w-[500px] h-[500px] bg-primary top-[-10%] left-[-10%] opacity-10" />
        <div className="mesh-orb w-[400px] h-[400px] bg-secondary bottom-[-5%] right-[-5%] opacity-8" />

        <div className="relative max-w-5xl mx-auto text-center z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-muted-foreground">AI-powered neuro-oncology platform</span>
            <span className="text-accent font-medium">v2.0</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            A living digital twin
            <br />
            <span className="gradient-text-animated">for every patient</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Upload MRI timepoints, track tumor evolution automatically, simulate
            growth &amp; resection scenarios — all in one clinical AI platform.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
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
          </motion.div>

          {/* Stats row with animated counters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10"
          >
            <div className="glass rounded-2xl px-4 py-4 text-center neon-card">
              <p className="text-2xl font-bold gradient-text">
                <AnimatedCounter target={98.2} decimals={1} suffix="%" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">Segmentation accuracy</p>
            </div>
            <div className="glass rounded-2xl px-4 py-4 text-center neon-card">
              <p className="text-2xl font-bold gradient-text">&lt;2s</p>
              <p className="text-xs text-muted-foreground mt-1">Avg. processing time</p>
            </div>
            <div className="glass rounded-2xl px-4 py-4 text-center neon-card">
              <p className="text-2xl font-bold gradient-text">HIPAA</p>
              <p className="text-xs text-muted-foreground mt-1">Ready infrastructure</p>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col items-center gap-1 text-muted-foreground"
          >
            <span className="text-xs tracking-widest uppercase">Explore</span>
            <ChevronDown className="h-4 w-4 animate-scroll-hint" />
          </motion.div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-6 py-24">
        <AnimatedSection>
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Three steps to your{" "}
              <span className="gradient-text">digital twin</span>
            </h2>
          </motion.div>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              icon: Upload,
              color: "from-primary/20 to-primary/5",
              iconColor: "text-primary",
              title: "Upload scans",
              desc: "Drag & drop NIfTI or DICOM files. We support T1, T1ce, T2, and FLAIR modalities.",
            },
            {
              step: "02",
              icon: Eye,
              color: "from-secondary/20 to-secondary/5",
              iconColor: "text-secondary",
              title: "AI segments instantly",
              desc: "Our deep learning pipeline detects tumor boundaries, computes volume, and extracts radiomic features.",
            },
            {
              step: "03",
              icon: TrendingUp,
              color: "from-accent/20 to-accent/5",
              iconColor: "text-accent",
              title: "Track & predict",
              desc: "Longitudinal timeline tracks evolution. Growth simulation predicts future tumor volume with confidence intervals.",
            },
          ].map((step, i) => (
            <motion.div
              key={step.step}
              variants={fadeUp}
              custom={i + 1}
              className="relative group"
            >
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-border to-transparent" />
              )}
              <div className="gradient-border-animated p-6 rounded-2xl text-center">
                <div className="text-xs font-bold text-muted-foreground/40 mb-3">STEP {step.step}</div>
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className={`h-7 w-7 ${step.iconColor}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </AnimatedSection>
      </section>

      {/* ── Feature cards ───────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-6 pb-24">
        <AnimatedSection>
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Core capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything you need to{" "}
              <span className="gradient-text">move faster</span>
            </h2>
          </motion.div>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-6">
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
          ].map((card, i) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              custom={i + 1}
              className="group gradient-border relative p-6 rounded-2xl bg-card transition-all duration-300 shadow-card hover:shadow-neon hover:-translate-y-1"
            >
              <div
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </AnimatedSection>

        {/* Bottom CTA strip */}
        <AnimatedSection>
          <motion.div
            variants={fadeUp}
            custom={0}
            className="mt-16 gradient-border-animated rounded-3xl p-10 text-center relative overflow-hidden"
          >
            <div className="mesh-orb w-[400px] h-[200px] bg-primary -top-10 -left-10 opacity-10" />
            <div className="mesh-orb w-[300px] h-[200px] bg-secondary -bottom-10 -right-10 opacity-10" />
            <div className="relative">
              <BarChart3 className="h-10 w-10 text-primary mx-auto mb-4 animate-float" />
              <h3 className="text-2xl font-bold mb-2">Ready to build your first digital twin?</h3>
              <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
                Join clinicians using OncoTwin to make faster, more confident treatment decisions.
              </p>
              <Link href="/signup">
                <Button size="lg" className="rounded-2xl shadow-glow h-12 px-8">
                  Create free account
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold gradient-text">OncoTwin</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                AI-powered digital twin platform for neuro-oncology. Track tumor evolution, simulate growth, and make data-driven treatment decisions.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Get started</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
                <li><span className="text-muted-foreground/50">Documentation</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Compliance</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> HIPAA Ready
                </li>
                <li className="flex items-center gap-1.5">
                  <Shield className="h-3 w-3" /> SOC 2 Planned
                </li>
                <li className="flex items-center gap-1.5">
                  <Layers3 className="h-3 w-3" /> Encrypted at rest
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6 flex items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} OncoTwin. All rights reserved.</span>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              <span>All data encrypted in transit and at rest</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
