/**
 * Authoritative Free vs Premium capability matrix.
 * Only capabilities that actually exist in the current product may appear here.
 * UI copy must derive from this file — never invent limits, ads, or tools.
 */

export const PREMIUM_CONTRACT = {
  sameLocalToolsAsFree: true,
  sameFileAndPageLimitsAsFree: true,
  higherLimitsImplemented: false,
  adsShipped: false,
  reservedAdFreeWhenAdsLaunch: true,
  checkoutProviderName: "Dodo Payments",
  monthlyDisplayINR: "₹199 / month",
  annualDisplayINR: "₹999 / year",
} as const;

export const FREE_BENEFITS = [
  "All implemented local tools",
  "No sign-up required",
  "Processing stays in the browser after the tool loads",
  "No watermark, no upload",
] as const;

export const PREMIUM_BENEFITS = [
  "Everything in Free — same tools, same local processing, same limits",
  "Reserved ad-free experience when ads are introduced",
  "Supports ongoing product development",
] as const;

export function premiumLimitHint(maxFiles: number): string {
  return `Select up to ${maxFiles} files.`;
}
