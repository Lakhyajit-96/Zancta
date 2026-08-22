/**
 * Analytics event contract — single source of truth.
 *
 * Every client-side GA4 event and server-side product event MUST be defined
 * here. Arbitrary event names are rejected at the type level and by runtime
 * validation. No file contents, filenames, OCR text, or sensitive data may
 * appear in any event payload.
 */

import type { ToolSlug } from "@/lib/tools";

// ── Event names ────────────────────────────────────────────────────────────

export const ANALYTICS_EVENTS = {
  // Acquisition
  page_view: "page_view",
  tool_catalog_view: "tool_catalog_view",
  pricing_view: "pricing_view",

  // Tool discovery + processing
  tool_view: "tool_view",
  tool_used: "tool_used",
  processing_started: "processing_started",
  processing_completed: "processing_completed",
  processing_failed: "processing_failed",
  processing_cancelled: "processing_cancelled",
  download_completed: "download_completed",

  // Auth
  signup_completed: "signup_completed",
  signin_completed: "signin_completed",

  // Monetization (server-side authoritative)
  pricing_plan_selected: "pricing_plan_selected",
  checkout_started: "checkout_started",
  subscription_active: "subscription_active",
  subscription_cancelled: "subscription_cancelled",
  payment_failed: "payment_failed",
  refund_completed: "refund_completed",

  // Premium OCR
  premium_feature_view: "premium_feature_view",
  ocr_language_selected: "ocr_language_selected",
  ocr_language_load_started: "ocr_language_load_started",
  ocr_language_load_completed: "ocr_language_load_completed",
  ocr_language_load_failed: "ocr_language_load_failed",
  ocr_processing_started: "ocr_processing_started",
  ocr_processing_completed: "ocr_processing_completed",
  ocr_processing_failed: "ocr_processing_failed",
  premium_upgrade_clicked: "premium_upgrade_clicked",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// ── Event payload schemas ──────────────────────────────────────────────────

export interface EventPayloads {
  page_view: { path: string };
  tool_catalog_view: Record<string, never>;
  pricing_view: Record<string, never>;
  tool_view: { tool: ToolSlug };
  tool_used: { tool: ToolSlug };
  processing_started: { tool: ToolSlug };
  processing_completed: { tool: ToolSlug };
  processing_failed: { tool: ToolSlug; error_category?: string };
  processing_cancelled: { tool: ToolSlug };
  download_completed: { tool: ToolSlug };
  signup_completed: { method: "credentials" | "google" | "github" };
  signin_completed: { method: "credentials" | "google" | "github" };
  pricing_plan_selected: { plan: string };
  checkout_started: { plan: string };
  subscription_active: { plan: string };
  subscription_cancelled: { plan: string };
  payment_failed: Record<string, never>;
  refund_completed: Record<string, never>;
  premium_feature_view: { tool: ToolSlug };
  ocr_language_selected: { tool: ToolSlug; language: string };
  ocr_language_load_started: { tool: ToolSlug; language: string };
  ocr_language_load_completed: { tool: ToolSlug; language: string };
  ocr_language_load_failed: { tool: ToolSlug; language: string };
  ocr_processing_started: { tool: ToolSlug; language: string };
  ocr_processing_completed: { tool: ToolSlug; language: string };
  ocr_processing_failed: { tool: ToolSlug; language: string; error_category?: string };
  premium_upgrade_clicked: { tool: ToolSlug };
}

// ── Client-side allowed events (consent-gated GA4) ─────────────────────────

export const CLIENT_ANALYTICS_EVENTS = [
  "page_view",
  "tool_view",
  "tool_used",
  "processing_started",
  "processing_completed",
  "processing_failed",
  "processing_cancelled",
  "download_completed",
  "signup_completed",
  "signin_completed",
  "pricing_plan_selected",
  "checkout_started",
  "tool_catalog_view",
  "pricing_view",
  "premium_feature_view",
  "ocr_language_selected",
  "ocr_language_load_started",
  "ocr_language_load_completed",
  "ocr_language_load_failed",
  "ocr_processing_started",
  "ocr_processing_completed",
  "ocr_processing_failed",
  "premium_upgrade_clicked",
] as const;

export type ClientAnalyticsEvent = (typeof CLIENT_ANALYTICS_EVENTS)[number];

// ── Validation ─────────────────────────────────────────────────────────────

const VALID_EVENT_NAMES = new Set<string>(Object.values(ANALYTICS_EVENTS));
const SLUG_RE = /^[a-z0-9-]{1,64}$/;
const PATH_RE = /^\/[a-z0-9/._-]{0,200}$/;
const PLAN_RE = /^[A-Z_]{1,40}$/;
const METHOD_RE = /^(credentials|google|github)$/;
const ERROR_CAT_RE = /^[a-z_]{1,40}$/;
const LANGUAGE_RE = /^[a-z]{3}$/;

export function isValidEventName(name: string): name is AnalyticsEventName {
  return VALID_EVENT_NAMES.has(name);
}

/**
 * Sanitize event params for GA4 — strips anything not explicitly allowed.
 * Returns only safe string key-value pairs. Never passes through raw user input.
 */
export function sanitizeClientParams(
  event: ClientAnalyticsEvent,
  params?: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!params) return out;

  if ("tool" in params && typeof params.tool === "string" && SLUG_RE.test(params.tool)) {
    out.tool = params.tool;
  }
  if ("path" in params && typeof params.path === "string" && PATH_RE.test(params.path)) {
    out.path = params.path;
  }
  if ("plan" in params && typeof params.plan === "string" && PLAN_RE.test(params.plan)) {
    out.plan = params.plan;
  }
  if ("method" in params && typeof params.method === "string" && METHOD_RE.test(params.method)) {
    out.method = params.method;
  }
  if ("error_category" in params && typeof params.error_category === "string" && ERROR_CAT_RE.test(params.error_category)) {
    out.error_category = params.error_category;
  }
  if ("language" in params && typeof params.language === "string" && LANGUAGE_RE.test(params.language)) {
    out.language = params.language;
  }

  return out;
}

// ── Version ────────────────────────────────────────────────────────────────

export const EVENT_CONTRACT_VERSION = 1;
