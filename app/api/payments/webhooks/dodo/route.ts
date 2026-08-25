import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { processVerifiedDodoEvent } from "@/lib/payments/process-dodo-event";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";
import { previewMutationsBlocked, PREVIEW_ISOLATED_CODE, PREVIEW_ISOLATED_MESSAGE } from "@/lib/preview-isolation";

const GENERIC_SIGNATURE_ERROR = "Invalid signature";

function webhookVerifyFailureCategory(error: string | undefined): string {
  const e = error || "";
  if (e.includes("Missing webhook headers")) return "missing_headers";
  if (e.includes("Invalid webhook-timestamp")) return "invalid_timestamp";
  if (e.includes("outside 5min")) return "timestamp_window";
  if (e.startsWith("Missing env") || e.includes("WEBHOOK_SECRET")) return "config";
  if (e.includes("Invalid JSON")) return "invalid_json";
  if (e.includes("Missing webhook-id")) return "missing_webhook_id";
  if (e.includes("Invalid webhook signature")) return "invalid_signature";
  return "verification_failed";
}

export async function POST(req: NextRequest) {
  if (previewMutationsBlocked()) {
    return NextResponse.json({ error: PREVIEW_ISOLATED_MESSAGE, code: PREVIEW_ISOLATED_CODE }, { status: 503 });
  }

  const rawBody = await req.text();

  const headers: Record<string, string | undefined> = {};
  for (const [k, v] of req.headers.entries()) headers[k.toLowerCase()] = v;
  for (const k of ["webhook-id", "webhook-timestamp", "webhook-signature"]) {
    const v = req.headers.get(k) || req.headers.get(k.replace(/(^|-)\w/g, (s) => s.toUpperCase()));
    if (v) headers[k] = v;
  }

  const provider = getPaymentProvider("dodo");
  const verified = await provider.verifyWebhook({ rawBody, headers });
  if (!verified.ok) {
    const ip = getClientIp(req.headers);
    const rl = await rateLimitAsync(`webhook-fail:${ip}`, 60, 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    console.error("[webhook:dodo] signature failed", webhookVerifyFailureCategory(verified.error), {
      hasWebhookId: Boolean(headers["webhook-id"]),
      hasTimestamp: Boolean(headers["webhook-timestamp"]),
      hasSignature: Boolean(headers["webhook-signature"]),
    });
    return NextResponse.json({ error: GENERIC_SIGNATURE_ERROR }, { status: 401 });
  }

  const result = await processVerifiedDodoEvent({
    webhookId: verified.providerEventId,
    eventType: verified.eventType,
    timestamp: verified.timestamp,
    payload: verified.payload,
    rawBody,
  });

  if (!result.ok) {
    console.error("[webhook:dodo] processing failed", verified.eventType, result.error);
    const status = result.error === "in_progress" ? 503 : 500;
    return NextResponse.json({ error: "Processing failed" }, { status });
  }
  return NextResponse.json({
    ok: true,
    duplicate: !!result.duplicate,
    noUser: !!result.noUser,
    stale: !!result.stale,
  });
}
