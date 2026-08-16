"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/marketing/auth-shell";

export default function ForgotPage() {
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setError(""); setMsg(""); setLoading(true); try { const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }); const data = await res.json(); if (!res.ok) setError(data.error || "We could not process that request."); else setMsg(data.message || "If the email exists, a reset link has been sent."); } catch { setError("Network error. Please try again."); } setLoading(false); };
  return <AuthShell eyebrow="ACCOUNT RECOVERY" title="Get back into your account." description="Request a one-time reset link. The response stays deliberately generic so it does not reveal whether an address has an account." reassurance="Reset links expire and are single-use.">
    <h2 className="text-xl font-semibold">Forgot password</h2><p className="mt-2 text-sm text-muted-foreground">We’ll send a reset link if that email exists.</p>
    <form onSubmit={submit} className="mt-6 space-y-4"><div><label htmlFor="email" className="text-sm font-medium">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded-md border bg-elevated px-3 text-sm" autoComplete="email" /></div>{error && <div role="alert" className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}{msg && <div role="status" aria-live="polite" className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{msg}</div>}<button type="submit" disabled={loading} className="h-11 w-full rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50">{loading ? "Sending…" : "Send reset link"}</button></form>
    <p className="mt-5 text-sm text-muted-foreground"><Link href="/signin" className="underline">Back to sign in</Link></p>
  </AuthShell>;
}
