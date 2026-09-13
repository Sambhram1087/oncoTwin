"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, Patient } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Calendar,
  Users,
  AlertCircle,
  ChevronRight,
  User,
  ArrowUpDown,
  X,
  Stethoscope,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const SEX_LABELS: Record<string, string> = { M: "Male", F: "Female", O: "Other" };

function DiagnosisBadge({ diagnosis }: { diagnosis: string | null }) {
  if (!diagnosis) return <span className="text-muted-foreground text-xs italic">—</span>;
  const lower = diagnosis.toLowerCase();
  const variant: "danger" | "warning" | "info" | "neutral" =
    lower.includes("glioblastoma") || lower.includes("grade iv")
      ? "danger"
      : lower.includes("grade iii") || lower.includes("astrocytoma")
      ? "warning"
      : lower.includes("grade i") || lower.includes("meningioma")
      ? "info"
      : "neutral";
  return (
    <Badge variant={variant} className="text-[10px] max-w-[160px] truncate">
      {diagnosis}
    </Badge>
  );
}

/* ── Add Patient Form ────────────────────────────────────────────────────── */
interface NewPatient {
  mrn: string;
  full_name: string;
  date_of_birth: string;
  sex: string;
  diagnosis: string;
  notes: string;
}

const EMPTY: NewPatient = {
  mrn: "",
  full_name: "",
  date_of_birth: "",
  sex: "",
  diagnosis: "",
  notes: "",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<NewPatient>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof Patient>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("add") === "1") {
      setShowAddForm(true);
    }
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

  const handleFormChange = (key: keyof NewPatient) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mrn.trim() || !form.full_name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.patients.create({
        mrn: form.mrn.trim(),
        full_name: form.full_name.trim(),
        date_of_birth: form.date_of_birth || undefined,
        sex: form.sex || undefined,
        diagnosis: form.diagnosis || undefined,
        notes: form.notes || undefined,
      });
      await fetchPatients();
      setShowAddForm(false);
      setForm(EMPTY);
    } catch (err: any) {
      setError(err.message || "Failed to add patient");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSort = (key: keyof Patient) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = patients
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        p.mrn.toLowerCase().includes(q) ||
        p.full_name.toLowerCase().includes(q) ||
        (p.diagnosis ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const SortHeader = ({
    label,
    field,
  }: {
    label: string;
    field: keyof Patient;
  }) => (
    <th
      className="px-5 py-3.5 font-semibold group cursor-pointer select-none hover:text-foreground"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`h-3 w-3 transition-opacity ${
            sortKey === field ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-50"
          }`}
        />
      </div>
    </th>
  );

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold tracking-tight">Patient Registry</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track longitudinal patient data.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Button onClick={() => { setShowAddForm(!showAddForm); setForm(EMPTY); setError(null); }} className="shadow-glow-sm">
              {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showAddForm ? "Cancel" : "Add Patient"}
            </Button>
          </motion.div>
        </div>

        {/* Add Patient Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.97 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="border-primary/30 bg-primary/5 shadow-inner-glow">
                <CardContent className="p-6">
                  <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> New Patient Record
                  </h2>
                  <form onSubmit={handleAddPatient}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {/* MRN */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          MRN <span className="text-danger">*</span>
                        </label>
                        <Input
                          placeholder="e.g. MRN-12345"
                          value={form.mrn}
                          onChange={handleFormChange("mrn")}
                          required
                          error={!!error}
                        />
                      </div>
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Full Name <span className="text-danger">*</span>
                        </label>
                        <Input
                          placeholder="Patient full name"
                          value={form.full_name}
                          onChange={handleFormChange("full_name")}
                          required
                        />
                      </div>
                      {/* DOB */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Date of Birth
                        </label>
                        <Input
                          type="date"
                          value={form.date_of_birth}
                          onChange={handleFormChange("date_of_birth")}
                        />
                      </div>
                      {/* Sex */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Sex
                        </label>
                        <select
                          value={form.sex}
                          onChange={handleFormChange("sex")}
                          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        >
                          <option value="">— Select —</option>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="O">Other</option>
                        </select>
                      </div>
                      {/* Diagnosis */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Diagnosis
                        </label>
                        <Input
                          placeholder="e.g. Glioblastoma, WHO Grade IV"
                          value={form.diagnosis}
                          onChange={handleFormChange("diagnosis")}
                        />
                      </div>
                      {/* Notes */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Clinical Notes
                        </label>
                        <textarea
                          placeholder="Additional clinical notes..."
                          value={form.notes}
                          onChange={handleFormChange("notes")}
                          rows={2}
                          className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                        />
                      </div>
                    </div>
                    {error && (
                      <p className="text-xs text-danger flex items-center gap-1 mb-3 animate-[shake_0.3s]">
                        <AlertCircle className="h-3 w-3" /> {error}
                      </p>
                    )}
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="ghost" onClick={() => { setShowAddForm(false); setError(null); }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting || !form.mrn || !form.full_name}>
                        {submitting ? "Saving..." : "Save Patient"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <Card className="shadow-sm">
          <div className="p-4 flex items-center justify-between border-b border-border bg-muted/20">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, MRN, or diagnosis..."
                className="pl-9 h-10 bg-background/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="neutral">{patients.length} total</Badge>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">Loading registry...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
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
                    <SortHeader label="Name" field="full_name" />
                    <SortHeader label="MRN" field="mrn" />
                    <th className="px-5 py-3.5 font-semibold">Sex / DOB</th>
                    <th className="px-5 py-3.5 font-semibold">Diagnosis</th>
                    <SortHeader label="Added" field="created_at" />
                    <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((p, i) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      key={p.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{p.full_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">#{p.id}</p>
                          </div>
                        </div>
                      </td>
                      {/* MRN */}
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{p.mrn}</td>
                      {/* Sex / DOB */}
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        <div className="space-y-0.5">
                          {p.sex ? (
                            <span className="font-medium text-foreground">{SEX_LABELS[p.sex] ?? p.sex}</span>
                          ) : (
                            <span className="italic text-muted-foreground/50">—</span>
                          )}
                          {p.date_of_birth && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {p.date_of_birth}
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Diagnosis */}
                      <td className="px-5 py-4">
                        <DiagnosisBadge diagnosis={p.diagnosis} />
                      </td>
                      {/* Added */}
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 opacity-70" />
                          {new Date(p.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <Link href={`/patients/${p.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                          >
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
