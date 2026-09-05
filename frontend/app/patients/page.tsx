"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, Patient } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calendar, FileText, Activity, AlertCircle, ChevronRight, Hash, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMrn, setNewMrn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await api.patients.list();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMrn.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.patients.create({ medical_record_number: newMrn });
      await fetchPatients();
      setShowAddForm(false);
      setNewMrn("");
    } catch (err: any) {
      setError(err.message || "Failed to add patient");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = patients.filter((p) =>
    p.medical_record_number.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold tracking-tight">Patient Registry</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and track longitudinal patient data.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Button onClick={() => setShowAddForm(!showAddForm)} className="shadow-glow-sm">
              <Plus className="h-4 w-4" /> Add Patient
            </Button>
          </motion.div>
        </div>

        {/* Animated Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="border-primary/30 bg-primary/5 shadow-inner-glow mb-6">
                <CardContent className="p-6">
                  <form onSubmit={handleAddPatient} className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 w-full space-y-2">
                      <label className="text-sm font-medium">Medical Record Number (MRN)</label>
                      <Input
                        placeholder="e.g. MRN-12345"
                        value={newMrn}
                        onChange={(e) => setNewMrn(e.target.value)}
                        error={!!error}
                        autoFocus
                      />
                      {error && (
                        <p className="text-xs text-danger flex items-center gap-1 mt-1 animate-[shake_0.3s]">
                          <AlertCircle className="h-3 w-3" /> {error}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "Saving..." : "Save Patient"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <Card className="shadow-sm">
          <div className="p-4 flex items-center justify-between border-b border-border bg-muted/20">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by MRN or ID..."
                className="pl-9 h-10 bg-background/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="neutral">{patients.length} total</Badge>
            </div>
          </div>

          {/* Table / List */}
          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">Loading registry...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4 animate-scale-in">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 relative">
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-20" />
                  <Users className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No patients found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {search ? "No matches for your search query." : "Start by adding a patient to the registry."}
                </p>
                {search && (
                  <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold group cursor-pointer hover:text-foreground">
                      <div className="flex items-center gap-1">MRN <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                    </th>
                    <th className="px-6 py-4 font-semibold group cursor-pointer hover:text-foreground">
                      <div className="flex items-center gap-1">System ID</div>
                    </th>
                    <th className="px-6 py-4 font-semibold">Added Date</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((p, i) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={p.id} 
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <User2 className="h-4 w-4" />
                        </div>
                        {p.medical_record_number}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Hash className="h-3 w-3" />
                          {p.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 opacity-70" />
                          {new Date(p.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/patients/${p.id}`}>
                          <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            View details
                            <ChevronRight className="h-4 w-4 ml-1 opacity-50 group-hover:opacity-100" />
                          </Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
