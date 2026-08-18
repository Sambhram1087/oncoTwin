"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRequireAuth } from "@/lib/use-require-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Users, FileScan, Activity, Upload as UploadIcon } from "lucide-react";

export default function DashboardPage() {
  const { ready, user } = useRequireAuth();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.patients.list(),
    enabled: ready,
  });

  if (!ready) {
    return (
      <AppShell>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </AppShell>
    );
  }

  const stats = [
    {
      label: "Total patients",
      value: patients?.length ?? 0,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Active digital twins",
      value: patients?.length ?? 0,
      icon: FileScan,
      color: "text-accent",
    },
    {
      label: "AI jobs today",
      value: "—",
      icon: Activity,
      color: "text-success",
    },
  ];

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here&apos;s what&apos;s happening across your patients.
          </p>
        </div>
        <Link href="/upload">
          <Button>
            <UploadIcon className="h-4 w-4" />
            Upload MRI
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
              <s.icon className={`h-8 w-8 ${s.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent patients</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : patients && patients.length > 0 ? (
            <div className="divide-y divide-border">
              {patients.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      MRN: {p.mrn} {p.diagnosis ? `· ${p.diagnosis}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">No patients yet</p>
              <Link href="/patients">
                <Button variant="secondary">Add your first patient</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
