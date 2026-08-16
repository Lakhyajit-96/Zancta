"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/marketing/auth-shell";

function ResetInner() {
  const params = useSearchParams(); const router = useRouter(); const token = params.get("token") || "";
  const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [ok, setOk] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setError(""); setOk(""); setLoading(true); try { const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) }); const data = await res.json(); if (!res.ok) setError(data.error || "That reset link is invalid or expired."); else { setOk("Password updated. Redirecting to sign in."); setTimeout(() => router.push("/signin"), 1500); } } catch { setError("Network error. Please try again."); } setLoading(false); };
  return <AuthShell eyebrow="ACCOUNT RECOVERY" title="Set a new password." description="Use the one-time link from your reset email. Links expire after 60 minutes." reassurance="Reset tokens are single-use; your new password is stored through the existing authentication system.">
    <h2 className="text-xl font-semibold">Reset password</h2>{!token ? <><p role="alert" className="mt-4 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">This reset link is missing or incomplete.</p><p className="mt-5 text-sm text-muted-foreground"><Link href="/forgot-password" className="underline">Request a new link</Link>.</p></> : <form onSubmit={submit} className="mt-6 space-y-4"><div><label htmlFor="password" className="text-sm font-medium">New password</label><input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 w-full rounded-md border bg-elevated px-3 text-sm" autoComplete="new-password" /></div>{error && <div role="alert" className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}{ok && <div role="status" aria-live="polite" className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{ok}</div>}<button type="submit" disabled={loading} className="h-11 w-full rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50">{loading ? "Updating…" : "Update password"}</button></form>}
  </AuthShell>;
}

export default function ResetPage() { return <Suspense fallback={<main className="min-h-screen px-6 py-20 text-center text-sm text-muted-foreground">Loading password reset…</main>}><ResetInner /></Suspense>; }
