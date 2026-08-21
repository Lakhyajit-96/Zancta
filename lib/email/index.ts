import { Resend } from "resend";
import { getAppOrigin } from "@/lib/seo";
import { LEGAL_PUBLIC } from "@/lib/legal-public";

export interface EmailAdapter {
  sendVerification(to: string, url: string): Promise<void>;
  sendPasswordReset(to: string, url: string): Promise<void>;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function safeUrl(url: string): string {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Email link must use HTTP or HTTPS");
  return parsed.toString();
}

function formatFromAddress(from: string): string {
  const trimmed = from.trim();
  if (trimmed.includes("<")) return trimmed;
  return `ZANCTA <${trimmed}>`;
}

function optionalReplyTo(): string | undefined {
  const replyTo = (process.env.EMAIL_REPLY_TO || "").trim();
  if (!replyTo.includes("@")) return undefined;
  return replyTo;
}

function legalFooterText(): string {
  const origin = getAppOrigin();
  return `Privacy: ${origin}/privacy\nTerms: ${origin}/terms\nRefund & Cancellation: ${origin}/refund-and-cancellation\nThis is a transactional message from ZANCTA.`;
}

function emailHtml(params: {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  paragraphs: string[];
  actionLabel: string;
  actionUrl: string;
  expiry: string;
  warning: string;
}): string {
  const origin = escapeHtml(getAppOrigin());
  const actionUrl = escapeHtml(safeUrl(params.actionUrl));
  const paragraphs = params.paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px;color:#d7d0ca">${escapeHtml(paragraph)}</p>`)
    .join("");
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#100f11;color:#f7f2ec;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(params.preheader)}</div>
    <div style="padding:32px 16px">
      <div style="max-width:600px;margin:0 auto;border:1px solid #39343a;background:#171519">
        <div style="padding:24px 28px;border-bottom:1px solid #39343a">
          <a href="${origin}" style="color:#f7f2ec;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.24em">ZANCTA</a>
        </div>
        <main style="padding:32px 28px">
          <p style="margin:0 0 12px;color:#d99a9a;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">${escapeHtml(params.eyebrow)}</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">${escapeHtml(params.title)}</h1>
          <p style="margin:0 0 16px;color:#d7d0ca">${escapeHtml(params.intro)}</p>
          ${paragraphs}
          <p style="margin:24px 0 28px"><a href="${actionUrl}" style="display:inline-block;background:#d99a9a;color:#211b1d;padding:13px 20px;border-radius:4px;font-weight:700;text-decoration:none">${escapeHtml(params.actionLabel)}</a></p>
          <p style="margin:0 0 8px;color:#d7d0ca">If the button does not work, copy this URL into your browser:</p>
          <p style="margin:0 0 16px;word-break:break-all;color:#aaa1a0;font-size:14px">${actionUrl}</p>
          <p style="margin:0 0 8px;color:#d7d0ca">This link expires in ${escapeHtml(params.expiry)} and can be used once.</p>
          <p style="margin:0;color:#aaa1a0;font-size:14px">${escapeHtml(params.warning)}</p>
        </main>
        <footer style="padding:20px 28px;border-top:1px solid #39343a;color:#aaa1a0;font-size:12px">
          <p style="margin:0 0 8px"><a href="${origin}/privacy" style="color:#d99a9a">Privacy</a> · <a href="${origin}/terms" style="color:#d99a9a">Terms</a> · <a href="${origin}/refund-and-cancellation" style="color:#d99a9a">Refund &amp; Cancellation</a></p>
          <p style="margin:0">© ZANCTA · Operated by ${escapeHtml(LEGAL_PUBLIC.operatorName)} · Transactional message</p>
        </footer>
      </div>
    </div>
  </body>
</html>`;
}

class ResendAdapter implements EmailAdapter {
  private resend: Resend;
  private from: string;
  private replyTo: string | undefined;
  constructor() {
    const key = process.env.RESEND_API_KEY;
    const from = (process.env.EMAIL_FROM || "").trim();
    if (!key) throw new Error("RESEND_API_KEY missing");
    if (!from.includes("@")) {
      throw new Error("EMAIL_FROM must be a mailbox such as noreply@mail.example.com");
    }
    this.resend = new Resend(key);
    this.from = formatFromAddress(from);
    this.replyTo = optionalReplyTo();
  }
  private async sendEmail(params: Parameters<Resend["emails"]["send"]>[0]) {
    // resend.emails.send() resolves with { data, error } instead of throwing;
    // surface provider failures so callers never report fake success.
    const { error } = await this.resend.emails.send(params);
    if (error) {
      // Resend error messages are safe (e.g. "domain is not verified"); no API keys included.
      throw new Error(`Resend send failed: ${error.name}: ${error.message}`);
    }
  }
  async sendVerification(to: string, url: string) {
    const link = safeUrl(url);
    await this.sendEmail({
      from: this.from,
      ...(this.replyTo ? { replyTo: this.replyTo } : {}),
      to,
      subject: "Verify your email — ZANCTA",
      html: emailHtml({
        preheader: "Confirm your email within 24 hours to finish creating your ZANCTA account.",
        eyebrow: "Email verification",
        title: "Verify your ZANCTA email",
        intro: "ZANCTA needs to confirm this address belongs to you before the account can be used for sign-in and, when checkout is enabled, for paid billing.",
        paragraphs: [
          "After you verify, you can sign in with this email. The link works once.",
        ],
        actionLabel: "Verify email",
        actionUrl: link,
        expiry: "24 hours",
        warning: "If you did not create this account, ignore this message. No account access is granted until the link is used.",
      }),
      text: `Verify your ZANCTA email\n\nZANCTA needs to confirm this address belongs to you before the account can be used for sign-in and, when checkout is enabled, for paid billing.\n\nVerify here:\n${link}\n\nThis link expires in 24 hours and can be used once. After verification, you can sign in with this email.\nIf you did not create this account, ignore this message.\n\n${legalFooterText()}`,
    });
  }
  async sendPasswordReset(to: string, url: string) {
    const link = safeUrl(url);
    await this.sendEmail({
      from: this.from,
      ...(this.replyTo ? { replyTo: this.replyTo } : {}),
      to,
      subject: "Reset your ZANCTA password",
      html: emailHtml({
        preheader: "A password reset was requested. This one-time link expires in 60 minutes.",
        eyebrow: "Account security",
        title: "Reset your ZANCTA password",
        intro: "Someone requested a password reset for a ZANCTA account using this email address.",
        paragraphs: [
          "The link is one-time. After a successful reset, existing signed-in sessions for that account are ended and you will need to sign in with the new password.",
        ],
        actionLabel: "Reset password",
        actionUrl: link,
        expiry: "60 minutes",
        warning: "If you did not request this, ignore this message. Your password will not change unless you use the link. A monitored public security mailbox is not published yet; do not send passwords or tokens in reply.",
      }),
      text: `Reset your ZANCTA password\n\nSomeone requested a password reset for a ZANCTA account using this email address.\n\nUse this one-time link:\n${link}\n\nThis link expires in 60 minutes and can be used once. After a successful reset, existing signed-in sessions are ended and you will need to sign in with the new password.\nIf you did not request this, ignore this message — your password will not change unless you use the link.\nA monitored public security mailbox is not published yet; do not send passwords or tokens in reply.\n\n${legalFooterText()}`,
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
}

class TestAdapter implements EmailAdapter {
  // For E2E: store last URL in memory, no external send
  lastVerificationUrl: string | null = null;
  lastPasswordResetUrl: string | null = null;
  async sendVerification(to: string, url: string) {
    this.lastVerificationUrl = url;
    console.log(`[TEST] Verification ${to}: ${url}`);
  }
  async sendPasswordReset(to: string, url: string) {
    this.lastPasswordResetUrl = url;
    console.log(`[TEST] Reset ${to}: ${url}`);
  }
}

function getAdapter(): EmailAdapter {
  const env = process.env.NODE_ENV;
  const hasResend = !!process.env.RESEND_API_KEY;
  if (env === "production") {
    if (!hasResend) throw new Error("RESEND_API_KEY missing in production");
    return new ResendAdapter();
  }
  // Test explicit
  if (env === "test") return new TestAdapter();
  // Development default
  return new ConsoleAdapter();
}

// For E2E, allow forced test adapter via header is handled in routes directly (they check adapter internally)
// Export helper for routes
export function getEmailAdapter(): EmailAdapter {
  return getAdapter();
}

// For production, never log tokens — adapter ensures only URL is sent, no token in logs
