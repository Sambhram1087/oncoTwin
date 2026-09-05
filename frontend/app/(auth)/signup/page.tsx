"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleField } from "@/components/ui/particle-field";
import { Brain, ArrowRight, AlertCircle, Lock, Mail, User, CheckCircle2, Eye, EyeOff, Activity, FileScan, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  
  const passwordValue = watch("password", "");
  
  // Simple password strength calculation
  const getStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 8) score += 1;
    if (pass.length > 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(4, score);
  };
  
  const strength = getStrength(passwordValue);
  const strengthColors = ["bg-muted", "bg-danger", "bg-warning", "bg-primary", "bg-success"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setLoading(true);
    try {
      const res = await api.auth.signup(values);
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="flex w-full min-h-screen flex-row-reverse">
        {/* Right side: Brand Showcase (Hidden on mobile) */}
        <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden border-l border-border/50">
          <ParticleField particleCount={80} connectionDistance={150} />
          
          <div className="relative z-10 flex justify-end">
            <Link href="/" className="flex items-center gap-3 w-fit">
              <span className="text-xl font-bold gradient-text">OncoTwin</span>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
                <Brain className="h-5 w-5 text-white" />
              </div>
            </Link>
          </div>

          <div className="relative z-10 max-w-lg mb-12 self-end animate-slide-in-right">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Start building <span className="gradient-text-accent">digital twins</span> today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Set up your clinical workspace in seconds. Free to start, no credit card required.
            </p>
            
            <div className="space-y-6">
              {[
                { icon: Activity, title: "Automated Segmentation", desc: "Upload MRI scans and get instant volume analysis." },
                { icon: FileScan, title: "Longitudinal Tracking", desc: "Monitor tumor evolution across multiple visits." },
                { icon: TrendingUp, title: "Growth Prediction", desc: "Simulate future scenarios with predictive AI." }
              ].map((feature, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  key={i} 
                  className="flex gap-4"
                >
                  <div className="h-12 w-12 rounded-xl bg-card border border-border/50 shadow-sm flex items-center justify-center text-primary flex-shrink-0">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Left side: Signup Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
          {/* Subtle mobile background */}
          <div className="lg:hidden absolute inset-0">
             <ParticleField particleCount={40} connectionDistance={120} />
             <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          </div>

          <div className="w-full max-w-md relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-strong rounded-3xl p-8 sm:p-10 shadow-float border border-border/50"
            >
              {/* Mobile Logo */}
              <div className="flex lg:hidden flex-col items-center mb-8">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow mb-4">
                  <Brain className="h-7 w-7 text-white" />
                </div>
              </div>

              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Create account</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your details to get started
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground transition-colors group-focus-within:text-primary">
                    Full name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      placeholder="Dr. Jane Smith"
                      autoComplete="name"
                      className="pl-10"
                      error={!!errors.full_name}
                      {...register("full_name")}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.full_name && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-danger text-xs mt-1.5 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.full_name.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground transition-colors group-focus-within:text-primary">
                    Work email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      type="email"
                      placeholder="doctor@hospital.org"
                      autoComplete="email"
                      className="pl-10"
                      error={!!errors.email}
                      {...register("email")}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-danger text-xs mt-1.5 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground transition-colors group-focus-within:text-primary">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      className="pl-10 pr-10"
                      error={!!errors.password}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground/60 hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password strength indicator */}
                  {passwordValue.length > 0 && (
                    <div className="mt-2.5">
                      <div className="flex gap-1 mb-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div 
                            key={i} 
                            className={`h-1 w-full rounded-full transition-colors duration-300 ${
                              i <= strength ? strengthColors[strength] : "bg-muted"
                            }`} 
                          />
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <span className={`text-[10px] font-medium ${strength > 2 ? "text-success" : "text-muted-foreground"}`}>
                          {strengthLabels[strength]}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-danger text-xs mt-1.5 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {serverError && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-start gap-2.5 text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 animate-[shake_0.4s_ease-in-out]"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {serverError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl mt-2 text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create account
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors">
                  Sign in
                </Link>
              </div>
            </motion.div>
            
            <p className="text-center text-xs text-muted-foreground mt-6">
              By creating an account you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
