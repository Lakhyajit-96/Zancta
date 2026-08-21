import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import prisma from "@/lib/db";
import { DodoProvider } from "@/lib/payments/providers/dodo";
import { syncEntitlement } from "@/lib/payments/entitlement-sync";
import { canShowAds, getEntitlement, hasEntitlement } from "@/lib/entitlement";

function makeSig(raw: string, secret: string, id: string, ts: string) {
  const bare = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(bare, "base64");
    if (key.length === 0) throw new Error("bad");
  } catch { key = Buffer.from(secret, "utf8"); }
  const signed = `${id}.${ts}.${raw}`;
  return crypto.createHmac("sha256", key).update(signed, "utf8").digest("base64");
}

const TEST_SECRET = "whsec_" + Buffer.from("test_secret_1234567890_test_secret_1234").toString("base64");
const TEST_SECRET_RAW = "test_secret_1234567890_test_secret_1234";

describe("payments lifecycle (sandbox code paths, no live Dodo)", () => {
  const userEmail = `paytest_${Date.now()}@example.com`;
  let userId: string;

  beforeAll(async () => {
    const u = await prisma.user.create({ data: { email: userEmail, passwordHash: "x" } });
    userId = u.id;
    await prisma.entitlement.create({ data: { userId, plan: "FREE", status: "ACTIVE" } });
    // Ensure webhook secret env for provider
    process.env.DODO_WEBHOOK_SECRET = TEST_SECRET;
    process.env.DODO_API_KEY = "test_dummy_key_for_code_path";
  });

  afterAll(async () => {
    // Cleanup
    await prisma.webhookEvent.deleteMany({ where: { provider: "dodo", providerEventId: { contains: `test_${userId}` } } }).catch(()=>{});
    await prisma.payment.deleteMany({ where: { userId } }).catch(()=>{});
    await prisma.paymentSubscription.deleteMany({ where: { userId } }).catch(()=>{});
    await prisma.entitlement.deleteMany({ where: { userId } }).catch(()=>{});
    await prisma.auditEvent.deleteMany({ where: { userId } }).catch(()=>{});
    await prisma.user.delete({ where: { id: userId } }).catch(()=>{});
  });

  it("Dodo webhook signature: valid accepted", async () => {
    const p = new DodoProvider();
    const raw = JSON.stringify({ event_type: "payment.succeeded", event_id: `test_${userId}_valid`, data: { payment_id: `pay_${userId}`, customer_email: userEmail, total_amount: 500, currency: "USD" } });
    const id = "msg_valid1";
    const ts = Math.floor(Date.now()/1000).toString();
    const sig = makeSig(raw, TEST_SECRET, id, ts);
    const res = await p.verifyWebhook({ rawBody: raw, headers: { "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${sig}` } });
    expect(res.ok).toBe(true);
    expect(res.eventType).toBe("payment.succeeded");
    expect(res.providerEventId).toBe(id);
  });

  it("Dodo webhook: modified body rejected (raw-body requirement)", async () => {
    const p = new DodoProvider();
    const raw = JSON.stringify({ event_type: "payment.succeeded", event_id: `test_${userId}_raw`, data: { payment_id: "pay_x" } });
    const pretty = JSON.stringify(JSON.parse(raw), null, 2); // same JSON, different raw
    const id = "msg_raw1";
    const ts = Math.floor(Date.now()/1000).toString();
    const sig = makeSig(raw, TEST_SECRET, id, ts);
    // Verify with pretty (re-serialized) should fail — raw mismatch
    const res = await p.verifyWebhook({ rawBody: pretty, headers: { "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${sig}` } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Invalid webhook signature/);
  });

  it("Dodo webhook: modified signature rejected", async () => {
    const p = new DodoProvider();
    const raw = JSON.stringify({ event_type: "payment.succeeded", event_id: `test_${userId}_badsig`, data: {} });
    const id = "msg_bad1";
    const ts = Math.floor(Date.now()/1000).toString();
    const badSig = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    const res = await p.verifyWebhook({ rawBody: raw, headers: { "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${badSig}` } });
    expect(res.ok).toBe(false);
  });

  it("Dodo webhook: wrong secret rejected", async () => {
    const p = new DodoProvider();
    const raw = JSON.stringify({ event_type: "payment.succeeded", event_id: `test_${userId}_wrongsec`, data: {} });
    const id = "msg_wrong1";
    const ts = Math.floor(Date.now()/1000).toString();
    const sigWithOther = makeSig(raw, "whsec_" + Buffer.from("other_secret_other_secret_other_1234").toString("base64"), id, ts);
    const res = await p.verifyWebhook({ rawBody: raw, headers: { "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${sigWithOther}` } });
    expect(res.ok).toBe(false);
  });

  it("Dodo webhook: expired timestamp rejected (replay protection)", async () => {
    const p = new DodoProvider();
    const raw = JSON.stringify({ event_type: "payment.succeeded", event_id: `test_${userId}_expired`, data: {} });
    const id = "msg_exp1";
    const ts = (Math.floor(Date.now()/1000) - 10*60).toString(); // 10 min ago, outside 5 min
    const sig = makeSig(raw, TEST_SECRET, id, ts);
    const res = await p.verifyWebhook({ rawBody: raw, headers: { "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${sig}` } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/outside 5min/);
  });

  it("WebhookEvent idempotency: unique providerEventId", async () => {
    const eventId = `test_${userId}_idem_${Date.now()}`;
    await prisma.webhookEvent.create({ data: { provider: "dodo", providerEventId: eventId, eventType: "payment.succeeded", payloadHash: "abc" } });
    // Second insert should throw unique constraint
    let threw = false;
    try { await prisma.webhookEvent.create({ data: { provider: "dodo", providerEventId: eventId, eventType: "payment.succeeded", payloadHash: "abc" } }); } catch (e: unknown) { if ((e as {code?:string}).code === "P2002") threw = true; }
    expect(threw).toBe(true);
    await prisma.webhookEvent.delete({ where: { providerEventId: eventId } }).catch(()=>{});
  });

  it("Entitlement activation: FREE -> PREMIUM ACTIVE via syncEntitlement", async () => {
    let ent = await getEntitlement(userId);
    expect(ent.plan).toBe("FREE");
    const subId = `sub_act_${userId}`;
    const periodEnd = new Date(Date.now()+30*86400000);
    await prisma.paymentSubscription.create({
      data: {
        userId,
        provider: "dodo",
        providerSubscriptionId: subId,
        plan: "PREMIUM_MONTHLY",
        status: "active",
        currentPeriodEnd: periodEnd,
      },
    });
    await syncEntitlement({
      userId,
      provider: "dodo",
      plan: "PREMIUM",
      status: "ACTIVE",
      providerSubscriptionId: subId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      providerEventId: `test_${userId}_act`,
      eventTimestamp: Math.floor(Date.now() / 1000),
    });
    ent = await getEntitlement(userId);
    expect(ent.plan).toBe("PREMIUM");
    expect(ent.status).toBe("ACTIVE");
    expect(ent.providerBacked).toBe(true);
    expect(hasEntitlement(ent, "PREMIUM")).toBe(true);
    expect(canShowAds(ent)).toBe(false);
  });

  it("Entitlement: canShowAds matrix", async () => {
    expect(canShowAds(null)).toBe(true); // anonymous
    expect(canShowAds({ plan: "FREE" as const, status: "ACTIVE" as const })).toBe(true);
    expect(canShowAds({ plan: "PREMIUM" as const, status: "ACTIVE" as const })).toBe(false);
    expect(canShowAds({ plan: "ADMIN" as const, status: "ACTIVE" as const })).toBe(false);
    // Expired should be ads-eligible again
    const expired = { plan: "EXPIRED" as const, status: "EXPIRED" as const };
    expect(canShowAds(expired)).toBe(true);
  });

  it("Entitlement: cancel at period end keeps ACTIVE until expiry", async () => {
    const future = new Date(Date.now()+10*86400000);
    const sub = await prisma.paymentSubscription.findFirst({ where: { userId } });
    if (sub) {
      await prisma.paymentSubscription.update({
        where: { id: sub.id },
        data: { status: "cancelled", cancelAtPeriodEnd: true, currentPeriodEnd: future },
      });
    }
    await syncEntitlement({
      userId,
      provider: "dodo",
      plan: "PREMIUM",
      status: "ACTIVE",
      providerSubscriptionId: sub?.providerSubscriptionId,
      currentPeriodEnd: future,
      cancelAtPeriodEnd: true,
      providerEventId: `test_${userId}_cancel`,
      eventTimestamp: Math.floor(Date.now() / 1000),
    });
    let ent = await getEntitlement(userId);
    expect(ent.plan).toBe("PREMIUM");
    expect(ent.status).toBe("ACTIVE");
    expect(ent.cancelAtPeriodEnd).toBe(true);
    await prisma.entitlement.update({ where: { userId }, data: { expiresAt: future } });
    if (sub) {
      await prisma.paymentSubscription.update({
        where: { id: sub.id },
        data: { currentPeriodEnd: future, status: "cancelled", cancelAtPeriodEnd: true },
      });
    }
    ent = await getEntitlement(userId);
    expect(ent.status).toBe("ACTIVE");
    await prisma.entitlement.update({ where: { userId }, data: { expiresAt: new Date(Date.now()-1000) } });
    if (sub) {
      await prisma.paymentSubscription.update({
        where: { id: sub.id },
        data: { currentPeriodEnd: new Date(Date.now()-1000), status: "expired" },
      });
    }
    ent = await getEntitlement(userId);
    expect(ent.status).toBe("EXPIRED");
  });

  it("Out-of-order: older webhook must not downgrade newer ACTIVE period", async () => {
    const newerEnd = new Date(Date.now()+30*86400000);
    const olderEnd = new Date(Date.now()+5*86400000);
    const sub = await prisma.paymentSubscription.findFirst({ where: { userId } });
    if (sub) {
      await prisma.paymentSubscription.update({
        where: { id: sub.id },
        data: { status: "active", cancelAtPeriodEnd: false, currentPeriodEnd: newerEnd },
      });
    }
    await syncEntitlement({
      userId,
      provider: "dodo",
      plan: "PREMIUM",
      status: "ACTIVE",
      providerSubscriptionId: sub?.providerSubscriptionId,
      currentPeriodEnd: newerEnd,
      providerEventId: `test_${userId}_newer`,
      eventTimestamp: 2_000,
    });
    let ent = await getEntitlement(userId);
    expect(ent.currentPeriodEnd?.getTime()).toBe(newerEnd.getTime());
    const stale = await syncEntitlement({
      userId,
      provider: "dodo",
      plan: "PREMIUM",
      status: "ACTIVE",
      providerSubscriptionId: sub?.providerSubscriptionId,
      currentPeriodEnd: olderEnd,
      providerEventId: `test_${userId}_older`,
      eventTimestamp: 1_000,
    });
    expect(stale.applied).toBe(false);
    expect(stale.reason).toBe("stale_event");
    ent = await getEntitlement(userId);
    expect(ent.currentPeriodEnd?.getTime()).toBe(newerEnd.getTime());
  });

  it("refuses PREMIUM without a provider subscription id", async () => {
    const result = await syncEntitlement({
      userId,
      provider: "dodo",
      plan: "PREMIUM",
      status: "ACTIVE",
      providerEventId: `test_${userId}_noids`,
    });
    expect(result.applied).toBe(false);
    expect(result.reason).toBe("refused_premium_without_provider_subscription");
  });

  it("Subscription + Payment records: minimal fields only", async () => {
    const subId = `sub_${userId}_${Date.now()}`;
    const payId = `pay_${userId}_${Date.now()}`;
    await prisma.paymentSubscription.create({ data: { userId, provider: "dodo", providerSubscriptionId: subId, plan: "PREMIUM_MONTHLY", status: "active", currentPeriodEnd: new Date(Date.now()+30*86400000) } });
    await prisma.payment.create({ data: { userId, provider: "dodo", providerPaymentId: payId, amount: 500, currency: "USD", status: "succeeded" } });
    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    const pay = await prisma.payment.findUnique({ where: { providerPaymentId: payId } });
    expect(sub?.providerSubscriptionId).toBe(subId);
    expect(pay?.amount).toBe(500);
    // Ensure no card columns exist
    expect((pay as unknown as Record<string,unknown>).cardNumber).toBeUndefined();
    await prisma.payment.delete({ where: { providerPaymentId: payId } });
    await prisma.paymentSubscription.delete({ where: { providerSubscriptionId: subId } });
  });
});
