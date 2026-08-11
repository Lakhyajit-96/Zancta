"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
    setError(""); setOk(""); setLoading(true);
    const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error || "Failed");
    else { setOk("Password updated. Sign in."); setTimeout(()=>router.push("/signin"), 1500); }
  };

  if (!token) return <main className="mx-auto max-w-md px-6 py-12"><p role="alert" className="text-sm text-error">Missing token</p></main>;

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
      <p className="mt-2 text-sm text-muted-foreground">Token expires in 60 minutes and is one-time use.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="password" className="text-sm font-medium">New password</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full rounded-md border bg-elevated px-3 py-2 text-sm" autoComplete="new-password" />
        </div>
        {error && <div role="alert" className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{error}</div>}
        {ok && <div role="status" aria-live="polite" className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{ok}</div>}
        <button type="submit" disabled={loading} className="h-10 w-full rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-50">{loading ? "Updating…" : "Update password"}</button>
      </form>
    </main>
  );
}

export default function ResetPage() {
  return <Suspense fallback={<main className="mx-auto max-w-md px-6 py-12"><p className="text-sm text-muted-foreground">Loading…</p></main>}><ResetInner /></Suspense>;
}
