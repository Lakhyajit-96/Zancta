"use client";

import type { ApiResult } from "@/lib/integrations/types";

export function emptyResult(message = "This section was not loaded."): ApiResult<unknown> {
  return { state: "DATA_UNAVAILABLE", data: null, message };
}

export function StateBanner({ result }: { result: Pick<ApiResult<unknown>, "state" | "message"> }) {
  if (result.state === "DATA_AVAILABLE") return null;
  return (
    <p className="rounded-md border border-border bg-elevated px-3 py-2 text-sm text-muted-foreground" role="status">
      <span className="font-medium text-foreground">{result.state.replaceAll("_", " ")}</span>
      {result.message ? ` — ${result.message}` : null}
    </p>
  );
}

export function Metric({
  label,
  result,
  value,
}: {
  label: string;
  result: Pick<ApiResult<unknown>, "state" | "message">;
  value?: string | number | null;
}) {
  const showValue = result.state === "DATA_AVAILABLE" && value !== null && value !== undefined;
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{showValue ? value : "—"}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{showValue ? "Provider data" : result.state.replaceAll("_", " ")}</p>
    </div>
  );
}

export function JsonBlock({ title, result }: { title: string; result: ApiResult<unknown> }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <StateBanner result={result} />
      {result.state === "DATA_AVAILABLE" && result.data != null ? (
        <pre className="overflow-x-auto rounded-md border border-border bg-elevated p-3 text-xs">{JSON.stringify(result.data, null, 2)}</pre>
      ) : null}
    </section>
  );
}
