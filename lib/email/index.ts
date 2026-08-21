import { Resend } from "resend";
import { getAppOrigin } from "@/lib/seo";

export interface EmailAdapter {
  sendVerification(to: string, url: string): Promise<void>;
  sendPasswordReset(to: string, url: string): Promise<void>;
}

const SUPPORT_EMAIL = "support@zancta.tech";

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

function emailHtml(params: {
  eyebrow: string;
  title: string;
  intro: string;
  actionLabel: string;
  actionUrl: string;
  expiry: string;
  warning: string;
}): string {
  const origin = escapeHtml(getAppOrigin());
  const actionUrl = escapeHtml(safeUrl(params.actionUrl));
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#100f11;color:#f7f2ec;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
    <div style="padding:32px 16px">
      <div style="max-width:600px;margin:0 auto;border:1px solid #39343a;background:#171519">
        <div style="padding:24px 28px;border-bottom:1px solid #39343a">
          <a href="${origin}" style="color:#f7f2ec;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.24em">ZANCTA</a>
        </div>
        <main style="padding:32px 28px">
          <p style="margin:0 0 12px;color:#d99a9a;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">${escapeHtml(params.eyebrow)}</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">${escapeHtml(params.title)}</h1>
          <p style="margin:0 0 24px;color:#d7d0ca">${escapeHtml(params.intro)}</p>
          <p style="margin:0 0 28px"><a href="${actionUrl}" style="display:inline-block;background:#d99a9a;color:#211b1d;padding:13px 20px;border-radius:4px;font-weight:700;text-decoration:none">${escapeHtml(params.actionLabel)}</a></p>
          <p style="margin:0 0 8px;color:#d7d0ca">This link expires in ${escapeHtml(params.expiry)} and can be used once.</p>
          <p style="margin:0;color:#aaa1a0;font-size:14px">${escapeHtml(params.warning)}</p>
        </main>
        <footer style="padding:20px 28px;border-top:1px solid #39343a;color:#aaa1a0;font-size:12px">
          <p style="margin:0 0 8px"><a href="${origin}/privacy" style="color:#d99a9a">Privacy</a> · <a href="${origin}/terms" style="color:#d99a9a">Terms</a> · <a href="${origin}/refund-and-cancellation" style="color:#d99a9a">Refund &amp; Cancellation</a> · <a href="mailto:${SUPPORT_EMAIL}" style="color:#d99a9a">Support</a></p>
          <p style="margin:0">© ZANCTA · Need help? ${SUPPORT_EMAIL}</p>
        </footer>
      </div>
    </div>
  </body>
</html>`;
}

class ResendAdapter implements EmailAdapter {
  private resend: Resend;
  private from: string;
  private replyTo: string;
  constructor() {
    const key = process.env.RESEND_API_KEY;
    const from = (process.env.EMAIL_FROM || "").trim();
    const replyTo = (process.env.EMAIL_REPLY_TO || SUPPORT_EMAIL).trim();
    if (!key) throw new Error("RESEND_API_KEY missing");
    if (!from.includes("@")) {
      throw new Error("EMAIL_FROM must be a mailbox such as noreply@mail.example.com");
    }
    if (!replyTo.includes("@")) throw new Error("EMAIL_REPLY_TO must be a mailbox");
    this.resend = new Resend(key);
    this.from = from;
    this.replyTo = replyTo;
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
      replyTo: this.replyTo,
      to,
      subject: "Verify your email — ZANCTA",
      html: emailHtml({
        eyebrow: "Email verification",
        title: "Verify your ZANCTA email",
        intro: "Confirm your email address to finish creating your ZANCTA account.",
        actionLabel: "Verify email",
        actionUrl: link,
        expiry: "24 hours",
        warning: "If you did not create this account, you can ignore this message.",
      }),
      text: `Verify your ZANCTA email\n\nConfirm your email address to finish creating your account:\n${link}\n\nThis link expires in 24 hours and can be used once. If you did not create this account, ignore this message.\n\nPrivacy: ${getAppOrigin()}/privacy\nTerms: ${getAppOrigin()}/terms\nRefund & Cancellation: ${getAppOrigin()}/refund-and-cancellation\nSupport: ${SUPPORT_EMAIL}`,
    });
  }
  async sendPasswordReset(to: string, url: string) {
    const link = safeUrl(url);
    await this.sendEmail({
      from: this.from,
      replyTo: this.replyTo,
      to,
      subject: "Reset your ZANCTA password",
      html: emailHtml({
        eyebrow: "Account security",
        title: "Reset your ZANCTA password",
        intro: "We received a request to reset the password for your ZANCTA account.",
        actionLabel: "Reset password",
        actionUrl: link,
        expiry: "60 minutes",
        warning: "If you did not request this, ignore this message. Your password will not change unless you use the link.",
      }),
      text: `Reset your ZANCTA password\n\nWe received a request to reset your password. Use this one-time link:\n${link}\n\nThis link expires in 60 minutes. If you did not request this, ignore this message — your password will not change.\n\nPrivacy: ${getAppOrigin()}/privacy\nTerms: ${getAppOrigin()}/terms\nRefund & Cancellation: ${getAppOrigin()}/refund-and-cancellation\nSupport: ${SUPPORT_EMAIL}`,
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
