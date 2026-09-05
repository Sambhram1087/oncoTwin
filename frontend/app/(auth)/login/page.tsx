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
import { Brain, ArrowRight, AlertCircle, Lock, Mail, Eye, EyeOff, Activity, Shield, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setLoading(true);
    try {
      const res = await api.auth.login(values);
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Login failed");
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

      <div className="flex w-full min-h-screen">
        {/* Left side: Brand Showcase (Hidden on mobile) */}
        <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden border-r border-border/50">
          <ParticleField particleCount={80} connectionDistance={150} />
          
          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-3 w-fit">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">OncoTwin</span>
            </Link>
          </div>

          <div className="relative z-10 max-w-lg mb-12 animate-slide-in-left">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Clinical precision meets <span className="gradient-text-animated">artificial intelligence</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Join leading oncologists using digital twin technology to track tumor evolution and simulate treatment outcomes.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Activity, text: "Sub-second AI segmentation" },
                { icon: Shield, text: "HIPAA-ready infrastructure" },
                { icon: Users, text: "Secure patient registry" }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium glass rounded-xl p-3 w-fit">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  {feature.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Login Form */}
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
                <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to your clinical dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground transition-colors group-focus-within:text-primary">
                    Email address
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
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign in to dashboard
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center text-sm">
                <span className="text-muted-foreground">New to OncoTwin? </span>
                <Link href="/signup" className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors">
                  Create an account
                </Link>
              </div>
            </motion.div>
            
            {/* Security note */}
            <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1.5">
              <Lock className="h-3 w-3" />
              Secured with enterprise-grade encryption
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
