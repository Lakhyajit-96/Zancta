import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { processVerifiedDodoEvent } from "@/lib/payments/process-dodo-event";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
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
    console.error("[webhook:dodo] signature failed", verified.error);
    return NextResponse.json({ error: verified.error || "Invalid signature" }, { status: 401 });
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
