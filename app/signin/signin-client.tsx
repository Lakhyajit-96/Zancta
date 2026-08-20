"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/marketing/auth-shell";
import { OAuthButtons } from "@/components/marketing/oauth-buttons";
import { describeAuthError } from "@/lib/auth-errors";

function SigninInner({ google, github }: { google: boolean; github: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  // Auth.js returns here with ?error=<code> when an OAuth flow fails or is denied.
  const providerError = describeAuthError(params.get("error"));
  const callbackUrl = params.get("callbackUrl") || "/account";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) setError("Invalid email or password. If you don’t have an account yet, create one first.");
      else router.push(callbackUrl);
    } catch { setError("Unable to sign in right now. Please try again."); }
    setLoading(false);
  };
  return (
    <AuthShell eyebrow="WELCOME BACK" title="Your workspace, without the upload anxiety." description="Sign in to manage account settings and premium entitlements. Your supported tool files remain local to your browser." reassurance="Authentication protects your account; it is not required to process local files.">
      <h2 className="text-lg font-semibold tracking-tight">Sign in</h2>
      <p className="mt-1 text-sm text-muted-foreground">Already have an account? Continue to your existing ZANCTA workspace.</p>
      {providerError && <div role="alert" className="mt-4 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{providerError}</div>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label htmlFor="email" className="text-sm font-medium">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field-input mt-1 h-11" autoComplete="email" /></div>
        <div><label htmlFor="password" className="text-sm font-medium">Password</label><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field-input mt-1 h-11" autoComplete="current-password" /></div>
        {error && <div role="alert" className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}
        <button type="submit" disabled={loading} className="premium-button premium-button-primary mt-2 w-full">{loading ? "Signing in…" : "Sign in"}</button>
      </form>
      <OAuthButtons google={google} github={github} callbackUrl={callbackUrl} intent="signin" />
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5 text-sm"><Link href="/forgot-password" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">Forgot password?</Link><Link href="/signup" className="font-medium text-accent underline underline-offset-4">Create account</Link></div>
    </AuthShell>
  );
}

export function SigninClient({ google, github }: { google: boolean; github: boolean }) {
  return <Suspense fallback={<main className="min-h-screen px-6 py-20 text-center text-sm text-muted-foreground">Loading sign in…</main>}><SigninInner google={google} github={github} /></Suspense>;
}
