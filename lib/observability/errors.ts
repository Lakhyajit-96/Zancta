/**
 * Structured error categorization for production observability.
 *
 * Every meaningful failure gets a stable identifier, category, and severity.
 * Never logs: file contents, OCR text, passwords, tokens, payment secrets.
 */

export type ErrorCategory =
  | "AUTH"
  | "BILLING"
  | "PROCESSING"
  | "OCR"
  | "PDF"
  | "IMAGE"
  | "SEO"
  | "CONTACT"
  | "EMAIL"
  | "SYSTEM"
  | "RATE_LIMIT"
  | "WEBHOOK";

export type ErrorSeverity = "info" | "warn" | "error" | "critical";

export interface StructuredError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  route?: string;
  tool?: string;
  timestamp: string;
  requestId?: string;
}

let requestCounter = 0;

export function generateRequestId(): string {
  return `req_${Date.now()}_${(++requestCounter).toString(36)}`;
}

/**
 * Log a structured error to stderr for Vercel log drains.
 * Safe for production: never includes file bytes, OCR text, or secrets.
 */
export function logError(opts: {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  route?: string;
  tool?: string;
  requestId?: string;
  error?: unknown;
}): StructuredError {
  const entry: StructuredError = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category: opts.category,
    severity: opts.severity,
    message: opts.message.slice(0, 500),
    route: opts.route,
    tool: opts.tool,
    timestamp: new Date().toISOString(),
    requestId: opts.requestId,
  };

  const logLine = JSON.stringify(entry);

  if (opts.severity === "critical" || opts.severity === "error") {
    console.error(`[ZANCTA:${opts.category}] ${logLine}`);
  } else if (opts.severity === "warn") {
    console.warn(`[ZANCTA:${opts.category}] ${logLine}`);
  }

  return entry;
}

/**
 * Sanitize an error for safe logging. Strips stack traces in production,
 * truncates messages, and never includes raw user input.
 */
export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message.slice(0, 300);
    if (process.env.NODE_ENV === "production") return msg;
    return `${msg}${err.stack ? ` | ${err.stack.split("\n").slice(0, 3).join(" → ")}` : ""}`;
  }
  if (typeof err === "string") return err.slice(0, 300);
  return "Unknown error";
}
