import { Resend } from "resend";
import type { ContactEnquiryPayload } from "@/lib/contact/schema";
import { contactTopicById } from "@/lib/contact/topics";
import type { EmailRole } from "./contacts";
import { replyToForRole, safeReplyMailbox } from "./contacts";
import { renderEmailHtml, renderEmailText, safeHttpsUrl, type EmailDocument } from "./layout";
import {
  accountDeletedEmail,
  accountDeletionCodeEmail,
  cancellationEmail,
  contactAcknowledgementEmail,
  contactInternalEmail,
  passwordChangedEmail,
  passwordResetEmail,
  paymentFailedEmail,
  refundProcessedEmail,
  securityNotificationEmail,
  subscriptionActivatedEmail,
  subscriptionRenewedEmail,
  verificationEmail,
  welcomeEmail,
} from "./templates";
import { previewEmailBlocked } from "@/lib/preview-isolation";

export interface EmailAdapter {
  sendVerification(to: string, url: string): Promise<void>;
  sendPasswordReset(to: string, url: string): Promise<void>;
  sendPasswordChanged(to: string): Promise<void>;
  sendWelcome(to: string): Promise<void>;
  sendAccountDeletionCode(to: string, code: string): Promise<void>;
  sendAccountDeleted(to: string): Promise<void>;
  sendSubscriptionActivated(
    to: string,
    input: { planLabel: string; amountLabel: string; periodEnd?: string }
  ): Promise<void>;
  sendSubscriptionRenewed(
    to: string,
    input: { planLabel: string; amountLabel?: string; periodEnd?: string }
  ): Promise<void>;
  sendPaymentFailed(to: string): Promise<void>;
  sendCancellation(
    to: string,
    input: { scheduled: boolean; periodEnd?: string }
  ): Promise<void>;
  sendRefundProcessed(
    to: string,
    input: { amountLabel?: string; currency?: string; status: string; reference?: string }
  ): Promise<void>;
  sendSecurityNotification(to: string, input: { happened: string; when?: string; next: string }): Promise<void>;
  sendContactNotification(payload: ContactEnquiryPayload): Promise<void>;
  sendContactAcknowledgement(payload: ContactEnquiryPayload): Promise<void>;
}

function formatFromAddress(from: string): string {
  const trimmed = from.trim();
  if (trimmed.includes("<")) return trimmed;
  return `ZANCTA <${trimmed}>`;
}

type TemplateSendParams = {
  to: string;
  subject: string;
  doc: EmailDocument;
  role?: EmailRole;
  replyTo?: string;
};

abstract class TemplateEmailAdapter implements EmailAdapter {
  protected abstract send(params: TemplateSendParams): Promise<void>;

  async sendVerification(to: string, url: string) {
    await this.send({
      to,
      subject: "Verify your ZANCTA email address",
      doc: verificationEmail(safeHttpsUrl(url)),
    });
  }
  async sendPasswordReset(to: string, url: string) {
    await this.send({
      to,
      role: "security",
      subject: "Reset your ZANCTA password",
      doc: passwordResetEmail(safeHttpsUrl(url)),
    });
  }
  async sendPasswordChanged(to: string) {
    await this.send({
      to,
      role: "security",
      subject: "Your ZANCTA password was changed",
      doc: passwordChangedEmail(),
    });
  }
  async sendWelcome(to: string) {
    await this.send({ to, subject: "Welcome to ZANCTA", doc: welcomeEmail() });
  }
  async sendAccountDeletionCode(to: string, code: string) {
    await this.send({
      to,
      role: "security",
      subject: "Confirm your ZANCTA account deletion",
      doc: accountDeletionCodeEmail(code),
    });
  }
  async sendAccountDeleted(to: string) {
    await this.send({
      to,
      role: "security",
      subject: "Your ZANCTA account has been deleted",
      doc: accountDeletedEmail(),
    });
  }
  async sendSubscriptionActivated(to: string, input: { planLabel: string; amountLabel: string; periodEnd?: string }) {
    await this.send({
      to,
      role: "billing",
      subject: "Your ZANCTA Premium subscription is active",
      doc: subscriptionActivatedEmail(input),
    });
  }
  async sendSubscriptionRenewed(to: string, input: { planLabel: string; amountLabel?: string; periodEnd?: string }) {
    await this.send({
      to,
      role: "billing",
      subject: "Your ZANCTA Premium subscription renewed",
      doc: subscriptionRenewedEmail(input),
    });
  }
  async sendPaymentFailed(to: string) {
    await this.send({
      to,
      role: "billing",
      subject: "Action may be required for your ZANCTA subscription",
      doc: paymentFailedEmail(),
    });
  }
  async sendCancellation(to: string, input: { scheduled: boolean; periodEnd?: string }) {
    await this.send({
      to,
      role: "billing",
      subject: "Your ZANCTA subscription cancellation is confirmed",
      doc: cancellationEmail(input),
    });
  }
  async sendRefundProcessed(
    to: string,
    input: { amountLabel?: string; currency?: string; status: string; reference?: string }
  ) {
    await this.send({
      to,
      role: "billing",
      subject: "Your ZANCTA refund has been processed",
      doc: refundProcessedEmail(input),
    });
  }
  async sendSecurityNotification(to: string, input: { happened: string; when?: string; next: string }) {
    await this.send({
      to,
      role: "security",
      subject: "ZANCTA security notification",
      doc: securityNotificationEmail(input),
    });
  }
  async sendContactNotification(payload: ContactEnquiryPayload) {
    await this.send({
      to: payload.destination,
      subject: `[ZANCTA] New Support Enquiry — ${payload.topicLabel}`,
      doc: contactInternalEmail(payload),
      replyTo: payload.email,
    });
  }
  async sendContactAcknowledgement(payload: ContactEnquiryPayload) {
    const role = contactTopicById(payload.topicId)?.destinationRole ?? "support";
    await this.send({
      to: payload.email,
      subject: "ZANCTA — We received your enquiry",
      doc: contactAcknowledgementEmail(payload),
      role,
    });
  }
}

class ResendAdapter extends TemplateEmailAdapter {
  private resend: Resend;
  private from: string;
  constructor() {
    super();
    const key = process.env.RESEND_API_KEY;
    const from = (process.env.EMAIL_FROM || "").trim();
    if (!key) throw new Error("RESEND_API_KEY missing");
    if (!from.includes("@")) {
      throw new Error("EMAIL_FROM must be a mailbox such as noreply@mail.example.com");
    }
    this.resend = new Resend(key);
    this.from = formatFromAddress(from);
  }
  protected async send(params: TemplateSendParams) {
    const { error } = await this.resend.emails.send({
      from: this.from,
      replyTo: safeReplyMailbox(params.replyTo ?? replyToForRole(params.role ?? "support")),
      to: safeReplyMailbox(params.to),
      subject: params.subject,
      html: renderEmailHtml(params.doc),
      text: renderEmailText(params.doc),
    });
    if (error) {
      throw new Error(`Resend send failed: ${error.name}: ${error.message}`);
    }
  }
}

type HostingerMailbox = {
  resourceId?: string;
  resource_id?: string;
  id?: string;
  address?: string;
  email?: string;
};

type HostingerAccountResponse = {
  data?: {
    mailboxes?: HostingerMailbox[];
  };
};

type HostingerSendRequest = {
  to: string[];
  subject: string;
  text: string;
  html: string;
  displayName: string;
};

const HOSTINGER_MAIL_DEFAULT_TIMEOUT_MS = 10_000;
const HOSTINGER_MAIL_MAX_ATTEMPTS = 3;
const HOSTINGER_MAIL_DEFAULT_RETRY_BASE_DELAY_MS = 250;
const HOSTINGER_MAIL_MAX_RETRY_DELAY_MS = 2_000;
const HOSTINGER_MAIL_MAX_RETRY_AFTER_MS = 5_000;

function extractMailboxAddress(value: string): string {
  const trimmed = value.trim();
  const angleMatch = trimmed.match(/<([^<>]+@[^<>]+)>/);
  return safeReplyMailbox(angleMatch?.[1] ?? trimmed);
}

function displayNameFromAddress(value: string): string {
  const angleIndex = value.indexOf("<");
  if (angleIndex === -1) return "ZANCTA";
  const displayName = value.slice(0, angleIndex).trim().replace(/^["']|["']$/g, "");
  return displayName || "ZANCTA";
}

function hostingerMailboxId(mailbox: HostingerMailbox | undefined): string {
  return (mailbox?.resourceId || mailbox?.resource_id || mailbox?.id || "").trim();
}

function hostingerMailboxAddress(mailbox: HostingerMailbox | undefined): string {
  return (mailbox?.address || mailbox?.email || "").trim();
}

function normalizeHostingerMailApiUrl(raw: string | undefined): string {
  const configured = (raw || "https://api.mail.hostinger.com").trim().replace(/\/+$/, "");
  const parsed = new URL(configured);
  if (parsed.protocol !== "https:") {
    throw new Error("HOSTINGER_MAIL_API_URL must use HTTPS");
  }
  if (parsed.pathname === "/api/v1" || parsed.pathname.startsWith("/api/v1/")) {
    return parsed.origin;
  }
  if (parsed.hostname === "api.hostinger.com" && parsed.pathname.startsWith("/mail")) {
    throw new Error("HOSTINGER_MAIL_API_URL must be https://api.mail.hostinger.com for Hostinger Mail API");
  }
  return `${parsed.origin}${parsed.pathname === "/" ? "" : parsed.pathname}`;
}

function positiveIntEnv(name: string, fallback: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function safeProviderErrorCode(bodyText: string): string {
  try {
    const body = JSON.parse(bodyText) as { code?: unknown };
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (/^[a-z0-9_.-]{1,80}$/i.test(code)) return code;
  } catch {
    return "";
  }
  return "";
}

function retryAfterDelayMs(headers: Headers): number | null {
  const raw = headers.get("Retry-After")?.trim();
  if (!raw) return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(Math.round(seconds * 1000), HOSTINGER_MAIL_MAX_RETRY_AFTER_MS);
  }
  const dateMs = Date.parse(raw);
  if (Number.isNaN(dateMs)) return null;
  return Math.min(Math.max(0, dateMs - Date.now()), HOSTINGER_MAIL_MAX_RETRY_AFTER_MS);
}

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class HostingerMailRequestError extends Error {
  readonly transient: boolean;
  readonly status?: number;

  constructor(message: string, input: { transient: boolean; status?: number }) {
    super(message);
    this.name = "HostingerMailRequestError";
    this.transient = input.transient;
    this.status = input.status;
  }
}

class HostingerMailAdapter extends TemplateEmailAdapter {
  private token: string;
  private apiUrl: string;
  private mailboxResourceId?: string;
  private mailboxResourceIdPromise?: Promise<string>;
  private fromAddress: string;
  private displayName: string;
  private timeoutMs: number;
  private retryBaseDelayMs: number;

  constructor() {
    super();
    const token = (process.env.HOSTINGER_MAIL_API_TOKEN || "").trim();
    if (!token) throw new Error("HOSTINGER_MAIL_API_TOKEN missing");

    const from = (process.env.HOSTINGER_MAIL_FROM || process.env.EMAIL_FROM || "").trim();
    if (!from.includes("@")) {
      throw new Error("HOSTINGER_MAIL_FROM or EMAIL_FROM must be a mailbox such as support@example.com");
    }

    this.token = token;
    this.apiUrl = normalizeHostingerMailApiUrl(process.env.HOSTINGER_MAIL_API_URL);
    this.mailboxResourceId =
      (process.env.HOSTINGER_MAIL_MAILBOX_RESOURCE_ID || process.env.HOSTINGER_MAILBOX_RESOURCE_ID || "").trim() ||
      undefined;
    this.fromAddress = extractMailboxAddress(from);
    this.displayName = displayNameFromAddress(from);
    this.timeoutMs = positiveIntEnv(
      "HOSTINGER_MAIL_TIMEOUT_MS",
      HOSTINGER_MAIL_DEFAULT_TIMEOUT_MS,
      60_000
    );
    this.retryBaseDelayMs = positiveIntEnv(
      "HOSTINGER_MAIL_RETRY_BASE_DELAY_MS",
      HOSTINGER_MAIL_DEFAULT_RETRY_BASE_DELAY_MS,
      5_000
    );
  }

  protected async send(params: TemplateSendParams) {
    const mailboxResourceId = await this.resolveMailboxResourceId();
    const body: HostingerSendRequest = {
      to: [safeReplyMailbox(params.to)],
      subject: params.subject,
      text: renderEmailText(params.doc),
      html: renderEmailHtml(params.doc),
      displayName: this.displayName,
    };

    await this.request<void>(`/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/send`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  private async resolveMailboxResourceId(): Promise<string> {
    if (this.mailboxResourceId) return this.mailboxResourceId;
    this.mailboxResourceIdPromise ??= this.fetchMailboxResourceId();
    return this.mailboxResourceIdPromise;
  }

  private async fetchMailboxResourceId(): Promise<string> {
    const account = await this.request<HostingerAccountResponse>("/api/v1/me");
    const mailboxes = account.data?.mailboxes ?? [];
    const expectedAddress = this.fromAddress.toLowerCase();
    const matchingMailbox = mailboxes.find(
      (mailbox) => hostingerMailboxAddress(mailbox).toLowerCase() === expectedAddress
    );
    const matchingId = hostingerMailboxId(matchingMailbox);
    if (matchingId) return matchingId;

    if (mailboxes.length === 1) {
      const onlyId = hostingerMailboxId(mailboxes[0]);
      if (onlyId) return onlyId;
    }

    const addresses = mailboxes.map(hostingerMailboxAddress).filter(Boolean).join(", ") || "none";
    throw new Error(
      `HOSTINGER_MAIL_MAILBOX_RESOURCE_ID missing; no Hostinger mailbox matched ${this.fromAddress}. Token mailboxes: ${addresses}`
    );
  }

  private retryDelayMs(attempt: number, response?: Response): number {
    const retryAfter = response ? retryAfterDelayMs(response.headers) : null;
    if (retryAfter !== null) return retryAfter;
    const exponential = this.retryBaseDelayMs * 2 ** Math.max(0, attempt - 1);
    const jitter = 0.75 + Math.random() * 0.5;
    return Math.min(Math.round(exponential * jitter), HOSTINGER_MAIL_MAX_RETRY_DELAY_MS);
  }

  private async fetchWithTimeout(path: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    headers.set("Authorization", `Bearer ${this.token}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(`${this.apiUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new HostingerMailRequestError("Hostinger Mail API request timed out", { transient: true });
      }
      throw new HostingerMailRequestError("Hostinger Mail API network request failed", { transient: true });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let lastError: HostingerMailRequestError | null = null;

    for (let attempt = 1; attempt <= HOSTINGER_MAIL_MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(path, init);
        const bodyText = await response.text();

        if (!response.ok) {
          const detail = safeProviderErrorCode(bodyText);
          const message = `Hostinger Mail API request failed: ${response.status}${detail ? ` ${detail}` : ""}`;
          const error = new HostingerMailRequestError(message, {
            transient: isTransientStatus(response.status),
            status: response.status,
          });
          if (!error.transient || attempt === HOSTINGER_MAIL_MAX_ATTEMPTS) throw error;
          lastError = error;
          await wait(this.retryDelayMs(attempt, response));
          continue;
        }

        return (bodyText ? JSON.parse(bodyText) : undefined) as T;
      } catch (error) {
        const requestError =
          error instanceof HostingerMailRequestError
            ? error
            : new HostingerMailRequestError("Hostinger Mail API request failed", { transient: true });
        if (!requestError.transient || attempt === HOSTINGER_MAIL_MAX_ATTEMPTS) throw requestError;
        lastError = requestError;
        await wait(this.retryDelayMs(attempt));
      }
    }

    throw lastError ?? new HostingerMailRequestError("Hostinger Mail API request failed", { transient: true });
  }
}

class ConsoleAdapter implements EmailAdapter {
  async sendVerification(to: string, url: string) {
    console.log(`[DEV] Verification email for ${to}: ${url}`);
  }
  async sendPasswordReset(to: string, url: string) {
    console.log(`[DEV] Password reset for ${to}: ${url}`);
  }
  async sendPasswordChanged(to: string) {
    console.log(`[DEV] Password changed for ${to}`);
  }
  async sendWelcome(to: string) {
    console.log(`[DEV] Welcome email for ${to}`);
  }
  async sendAccountDeletionCode(to: string, code: string) {
    console.log(`[DEV] Account deletion code for ${to}: ${code}`);
  }
  async sendAccountDeleted(to: string) {
    console.log(`[DEV] Account deleted email for ${to}`);
  }
  async sendSubscriptionActivated(to: string) {
    console.log(`[DEV] Subscription activated for ${to}`);
  }
  async sendSubscriptionRenewed(to: string) {
    console.log(`[DEV] Subscription renewed for ${to}`);
  }
  async sendPaymentFailed(to: string) {
    console.log(`[DEV] Payment failed for ${to}`);
  }
  async sendCancellation(to: string) {
    console.log(`[DEV] Cancellation for ${to}`);
  }
  async sendRefundProcessed(to: string) {
    console.log(`[DEV] Refund processed for ${to}`);
  }
  async sendSecurityNotification(to: string) {
    console.log(`[DEV] Security notification for ${to}`);
  }
  async sendContactNotification(payload: ContactEnquiryPayload) {
    console.log(`[DEV] Contact enquiry ${payload.reference} -> ${payload.destination}`);
  }
  async sendContactAcknowledgement(payload: ContactEnquiryPayload) {
    console.log(`[DEV] Contact acknowledgement ${payload.reference} -> ${payload.email}`);
  }
}

class TestAdapter implements EmailAdapter {
  lastVerificationUrl: string | null = null;
  lastPasswordResetUrl: string | null = null;
  lastEvent: string | null = null;
  async sendVerification(to: string, url: string) {
    this.lastVerificationUrl = url;
    this.lastEvent = "verification";
    console.log(`[TEST] Verification ${to}: ${url}`);
  }
  async sendPasswordReset(to: string, url: string) {
    this.lastPasswordResetUrl = url;
    this.lastEvent = "password-reset";
    console.log(`[TEST] Reset ${to}: ${url}`);
  }
  async sendPasswordChanged(to: string) {
    this.lastEvent = "password-changed";
    console.log(`[TEST] Password changed ${to}`);
  }
  async sendWelcome(to: string) {
    this.lastEvent = "welcome";
    console.log(`[TEST] Welcome ${to}`);
  }
  lastAccountDeletionCode: string | null = null;
  async sendAccountDeletionCode(to: string, code: string) {
    this.lastAccountDeletionCode = code;
    this.lastEvent = "account-deletion-code";
    console.log(`[TEST] Account deletion code ${to}`);
  }
  async sendAccountDeleted(to: string) {
    this.lastEvent = "account-deleted";
    console.log(`[TEST] Account deleted ${to}`);
  }
  async sendSubscriptionActivated(to: string) {
    this.lastEvent = "subscription-activated";
    console.log(`[TEST] Subscription activated ${to}`);
  }
  async sendSubscriptionRenewed(to: string) {
    this.lastEvent = "subscription-renewed";
    console.log(`[TEST] Subscription renewed ${to}`);
  }
  async sendPaymentFailed(to: string) {
    this.lastEvent = "payment-failed";
    console.log(`[TEST] Payment failed ${to}`);
  }
  async sendCancellation(to: string) {
    this.lastEvent = "cancellation";
    console.log(`[TEST] Cancellation ${to}`);
  }
  async sendRefundProcessed(to: string) {
    this.lastEvent = "refund";
    console.log(`[TEST] Refund ${to}`);
  }
  async sendSecurityNotification(to: string) {
    this.lastEvent = "security";
    console.log(`[TEST] Security ${to}`);
  }
  lastContactReference: string | null = null;
  lastContactDestination: string | null = null;
  async sendContactNotification(payload: ContactEnquiryPayload) {
    this.lastEvent = "contact-notification";
    this.lastContactReference = payload.reference;
    this.lastContactDestination = payload.destination;
    console.log(`[TEST] Contact enquiry ${payload.reference} -> ${payload.destination}`);
  }
  async sendContactAcknowledgement(payload: ContactEnquiryPayload) {
    this.lastEvent = "contact-acknowledgement";
    this.lastContactReference = payload.reference;
    console.log(`[TEST] Contact acknowledgement ${payload.reference} -> ${payload.email}`);
  }
}

class IsolatedPreviewAdapter implements EmailAdapter {
  private async noop(kind: string) {
    console.log(`[PREVIEW] ${kind} email suppressed`);
  }
  async sendVerification() {
    await this.noop("verification");
  }
  async sendPasswordReset() {
    await this.noop("password-reset");
  }
  async sendPasswordChanged() {
    await this.noop("password-changed");
  }
  async sendWelcome() {
    await this.noop("welcome");
  }
  async sendAccountDeletionCode() {
    await this.noop("account-deletion-code");
  }
  async sendAccountDeleted() {
    await this.noop("account-deleted");
  }
  async sendSubscriptionActivated() {
    await this.noop("subscription-activated");
  }
  async sendSubscriptionRenewed() {
    await this.noop("subscription-renewed");
  }
  async sendPaymentFailed() {
    await this.noop("payment-failed");
  }
  async sendCancellation() {
    await this.noop("cancellation");
  }
  async sendRefundProcessed() {
    await this.noop("refund");
  }
  async sendSecurityNotification() {
    await this.noop("security");
  }
  async sendContactNotification() {
    await this.noop("contact-notification");
  }
  async sendContactAcknowledgement() {
    await this.noop("contact-acknowledgement");
  }
}

function getAdapter(): EmailAdapter {
  const env = process.env.NODE_ENV;
  if (env === "test") return new TestAdapter();
  if (previewEmailBlocked()) return new IsolatedPreviewAdapter();
  const provider = (process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
  if (provider && provider !== "resend" && provider !== "hostinger") {
    throw new Error("EMAIL_PROVIDER must be 'resend' or 'hostinger'");
  }
  if (provider === "hostinger") return new HostingerMailAdapter();
  if (provider === "resend") return new ResendAdapter();

  const hasResend = !!process.env.RESEND_API_KEY;
  const hasHostinger = !!process.env.HOSTINGER_MAIL_API_TOKEN;
  if (env === "production") {
    if (hasHostinger && !hasResend) return new HostingerMailAdapter();
    if (!hasResend) throw new Error("RESEND_API_KEY missing in production");
    return new ResendAdapter();
  }
  return new ConsoleAdapter();
}

export function getEmailAdapter(): EmailAdapter {
  return getAdapter();
}

export async function trySendEmail(label: string, send: () => Promise<void>): Promise<void> {
  try {
    await send();
  } catch (error) {
    console.error(`[email] ${label} failed:`, error instanceof Error ? error.message : String(error));
  }
}
