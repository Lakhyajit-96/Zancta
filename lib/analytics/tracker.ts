"use client";

/**
 * Client-side analytics tracker. Wraps GA4 gtag calls with:
 * - Consent gating (only fires after user opts in)
 * - Type-safe event names from the event contract
 * - Param sanitization (no file data, no PII)
 *
 * Import this instead of calling gtag directly.
 */

import {
  type ClientAnalyticsEvent,
  CLIENT_ANALYTICS_EVENTS,
  sanitizeClientParams,
} from "@/lib/analytics/events";
import {
  CONSENT_STORAGE_KEY,
  isGaMeasurementId,
  parseConsent,
} from "@/lib/consent";

const CLIENT_EVENT_SET = new Set<string>(CLIENT_ANALYTICS_EVENTS);

function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY)).analytics;
}

function gaReady(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

/**
 * Fire a consent-gated, sanitized GA4 event.
 * No-ops silently when consent is not granted or GA is not loaded.
 */
export function trackEvent(
  event: ClientAnalyticsEvent,
  params?: Record<string, unknown>,
): void {
  if (!CLIENT_EVENT_SET.has(event)) return;
  if (!hasConsent()) return;
  if (!isGaMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)) return;
  if (!gaReady()) return;

  const safe = sanitizeClientParams(event, params);
  window.gtag?.("event", event, safe);
}

