// Login page. Handles user authentication and redirects after login.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Suspense } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Determines redirect URL after login
  const nextUrl = useMemo(() => {
    const n = searchParams?.get("next") || searchParams?.get("returnUrl");
    return n && n.startsWith("/") ? n : "/";
  }, [searchParams]);

  const { user, loading: authLoading, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(nextUrl);
    }
  }, [authLoading, user, nextUrl, router]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

  // Handles login form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        // Try to read error message from response
        let msg = `Login failed (${res.status})`;
        try {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const data = (await res.json()) as { message?: string | string[] };
            if (Array.isArray(data.message)) msg = data.message.join(", ");
            else if (typeof data.message === "string") msg = data.message;
          } else {
            const text = await res.text();
            if (text) msg = text.slice(0, 200);
          }
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      await refresh();
      router.replace(nextUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Suspense fallback={null}>
    <div className="mx-auto min-h-[70vh] max-w-md px-4 pt-24">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Login</h1>

      {/* Login form */}
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-md border border-slate-200 p-4"
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Login"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        No account?{" "}
        <a
          href={`/register?next=${encodeURIComponent(nextUrl)}`}
          className="text-emerald-600 hover:underline"
        >
          Register
        </a>
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
    </Suspense>
  );
}
