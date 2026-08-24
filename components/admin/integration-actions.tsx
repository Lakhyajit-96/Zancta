"use client";

import { useState } from "react";

export function InspectForm() {
  const [url, setUrl] = useState("https://zancta.tech/");
  const [out, setOut] = useState<string>("");
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOut("Running inspection…");
    const res = await fetch("/api/admin/integrations/google/inspect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    setOut(JSON.stringify(await res.json(), null, 2));
  }
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label className="block text-sm">
        URL
        <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm">Inspect URL</button>
      {out ? <pre className="overflow-x-auto rounded-md border border-border bg-elevated p-3 text-xs">{out}</pre> : null}
    </form>
  );
}

export function SitemapForm() {
  const [out, setOut] = useState("");
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm("Submit https://zancta.tech/sitemap.xml to Google Search Console?")) return;
    const res = await fetch("/api/admin/integrations/google/sitemap", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ feedpath: "https://zancta.tech/sitemap.xml", confirm: true }),
    });
    setOut(JSON.stringify(await res.json(), null, 2));
  }
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <p className="text-sm text-muted-foreground">Write action: submit the canonical sitemap only. Request-indexing is not available via API.</p>
      <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm">Submit sitemap.xml</button>
      {out ? <pre className="overflow-x-auto rounded-md border border-border bg-elevated p-3 text-xs">{out}</pre> : null}
    </form>
  );
}

export function BingSubmitForm() {
  const [url, setUrl] = useState("https://zancta.tech/");
  const [out, setOut] = useState("");
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm(`Submit ${url} to Bing Webmaster?`)) return;
    const res = await fetch("/api/admin/integrations/bing/submit-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, confirm: true }),
    });
    setOut(JSON.stringify(await res.json(), null, 2));
  }
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label className="block text-sm">
        URL
        <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm">Submit URL to Bing</button>
      {out ? <pre className="overflow-x-auto rounded-md border border-border bg-elevated p-3 text-xs">{out}</pre> : null}
    </form>
  );
}
