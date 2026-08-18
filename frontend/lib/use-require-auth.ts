"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

export function useRequireAuth() {
  const router = useRouter();
  const { token, user, setUser, hydrate } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("oncotwin_token")
        : null;

    if (!token && !stored) {
      router.replace("/login");
      return;
    }

    if (!user) {
      api
        .auth.me()
        .then((u) => {
          setUser(u);
          setReady(true);
        })
        .catch(() => {
          router.replace("/login");
        });
    } else {
      setReady(true);
    }
  }, [token, user, setUser, router]);

  return { ready, user };
}
