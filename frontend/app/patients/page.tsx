"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRequireAuth } from "@/lib/use-require-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import {
  Plus,
  Search,
  X,
  AlertCircle,
  Users,
  ChevronRight,
  Clock,
  UserPlus,
  Stethoscope,
} from "lucide-react";

const schema = z.object({
  mrn: z.string().min(1, "MRN is required"),
  full_name: z.string().min(1, "Name is required"),
  date_of_birth: z.string().optional(),
  sex: z.string().optional(),
  diagnosis: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function PatientsPage() {
  const { ready } = useRequireAuth();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients", search],
    queryFn: () => api.patients.list(search || undefined),
    enabled: ready,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.patients.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowForm(false);
      reset();
      setFormError(null);
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to create patient"
      );
    },
  });

  if (!ready) {
    return (
      <AppShell>
        <Skeleton className="h-10 w-48 mb-8 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Patient registry
            </span>
          </div>
          <h1 className="text-3xl font-bold">Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {patients?.length ?? 0} patient{patients?.length !== 1 ? "s" : ""} in your registry
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className={showForm ? "gap-2" : "gap-2 shadow-glow-sm"}
          variant={showForm ? "secondary" : "primary"}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              New patient
            </>
          )}
        </Button>
      </div>

      {/* ── Add patient form ────────────────────────────────────── */}
      {showForm && (
        <Card className="mb-6 animate-scale-in border-primary/20 shadow-glow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              Register new patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((v) => createMutation.mutate(v))}
              className="grid md:grid-cols-2 gap-4"
            >
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  MRN <span className="text-danger">*</span>
                </label>
                <Input placeholder="MRN-1001" {...register("mrn")} />
                {errors.mrn && (
                  <p className="text-danger text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.mrn.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Full name <span className="text-danger">*</span>
                </label>
                <Input placeholder="Jane Doe" {...register("full_name")} />
                {errors.full_name && (
                  <p className="text-danger text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Date of birth
                </label>
                <Input type="date" {...register("date_of_birth")} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Sex
                </label>
                <Input placeholder="F / M / Other" {...register("sex")} />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Diagnosis
                </label>
                <Input
                  placeholder="Glioblastoma WHO Grade IV"
                  {...register("diagnosis")}
                />
              </div>

              {formError && (
                <div className="md:col-span-2 flex items-start gap-2.5 text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}

              <div className="md:col-span-2 flex gap-3">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create patient
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowForm(false); reset(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-10 max-w-sm"
          placeholder="Search by name or MRN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Patient list ────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : patients && patients.length > 0 ? (
            <div className="divide-y divide-border/50">
              {patients.map((p, idx) => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="group flex items-center justify-between p-4 hover:bg-muted/40 transition-all duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/25 to-secondary/15 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="badge badge-info text-[10px]">
                          {p.mrn}
                        </span>
                        {p.sex && (
                          <span className="text-xs text-muted-foreground">{p.sex}</span>
                        )}
                        {p.diagnosis && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            · {p.diagnosis}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Added {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">
                {search ? "No patients found" : "No patients yet"}
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                {search
                  ? `No results for "${search}"`
                  : "Register your first patient to begin building digital twins"}
              </p>
              {!search && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Add first patient
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
