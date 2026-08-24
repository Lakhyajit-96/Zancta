import {
  bingChildrenUrlInfo,
  bingCrawlIssues,
  bingCrawlSettings,
  bingCrawlStats,
  bingFeeds,
  bingLinkCounts,
  bingPageStats,
  bingQueryStats,
  bingRankTraffic,
  bingRelatedKeywords,
  bingUrlSubmissionQuota,
  bingUserSites,
  pickBingSite,
} from "./webmaster";
import { getPublicConnection, recordFailure, recordSuccess, updateConnectionSelection } from "../store";
import { getValidAccessToken } from "../tokens";

export async function loadBingDashboard() {
  const connection = await getPublicConnection("bing");
  const token = await getValidAccessToken("bing");
  if (token.state !== "DATA_AVAILABLE" || !token.data) {
    return { connection, token, sites: token, siteUrl: null as string | null };
  }
  const sites = await bingUserSites(token.data);
  const siteUrl = sites.data ? pickBingSite(sites.data) : connection.selectedProperty;
  if (siteUrl && siteUrl !== connection.selectedProperty) {
    await updateConnectionSelection("bing", { selectedProperty: siteUrl });
  }
  if (!siteUrl) {
    await recordFailure("bing", "PROPERTY_NOT_FOUND", "zancta.tech was not in the Bing site list.", "PERMISSION_DENIED");
    return { connection: await getPublicConnection("bing"), token, sites, siteUrl: null };
  }
  const [queries, pages, traffic, crawl, feeds, links, issues, crawlSettings, quota, explorer, keywords] = await Promise.all([
    bingQueryStats(token.data, siteUrl),
    bingPageStats(token.data, siteUrl),
    bingRankTraffic(token.data, siteUrl),
    bingCrawlStats(token.data, siteUrl),
    bingFeeds(token.data, siteUrl),
    bingLinkCounts(token.data, siteUrl),
    bingCrawlIssues(token.data, siteUrl),
    bingCrawlSettings(token.data, siteUrl),
    bingUrlSubmissionQuota(token.data, siteUrl),
    bingChildrenUrlInfo(token.data, siteUrl),
    bingRelatedKeywords(token.data, "pdf tools"),
  ]);
  const okish = [queries, pages, traffic].some((r) => r.state === "DATA_AVAILABLE" || r.state === "NO_DATA");
  if (okish) await recordSuccess("bing", queries.latencyMs);
  else await recordFailure("bing", queries.state, queries.message);
  return {
    connection: await getPublicConnection("bing"),
    token,
    sites,
    siteUrl,
    queries,
    pages,
    traffic,
    crawl,
    feeds,
    links,
    issues,
    crawlSettings,
    quota,
    explorer,
    keywords,
  };
}
