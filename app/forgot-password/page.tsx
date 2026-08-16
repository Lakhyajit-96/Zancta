"use client";
import { useState } from "react";
import { LayoutChrome } from "@/components/layout/chrome";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMsg(""); setLoading(true);
    const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error || "Failed");
    else setMsg(data.message || "Check email");
  };
  return (
    <LayoutChrome showNav={false}>
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
      <p className="mt-2 text-sm text-muted-foreground">We&apos;ll send a reset link if that email exists — generic response for privacy.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded-md border bg-elevated px-3 py-2 text-sm" autoComplete="email" />
        </div>
        {error && <div role="alert" className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}
        {msg && <div role="status" aria-live="polite" className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{msg}</div>}
        <button type="submit" disabled={loading} className="h-11 w-full rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50">{loading ? "Sending…" : "Send reset link"}</button>
      </form>
    </main>
    </LayoutChrome>
  );
}
