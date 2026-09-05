"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { api, Patient } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ParticleField } from "@/components/ui/particle-field";
import { Upload, File as FileIcon, Check, Brain, Search, Users, Activity, ChevronRight, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function UploadPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    api.patients.list().then(setPatients).catch(console.error);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
      setStep(3);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setStep(3);
    }
  };

  const handleUpload = async () => {
    if (!file || patientId === null) return;
    setUploading(true);
    try {
      const res = await api.scans.upload(patientId, file, "t1ce", "baseline");
      // Wait a moment for UX
      setTimeout(() => {
        router.push(`/results/${res.id}`);
      }, 800);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
      setUploading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.mrn.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search.toLowerCase())
  );

  const selectedPatientData = patients.find(p => p.id === patientId);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-4 shadow-glow-sm">
            <Upload className="h-8 w-8" />
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-3xl font-bold tracking-tight">New Scan Analysis</motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-muted-foreground mt-2">Upload a NIfTI file to run the segmentation pipeline.</motion.p>
        </div>

        {/* Wizard Progress */}
        <div className="flex items-center justify-center max-w-lg mx-auto mb-10 relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-border/50 -z-10" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-10" style={{ width: `${(step - 1) * 50}%` }} />
          
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex justify-center relative">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === s ? 'bg-primary text-primary-foreground shadow-glow-sm scale-110' : 
                step > s ? 'bg-primary text-primary-foreground' : 'bg-card border-2 border-border text-muted-foreground'
              }`}>
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              <div className="absolute -bottom-6 w-max text-xs font-medium text-muted-foreground">
                {s === 1 ? 'Patient' : s === 2 ? 'Upload' : 'Confirm'}
              </div>
            </div>
          ))}
        </div>

        <Card className="overflow-hidden border-border/50 shadow-float bg-card/50 backdrop-blur-xl">
          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              {/* STEP 1: SELECT PATIENT */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-8"
                >
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Select Patient
                  </h3>
                  
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Search MRN..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredPatients.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No patients found.</div>
                    ) : (
                      filteredPatients.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => { setPatientId(p.id); setStep(2); }}
                          className="p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-all group"
                        >
                          <div>
                            <p className="font-semibold">{p.mrn}</p>
                            <p className="text-xs text-muted-foreground font-mono">ID: {p.id}</p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: UPLOAD FILE */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Upload className="h-5 w-5 text-primary" /> Upload MRI Scan
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Change Patient</Button>
                  </div>

                  <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border flex items-center gap-3">
                     <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                       <User className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                       <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Selected Patient</p>
                       <p className="font-medium">{selectedPatientData?.mrn}</p>
                     </div>
                  </div>

                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative flex flex-col items-center justify-center w-full h-64 mt-6
                      border-2 border-dashed rounded-2xl cursor-pointer
                      transition-all duration-300 overflow-hidden
                      ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
                    `}
                  >
                    {isDragging && (
                      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                         <ParticleField particleCount={30} connectionDistance={100} />
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                      <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-muted text-muted-foreground'}`}>
                        <Brain className={`h-8 w-8 ${isDragging ? 'animate-pulse' : ''}`} />
                      </div>
                      <p className="mb-2 text-lg font-semibold">
                        <span className="text-primary">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-sm text-muted-foreground">
                        NIfTI files (.nii or .nii.gz)
                      </p>
                    </div>
                    <input type="file" className="hidden" accept=".nii,.nii.gz" onChange={handleFileChange} />
                  </label>
                </motion.div>
              )}

              {/* STEP 3: CONFIRM */}
              {step === 3 && file && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-8 text-center"
                >
                  <div className="h-24 w-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 relative shadow-inner-glow">
                    <FileIcon className="h-10 w-10 text-primary" />
                    <div className="absolute -top-2 -right-2 h-8 w-8 bg-success rounded-full flex items-center justify-center text-success-foreground border-4 border-card shadow-sm">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">Ready to analyze</h3>
                  
                  <div className="max-w-sm mx-auto glass rounded-xl p-4 mb-8 text-left">
                     <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/50">
                        <FileIcon className="h-8 w-8 text-muted-foreground" />
                        <div className="overflow-hidden">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB • NIfTI Scan</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <User className="h-8 w-8 p-1.5 bg-muted rounded-lg text-muted-foreground" />
                        <div>
                          <p className="font-medium">{selectedPatientData?.mrn}</p>
                          <p className="text-xs text-muted-foreground">Target Patient</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    <Button variant="outline" size="lg" onClick={() => { setFile(null); setStep(2); }} disabled={uploading}>
                      Change file
                    </Button>
                    <Button size="lg" onClick={handleUpload} disabled={uploading} className="shadow-glow min-w-[160px]">
                      {uploading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Activity className="h-5 w-5 mr-2" /> Start Analysis
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
