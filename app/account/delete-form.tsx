"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";

export default function DeleteForm() {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    setError("");
    setNotice("");
    setSending(true);
    const res = await fetch("/api/account/delete/request-code", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error || "Failed to send the confirmation code");
      return;
    }
    setCodeSent(true);
    setNotice("We emailed a confirmation code to your account email. Paste it below to continue.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) { setError("Paste the confirmation code from your email"); return; }
    if (confirm !== "DELETE") { setError("Type DELETE to confirm"); return; }
    setLoading(true);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE", stepUpToken: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || "Failed"); setLoading(false); }
    else { await signOut({ callbackUrl: "/" }); }
  };

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        onClick={requestCode}
        disabled={sending}
        className="premium-button h-10 px-5 disabled:opacity-50"
      >
        {sending ? "Sending…" : codeSent ? "Resend confirmation code" : "Email me a confirmation code"}
      </button>
      {notice && <p className="text-xs text-muted">{notice}</p>}
      <form onSubmit={submit} className="space-y-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Confirmation code from email"
          className="field-input"
          autoComplete="off"
          aria-label="Confirmation code from email"
        />
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type DELETE"
          className="field-input"
          aria-label="Confirm deletion"
        />
        {error && <p role="alert" className="text-xs text-error">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="premium-button h-10 px-5 bg-error text-[#2a1212] disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Delete account"}
        </button>
      </form>
    </div>
  );
}
