"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginCustomer, sendCustomerPasswordReset } from "@/lib/customerAuthService";

export default function CustomerLoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") ?? "/account";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  // Forgot password
  const [showReset, setShowReset]       = useState(false);
  const [resetEmail, setResetEmail]     = useState("");
  const [resetSent, setResetSent]       = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError]     = useState<string | null>(null);

  const inputCls = "w-full rounded-lg border border-brand-border bg-brand-white px-3 py-2.5 text-sm text-brand-brown placeholder:text-brand-muted focus:outline-none focus:border-brand-terracotta transition-colors";

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginCustomer(email, password);
      router.replace(redirect);
    } catch {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);
    try {
      await sendCustomerPasswordReset(resetEmail);
      setResetSent(true);
    } catch {
      setResetError("Could not send reset email. Check the address and try again.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-brand-white rounded-2xl border border-brand-border p-8 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-semibold text-brand-brown">Welcome back</h1>
            <p className="text-sm text-brand-muted mt-1">Sign in to your Flamira account</p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-center">
              {error}
            </p>
          )}

          {!showReset ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-brand-brown">Email</label>
                <input id="email" type="email" autoComplete="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-brand-brown">Password</label>
                <input id="password" type="password" autoComplete="current-password" required value={password}
                  onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
              </div>

              <button type="submit" disabled={loading}
                className="mt-1 w-full px-4 py-2.5 rounded-full bg-brand-terracotta text-brand-white font-medium text-sm hover:bg-brand-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {loading ? "Signing in…" : "Sign In"}
              </button>

              <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); }}
                className="text-xs text-brand-terracotta hover:text-brand-terracotta-dark underline underline-offset-2 text-center transition-colors">
                Forgot your password?
              </button>
            </form>
          ) : (
            /* Forgot password inline */
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-brand-brown mb-1">Reset your password</p>
                <p className="text-xs text-brand-muted">Enter your email and we&apos;ll send a reset link.</p>
              </div>

              {resetSent ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                  ✓ Reset link sent — check your inbox.
                </div>
              ) : (
                <form onSubmit={handleReset} className="flex flex-col gap-3">
                  {resetError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{resetError}</p>
                  )}
                  <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                    className={inputCls} placeholder="you@example.com" />
                  <button type="submit" disabled={resetLoading}
                    className="w-full px-4 py-2.5 rounded-full bg-brand-terracotta text-brand-white font-medium text-sm hover:bg-brand-terracotta-dark disabled:opacity-60 transition-colors">
                    {resetLoading ? "Sending…" : "Send Reset Link"}
                  </button>
                </form>
              )}

              <button type="button" onClick={() => setShowReset(false)}
                className="text-xs text-brand-stone hover:text-brand-brown underline underline-offset-2 text-center transition-colors">
                ← Back to sign in
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-brand-stone mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/account/signup" className="text-brand-terracotta hover:text-brand-terracotta-dark underline underline-offset-2 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
