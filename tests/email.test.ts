import { afterEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { id: "email_test" }, error: null }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

describe("production transactional email", () => {
  const original = {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    resendKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM,
    replyTo: process.env.EMAIL_REPLY_TO,
    appUrl: process.env.NEXTAUTH_URL,
  };

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = original.nodeEnv;
    process.env.VERCEL_ENV = original.vercelEnv;
    process.env.RESEND_API_KEY = original.resendKey;
    process.env.EMAIL_FROM = original.emailFrom;
    process.env.EMAIL_REPLY_TO = original.replyTo;
    process.env.NEXTAUTH_URL = original.appUrl;
    sendMock.mockClear();
  });

  it("fails closed instead of falling back to console in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.RESEND_API_KEY;
    const { getEmailAdapter } = await import("@/lib/email");
    expect(() => getEmailAdapter()).toThrow("RESEND_API_KEY missing in production");
  });

  it("sends branded HTML, plain text, reply-to, and the exact reset subject", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "noreply@mail.zancta.tech";
    process.env.EMAIL_REPLY_TO = "support@zancta.tech";
    process.env.NEXTAUTH_URL = "https://zancta.tech";

    const { getEmailAdapter } = await import("@/lib/email");
    await getEmailAdapter().sendPasswordReset(
      "person@example.com",
      "https://zancta.tech/reset-password?token=abc%26def"
    );

    const payload = sendMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.from).toBe("ZANCTA <noreply@mail.zancta.tech>");
    expect(payload.replyTo).toBe("security@zancta.tech");
    expect(payload.subject).toBe("Reset your ZANCTA password");
    expect(payload.html).toEqual(expect.stringContaining("Reset password"));
    expect(payload.html).toEqual(expect.stringContaining("abc%26def"));
    expect(payload.html).toEqual(expect.stringContaining("display:none"));
    expect(payload.html).toEqual(expect.stringContaining("copy this URL"));
    expect(payload.text).toEqual(expect.stringContaining("The link expires after 60 minutes"));
    expect(payload.text).toEqual(expect.stringContaining("existing signed-in sessions"));
    expect(payload.html).not.toEqual(expect.stringContaining("<script"));
    expect(payload.html).not.toEqual(expect.stringContaining("Lakhyajit Changmai"));
    expect(payload.text).not.toEqual(expect.stringContaining("Lakhyajit Changmai"));
    expect(payload.text).toEqual(expect.stringContaining("Transactional message from ZANCTA"));
  });

  it("defaults Reply-To to support@zancta.tech and includes the production logo URL", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "noreply@mail.zancta.tech";
    delete process.env.EMAIL_REPLY_TO;
    process.env.NEXTAUTH_URL = "https://zancta.tech";

    const { getEmailAdapter } = await import("@/lib/email");
    await getEmailAdapter().sendVerification(
      "person@example.com",
      "https://zancta.tech/verify-email?token=verify-token"
    );

    const payload = sendMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.from).toBe("ZANCTA <noreply@mail.zancta.tech>");
    expect(payload.replyTo).toBe("support@zancta.tech");
    expect(payload.subject).toBe("Verify your ZANCTA email address");
    expect(payload.html).toEqual(expect.stringContaining("https://zancta.tech/assets/zancta-brand/email/zancta-email-mark.png"));
    expect(payload.html).toEqual(expect.stringContaining('alt="ZANCTA"'));
    expect(payload.html).toEqual(expect.stringContaining("support@zancta.tech"));
    expect(payload.html).not.toEqual(expect.stringContaining("localhost"));
    expect(payload.html).not.toEqual(expect.stringContaining("vercel.app"));
    expect(payload.html).not.toEqual(expect.stringContaining("AUTH_SECRET"));
    expect(payload.text).toEqual(expect.stringContaining("https://zancta.tech/verify-email?token=verify-token"));
  });

  it("sends contact notification to the routed mailbox with user Reply-To", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "noreply@mail.zancta.tech";
    process.env.EMAIL_REPLY_TO = "support@zancta.tech";
    process.env.NEXTAUTH_URL = "https://zancta.tech";

    const { getEmailAdapter } = await import("@/lib/email");
    await getEmailAdapter().sendContactNotification({
      reference: "ZCT-MAIL0001",
      topicId: "security",
      topicLabel: "Security report",
      name: "Reporter",
      email: "reporter@example.com",
      subject: "Possible issue",
      message: "A concise security report.",
      receivedAt: "2026-08-22T00:00:00.000Z",
      environment: "production",
      destination: "security@zancta.tech",
    });

    const payload = sendMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.from).toBe("ZANCTA <noreply@mail.zancta.tech>");
    expect(payload.to).toBe("security@zancta.tech");
    expect(payload.replyTo).toBe("reporter@example.com");
    expect(payload.subject).toBe("[ZANCTA] New Support Enquiry — Security report");
    expect(payload.html).toEqual(expect.stringContaining("ZCT-MAIL0001"));
    expect(payload.html).not.toEqual(expect.stringContaining("Lakhyajit Changmai"));
  });

  it("sends the account-deletion code in the body, not the subject or a URL", async () => {
    vi.resetModules();
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "noreply@mail.zancta.tech";
    process.env.NEXTAUTH_URL = "https://zancta.tech";
    sendMock.mockClear();

    const { getEmailAdapter } = await import("@/lib/email");
    const code = "a".repeat(64);
    await getEmailAdapter().sendAccountDeletionCode("person@example.com", code);

    const payload = sendMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.replyTo).toBe("security@zancta.tech");
    expect(payload.subject).toBe("Confirm your ZANCTA account deletion");
    expect(payload.subject).not.toEqual(expect.stringContaining(code));
    expect(payload.html).toEqual(expect.stringContaining(code));
    expect(payload.html).not.toEqual(expect.stringContaining("/account/delete?"));
    expect(payload.text).toEqual(expect.stringContaining("expires after 15 minutes"));
    expect(payload.text).toEqual(expect.stringContaining("can be used once"));
  });

  it("does not send Resend from Vercel Preview even when NODE_ENV is production", async () => {
    vi.resetModules();
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.VERCEL_ENV = "preview";
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "noreply@mail.zancta.tech";
    delete process.env.PREVIEW_ALLOW_PRODUCTION_EMAIL;

    const { getEmailAdapter } = await import("@/lib/email");
    await getEmailAdapter().sendVerification("person@example.com", "https://zancta.tech/verify-email?token=preview");
    expect(sendMock).not.toHaveBeenCalled();
  });
});
