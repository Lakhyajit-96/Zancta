"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/marketing/auth-shell";
import { EnvelopeVisual } from "@/components/marketing/visuals";

function VerifyInner() {
  const token = useSearchParams().get("token"); const [status, setStatus] = useState<"loading" | "ok" | "error">(token ? "loading" : "error"); const [msg, setMsg] = useState(token ? "" : "This verification link is missing a token.");
  useEffect(() => { if (!token) return; fetch("/api/auth/verify-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) }).then(async (r) => { const d = await r.json(); if (!r.ok) { setStatus("error"); setMsg(d.error || "This link is invalid or expired."); } else { setStatus("ok"); setMsg("Email verified. You can now sign in."); } }).catch(() => { setStatus("error"); setMsg("Network error. Please try again."); }); }, [token]);
  return <AuthShell eyebrow="ACCOUNT VERIFICATION" title="Confirm your email." description="Email verification helps keep account recovery and entitlement changes tied to the right address." reassurance="The link is processed by the existing authentication flow and does not touch your local tool files.">
    <h2 className="text-lg font-semibold tracking-tight">Verify email</h2><EnvelopeVisual />{status === "loading" && <p className="mt-2 text-center text-sm text-muted-foreground" aria-live="polite">Verifying…</p>}{status === "ok" && <div role="status" aria-live="polite" className="mt-2 rounded-md border border-success/40 bg-success/10 px-3 py-3 text-center text-sm text-success">{msg} <Link href="/signin" className="underline underline-offset-4">Sign in</Link></div>}{status === "error" && <div role="alert" className="mt-2 rounded-md border border-error/40 bg-error/10 px-3 py-3 text-sm text-error">{msg}<p className="mt-3"><Link href="/signup" className="underline underline-offset-4">Create a new account</Link> or <Link href="/signin" className="underline underline-offset-4">return to sign in</Link>.</p></div>}
  </AuthShell>;
}

export default function VerifyPage() { return <Suspense fallback={<main className="min-h-screen px-6 py-20 text-center text-sm text-muted-foreground">Loading verification…</main>}><VerifyInner /></Suspense>; }
