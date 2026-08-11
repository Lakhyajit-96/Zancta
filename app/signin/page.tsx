"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SigninInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Invalid email or password");
    else router.push(params.get("callbackUrl") || "/account");
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your files stay local — account is for entitlements only.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded-md border bg-elevated px-3 py-2 text-sm" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full rounded-md border bg-elevated px-3 py-2 text-sm" autoComplete="current-password" />
        </div>
        {error && <div role="alert" className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}
        <button type="submit" disabled={loading} className="h-10 w-full rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
        <div className="flex justify-between text-xs text-muted-foreground">
          <Link href="/forgot-password" className="underline">Forgot password?</Link>
          <Link href="/signup" className="underline">Create account</Link>
        </div>
      </form>
    </main>
  );
}

export default function SigninPage() {
  return <Suspense fallback={<main className="mx-auto max-w-md px-6 py-12"><p className="text-sm text-muted-foreground">Loading…</p></main>}><SigninInner /></Suspense>;
}
