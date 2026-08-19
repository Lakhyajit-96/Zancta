"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/marketing/auth-shell";
import { EnvelopeVisual } from "@/components/marketing/visuals";

function ResendForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = (await res.json().catch(() => ({}))) as { message?: string; emailIssue?: boolean; cooldown?: boolean; error?: string };
      if (res.status === 429) {
        setNote({ kind: "warn", text: d.error || "Too many attempts. Try again later." });
      } else if (!res.ok) {
        setNote({ kind: "error", text: d.error || "That request couldn't be processed. Please try again." });
      } else if (d.emailIssue) {
        setNote({ kind: "warn", text: d.message || "We couldn't send the email right now. Please try again in a few minutes." });
      } else if (d.cooldown) {
        setNote({ kind: "warn", text: d.message || "Please wait a while before requesting another verification email." });
      } else {
        setNote({ kind: "ok", text: d.message || "If that email is registered and not verified yet, a new verification email is on its way." });
      }
    } catch {
      setNote({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded-lg border border-border bg-elevated/40 p-4">
      <div>
        <label htmlFor="resend-email" className="text-sm font-medium">
          Didn&apos;t get the email? Request a new one
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter your account email. If it&apos;s registered and not verified yet, we&apos;ll send a fresh one-time link.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="resend-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="field-input flex-1"
        />
        <button type="submit" disabled={busy || !email} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">
          {busy ? "Sending…" : "Resend verification email"}
        </button>
      </div>
      {note && (
        <p
          role="status"
          aria-live="polite"
          className={`text-xs ${note.kind === "ok" ? "text-success" : note.kind === "warn" ? "text-warning" : "text-error"}`}
        >
          {note.text}
        </p>
      )}
    </form>
  );
}

function VerifyInner() {
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");
  const [msg, setMsg] = useState(token ? "" : "This verification link is missing a token.");
  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/verify-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setStatus("error");
          setMsg(d.error || "This link is invalid or expired.");
        } else {
          setStatus("ok");
          setMsg("Email verified. You can now sign in.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMsg("Network error. Please try again.");
      });
  }, [token]);
  return (
    <AuthShell
      eyebrow="ACCOUNT VERIFICATION"
      title="Confirm your email."
      description="Email verification helps keep account recovery and entitlement changes tied to the right address."
      reassurance="The link is processed by the existing authentication flow and does not touch your local tool files."
    >
      <h2 className="text-lg font-semibold tracking-tight">Verify email</h2>
      <EnvelopeVisual />
      {status === "loading" && (
        <p className="mt-2 text-center text-sm text-muted-foreground" aria-live="polite">
          Verifying…
        </p>
      )}
      {status === "ok" && (
        <div role="status" aria-live="polite" className="mt-2 rounded-md border border-success/40 bg-success/10 px-3 py-3 text-center text-sm text-success">
          {msg}{" "}
          <Link href="/signin" className="underline underline-offset-4">
            Sign in
          </Link>
        </div>
      )}
      {status === "error" && (
        <div role="alert" className="mt-2 rounded-md border border-error/40 bg-error/10 px-3 py-3 text-sm text-error">
          {msg}
          <p className="mt-3">
            <Link href="/signup" className="underline underline-offset-4">
              Create a new account
            </Link>{" "}
            or{" "}
            <Link href="/signin" className="underline underline-offset-4">
              return to sign in
            </Link>
            .
          </p>
        </div>
      )}
      {status !== "ok" && <ResendForm />}
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-6 py-20 text-center text-sm text-muted-foreground">Loading verification…</main>}>
      <VerifyInner />
    </Suspense>
  );
}
