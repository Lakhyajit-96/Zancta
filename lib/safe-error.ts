import { NextResponse } from "next/server";

// TEMP-DIAG-PHASE9C6: remove after diagnosis ─ imports used only by the diag block below
import prisma from "@/lib/db";
import { Resend } from "resend";
// TEMP-DIAG-PHASE9C6: end diag imports

/** Redact credentials embedded in URLs (e.g. Prisma/pg DSNs like postgres://user:pass@host). */
function sanitizeMessage(text: string): string {
  return text.replace(
    /\b(\w[\w+]*):\/\/[^@\s]+@([^\s]+)/g,
    (_m, scheme: string, host: string) => `${scheme}://[REDACTED]@${host}`
  );
}

// TEMP-DIAG-PHASE9C6: remove after diagnosis
/**
 * Private diagnostic relay: Vercel runtime logs are inaccessible, so ship the
 * sanitized error signature to two independent private channels:
 *   a) AuditEvent row (works when the DB connection itself is fine),
 *   b) self-addressed Resend email (works even when the DB is unreachable).
 * Never includes secrets/tokens/PII; DSN credentials are redacted (host kept).
 * Must never throw and must not delay the client response beyond ~4s.
 */
function diagRelay(route: string, stage: string, name: string, message: string): Promise<void> {
  const payload = `route=${route} stage=${stage} name=${name} msg=${message}`.slice(0, 1500);
  const work = (async () => {
    // Channel A: persist to AuditEvent (action "diag.error")
    try {
      await prisma.auditEvent.create({
        data: { action: "diag.error", metadata: payload },
      });
    } catch { /* diag channel must never surface errors */ }
    // Channel B: self-addressed email via Resend (stays within verified domain)
    try {
      const key = process.env.RESEND_API_KEY;
      const from = process.env.EMAIL_FROM;
      if (key && from) {
        const resend = new Resend(key);
        await resend.emails.send({
          from,
          to: from,
          subject: `toolsite diag ${route}`,
          html: `<pre>${payload.replace(/</g, "&lt;")}</pre>`,
        });
      }
    } catch { /* diag channel must never surface errors */ }
  })().catch(() => {});
  // Hard cap: never hold the serverless response longer than ~4s. Awaited (not
  // fire-and-forget) because Vercel may freeze the function once the response
  // is returned, which would kill un-awaited pending work.
  return Promise.race([work, new Promise<void>((r) => setTimeout(r, 4000))]).then(() => undefined);
}
// TEMP-DIAG-PHASE9C6: end diag helper

/**
 * Log a sanitized failure for server diagnostics and return a generic 500.
 * Never echoes raw error details, secrets, tokens, or PII to the client.
 */
export async function safeServerError(route: string, stage: string, err: unknown): Promise<NextResponse> {
  const name = err instanceof Error ? err.name : typeof err;
  const rawMessage = err instanceof Error ? err.message : String(err);
  const safeMessage = sanitizeMessage(rawMessage);
  console.error(
    `[${route}] failed at stage="${stage}" name=${name} message="${safeMessage}"`
  );
  // TEMP-DIAG-PHASE9C6: remove after diagnosis
  try {
    await diagRelay(route, stage, name, safeMessage);
  } catch { /* must never affect the response */ }
  // TEMP-DIAG-PHASE9C6: end diag call
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
