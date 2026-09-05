"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, DashboardStats } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Activity,
  Upload,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api.stats.getDashboard().then((res) => {
      setStats(res);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getSparklinePoints = (values: number[]) => {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    return values.map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    }).join(" ");
  };

  const stagger = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
    })
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              {getTimeGreeting()}, {user?.full_name?.split(' ')[0] || "Clinician"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Here's an overview of your clinical workspace today.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-2"
          >
            <Link href="/upload">
              <Button className="rounded-xl shadow-glow">
                <Upload className="h-4 w-4" />
                Upload Scan
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: "Total Patients", 
              value: stats?.total_patients || 0, 
              icon: Users,
              color: "primary",
              trend: "+12% this month",
              chart: [20, 25, 22, 30, 28, 35, 42]
            },
            { 
              label: "Scans Analyzed", 
              value: stats?.total_scans || 0, 
              icon: Activity,
              color: "secondary",
              trend: "+5% this week",
              chart: [10, 15, 12, 18, 25, 20, 28]
            },
            { 
              label: "Pending Jobs", 
              value: stats?.pending_jobs || 0, 
              icon: Clock,
              color: "warning",
              trend: "Requires attention",
              chart: [5, 8, 3, 10, 2, 7, 4]
            },
            { 
              label: "Avg Process Time", 
              value: 1.8, 
              suffix: "s",
              decimals: 1,
              icon: CheckCircle2,
              color: "success",
              trend: "-0.2s improvement",
              chart: [2.5, 2.2, 2.0, 1.9, 2.1, 1.8, 1.8]
            },
          ].map((stat, i) => (
            <motion.div key={i} custom={i} initial="hidden" animate="visible" variants={stagger}>
              <Card className="h-full overflow-hidden relative group">
                {/* Accent top border */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-${stat.color}`} />
                
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`h-10 w-10 rounded-xl bg-${stat.color}/10 flex items-center justify-center text-${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    {/* Tiny sparkline */}
                    <svg className={`w-16 h-8 text-${stat.color}/30`} viewBox="0 -10 100 120" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={getSparklinePoints(stat.chart)}
                      />
                    </svg>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <h3 className="text-3xl font-bold tracking-tight">
                        {loading ? (
                          <span className="w-16 h-8 block rounded-md skeleton" />
                        ) : (
                          <AnimatedCounter target={stat.value} decimals={stat.decimals || 0} />
                        )}
                      </h3>
                      {stat.suffix && <span className="text-sm font-medium text-muted-foreground mb-1">{stat.suffix}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-muted-foreground">
                      {stat.trend.startsWith('+') ? (
                        <ArrowUpRight className="h-3 w-3 text-success" />
                      ) : stat.trend.startsWith('-') ? (
                        <ArrowUpRight className="h-3 w-3 text-success rotate-90" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-warning" />
                      )}
                      <span>{stat.trend}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-6 pt-4">
          <motion.div custom={4} initial="hidden" animate="visible" variants={stagger} className="lg:col-span-2">
            <Card className="h-full">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">Latest scans and analysis jobs</p>
                </div>
                <Link href="/patients">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground font-medium">Loading activity feed...</p>
                  </div>
                ) : stats?.recent_jobs.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Activity className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">No recent activity found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {stats?.recent_jobs.slice(0, 5).map((job, idx) => (
                      <Link 
                        key={job.id} 
                        href={`/results/${job.id}`}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            job.status === 'COMPLETED' ? 'bg-success/15 text-success' : 
                            job.status === 'FAILED' ? 'bg-danger/15 text-danger' : 
                            'bg-warning/15 text-warning'
                          }`}>
                            {job.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5" /> : 
                             job.status === 'FAILED' ? <AlertCircle className="h-5 w-5" /> : 
                             <Activity className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium flex items-center gap-2">
                              Patient #{job.patient_id.substring(0, 6)}
                              <Badge variant={
                                job.status === 'COMPLETED' ? 'success' : 
                                job.status === 'FAILED' ? 'danger' : 'warning'
                              }>
                                {job.status}
                              </Badge>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(job.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div custom={5} initial="hidden" animate="visible" variants={stagger}>
            <Card className="h-full bg-gradient-to-br from-card to-primary/5">
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-1">Quick Actions</h3>
                <p className="text-sm text-muted-foreground mb-6">Common tasks for your workflow</p>
                
                <div className="space-y-3">
                  <Link href="/upload" className="block">
                    <div className="group flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-1 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom" />
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">Upload Scan</p>
                        <p className="text-xs text-muted-foreground">Run new analysis</p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/patients" className="block">
                    <div className="group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-border hover:bg-muted/50 transition-colors cursor-pointer relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-1 bg-muted-foreground transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom" />
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">Patient Registry</p>
                        <p className="text-xs text-muted-foreground">View longitudinal data</p>
                      </div>
                    </div>
                  </Link>

                  <div className="group flex items-center gap-4 p-4 rounded-xl border border-border border-dashed hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="h-10 w-10 rounded-lg bg-transparent flex items-center justify-center text-muted-foreground border border-dashed border-muted-foreground/50">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Add Custom Action</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
