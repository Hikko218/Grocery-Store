"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

export type User = {
  id: number;
  email: string;
  name?: string | null;
  role?: string | null; // "user" | "admin"
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  loginRedirect: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/status`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as unknown;
      // Unterstützt mehrere Formen: {isAuthenticated,user:{...}} oder {isAuthenticated,userId,email,role} oder direkt {id,email,role}
      let next: User | null = null;
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if (
          d.isAuthenticated === true &&
          typeof d.user === "object" &&
          d.user
        ) {
          const u = d.user as {
            id?: number;
            email?: string;
            role?: string | null;
          };
          if (typeof u.id === "number" && typeof u.email === "string") {
            next = {
              id: u.id,
              email: u.email,
              role: (u.role ?? null)?.toString().toLowerCase() ?? null,
            };
          }
        } else if (d.isAuthenticated === true && typeof d.userId === "number") {
          next = {
            id: d.userId as number,
            email: String(d.email ?? ""),
            role: (d.role ?? null)?.toString().toLowerCase() ?? null,
          };
        } else if (typeof d.id === "number" && typeof d.email === "string") {
          next = {
            id: d.id as number,
            email: d.email as string,
            role: (d.role ?? null)?.toString().toLowerCase() ?? null,
          };
        }
      }
      setUser(next);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchMe();
      setLoading(false);
    })();
  }, [fetchMe]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchMe();
    setLoading(false);
  }, [fetchMe]);

  const loginRedirect = useCallback(() => {
    router.push("/login");
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    } finally {
      setUser(null);
      router.push("/");
    }
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, refresh, loginRedirect, logout }),
    [user, loading, refresh, loginRedirect, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
