"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = login(email, password, remember);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(11,31,58,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(212,160,23,0.12),_transparent_45%)]" />
      <div className="relative w-full max-w-md rounded-xl bg-white p-8 shadow-lg ring-1 ring-[var(--border)]">
        <div className="mb-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
            Agesa
          </p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-[var(--amber)]">
            OmniPanel
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
            Giriş Yap
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            AgeSA MCP Online hesabınızla devam edin
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--navy)]">
              E-posta
            </span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 outline-none focus:border-[var(--amber)]"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--navy)]">
              Şifre
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 outline-none focus:border-[var(--amber)]"
              placeholder="••••••••"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 accent-[var(--navy)]"
            />
            Bu cihazda beni hatırla
          </label>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[var(--amber)] px-3 py-2.5 text-sm font-semibold text-[var(--navy)] transition hover:brightness-105 disabled:opacity-50"
          >
            {submitting ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
