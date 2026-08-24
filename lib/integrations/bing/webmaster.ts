import { empty, fail, ok, type ApiResult } from "../types";
import { providerFetch } from "../http";

const JSON_ROOT = "https://www.bing.com/webmaster/api.svc/json";
const CANONICAL = "https://zancta.tech/";

export function pickBingSite(urls: string[]): string | null {
  const exact = urls.find((u) => u.replace(/\/$/, "").toLowerCase() === "https://zancta.tech");
  if (exact) return exact.endsWith("/") ? exact : `${exact}/`;
  const any = urls.find((u) => u.toLowerCase().includes("zancta.tech"));
  return any ?? null;
}

function unwrap(data: unknown): unknown {
  if (data && typeof data === "object" && "d" in data) return (data as { d: unknown }).d;
  return data;
}

function asUrlList(data: unknown): string[] {
  const inner = unwrap(data);
  if (Array.isArray(inner)) {
    return inner
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const rec = item as Record<string, unknown>;
          return String(rec.Url || rec.url || rec.SiteUrl || rec.siteUrl || "");
        }
        return "";
      })
      .filter(Boolean);
  }
  if (inner && typeof inner === "object" && Array.isArray((inner as { results?: unknown[] }).results)) {
    return asUrlList((inner as { results: unknown[] }).results);
  }
  return [];
}

export async function bingJson(
  accessToken: string,
  method: string,
  query: Record<string, string> = {},
  init: RequestInit = {},
): Promise<ApiResult<unknown>> {
  const params = new URLSearchParams(query);
  const url = `${JSON_ROOT}/${method}${params.toString() ? `?${params}` : ""}`;
  return providerFetch(url, { ...init, accessToken });
}

export async function bingUserSites(accessToken: string): Promise<ApiResult<string[]>> {
  const res = await bingJson(accessToken, "GetUserSites");
  if (res.state !== "DATA_AVAILABLE") return res as ApiResult<string[]>;
  const urls = asUrlList(res.data);
  if (urls.length === 0) return empty("No Bing Webmaster sites are visible to this Microsoft account.");
  return ok(urls, { fetchedAt: res.fetchedAt, latencyMs: res.latencyMs });
}

export async function bingQueryStats(accessToken: string, siteUrl: string) {
  return bingJson(accessToken, "GetQueryStats", { siteUrl: siteUrl || CANONICAL });
}

export async function bingPageStats(accessToken: string, siteUrl: string) {
  return bingJson(accessToken, "GetPageStats", { siteUrl });
}

export async function bingRankTraffic(accessToken: string, siteUrl: string) {
  return bingJson(accessToken, "GetRankAndTrafficStats", { siteUrl });
}

export async function bingCrawlStats(accessToken: string, siteUrl: string) {
  return bingJson(accessToken, "GetCrawlStats", { siteUrl });
}

export async function bingFeeds(accessToken: string, siteUrl: string) {
  return bingJson(accessToken, "GetFeeds", { siteUrl });
}

export async function bingSubmitUrl(accessToken: string, siteUrl: string, url: string) {
  if (!url.startsWith("https://zancta.tech/")) {
    return fail("DATA_UNAVAILABLE", "Only https://zancta.tech URLs can be submitted.");
  }
  return bingJson(accessToken, "SubmitUrl", {}, { method: "POST", body: JSON.stringify({ siteUrl, url }) });
}

export async function bingUrlInfo(accessToken: string, siteUrl: string, url: string) {
  return bingJson(accessToken, "GetUrlInfo", { siteUrl, url });
}

export async function bingChildrenUrlInfo(accessToken: string, siteUrl: string) {
  return bingJson(accessToken, "GetChildrenUrlInfo", { siteUrl, url: siteUrl });
}

export async function bingCrawlIssues(accessToken: string, siteUrl: string) {
  return bingJson(accessToken, "GetCrawlIssues", { siteUrl });
}

export async function bingCrawlSettings(accessToken: string, siteUrl: string) {
  return bingJson(accessToken, "GetCrawlSettings", { siteUrl });
}

export async function bingUrlSubmissionQuota(accessToken: string, siteUrl: string) {
  return bingJson(accessToken, "GetUrlSubmissionQuota", { siteUrl });
}

export async function bingRelatedKeywords(accessToken: string, query: string) {
  return bingJson(accessToken, "GetRelatedKeywords", { q: query, country: "in", language: "en-IN" });
}

export async function bingKeywordStats(accessToken: string, siteUrl: string, query: string) {
  return bingJson(accessToken, "GetKeywordStats", { siteUrl, q: query });
}

export async function bingLinkCounts(accessToken: string, siteUrl: string) {
  return bingJson(accessToken, "GetLinkCounts", { siteUrl });
}

export const BING_UNSUPPORTED = {
  aiPerformance: "Bing Webmaster JSON API does not document an AI performance report. Use the Bing Webmaster UI if that report exists for the account.",
  requestIndexingGoogleStyle: "Bing URL submission is SubmitUrl for a specific URL, not a Search Console-style request-indexing product.",
  soap: "SOAP and POX endpoints are not used. This integration calls JSON over HTTPS only.",
  indexNow: "IndexNow status is not exposed by the Bing Webmaster JSON API. Keys are not rotated and unchanged URLs are not resubmitted from this dashboard.",
  siteScan: "A Bing site-scan/recommendations dump is not documented on the JSON API. Owner action is in Bing Webmaster Tools.",
} as const;
