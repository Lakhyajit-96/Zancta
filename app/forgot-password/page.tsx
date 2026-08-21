"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/marketing/auth-shell";

export default function ForgotPage() {
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setError(""); setMsg(""); setLoading(true); try { const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }); const data = await res.json(); if (!res.ok) setError(data.error || "We could not process that request."); else setMsg(data.message || "If the email exists, a reset link has been sent."); } catch { setError("Network error. Please try again."); } setLoading(false); };
  return <AuthShell eyebrow="ACCOUNT RECOVERY" title="Get back into your account." description="Request a one-time reset link. The response stays deliberately generic so it does not reveal whether an address has an account." reassurance="Reset links expire and are single-use.">
    <h2 className="text-lg font-semibold tracking-tight">Forgot password</h2><p className="mt-1 text-sm text-muted-foreground">Request a one-time reset link. The response is generic and does not confirm whether the address is registered.</p>
    <form onSubmit={submit} className="mt-6 space-y-4"><div><label htmlFor="email" className="text-sm font-medium">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field-input mt-1 h-11" autoComplete="email" /></div>{error && <div role="alert" className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}{msg && <div role="status" aria-live="polite" className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{msg}</div>}<button type="submit" disabled={loading} className="premium-button premium-button-primary mt-2 w-full">{loading ? "Sending…" : "Send reset link"}</button></form>
    <p className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground"><Link href="/signin" className="underline underline-offset-4 hover:text-foreground">Back to sign in</Link></p>
  </AuthShell>;
}
