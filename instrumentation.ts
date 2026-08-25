import { enforceProductionConfigOrThrow } from "@/lib/production-config";

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    try {
      const Sentry = await import(/* webpackIgnore: true */ "@sentry/nextjs");
      Sentry.init({
        dsn,
        sendDefaultPii: false,
        tracesSampleRate: 0,
        beforeSend(event: { request?: Record<string, unknown>; extra?: Record<string, unknown> }) {
          if (event.request) {
            delete event.request.cookies;
            delete event.request.headers;
            delete event.request.data;
          }
          if (event.extra) {
            for (const key of Object.keys(event.extra)) {
              if (/file|filename|ocr|password|token|secret|email|card/i.test(key)) {
                delete event.extra[key];
              }
            }
          }
          return event;
        },
      });
    } catch {
      // Package may be absent until a DSN is configured.
    }
  }

  // Runtime-only. enforceProductionConfigOrThrow no-ops during `next build`,
  // Vitest, local dev, and Vercel Preview. On Vercel Production this runs
  // per Node.js isolate cold start — not a single process-wide boot.
  enforceProductionConfigOrThrow();
}
