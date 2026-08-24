import { empty, ok, type ApiResult, type GscOverview, type GscRow } from "../types";
import { providerFetch } from "../http";

const GSC = "https://www.googleapis.com/webmasters/v3";
const INSPECT = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const CANONICAL_HOST = "zancta.tech";

export function pickZanctaProperty(siteUrls: string[]): string | null {
  const exactDomain = siteUrls.find((u) => u.toLowerCase() === `sc-domain:${CANONICAL_HOST}`);
  if (exactDomain) return exactDomain;
  const https = siteUrls.find((u) => u.toLowerCase() === `https://${CANONICAL_HOST}/`);
  if (https) return https;
  const any = siteUrls.find((u) => u.toLowerCase().includes(CANONICAL_HOST));
  return any ?? null;
}

function sitePath(siteUrl: string) {
  return `${GSC}/sites/${encodeURIComponent(siteUrl)}`;
}

export async function listGscSites(accessToken: string): Promise<ApiResult<string[]>> {
  const res = await providerFetch(`${GSC}/sites`, { accessToken });
  if (res.state !== "DATA_AVAILABLE" || !res.data) return res as ApiResult<string[]>;
  const entries = (res.data as { siteEntry?: Array<{ siteUrl?: string }> }).siteEntry ?? [];
  const urls = entries.map((e) => e.siteUrl).filter((u): u is string => Boolean(u));
  if (urls.length === 0) return empty("No Search Console properties are visible to this Google account.");
  return ok(urls, { fetchedAt: res.fetchedAt, latencyMs: res.latencyMs });
}

export async function querySearchAnalytics(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  rowLimit = 50,
): Promise<ApiResult<GscOverview>> {
  const res = await providerFetch(`${sitePath(siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, startRow: 0 }),
  });
  if (res.state !== "DATA_AVAILABLE") return res as ApiResult<GscOverview>;
  const rowsRaw = (res.data as { rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }> }).rows ?? [];
  if (dimensions.length > 0 && rowsRaw.length === 0) {
    return empty("Search Console returned no rows for this range.");
  }
  const rows: GscRow[] = rowsRaw.map((r) => ({
    keys: r.keys ?? [],
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
  const totals = rowsRaw.length
    ? rows.reduce(
        (acc, r) => ({
          clicks: acc.clicks + r.clicks,
          impressions: acc.impressions + r.impressions,
          ctr: 0,
          position: 0,
        }),
        { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      )
    : { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  if (dimensions.length === 0) {
    const only = rows[0];
    if (!only) return empty("Search Console returned no totals for this range.");
    return ok({ ...only, rows: [only] }, { fetchedAt: res.fetchedAt, latencyMs: res.latencyMs });
  }
  const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
  const position =
    rows.reduce((acc, r) => acc + r.position * r.impressions, 0) / Math.max(1, totals.impressions);
  return ok({ ...totals, ctr, position, rows }, { fetchedAt: res.fetchedAt, latencyMs: res.latencyMs });
}

export async function listGscSitemaps(accessToken: string, siteUrl: string) {
  return providerFetch(`${sitePath(siteUrl)}/sitemaps`, { accessToken });
}

export async function submitGscSitemap(accessToken: string, siteUrl: string, feedpath: string) {
  return providerFetch(`${sitePath(siteUrl)}/sitemaps/${encodeURIComponent(feedpath)}`, {
    method: "PUT",
    accessToken,
  });
}

export async function inspectGscUrl(accessToken: string, siteUrl: string, inspectionUrl: string) {
  return providerFetch(INSPECT, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: "en-US" }),
  });
}

export const INDEXING_API_NOTE =
  "Google's Indexing API is not supported for ordinary website URLs. Request indexing from Search Console URL Inspection. This dashboard will not fake that action.";
