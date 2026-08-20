export const CONSENT_STORAGE_KEY = "zancta.consent.v1";

export type ConsentState = {
  analytics: boolean;
  decided: boolean;
};

export function parseConsent(raw: string | null): ConsentState {
  if (!raw) return { analytics: false, decided: false };
  try {
    const parsed = JSON.parse(raw) as { analytics?: unknown };
    return { analytics: parsed.analytics === true, decided: true };
  } catch {
    return { analytics: false, decided: false };
  }
}

export function serializeConsent(analytics: boolean): string {
  return JSON.stringify({ analytics, v: 1, at: Date.now() });
}

export function isGaMeasurementId(id: string | undefined): boolean {
  return Boolean(id && /^G-[A-Z0-9]+$/.test(id.trim()));
}

export const ALLOWED_ANALYTICS_EVENTS = ["tool_used", "signup", "subscription_start", "subscription_cancel"] as const;
export type AnalyticsEvent = (typeof ALLOWED_ANALYTICS_EVENTS)[number];

export function sanitizeAnalyticsParams(event: AnalyticsEvent, params?: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  if (event === "tool_used" && typeof params?.tool === "string" && /^[a-z0-9-]{1,64}$/.test(params.tool)) {
    out.tool = params.tool;
  }
  return out;
}
