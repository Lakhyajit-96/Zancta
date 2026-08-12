import { NextResponse } from "next/server";

/** Redact credentials embedded in URLs (e.g. Prisma/pg DSNs like postgres://user:pass@host). */
function sanitizeMessage(text: string): string {
  return text.replace(
    /\b(\w[\w+]*):\/\/[^@\s]+@([^\s]+)/g,
    (_m, scheme: string, host: string) => `${scheme}://[REDACTED]@${host}`
  );
}

/**
 * Log a sanitized failure for server diagnostics and return a generic 500.
 * Never echoes raw error details, secrets, tokens, or PII to the client.
 */
export function safeServerError(route: string, stage: string, err: unknown): NextResponse {
  const name = err instanceof Error ? err.name : typeof err;
  const rawMessage = err instanceof Error ? err.message : String(err);
  console.error(
    `[${route}] failed at stage="${stage}" name=${name} message="${sanitizeMessage(rawMessage)}"`
  );
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
