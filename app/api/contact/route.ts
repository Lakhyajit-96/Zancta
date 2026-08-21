import { NextRequest, NextResponse } from "next/server";
import { getEmailAdapter } from "@/lib/email";
import { CONTACT_MAX_BODY_BYTES, isAllowedContactOrigin } from "@/lib/contact/origin";
import {
  CONTACT_GENERIC_ERROR,
  CONTACT_RATE_LIMIT_ERROR,
  CONTACT_VALIDATION_ERROR,
  containsHeaderInjection,
  contactEnquirySchema,
  contactEnvironment,
  createContactReference,
  type ContactEnquiryPayload,
} from "@/lib/contact/schema";
import { contactTopicById, mailboxForTopic } from "@/lib/contact/topics";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  if (!isAllowedContactOrigin(req.headers)) {
    return jsonError(403, CONTACT_GENERIC_ERROR);
  }

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > CONTACT_MAX_BODY_BYTES) {
    return jsonError(413, CONTACT_VALIDATION_ERROR);
  }

  const ip = getClientIp(req.headers);
  const ipLimit = await rateLimitAsync(`contact-ip:${ip}`, 5, 15 * 60 * 1000);
  if (!ipLimit.ok) {
    return jsonError(429, CONTACT_RATE_LIMIT_ERROR);
  }

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > CONTACT_MAX_BODY_BYTES) {
      return jsonError(413, CONTACT_VALIDATION_ERROR);
    }
    body = JSON.parse(raw) as unknown;
  } catch {
    return jsonError(400, CONTACT_VALIDATION_ERROR);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError(400, CONTACT_VALIDATION_ERROR);
  }

  const parsed = contactEnquirySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, CONTACT_VALIDATION_ERROR);
  }

  const input = parsed.data;
  const accountEmailRaw = (input.accountEmail || "").trim().toLowerCase();
  if (accountEmailRaw) {
    const accountEmail = contactEnquirySchema.shape.email.safeParse(accountEmailRaw);
    if (!accountEmail.success || containsHeaderInjection(accountEmailRaw)) {
      return jsonError(400, CONTACT_VALIDATION_ERROR);
    }
  }
  if (input.website && input.website.trim()) {
    return NextResponse.json({ ok: true, reference: createContactReference() });
  }

  const emailLimit = await rateLimitAsync(`contact-email:${input.email}`, 3, 60 * 60 * 1000);
  if (!emailLimit.ok) {
    return jsonError(429, CONTACT_RATE_LIMIT_ERROR);
  }

  const topic = contactTopicById(input.topic);
  if (!topic) {
    return jsonError(400, CONTACT_VALIDATION_ERROR);
  }

  const destination = mailboxForTopic(topic.id);
  const payload: ContactEnquiryPayload = {
    reference: createContactReference(),
    topicId: topic.id,
    topicLabel: topic.label,
    name: input.name,
    email: input.email,
    accountEmail: accountEmailRaw || undefined,
    subject: input.subject,
    message: input.message,
    receivedAt: new Date().toISOString(),
    environment: contactEnvironment(),
    destination,
  };

  try {
    const emailer = getEmailAdapter();
    await emailer.sendContactNotification(payload);
    try {
      await emailer.sendContactAcknowledgement(payload);
    } catch (error) {
      console.error(
        "[contact] acknowledgement failed",
        payload.reference,
        error instanceof Error ? error.message : String(error)
      );
    }
  } catch (error) {
    console.error(
      "[contact] notification failed",
      payload.reference,
      error instanceof Error ? error.message : String(error)
    );
    return jsonError(500, CONTACT_GENERIC_ERROR);
  }

  return NextResponse.json({ ok: true, reference: payload.reference });
}
