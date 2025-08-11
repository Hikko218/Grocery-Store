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
      const data = (await res.json()) as User;
      setUser(data ?? null);
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
