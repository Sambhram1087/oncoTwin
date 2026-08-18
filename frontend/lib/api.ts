export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("oncotwin_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- Types matching backend schemas --------------------------------
export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
}

export interface Patient {
  id: number;
  mrn: string;
  full_name: string;
  date_of_birth: string | null;
  sex: string | null;
  diagnosis: string | null;
  notes: string | null;
  created_at: string;
}

export interface Scan {
  id: number;
  patient_id: number;
  modality: string;
  original_filename: string;
  visit_label: string | null;
  created_at: string;
  job_id: number | null;
}

export interface JobResult {
  tumor_volume_ml: number;
  confidence: number;
  segmentation_mask_summary: { voxel_count: number; labels: string[] };
  radiomics: Record<string, number>;
  mesh: { vertices: number; faces: number };
  model_version: string;
}

export interface Job {
  id: number;
  scan_id: number;
  status: "queued" | "running" | "complete" | "failed";
  progress: number;
  result: JobResult | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrowthPrediction {
  days: number;
  projected_volume_ml: number;
  confidence: number;
}

// ---- API functions ---------------------------------------------------
export const api = {
  auth: {
    signup: (data: { email: string; password: string; full_name?: string }) =>
      request<{ access_token: string }>("/api/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ access_token: string }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    me: () => request<User>("/api/v1/auth/me"),
  },
  patients: {
    list: (search?: string) =>
      request<Patient[]>(
        `/api/v1/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`
      ),
    get: (id: number) => request<Patient>(`/api/v1/patients/${id}`),
    create: (data: Partial<Patient>) =>
      request<Patient>("/api/v1/patients", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Patient>) =>
      request<Patient>(`/api/v1/patients/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      request<void>(`/api/v1/patients/${id}`, { method: "DELETE" }),
  },
  scans: {
    list: (patientId: number) =>
      request<Scan[]>(`/api/v1/patients/${patientId}/scans`),
    upload: (patientId: number, file: File, modality: string, visitLabel: string) => {
      const form = new FormData();
      form.append("file", file);
      form.append("modality", modality);
      form.append("visit_label", visitLabel);
      return request<Job>(`/api/v1/patients/${patientId}/scans`, {
        method: "POST",
        body: form,
      });
    },
  },
  jobs: {
    get: (id: number) => request<Job>(`/api/v1/jobs/${id}`),
  },
  predict: {
    growth: (jobId: number, days: number) =>
      request<GrowthPrediction>(`/api/v1/predict/${jobId}?days=${days}`),
  },
};
