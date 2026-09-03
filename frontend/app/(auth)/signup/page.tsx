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
import { Brain, ArrowRight, AlertCircle, Lock, Mail, User, CheckCircle2 } from "lucide-react";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

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
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Background orbs */}
      <div className="mesh-orb w-[500px] h-[500px] bg-secondary -top-20 -right-20 opacity-10" />
      <div className="mesh-orb w-[400px] h-[400px] bg-primary -bottom-20 -left-20 opacity-8" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 shadow-float border border-border">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-glow mb-4">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground text-center">
              Start tracking patients in minutes
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {["Free to start", "No setup required", "HIPAA-ready infra", "Instant AI analysis"].map((b) => (
              <div key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-accent flex-shrink-0" />
                {b}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Full name
              </label>
              <Input
                placeholder="Dr. Jane Smith"
                autoComplete="name"
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="text-danger text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Work email
              </label>
              <Input
                type="email"
                placeholder="you@hospital.org"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-danger text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Password
              </label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-danger text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <div className="flex items-start gap-2.5 text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl mt-2"
              size="lg"
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">Already have an account?</span>
            </div>
          </div>

          <Link href="/login">
            <Button variant="secondary" className="w-full h-11 rounded-xl">
              Sign in instead
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By creating an account you agree to our Terms of Service &amp; Privacy Policy.
        </p>
      </div>
    </main>
  );
}
