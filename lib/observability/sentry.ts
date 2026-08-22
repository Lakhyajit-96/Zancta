import { logError, safeErrorMessage, type ErrorCategory, type ErrorSeverity } from "@/lib/observability/errors";

function redactEvent<T extends Record<string, unknown>>(event: T): T {
  const clone = { ...event };
  const blocked = /file|filename|ocr|text|password|token|secret|email|card|pdf|content|ip/i;
  for (const key of Object.keys(clone)) {
    if (blocked.test(key)) delete clone[key];
  }
  return clone;
}

export async function reportException(opts: {
  error: unknown;
  category: ErrorCategory;
  severity?: ErrorSeverity;
  route?: string;
  tool?: string;
  requestId?: string;
}): Promise<void> {
  logError({
    category: opts.category,
    severity: opts.severity ?? "error",
    message: safeErrorMessage(opts.error),
    route: opts.route,
    tool: opts.tool,
    requestId: opts.requestId,
    error: opts.error,
  });

  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    const Sentry = await import(/* webpackIgnore: true */ "@sentry/nextjs");
    Sentry.captureException(opts.error, {
      tags: { category: opts.category, route: opts.route || "", tool: opts.tool || "" },
      extra: redactEvent({
        category: opts.category,
        route: opts.route,
        tool: opts.tool,
        requestId: opts.requestId,
      }),
    });
  } catch {
    // SDK optional until installed and DSN configured.
  }
}

export function sentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}
