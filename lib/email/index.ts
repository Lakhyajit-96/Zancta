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

class ResendAdapter implements EmailAdapter {
  private resend: Resend;
  private from: string;
  constructor() {
    const key = process.env.RESEND_API_KEY;
    const from = (process.env.EMAIL_FROM || "").trim();
    if (!key) throw new Error("RESEND_API_KEY missing");
    if (!from.includes("@")) {
      throw new Error("EMAIL_FROM must be a mailbox such as noreply@mail.example.com");
    }
    this.resend = new Resend(key);
    this.from = formatFromAddress(from);
  }
  private async send(params: {
    to: string;
    subject: string;
    doc: EmailDocument;
    role?: EmailRole;
    replyTo?: string;
  }) {
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
  const hasResend = !!process.env.RESEND_API_KEY;
  if (env === "production") {
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
