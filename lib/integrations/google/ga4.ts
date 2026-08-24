import { empty, fail, ok, type ApiResult } from "../types";
import { providerFetch } from "../http";

const ADMIN = "https://analyticsadmin.googleapis.com/v1beta";
const DATA = "https://analyticsdata.googleapis.com/v1beta";
const EXPECTED_MEASUREMENT = "G-56KMDH7Z2X";

export function expectedMeasurementId(): string {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || EXPECTED_MEASUREMENT;
}

export async function discoverGa4Property(accessToken: string): Promise<ApiResult<{ propertyId: string; displayName: string; measurementId: string }>> {
  const summaries = await providerFetch(`${ADMIN}/accountSummaries`, { accessToken });
  if (summaries.state !== "DATA_AVAILABLE" || !summaries.data) {
    return summaries as ApiResult<{ propertyId: string; displayName: string; measurementId: string }>;
  }
  const accounts = (summaries.data as {
    accountSummaries?: Array<{
      propertySummaries?: Array<{ property?: string; displayName?: string }>;
    }>;
  }).accountSummaries ?? [];
  const target = expectedMeasurementId();
  for (const account of accounts) {
    for (const prop of account.propertySummaries ?? []) {
      const name = prop.property;
      if (!name) continue;
      const streams = await providerFetch(`${ADMIN}/${name}/dataStreams`, { accessToken });
      if (streams.state !== "DATA_AVAILABLE" || !streams.data) continue;
      const list = (streams.data as { dataStreams?: Array<{ webStreamData?: { measurementId?: string }; name?: string }> }).dataStreams ?? [];
      const match = list.find((s) => s.webStreamData?.measurementId === target);
      if (match) {
        const propertyId = name.replace(/^properties\//, "");
        return ok({
          propertyId,
          displayName: prop.displayName || propertyId,
          measurementId: target,
        });
      }
    }
  }
  return fail("PROPERTY_NOT_FOUND", `No GA4 web stream with measurement ID ${target} is visible to this Google account.`);
}

export async function runGa4Report(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<ApiResult<unknown>> {
  return providerFetch(`${DATA}/properties/${propertyId}:runReport`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(body),
  });
}

export async function runGa4Realtime(accessToken: string, propertyId: string): Promise<ApiResult<unknown>> {
  return providerFetch(`${DATA}/properties/${propertyId}:runRealtimeReport`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "unifiedScreenName" }],
      limit: 20,
    }),
  });
}

export function parseReportRows(data: unknown): Array<{ keys: string[]; values: number[] }> {
  const rows = (data as { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> })?.rows ?? [];
  return rows.map((row) => ({
    keys: (row.dimensionValues ?? []).map((d) => d.value ?? "(not set)"),
    values: (row.metricValues ?? []).map((m) => Number(m.value ?? 0)),
  }));
}

export function totalsFromReport(data: unknown): number[] | null {
  const totals = (data as { totals?: Array<{ metricValues?: Array<{ value?: string }> }> })?.totals;
  if (!totals?.[0]?.metricValues) return null;
  return totals[0].metricValues.map((m) => Number(m.value ?? 0));
}

export async function ga4Overview(accessToken: string, propertyId: string, startDate: string, endDate: string) {
  const res = await runGa4Report(accessToken, propertyId, {
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: "activeUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "engagementRate" },
      { name: "averageSessionDuration" },
      { name: "eventCount" },
      { name: "screenPageViews" },
    ],
    metricAggregations: ["TOTAL"],
  });
  if (res.state !== "DATA_AVAILABLE") return res;
  const totals = totalsFromReport(res.data);
  if (!totals) return empty("GA4 returned no overview totals for this range.");
  return ok({
    activeUsers: totals[0],
    newUsers: totals[1],
    sessions: totals[2],
    engagementRate: totals[3],
    averageSessionDuration: totals[4],
    eventCount: totals[5],
    screenPageViews: totals[6],
  }, { fetchedAt: res.fetchedAt, latencyMs: res.latencyMs });
}

const FUNNEL_EVENTS = [
  "page_view",
  "tool_view",
  "processing_started",
  "processing_completed",
  "tool_used",
  "download_completed",
];

const OCR_EVENTS = [
  "ocr_processing_started",
  "ocr_processing_completed",
  "ocr_language_selected",
];

export async function ga4EventCounts(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string,
  events: string[],
) {
  const res = await runGa4Report(accessToken, propertyId, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: events },
      },
    },
    limit: 50,
  });
  if (res.state !== "DATA_AVAILABLE") return res;
  const rows = parseReportRows(res.data);
  if (rows.length === 0) return empty("GA4 returned no matching events for this range.");
  const counts: Record<string, number> = {};
  for (const event of events) counts[event] = 0;
  for (const row of rows) counts[row.keys[0]] = row.values[0] ?? 0;
  return ok(counts, { fetchedAt: res.fetchedAt, latencyMs: res.latencyMs });
}

export async function ga4DimensionReport(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  metrics: string[],
  limit = 50,
) {
  const res = await runGa4Report(accessToken, propertyId, {
    dateRanges: [{ startDate, endDate }],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    limit,
    metricAggregations: ["TOTAL"],
  });
  if (res.state !== "DATA_AVAILABLE") return res;
  const rows = parseReportRows(res.data);
  if (rows.length === 0) return empty("GA4 returned no rows for this breakdown.");
  return ok({ dimensions, metrics, rows }, { fetchedAt: res.fetchedAt, latencyMs: res.latencyMs });
}

export async function ga4AdminMetadata(accessToken: string, propertyId: string) {
  const [property, retention, keyEvents, customDimensions, streams] = await Promise.all([
    providerFetch(`${ADMIN}/properties/${propertyId}`, { accessToken }),
    providerFetch(`${ADMIN}/properties/${propertyId}/dataRetentionSettings`, { accessToken }),
    providerFetch(`${ADMIN}/properties/${propertyId}/keyEvents`, { accessToken }),
    providerFetch(`${ADMIN}/properties/${propertyId}/customDimensions`, { accessToken }),
    providerFetch(`${ADMIN}/properties/${propertyId}/dataStreams`, { accessToken }),
  ]);
  if (property.state !== "DATA_AVAILABLE") return property;
  const p = (property.data ?? {}) as {
    displayName?: string;
    timeZone?: string;
    currencyCode?: string;
    industryCategory?: string;
  };
  return ok(
    {
      displayName: p.displayName ?? null,
      timeZone: p.timeZone ?? null,
      currencyCode: p.currencyCode ?? null,
      industryCategory: p.industryCategory ?? null,
      dataRetention: retention.state === "DATA_AVAILABLE" ? retention.data : { state: retention.state, message: retention.message },
      keyEvents: keyEvents.state === "DATA_AVAILABLE" ? keyEvents.data : { state: keyEvents.state, message: keyEvents.message },
      customDimensions:
        customDimensions.state === "DATA_AVAILABLE"
          ? customDimensions.data
          : { state: customDimensions.state, message: customDimensions.message },
      dataStreams: streams.state === "DATA_AVAILABLE" ? streams.data : { state: streams.state, message: streams.message },
    },
    { fetchedAt: property.fetchedAt, latencyMs: property.latencyMs },
  );
}

export function ga4FunnelRates(funnel: ApiResult<Record<string, number>>) {
  if (funnel.state !== "DATA_AVAILABLE" || !funnel.data) {
    return fail<Record<string, number | string>>("DATA_UNAVAILABLE", funnel.message || "Funnel counts are not available.");
  }
  const started = funnel.data.processing_started;
  const completed = funnel.data.processing_completed;
  const downloads = funnel.data.download_completed;
  const views = funnel.data.tool_view;
  if (typeof started !== "number" || typeof completed !== "number") {
    return fail<Record<string, number | string>>("DATA_UNAVAILABLE", "Completion rate needs processing_started and processing_completed.");
  }
  if (started <= 0) {
    return fail<Record<string, number | string>>("DATA_UNAVAILABLE", "Completion rate denominator is missing or zero.");
  }
  const rates: Record<string, number | string> = {
    completionRate: completed / started,
  };
  if (typeof downloads === "number" && started > 0) rates.downloadRate = downloads / started;
  if (typeof views === "number") rates.toolViews = views;
  rates.processingStarted = started;
  rates.processingCompleted = completed;
  return ok(rates, { fetchedAt: funnel.fetchedAt, latencyMs: funnel.latencyMs });
}

export { FUNNEL_EVENTS, OCR_EVENTS };
