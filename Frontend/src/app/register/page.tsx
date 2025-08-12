"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = useMemo(() => {
    const n = searchParams?.get("next") || searchParams?.get("returnUrl");
    return n && n.startsWith("/") ? n : "/";
  }, [searchParams]);

  const { user, loading: authLoading, refresh } = useAuth();
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(nextUrl);
    }
  }, [authLoading, user, nextUrl, router]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
  const AUTH_LOGIN_URL = `${API_BASE}/auth/login`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/user`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          email,
          password,
        }),
      });

      if (!res.ok) {
        let msg = `Registration failed (${res.status})`;
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
        } catch {}
        throw new Error(msg);
      }

      // Direkt nach Registrierung einloggen
      const loginRes = await fetch(AUTH_LOGIN_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) {
        // Wenn Login fehlschlägt, Fehler anzeigen statt still weiterzuleiten
        let msg = `Login after register failed (${loginRes.status})`;
        try {
          const ct = loginRes.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const data = (await loginRes.json()) as {
              message?: string | string[];
            };
            if (Array.isArray(data.message)) msg = data.message.join(", ");
            else if (typeof data.message === "string") msg = data.message;
          } else {
            const text = await loginRes.text();
            if (text) msg = text.slice(0, 200);
          }
        } catch {}
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
    <div className="mx-auto max-w-md px-4 pt-24">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Register</h1>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-md border border-slate-200 p-4"
      >
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-slate-700"
          >
            First name (optional)
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="First name"
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-slate-700"
          >
            Last name (optional)
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Last name"
          />
        </div>

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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Your password"
          />
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="block text-sm font-medium text-slate-700"
          >
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Repeat your password"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {submitting ? "Registering…" : "Register"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <a
          href={`/login?next=${encodeURIComponent(nextUrl)}`}
          className="text-emerald-600 hover:underline"
        >
          Login
        </a>
      </p>
    </div>
  );
}
