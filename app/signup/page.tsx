"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
      if (!res.ok) setError(data.error || "Failed");
      else { setOk(data.message || "Account created. Check email."); setTimeout(() => router.push("/signin"), 1500); }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Local-first tools stay free. Account adds entitlements for future premium.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium">Name (optional)</label>
          <input id="name" value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded-md border bg-elevated px-3 py-2 text-sm" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded-md border bg-elevated px-3 py-2 text-sm" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full rounded-md border bg-elevated px-3 py-2 text-sm" autoComplete="new-password" />
          <p className="mt-1 text-xs text-muted-foreground">Min 8 characters. Never stored in plain text.</p>
        </div>
        {error && <div role="alert" className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}
        {ok && <div role="status" aria-live="polite" className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{ok}</div>}
        <button type="submit" disabled={loading} className="h-10 w-full rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50">{loading ? "Creating…" : "Create account"}</button>
        <p className="text-xs text-muted-foreground">By creating an account you agree to our Terms and Privacy. <a href="/signin" className="underline">Already have an account?</a></p>
      </form>
    </main>
  );
}
