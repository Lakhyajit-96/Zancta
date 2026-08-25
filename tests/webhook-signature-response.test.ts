import { afterAll, beforeAll, describe, expect, it } from "vitest";
import crypto from "crypto";
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { POST } from "@/app/api/payments/webhooks/dodo/route";

const TEST_SECRET = "whsec_" + Buffer.from("webhook_sig_secret_1234567890abcd").toString("base64");
const stamp = Date.now();
const INTERNAL_LEAKS = [
  "Missing webhook headers",
  "expected webhook-id",
  "Invalid webhook-timestamp",
  "outside 5min",
  "possible replay",
  "Invalid webhook signature",
  "Missing env",
  "DODO_WEBHOOK_SECRET",
  "DODO_PAYMENTS_WEBHOOK_SECRET",
  "Invalid JSON payload",
  "Missing webhook-id",
  "stack",
  "whsec_",
  "at verifyStandardWebhook",
];

function sign(raw: string, id: string, ts: string) {
  const bare = TEST_SECRET.startsWith("whsec_") ? TEST_SECRET.slice(6) : TEST_SECRET;
  const key = Buffer.from(bare, "base64");
  return `v1,${crypto.createHmac("sha256", key).update(`${id}.${ts}.${raw}`, "utf8").digest("base64")}`;
}

async function postWebhook(opts: {
  body: string;
  headers?: Record<string, string>;
  ip?: string;
}) {
  const req = new NextRequest("http://localhost:3000/api/payments/webhooks/dodo", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": opts.ip || `203.0.113.${1 + Math.floor(Math.random() * 200)}`,
      ...(opts.headers || {}),
    },
    body: opts.body,
  });
  const res = await POST(req);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, text: JSON.stringify(json) };
}

function expectGenericUnauthorized(result: { status: number; json: unknown; text: string }) {
  expect(result.status).toBe(401);
  expect(result.json).toEqual({ error: "Invalid signature" });
  for (const leak of INTERNAL_LEAKS) {
    expect(result.text).not.toContain(leak);
  }
}

describe("Dodo webhook signature failures are externally generic", () => {
  const raw = JSON.stringify({
    event_type: "subscription.active",
    data: { subscription_id: `sub_sig_${stamp}`, metadata: { userId: "nobody" } },
  });
  let adminId = "";
  let freeId = "";
  const prevSecret = process.env.DODO_WEBHOOK_SECRET;
  const prevAlt = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

  beforeAll(async () => {
    process.env.DODO_WEBHOOK_SECRET = TEST_SECRET;
    delete process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
    const admin = await prisma.user.create({ data: { email: `wh-admin-${stamp}@example.com` } });
    adminId = admin.id;
    await prisma.entitlement.create({
      data: { userId: adminId, plan: "ADMIN", status: "ACTIVE", source: "OPERATOR_BOOTSTRAP" },
    });
    const free = await prisma.user.create({ data: { email: `wh-free-${stamp}@example.com` } });
    freeId = free.id;
    await prisma.entitlement.create({ data: { userId: freeId, plan: "FREE", status: "ACTIVE" } });
  });

  afterAll(async () => {
    if (prevSecret === undefined) delete process.env.DODO_WEBHOOK_SECRET;
    else process.env.DODO_WEBHOOK_SECRET = prevSecret;
    if (prevAlt === undefined) delete process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
    else process.env.DODO_PAYMENTS_WEBHOOK_SECRET = prevAlt;
    const ids = [adminId, freeId].filter(Boolean);
    await prisma.webhookEvent.deleteMany({ where: { providerEventId: { startsWith: `wh_sig_${stamp}` } } }).catch(() => {});
    await prisma.entitlement.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
  });

  it("TEST 1: missing signature headers → generic 401", async () => {
    expectGenericUnauthorized(await postWebhook({ body: raw }));
  });

  it("TEST 2: malformed signature → generic 401", async () => {
    expectGenericUnauthorized(
      await postWebhook({
        body: raw,
        headers: {
          "webhook-id": `wh_sig_${stamp}_malformed`,
          "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
          "webhook-signature": "not-a-valid-signature",
        },
      }),
    );
  });

  it("TEST 3: invalid signature → generic 401", async () => {
    expectGenericUnauthorized(
      await postWebhook({
        body: raw,
        headers: {
          "webhook-id": `wh_sig_${stamp}_invalid`,
          "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
          "webhook-signature": "v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        },
      }),
    );
  });

  it("TEST 4: expired timestamp → generic 401", async () => {
    const id = `wh_sig_${stamp}_expired`;
    const ts = String(Math.floor(Date.now() / 1000) - 10 * 60);
    expectGenericUnauthorized(
      await postWebhook({
        body: raw,
        headers: {
          "webhook-id": id,
          "webhook-timestamp": ts,
          "webhook-signature": sign(raw, id, ts),
        },
      }),
    );
  });

  it("TEST 5: invalid webhook-id / signature metadata → generic 401", async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    expectGenericUnauthorized(
      await postWebhook({
        body: raw,
        headers: {
          "webhook-id": "",
          "webhook-timestamp": ts,
          "webhook-signature": sign(raw, "wh_sig_empty", ts),
        },
      }),
    );
  });

  it("TEST 6: missing webhook secret stays generic externally", async () => {
    const saved = process.env.DODO_WEBHOOK_SECRET;
    const savedAlt = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
    delete process.env.DODO_WEBHOOK_SECRET;
    delete process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
    try {
      const id = `wh_sig_${stamp}_config`;
      const ts = String(Math.floor(Date.now() / 1000));
      expectGenericUnauthorized(
        await postWebhook({
          body: raw,
          headers: {
            "webhook-id": id,
            "webhook-timestamp": ts,
            "webhook-signature": sign(raw, id, ts),
          },
        }),
      );
    } finally {
      if (saved !== undefined) process.env.DODO_WEBHOOK_SECRET = saved;
      if (savedAlt !== undefined) process.env.DODO_PAYMENTS_WEBHOOK_SECRET = savedAlt;
    }
  });

  it("TEST 7: valid signature keeps existing success behavior", async () => {
    const id = `wh_sig_${stamp}_ok`;
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({
      event_type: "payment.succeeded",
      data: { payment_id: `pay_sig_${stamp}`, metadata: { userId: freeId } },
    });
    const result = await postWebhook({
      body,
      headers: {
        "webhook-id": id,
        "webhook-timestamp": ts,
        "webhook-signature": sign(body, id, ts),
      },
    });
    expect(result.status).toBe(200);
    expect(result.json).toMatchObject({ ok: true });
    expect(result.text).not.toContain("Invalid webhook signature");
    expect(result.text).not.toContain("Missing webhook headers");
  });

  it("TEST 8: valid webhook still uses webhook-id as the idempotency key", async () => {
    const id = `wh_sig_${stamp}_idem`;
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({
      event_type: "payment.succeeded",
      data: { payment_id: `pay_sig_idem_${stamp}`, metadata: { userId: freeId } },
    });
    const headers = {
      "webhook-id": id,
      "webhook-timestamp": ts,
      "webhook-signature": sign(body, id, ts),
    };
    const first = await postWebhook({ body, headers });
    expect(first.status).toBe(200);
    const second = await postWebhook({ body, headers });
    expect(second.status).toBe(200);
    expect(second.json).toMatchObject({ ok: true, duplicate: true });
    const stored = await prisma.webhookEvent.findUnique({ where: { providerEventId: id } });
    expect(stored?.status).toBe("succeeded");
  });

  it("TEST 9: invalid webhook never mutates a normal entitlement", async () => {
    const before = await prisma.entitlement.findUnique({ where: { userId: freeId } });
    const body = JSON.stringify({
      event_type: "subscription.active",
      data: {
        subscription_id: `sub_sig_attack_${stamp}`,
        metadata: { userId: freeId, planId: "PREMIUM_MONTHLY" },
        status: "active",
      },
    });
    expectGenericUnauthorized(
      await postWebhook({
        body,
        headers: {
          "webhook-id": `wh_sig_${stamp}_mut_free`,
          "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
          "webhook-signature": "v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        },
      }),
    );
    const after = await prisma.entitlement.findUnique({ where: { userId: freeId } });
    expect(after?.plan).toBe(before?.plan);
    expect(after?.status).toBe(before?.status);
    expect(after?.updatedAt.getTime()).toBe(before?.updatedAt.getTime());
  });

  it("TEST 10: invalid webhook cannot affect an ADMIN entitlement", async () => {
    const before = await prisma.entitlement.findUnique({ where: { userId: adminId } });
    const body = JSON.stringify({
      event_type: "subscription.expired",
      data: {
        subscription_id: `sub_sig_admin_${stamp}`,
        metadata: { userId: adminId },
        status: "expired",
      },
    });
    expectGenericUnauthorized(
      await postWebhook({
        body,
        headers: {
          "webhook-id": `wh_sig_${stamp}_mut_admin`,
          "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
          "webhook-signature": "v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        },
      }),
    );
    const after = await prisma.entitlement.findUnique({ where: { userId: adminId } });
    expect(after?.plan).toBe("ADMIN");
    expect(after?.status).toBe("ACTIVE");
    expect(after?.source).toBe("OPERATOR_BOOTSTRAP");
    expect(after?.updatedAt.getTime()).toBe(before?.updatedAt.getTime());
  });
});
