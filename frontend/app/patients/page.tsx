"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRequireAuth } from "@/lib/use-require-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { Plus, Search, X } from "lucide-react";

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

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.patients.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowForm(false);
      reset();
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : "Failed to create patient");
    },
  });

  if (!ready) {
    return (
      <AppShell>
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "New patient"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 animate-fade-in">
          <CardContent className="pt-6">
            <form
              onSubmit={handleSubmit((v) => createMutation.mutate(v))}
              className="grid md:grid-cols-2 gap-4"
            >
              <div>
                <label className="text-sm font-medium mb-1 block">MRN</label>
                <Input placeholder="MRN-1001" {...register("mrn")} />
                {errors.mrn && <p className="text-danger text-xs mt-1">{errors.mrn.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Full name</label>
                <Input placeholder="Jane Doe" {...register("full_name")} />
                {errors.full_name && (
                  <p className="text-danger text-xs mt-1">{errors.full_name.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date of birth</label>
                <Input type="date" {...register("date_of_birth")} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Sex</label>
                <Input placeholder="F / M / Other" {...register("sex")} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Diagnosis</label>
                <Input placeholder="Glioblastoma WHO Grade IV" {...register("diagnosis")} />
              </div>
              {formError && (
                <p className="md:col-span-2 text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
              <div className="md:col-span-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create patient"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or MRN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : patients && patients.length > 0 ? (
            <div className="divide-y divide-border">
              {patients.map((p) => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      MRN: {p.mrn} {p.sex ? `· ${p.sex}` : ""}{" "}
                      {p.diagnosis ? `· ${p.diagnosis}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Added {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              No patients found. Create one to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
