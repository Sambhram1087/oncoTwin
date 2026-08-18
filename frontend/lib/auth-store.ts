import { create } from "zustand";
import { User } from "./api";

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("oncotwin_token", token);
      else localStorage.removeItem("oncotwin_token");
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("oncotwin_token");
    }
    set({ token: null, user: null });
  },
  hydrate: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("oncotwin_token");
      if (token) set({ token });
    }
  },
}));
