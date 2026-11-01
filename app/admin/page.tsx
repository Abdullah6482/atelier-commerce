"use client";

import { FormEvent, useEffect, useState } from "react";

type AdminSessionResponse = {
  authenticated?: boolean;
  error?: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/session")
      .then(async (response) => {
        const data = await response.json() as AdminSessionResponse;
        if (!response.ok) throw new Error(data.error ?? "Could not check admin session.");
        setAuthenticated(data.authenticated === true);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Could not check admin session.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json() as AdminSessionResponse;
      if (!response.ok) throw new Error(data.error ?? "Invalid admin credentials.");
      setPassword("");
      setAuthenticated(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Admin sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    setError("");
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not sign out.");
      setAuthenticated(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f1ea] px-5 py-12 text-[#181816]">
      <section className="w-full max-w-md rounded-[30px] border border-black/10 bg-white/70 p-7 shadow-xl md:p-10">
        <a href="/" className="text-sm font-bold uppercase tracking-[.15em]">Luma Market</a>
        <p className="mt-10 text-xs font-bold uppercase tracking-[.18em] text-[#f25f3a]">Store administration</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Admin sign-in</h1>
        {loading ? (
          <p className="mt-6 text-sm text-black/55">Checking your session…</p>
        ) : authenticated ? (
          <div className="mt-6">
            <p className="text-sm leading-6 text-black/65">
              You are signed in. Product create, update, and delete API requests now require this admin session.
            </p>
            <button onClick={signOut} className="mt-6 rounded-full bg-[#181816] px-6 py-3 text-sm font-bold text-white">
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={signIn} className="mt-6">
            <label htmlFor="admin-password" className="text-sm font-semibold">Admin password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="shop-field mt-2"
            />
            {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button disabled={submitting} className="mt-5 w-full rounded-full bg-[#181816] px-6 py-4 text-sm font-bold text-white disabled:opacity-50">
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}
        {!loading && authenticated && error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <p className="mt-8 border-t border-black/10 pt-5 text-xs leading-5 text-black/45">
          Admin credentials are supplied by the deployment environment. There is no public account registration.
        </p>
      </section>
    </main>
  );
}
