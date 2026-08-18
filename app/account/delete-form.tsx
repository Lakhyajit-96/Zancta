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
      <input value={confirm} onChange={(e)=>setConfirm(e.target.value)} placeholder="Type DELETE" className="field-input" aria-label="Confirm deletion" />
      {error && <p role="alert" className="text-xs text-error">{error}</p>}
      <button type="submit" disabled={loading} className="premium-button h-10 px-5 bg-error text-[#2a1212] disabled:opacity-50">{loading ? "Deleting…" : "Delete account"}</button>
    </form>
  );
}
