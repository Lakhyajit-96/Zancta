import { NextResponse } from "next/server";

/** Redact credentials embedded in URLs (e.g. Prisma/pg DSNs like postgres://user:pass@host). */
function sanitizeMessage(text: string): string {
  return text.replace(
    /\b(\w[\w+]*):\/\/[^@\s]+@([^\s]+)/g,
    (_m, scheme: string, host: string) => `${scheme}://[REDACTED]@${host}`
  );
}

// TEMP-DIAG-PHASE9C6: remove after diagnosis
/**
 * Private diagnostic relay (round 3): Vercel runtime logs are inaccessible and
 * the DB + email channels proved unusable (DB write fails from the function;
 * Resend sender domain unverified), so the sanitized error signature is SET
 * into Upstash Redis via its REST API — a channel that survives both failures.
 * Never includes secrets/tokens/PII; DSN credentials are redacted (host kept).
 * Must never throw and must not delay the client response beyond ~4s.
 */
function diagRelay(route: string, stage: string, name: string, message: string): Promise<void> {
  const work = (async () => {
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!url || !token) return;
      const value = JSON.stringify({ route, stage, name, message, ts: new Date().toISOString() }).slice(0, 1500);
      await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(["SET", `diag:phase9c6:${route.replace(/\//g, "-")}`, value, "EX", "3600"]),
      });
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
