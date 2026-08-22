"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthLoading, AuthShell } from "@/components/marketing/auth-shell";
import { PasswordField } from "@/components/ui/password-field";

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "That reset link is invalid or expired.");
      else {
        setOk("Password updated. Redirecting to sign in.");
        setTimeout(() => router.push("/signin"), 1500);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title="Set a new password."
      description="Use the one-time link from your reset email. Links expire after 60 minutes."
      reassurance="Reset tokens are single-use; your new password is stored through the existing authentication system."
    >
      <h2 className="text-lg font-semibold tracking-tight">Reset password</h2>
      {!token ? (
        <>
          <p role="alert" className="mt-4 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">This reset link is missing or incomplete.</p>
          <p className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
            <Link href="/forgot-password" className="underline underline-offset-4 hover:text-foreground">Request a new link</Link>.
          </p>
        </>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <PasswordField
            id="password"
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            minLength={8}
            hint={<p className="mt-1 text-xs text-muted-foreground">At least 8 characters. Never stored in plain text.</p>}
          />
          {error && <div role="alert" className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}
          {ok && <div role="status" aria-live="polite" className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{ok}</div>}
          <button type="submit" disabled={loading} className="premium-button premium-button-primary mt-2 w-full">{loading ? "Updating…" : "Update password"}</button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<AuthLoading title="Loading password reset." />}>
      <ResetInner />
    </Suspense>
  );
}
