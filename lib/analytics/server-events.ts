/**
 * Server-side product event recording.
 *
 * Records funnel events to the AuditEvent table for internal dashboards.
 * These are authoritative server-side events that do not require client consent
 * (they record product state changes, not tracking behavior).
 *
 * Never records: file contents, filenames, OCR text, passwords, tokens.
 */

import { auditEvent } from "@/lib/audit";
import { type AnalyticsEventName, isValidEventName, EVENT_CONTRACT_VERSION } from "@/lib/analytics/events";

export async function recordProductEvent(opts: {
  event: AnalyticsEventName;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  if (!isValidEventName(opts.event)) return;

  const safeMeta: Record<string, unknown> = {
    _v: EVENT_CONTRACT_VERSION,
    _src: "product_event",
  };

  if (opts.metadata) {
    for (const [key, value] of Object.entries(opts.metadata)) {
      if (typeof value === "string" && value.length <= 200) {
        safeMeta[key] = value;
      } else if (typeof value === "number" && Number.isFinite(value)) {
        safeMeta[key] = value;
      } else if (typeof value === "boolean") {
        safeMeta[key] = value;
      }
    }
  }

  await auditEvent({
    userId: opts.userId ?? null,
    action: `analytics.${opts.event}`,
    metadata: JSON.stringify(safeMeta),
    ip: opts.ip ?? null,
    userAgent: opts.userAgent ?? null,
  });
}
