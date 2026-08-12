"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LayoutChrome } from "@/components/layout/chrome";

function VerifyInner() {
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => { setStatus("error"); setMsg("Missing token"); });
      return;
    }
    queueMicrotask(() => setStatus("loading"));
    fetch("/api/auth/verify-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) { setStatus("error"); setMsg(d.error || "Failed"); }
        else { setStatus("ok"); setMsg("Email verified. You can now sign in."); }
      })
      .catch(() => { setStatus("error"); setMsg("Network error"); });
  }, [token]);

  return (
    <LayoutChrome showNav={false}>
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Verify email</h1>
      {status==="loading" && <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">Verifying…</p>}
      {status==="ok" && <div role="status" aria-live="polite" className="mt-4 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{msg} <Link href="/signin" className="underline">Sign in</Link></div>}
      {status==="error" && <div role="alert" className="mt-4 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">{msg}</div>}
      {status==="idle" && <p className="mt-4 text-sm text-muted-foreground">Waiting for token…</p>}
    </main>
    </LayoutChrome>
  );
}

export default function VerifyPage() {
  return <Suspense fallback={<LayoutChrome showNav={false}><main className="mx-auto max-w-md px-6 py-12"><p className="text-sm text-muted-foreground">Loading…</p></main></LayoutChrome>}><VerifyInner /></Suspense>;
}
