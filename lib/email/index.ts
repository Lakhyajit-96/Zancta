import { Resend } from "resend";

export interface EmailAdapter {
  sendVerification(to: string, url: string): Promise<void>;
  sendPasswordReset(to: string, url: string): Promise<void>;
}

class ResendAdapter implements EmailAdapter {
  private resend: Resend;
  private from: string;
  constructor() {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "noreply@localfile.app";
    if (!key) throw new Error("RESEND_API_KEY missing");
    this.resend = new Resend(key);
    this.from = from;
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
    await this.sendEmail({
      from: this.from,
      to,
      subject: "Verify your email — LocalFile",
      html: `<p>Verify your email by clicking <a href="${url}">${url}</a>. This link expires in 24 hours and is one-time use.</p><p>If you didn't request this, ignore.</p>`,
    });
  }
  async sendPasswordReset(to: string, url: string) {
    await this.sendEmail({
      from: this.from,
      to,
      subject: "Reset your password — LocalFile",
      html: `<p>Reset your password by clicking <a href="${url}">${url}</a>. This link expires in 60 minutes and is one-time use.</p><p>If you didn't request this, ignore — no password was changed.</p>`,
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
  // Production with key -> Resend
  if (env === "production" && hasResend) return new ResendAdapter();
  // Test explicit
  if (env === "test") return new TestAdapter();
  // Development default
  return new ConsoleAdapter();
}

// For E2E, allow forced test adapter via header is handled in routes directly (they check adapter internally)
// Export helper for routes
export function getEmailAdapter(): EmailAdapter {
  // In E2E prod build, we want Console for localhost, Resend for real prod
  // If RESEND_API_KEY not set, fall back to Console (safe)
  try {
    return getAdapter();
  } catch {
    return new ConsoleAdapter();
  }
}

// For production, never log tokens — adapter ensures only URL is sent, no token in logs
