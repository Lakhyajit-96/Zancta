import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { contactEnquirySchema, containsHeaderInjection, createContactReference } from "@/lib/contact/schema";
import { mailboxForTopic } from "@/lib/contact/topics";
import { contactAcknowledgementEmail, contactInternalEmail } from "@/lib/email/templates";
import { renderEmailHtml, renderEmailText } from "@/lib/email/layout";

(process.env as Record<string, string | undefined>).NODE_ENV = "test";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

const notify = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const ack = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/email", () => ({
  getEmailAdapter: () => ({
    sendContactNotification: notify,
    sendContactAcknowledgement: ack,
  }),
}));

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Alex Example",
    email: "alex@example.com",
    topic: "general",
    subject: "Question about merge",
    message: "The merge tool reported an honest error on a supported PDF. What should I check next?",
    website: "",
    ...overrides,
  };
}

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      "x-forwarded-for": headers["x-forwarded-for"] || `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function post(body: unknown, headers?: Record<string, string>) {
  const { POST } = await import("@/app/api/contact/route");
  const res = await POST(makeReq(body, headers));
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

describe("contact enquiry validation and routing", () => {
  afterEach(() => {
    notify.mockClear();
    ack.mockClear();
  });

  it("creates ZCT reference IDs", () => {
    expect(createContactReference()).toMatch(/^ZCT-[0-9A-F]{10}$/);
  });

  it("rejects header injection in name, email, and subject", () => {
    expect(containsHeaderInjection("ok")).toBe(false);
    expect(containsHeaderInjection("bad\r\nBcc: attacker@example.com")).toBe(true);
    expect(contactEnquirySchema.safeParse(validBody({ name: "A\nBcc:x" })).success).toBe(false);
    expect(contactEnquirySchema.safeParse(validBody({ subject: "Hi\r\nTo:evil@x" })).success).toBe(false);
    expect(contactEnquirySchema.safeParse(validBody({ email: "ok@example.com\nCc:evil@x" })).success).toBe(false);
  });

  it("routes topics to existing mailboxes only", () => {
    expect(mailboxForTopic("general")).toBe("support@zancta.tech");
    expect(mailboxForTopic("technical")).toBe("support@zancta.tech");
    expect(mailboxForTopic("account")).toBe("support@zancta.tech");
    expect(mailboxForTopic("partnership")).toBe("support@zancta.tech");
    expect(mailboxForTopic("other")).toBe("support@zancta.tech");
    expect(mailboxForTopic("privacy")).toBe("privacy@zancta.tech");
    expect(mailboxForTopic("security")).toBe("security@zancta.tech");
    expect(mailboxForTopic("billing")).toBe("billing@zancta.tech");
    expect(mailboxForTopic("refund")).toBe("billing@zancta.tech");
  });

  it("accepts a valid enquiry and sends internal plus acknowledgement", async () => {
    const { status, json } = await post(validBody({ topic: "privacy" }));
    expect(status).toBe(200);
    expect(json.ok).toBe(true);
    expect(String(json.reference)).toMatch(/^ZCT-[0-9A-F]{10}$/);
    expect(notify).toHaveBeenCalledOnce();
    expect(ack).toHaveBeenCalledOnce();
    const payload = notify.mock.calls[0][0] as { destination: string; topicId: string; email: string };
    expect(payload.destination).toBe("privacy@zancta.tech");
    expect(payload.topicId).toBe("privacy");
    expect(payload.email).toBe("alex@example.com");
  });

  it("ignores unauthorized destination fields", async () => {
    await post(validBody({ topic: "general", destination: "security@zancta.tech", to: "attacker@example.com" }));
    expect(notify.mock.calls[0][0].destination).toBe("support@zancta.tech");
  });

  it("silently accepts honeypot spam without sending mail", async () => {
    const { status, json } = await post(validBody({ website: "https://spam.example" }));
    expect(status).toBe(200);
    expect(json.ok).toBe(true);
    expect(notify).not.toHaveBeenCalled();
    expect(ack).not.toHaveBeenCalled();
  });

  it("rejects missing origin", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const req = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.9" },
      body: JSON.stringify(validBody()),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(notify).not.toHaveBeenCalled();
  });

  it("rejects a foreign origin", async () => {
    const { status } = await post(validBody(), { origin: "https://evil.example" });
    expect(status).toBe(403);
    expect(notify).not.toHaveBeenCalled();
  });

  it("rejects invalid email, short message, and oversized payload", async () => {
    expect((await post(validBody({ email: "not-an-email" }))).status).toBe(400);
    expect((await post(validBody({ message: "too short" }))).status).toBe(400);
    const huge = "x".repeat(21_000);
    expect((await post(huge)).status).toBe(413);
  });

  it("rate-limits repeated submissions from one IP", async () => {
    const ip = "198.51.100.44";
    for (let i = 0; i < 5; i += 1) {
      const res = await post(validBody({ email: `person${i}@example.com` }), { "x-forwarded-for": ip });
      expect(res.status).toBe(200);
    }
    const blocked = await post(validBody({ email: "later@example.com" }), { "x-forwarded-for": ip });
    expect(blocked.status).toBe(429);
    expect(blocked.json.error).toBe("Please try again later.");
  });

  it("escapes HTML and does not echo secrets in contact emails", () => {
    const payload = {
      reference: "ZCT-TESTREF01",
      topicId: "security" as const,
      topicLabel: "Security report",
      name: `<script>alert(1)</script>`,
      email: "reporter@example.com",
      subject: "Possible XSS <img src=x onerror=alert(1)>",
      message: "Details <b>bold</b>\nsecond line",
      receivedAt: "2026-08-22T00:00:00.000Z",
      environment: "test",
      destination: "security@zancta.tech",
    };
    const html = renderEmailHtml(contactInternalEmail(payload));
    const text = renderEmailText(contactAcknowledgementEmail(payload));
    expect(html).toContain("ZCT-TESTREF01");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("RESEND_API_KEY");
    expect(html).not.toContain("AUTH_SECRET");
    expect(text).toContain("We received your enquiry");
    expect(text).toContain("ZCT-TESTREF01");
    expect(text).not.toContain("Lakhyajit Changmai");
  });
});
