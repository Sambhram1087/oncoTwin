"use client";

import { useEffect, useRef, useState } from "react";
import { WS_BASE_URL } from "./api";

interface ProgressMessage {
  status: string;
  progress: number;
  step?: string;
  result?: unknown;
  error?: string;
}

export function useJobProgress(jobId: number | null) {
  const [message, setMessage] = useState<ProgressMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const ws = new WebSocket(`${WS_BASE_URL}/api/v1/ws/jobs/${jobId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProgressMessage;
        setMessage(data);
      } catch {
        // ignore malformed message
      }
    };

    return () => {
      ws.close();
    };
  }, [jobId]);

  return message;
}
