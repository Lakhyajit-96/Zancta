"use client";

import { useState } from "react";

export function CancelPremiumForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function cancel() {
    setError("");
    setBusy(true);
    const res = await fetch("/api/payments/cancel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    const data = await res.json().catch(() => ({})) as { error?: string; cancelAtPeriodEnd?: boolean };
    if (!res.ok) {
      setError(data.error || "Cancellation failed");
      setBusy(false);
      return;
    }
    setDone(true);
    setBusy(false);
    window.location.reload();
  }

  if (done) return <p className="text-xs text-warning mt-2">Cancellation requested. Reloading…</p>;

  return (
    <div className="mt-3">
      <button type="button" disabled={busy} onClick={cancel} className="premium-button premium-button-secondary h-10 px-5">
        {busy ? "Cancelling…" : "Cancel at period end"}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
