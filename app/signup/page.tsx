"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/marketing/auth-shell";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setOk(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, name: name || undefined }) });
      const data = await res.json();
      if (!res.ok) setError(data.error || "We could not create that account.");
      else { setOk(data.message || "Account created. Check your email to continue."); setTimeout(() => router.push("/signin"), 1500); }
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  return (
    <AuthShell eyebrow="JOIN ZANCTA" title="A quieter way to work with files." description="Create an account for entitlements and account settings. The supported tools still process files in your browser." reassurance="Your account is separate from your file bytes; tool files are not uploaded for local processing.">
      <h2 className="text-lg font-semibold tracking-tight">Create account</h2>
      <p className="mt-1 text-sm text-muted-foreground">No account is required to try the local tools.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label htmlFor="name" className="text-sm font-medium">Name <span className="text-muted-foreground">(optional)</span></label><input id="name" value={name} onChange={(e) => setName(e.target.value)} className="field-input mt-1 h-11" autoComplete="name" /></div>
        <div><label htmlFor="email" className="text-sm font-medium">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field-input mt-1 h-11" autoComplete="email" /></div>
        <div><label htmlFor="password" className="text-sm font-medium">Password</label><input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="field-input mt-1 h-11" autoComplete="new-password" /><p className="mt-1 text-xs text-muted-foreground">At least 8 characters. Never stored in plain text.</p></div>
        {error && <div role="alert" className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}
        {ok && <div role="status" aria-live="polite" className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{ok}</div>}
        <button type="submit" disabled={loading} className="premium-button premium-button-primary mt-2 w-full">{loading ? "Creating…" : "Create account"}</button>
      </form>
      <p className="mt-5 text-xs leading-5 text-muted-foreground">By creating an account you agree to the <Link href="/terms" className="underline underline-offset-4">Terms</Link> and <Link href="/privacy" className="underline underline-offset-4">Privacy notice</Link>.</p>
      <p className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">Already have an account? <Link href="/signin" className="font-medium text-accent underline underline-offset-4">Sign in</Link></p>
    </AuthShell>
  );
}
