import { afterEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { id: "email_test" }, error: null }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

const originalMathRandom = Math.random;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

describe("production transactional email", () => {
  const original = {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    emailProvider: process.env.EMAIL_PROVIDER,
    resendKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM,
    replyTo: process.env.EMAIL_REPLY_TO,
    hostingerToken: process.env.HOSTINGER_MAIL_API_TOKEN,
    hostingerApiUrl: process.env.HOSTINGER_MAIL_API_URL,
    hostingerMailboxId: process.env.HOSTINGER_MAIL_MAILBOX_RESOURCE_ID,
    hostingerFrom: process.env.HOSTINGER_MAIL_FROM,
    hostingerTimeoutMs: process.env.HOSTINGER_MAIL_TIMEOUT_MS,
    hostingerRetryBaseDelayMs: process.env.HOSTINGER_MAIL_RETRY_BASE_DELAY_MS,
    appUrl: process.env.NEXTAUTH_URL,
  };

  afterEach(() => {
    restoreEnv("NODE_ENV", original.nodeEnv);
    restoreEnv("VERCEL_ENV", original.vercelEnv);
    restoreEnv("EMAIL_PROVIDER", original.emailProvider);
    restoreEnv("RESEND_API_KEY", original.resendKey);
    restoreEnv("EMAIL_FROM", original.emailFrom);
    restoreEnv("EMAIL_REPLY_TO", original.replyTo);
    restoreEnv("HOSTINGER_MAIL_API_TOKEN", original.hostingerToken);
    restoreEnv("HOSTINGER_MAIL_API_URL", original.hostingerApiUrl);
    restoreEnv("HOSTINGER_MAIL_MAILBOX_RESOURCE_ID", original.hostingerMailboxId);
    restoreEnv("HOSTINGER_MAIL_FROM", original.hostingerFrom);
    restoreEnv("HOSTINGER_MAIL_TIMEOUT_MS", original.hostingerTimeoutMs);
    restoreEnv("HOSTINGER_MAIL_RETRY_BASE_DELAY_MS", original.hostingerRetryBaseDelayMs);
    restoreEnv("NEXTAUTH_URL", original.appUrl);
    Math.random = originalMathRandom;
    sendMock.mockClear();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  function configureHostingerEmail() {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.EMAIL_PROVIDER = "hostinger";
    process.env.HOSTINGER_MAIL_API_TOKEN = "hostinger_test_token";
    process.env.HOSTINGER_MAIL_API_URL = "https://api.mail.hostinger.com";
    process.env.HOSTINGER_MAIL_MAILBOX_RESOURCE_ID = "AC49fb3789b4ef7597d34bf38337ab";
    process.env.HOSTINGER_MAIL_FROM = "ZANCTA <support@zancta.tech>";
    process.env.HOSTINGER_MAIL_TIMEOUT_MS = "20";
    process.env.HOSTINGER_MAIL_RETRY_BASE_DELAY_MS = "1";
    process.env.NEXTAUTH_URL = "https://zancta.tech";
    delete process.env.RESEND_API_KEY;
  }

  function hostingerSendBody(fetchMock: ReturnType<typeof vi.fn>, call = 0): Record<string, unknown> {
    const init = fetchMock.mock.calls[call][1] as RequestInit;
    return JSON.parse(init.body as string) as Record<string, unknown>;
  }

  it("fails closed instead of falling back to console in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.EMAIL_PROVIDER = "resend";
    delete process.env.RESEND_API_KEY;
    const { getEmailAdapter } = await import("@/lib/email");
    expect(() => getEmailAdapter()).toThrow("RESEND_API_KEY missing");
  });

  it("sends branded HTML, plain text, reply-to, and the exact reset subject", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.EMAIL_PROVIDER = "resend";
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
    process.env.EMAIL_PROVIDER = "resend";
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
    process.env.EMAIL_PROVIDER = "resend";
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
    process.env.EMAIL_PROVIDER = "resend";
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
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "noreply@mail.zancta.tech";
    delete process.env.PREVIEW_ALLOW_PRODUCTION_EMAIL;

    const { getEmailAdapter } = await import("@/lib/email");
    await getEmailAdapter().sendVerification("person@example.com", "https://zancta.tech/verify-email?token=preview");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends transactional email through Hostinger Mail when configured", async () => {
    vi.resetModules();
    configureHostingerEmail();

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getEmailAdapter } = await import("@/lib/email");
    await getEmailAdapter().sendVerification(
      "person@example.com",
      "https://zancta.tech/verify-email?token=hostinger"
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.mail.hostinger.com/api/v1/mailboxes/AC49fb3789b4ef7597d34bf38337ab/send");
    expect(init.method).toBe("POST");
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer hostinger_test_token");

    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.to).toEqual(["person@example.com"]);
    expect(body.subject).toBe("Verify your ZANCTA email address");
    expect(body.displayName).toBe("ZANCTA");
    expect(body.html).toEqual(expect.stringContaining("Verify email address"));
    expect(body.text).toEqual(expect.stringContaining("This verification link expires after 24 hours"));
    expect(body).not.toHaveProperty("replyTo");
  });

  it("does not send unsupported custom Reply-To fields in Hostinger mode", async () => {
    vi.resetModules();
    configureHostingerEmail();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getEmailAdapter } = await import("@/lib/email");
    const emailer = getEmailAdapter();
    await emailer.sendPasswordReset("person@example.com", "https://zancta.tech/reset-password?token=abc");
    await emailer.sendSubscriptionRenewed("person@example.com", {
      planLabel: "ZANCTA Premium Monthly",
      amountLabel: "₹199",
    });

    expect(hostingerSendBody(fetchMock, 0)).not.toHaveProperty("replyTo");
    expect(hostingerSendBody(fetchMock, 1)).not.toHaveProperty("replyTo");
  });

  it("omits unsupported reporter Reply-To for Hostinger contact notifications", async () => {
    vi.resetModules();
    configureHostingerEmail();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

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

    expect(hostingerSendBody(fetchMock)).not.toHaveProperty("replyTo");
  });

  it("rejects unsafe Reply-To values before Resend send", async () => {
    vi.resetModules();
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "noreply@mail.zancta.tech";
    process.env.NEXTAUTH_URL = "https://zancta.tech";
    sendMock.mockClear();

    const { getEmailAdapter } = await import("@/lib/email");
    await expect(
      getEmailAdapter().sendContactNotification({
        reference: "ZCT-MAIL0001",
        topicId: "general",
        topicLabel: "General",
        name: "Reporter",
        email: "reporter@example.com\r\nBcc: attacker@example.com",
        subject: "Possible issue",
        message: "A concise support request.",
        receivedAt: "2026-08-22T00:00:00.000Z",
        environment: "production",
        destination: "support@zancta.tech",
      })
    ).rejects.toThrow("Invalid reply mailbox");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("retries one transient Hostinger failure then succeeds", async () => {
    vi.resetModules();
    configureHostingerEmail();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "ERR_TEMPORARY" }), { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getEmailAdapter } = await import("@/lib/email");
    await getEmailAdapter().sendWelcome("person@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails after bounded Hostinger transient retries", async () => {
    vi.resetModules();
    configureHostingerEmail();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ code: "ERR_TEMPORARY" }), { status: 503 }))
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getEmailAdapter } = await import("@/lib/email");
    await expect(getEmailAdapter().sendWelcome("person@example.com")).rejects.toThrow(
      "Hostinger Mail API request failed: 503 ERR_TEMPORARY"
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([401, 403])("does not retry Hostinger authentication failure %s", async (status) => {
    vi.resetModules();
    configureHostingerEmail();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "ERR_UNAUTHORIZED" }), { status }));
    vi.stubGlobal("fetch", fetchMock);

    const { getEmailAdapter } = await import("@/lib/email");
    await expect(getEmailAdapter().sendWelcome("person@example.com")).rejects.toThrow(
      `Hostinger Mail API request failed: ${status} ERR_UNAUTHORIZED`
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry permanent Hostinger 4xx failures or leak provider details", async () => {
    vi.resetModules();
    configureHostingerEmail();
    const sensitiveDetail = "internal-mailbox-secret";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: "ERR_BAD_REQUEST", error: sensitiveDetail }), { status: 400 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getEmailAdapter } = await import("@/lib/email");
    const sendPromise = getEmailAdapter().sendWelcome("person@example.com");
    await expect(sendPromise).rejects.toThrow("Hostinger Mail API request failed: 400 ERR_BAD_REQUEST");
    await expect(sendPromise).rejects.not.toThrow(sensitiveDetail);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("honors and caps Hostinger 429 Retry-After before succeeding", async () => {
    vi.resetModules();
    configureHostingerEmail();
    vi.useFakeTimers();
    const timeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "ERR_RATE_LIMITED" }), {
        status: 429,
        headers: { "Retry-After": "60" },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getEmailAdapter } = await import("@/lib/email");
    const sendPromise = getEmailAdapter().sendWelcome("person@example.com");
    await vi.runAllTimersAsync();
    await sendPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(timeoutSpy.mock.calls.some((call) => Number(call[1]) === 5_000)).toBe(true);
  });

  it("retries Hostinger network failures within the bound", async () => {
    vi.resetModules();
    configureHostingerEmail();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network down with secret hostinger_test_token"))
      .mockRejectedValueOnce(new TypeError("network still down"))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const { getEmailAdapter } = await import("@/lib/email");
    await getEmailAdapter().sendWelcome("person@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("aborts a hung Hostinger request and fails without leaking the token", async () => {
    vi.resetModules();
    configureHostingerEmail();
    process.env.HOSTINGER_MAIL_TIMEOUT_MS = "1";
    process.env.HOSTINGER_MAIL_RETRY_BASE_DELAY_MS = "1";
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getEmailAdapter } = await import("@/lib/email");
    await expect(getEmailAdapter().sendWelcome("person@example.com")).rejects.toThrow(
      "Hostinger Mail API request timed out"
    );
    await expect(getEmailAdapter().sendWelcome("person@example.com")).rejects.not.toThrow("hostinger_test_token");
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
