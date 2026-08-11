"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";

export default function DeleteForm() {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (confirm !== "DELETE") { setError("Type DELETE to confirm"); return; }
    setLoading(true);
    const res = await fetch("/api/account/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) { setError(data.error || "Failed"); setLoading(false); }
    else { await signOut({ callbackUrl: "/" }); }
  };
  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <input value={confirm} onChange={(e)=>setConfirm(e.target.value)} placeholder="Type DELETE" className="w-full rounded-md border bg-elevated px-3 py-2 text-sm" aria-label="Confirm deletion" />
      {error && <p role="alert" className="text-xs text-error">{error}</p>}
      <button type="submit" disabled={loading} className="h-9 px-4 rounded-md bg-error text-error-foreground text-sm disabled:opacity-50">{loading ? "Deleting…" : "Delete account"}</button>
    </form>
  );
}
