/**
 * Authoritative Free vs Premium capability matrix.
 * Only capabilities that actually exist in the current product may appear here.
 * UI copy must derive from this file — never invent limits, ads, or tools.
 */

export const PREMIUM_CONTRACT = {
  sameLocalToolsAsFree: true,
  sameFileAndPageLimitsAsFree: true,
  higherLimitsImplemented: false,
  localOcrPowerImplemented: true,
  adsShipped: false,
  reservedAdFreeWhenAdsLaunch: true,
  checkoutProviderName: "Dodo Payments",
  monthlyDisplayINR: "₹199 / month",
  annualDisplayINR: "₹999 / year",
  annualVsMonthlySaving: "₹1,389 per year versus 12 × ₹199",
} as const;

export const FREE_BENEFITS = [
  "All implemented local tools",
  "English image OCR",
  "No sign-up required",
  "Processing stays in the browser after the tool loads",
  "No watermark, no upload",
] as const;

export const PREMIUM_BENEFITS = [
  "Everything in Free",
  "Local OCR Power: Hindi, Bengali, Tamil, Spanish, French, and German language packs",
  "Scanned PDF OCR in the browser, up to 20 pages",
  "Reserved ad-free experience when ads are introduced",
] as const;

export function premiumLimitHint(maxFiles: number): string {
  return `Select up to ${maxFiles} files.`;
}
