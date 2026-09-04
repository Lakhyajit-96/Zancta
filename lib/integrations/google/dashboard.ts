import { resolveDateRange } from "../date-range";
import { inspectGscUrl, listGscSitemaps, listGscSites, pickZanctaProperty, querySearchAnalytics } from "./gsc";
import {
  discoverGa4Property,
  FUNNEL_EVENTS,
  ga4AdminMetadata,
  ga4DimensionReport,
  ga4EventCounts,
  ga4FunnelRates,
  ga4Overview,
  OCR_EVENTS,
  runGa4Realtime,
} from "./ga4";
import {
  getPublicConnection,
  latestSnapshot,
  recordFailure,
  recordSuccess,
  saveSnapshot,
  updateConnectionSelection,
} from "../store";
import { getValidAccessToken } from "../tokens";
import { fail, type ApiResult } from "../types";

const IMPORTANT_URLS = [
  "https://zancta.tech/",
  "https://zancta.tech/tools",
  "https://zancta.tech/tools/merge-pdf",
  "https://zancta.tech/guides/local-processing",
];

export async function loadGoogleDashboard(range: string | null, start?: string | null, end?: string | null) {
  const dates = resolveDateRange(range, start, end);
  const connection = await getPublicConnection("google");
  const token = await getValidAccessToken("google");
  if (token.state !== "DATA_AVAILABLE" || !token.data) {
    return { connection, dates, token, sites: token, property: null as string | null };
  }

  const cached = await latestSnapshot<Record<string, unknown>>("google", "dashboard-v2", dates.key);
  if (cached?.payload && cached.state === "DATA_AVAILABLE") {
    return { connection, dates, token, property: connection.selectedProperty, fromCache: true, ...cached.payload };
  }

  const access = token.data;
  const sites = await listGscSites(access);
  const property = sites.data ? pickZanctaProperty(sites.data) : connection.selectedProperty;
  if (property && property !== connection.selectedProperty) {
    await updateConnectionSelection("google", { selectedProperty: property });
  }

  if (!property) {
    await recordFailure(
      "google",
      "PROPERTY_NOT_FOUND",
      "zancta.tech was not in the Search Console site list.",
      "PERMISSION_DENIED",
    );
    return { connection: await getPublicConnection("google"), dates, token, sites, property: null };
  }

  const [totals, queries, pages, countries, devices, appearance, daily, sitemaps, ga4prop] = await Promise.all([
    querySearchAnalytics(access, property, dates.startDate, dates.endDate, []),
    querySearchAnalytics(access, property, dates.startDate, dates.endDate, ["query"]),
    querySearchAnalytics(access, property, dates.startDate, dates.endDate, ["page"]),
    querySearchAnalytics(access, property, dates.startDate, dates.endDate, ["country"]),
    querySearchAnalytics(access, property, dates.startDate, dates.endDate, ["device"]),
    querySearchAnalytics(access, property, dates.startDate, dates.endDate, ["searchAppearance"]),
    querySearchAnalytics(access, property, dates.startDate, dates.endDate, ["date"], 250),
    listGscSitemaps(access, property),
    discoverGa4Property(access),
  ]);

  if (ga4prop.data) {
    await updateConnectionSelection("google", {
      selectedProperty: property,
      ga4PropertyId: ga4prop.data.propertyId,
      ga4MeasurementId: ga4prop.data.measurementId,
    });
  }

  const ga4PropertyId = ga4prop.data?.propertyId ?? connection.ga4PropertyId;
  const ga4 = ga4PropertyId
    ? await Promise.all([
        ga4Overview(access, ga4PropertyId, dates.startDate, dates.endDate),
        ga4EventCounts(access, ga4PropertyId, dates.startDate, dates.endDate, FUNNEL_EVENTS),
        ga4EventCounts(access, ga4PropertyId, dates.startDate, dates.endDate, OCR_EVENTS),
        runGa4Realtime(access, ga4PropertyId),
        ga4DimensionReport(access, ga4PropertyId, dates.startDate, dates.endDate, ["sessionSource", "sessionMedium"], ["activeUsers", "sessions"]),
        ga4DimensionReport(access, ga4PropertyId, dates.startDate, dates.endDate, ["sessionCampaignName"], ["activeUsers", "sessions"]),
        ga4DimensionReport(access, ga4PropertyId, dates.startDate, dates.endDate, ["landingPage"], ["sessions", "activeUsers"]),
        ga4DimensionReport(access, ga4PropertyId, dates.startDate, dates.endDate, ["pagePath"], ["screenPageViews", "activeUsers"]),
        ga4DimensionReport(access, ga4PropertyId, dates.startDate, dates.endDate, ["country"], ["activeUsers", "sessions"]),
        ga4DimensionReport(access, ga4PropertyId, dates.startDate, dates.endDate, ["deviceCategory"], ["activeUsers", "sessions"]),
        ga4DimensionReport(access, ga4PropertyId, dates.startDate, dates.endDate, ["browser"], ["activeUsers", "sessions"]),
        ga4DimensionReport(access, ga4PropertyId, dates.startDate, dates.endDate, ["operatingSystem"], ["activeUsers", "sessions"]),
        ga4DimensionReport(access, ga4PropertyId, dates.startDate, dates.endDate, ["date"], ["activeUsers", "sessions", "eventCount"], 90),
        ga4AdminMetadata(access, ga4PropertyId),
      ])
    : null;

  const latency = [sites, totals].map((r) => r.latencyMs ?? 0).reduce((a, b) => a + b, 0);
  if (totals.state === "DATA_AVAILABLE" || totals.state === "NO_DATA") await recordSuccess("google", latency);
  else await recordFailure("google", totals.state, totals.message);

  const missing = fail("PROPERTY_NOT_FOUND", "GA4 property was not discovered.");
  const funnel = ga4?.[1] ?? missing;
  const payload = {
    sites,
    totals,
    queries,
    pages,
    countries,
    devices,
    appearance,
    daily,
    sitemaps,
    ga4prop,
    ga4Overview: ga4?.[0] ?? missing,
    funnel,
    ocr: ga4?.[2] ?? missing,
    realtime: ga4?.[3] ?? missing,
    acquisition: ga4?.[4] ?? missing,
    campaigns: ga4?.[5] ?? missing,
    landingPages: ga4?.[6] ?? missing,
    topPages: ga4?.[7] ?? missing,
    ga4Countries: ga4?.[8] ?? missing,
    ga4Devices: ga4?.[9] ?? missing,
    browsers: ga4?.[10] ?? missing,
    operatingSystems: ga4?.[11] ?? missing,
    ga4Daily: ga4?.[12] ?? missing,
    ga4Admin: ga4?.[13] ?? missing,
    funnelRates: ga4FunnelRates(funnel as ApiResult<Record<string, number>>),
    importantUrls: IMPORTANT_URLS,
  };

  await saveSnapshot("google", "dashboard-v2", dates.key, totals.state, payload).catch(() => {});

  return {
    connection: await getPublicConnection("google"),
    dates,
    token,
    property,
    fromCache: false,
    ...payload,
  };
}

export async function runUrlInspection(url: string): Promise<ApiResult<unknown>> {
  const token = await getValidAccessToken("google");
  if (token.state !== "DATA_AVAILABLE" || !token.data) return token;
  const connection = await getPublicConnection("google");
  let siteUrl = connection.selectedProperty;
  if (!siteUrl) {
    const sites = await listGscSites(token.data);
    siteUrl = sites.data ? pickZanctaProperty(sites.data) : null;
  }
  if (!siteUrl) return fail("PROPERTY_NOT_FOUND", "Search Console property for zancta.tech was not found.");
  return inspectGscUrl(token.data, siteUrl, url);
}
