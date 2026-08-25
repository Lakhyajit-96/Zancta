import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import {
  AUTH_EMAIL_DELIVERY_LIMIT,
  authEmailRateLimitKey,
  limitAuthEmailDelivery,
  normalizeAuthEmail,
} from "@/lib/auth-email-rate-limit";

(process.env as Record<string, string | undefined>).NODE_ENV = "test";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const GENERIC_FORGOT = "If that email exists, a reset link has been sent.";
const GENERIC_SIGNUP = "If this email can receive messages from ZANCTA, check your inbox for next steps.";
const stamp = Date.now();

function req(path: string, body: unknown, ip: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

async function forgot(email: string, ip: string) {
  const { POST } = await import("@/app/api/auth/forgot-password/route");
  const res = await POST(req("/api/auth/forgot-password", { email }, ip));
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function signup(email: string, ip: string, password = "SignupPass12345!") {
  const { POST } = await import("@/app/api/auth/signup/route");
  const res = await POST(req("/api/auth/signup", { email, password, name: "T" }, ip));
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describe("auth email rate-limit keys", () => {
  it("normalizes trim/lowercase and never embeds the raw address", () => {
    expect(normalizeAuthEmail("  Victim@Example.COM ")).toBe("victim@example.com");
    const key = authEmailRateLimitKey("forgot-password", "Victim@Example.COM");
    expect(key.startsWith("forgot-password-email:")).toBe(true);
    expect(key).not.toContain("@");
    expect(key.toLowerCase()).not.toContain("victim@example.com");
    expect(key).toMatch(/^forgot-password-email:[0-9a-f]{64}$/);
    expect(authEmailRateLimitKey("forgot-password", "victim@example.com")).toBe(key);
    expect(authEmailRateLimitKey("resend-verify", "victim@example.com")).not.toBe(key);
  });
});

describe("forgot-password per-email cooldown", () => {
  const victim = `fp-victim-${stamp}@example.com`;
  const other = `fp-other-${stamp}@example.com`;
  const missing = `fp-missing-${stamp}@example.com`;
  let userId = "";
  let otherId = "";

  beforeAll(async () => {
    const u = await prisma.user.create({
      data: { email: victim, passwordHash: await bcrypt.hash("ForgotPass12345!", 12), emailVerified: new Date() },
    });
    userId = u.id;
    const o = await prisma.user.create({
      data: { email: other, passwordHash: await bcrypt.hash("ForgotPass12345!", 12), emailVerified: new Date() },
    });
    otherId = o.id;
  });

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: [userId, otherId] } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: [userId, otherId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherId] } } }).catch(() => {});
  });

  it("TEST 1-3 + abuse: first three sends allowed; rotating IP does not bypass the 4th", async () => {
    const first = await forgot(victim, "198.51.100.1");
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ ok: true, message: GENERIC_FORGOT });
    expect(await prisma.passwordResetToken.count({ where: { userId, usedAt: null } })).toBe(1);

    const second = await forgot(victim, "198.51.100.2");
    expect(second.status).toBe(200);
    expect(second.body.message).toBe(GENERIC_FORGOT);
    const third = await forgot(victim, "198.51.100.3");
    expect(third.status).toBe(200);

    const afterThree = await prisma.passwordResetToken.findMany({ where: { userId, usedAt: null } });
    expect(afterThree).toHaveLength(1);

    const fourth = await forgot(victim, "198.51.100.4");
    expect(fourth.status).toBe(200);
    expect(fourth.body).toEqual({ ok: true, message: GENERIC_FORGOT });
    expect(fourth.body.error).toBeUndefined();
    expect(JSON.stringify(fourth.body)).not.toMatch(/Email not registered|already exists|Too many requests for this account|"cooldown"/i);
    const afterFour = await prisma.passwordResetToken.findMany({ where: { userId, usedAt: null } });
    expect(afterFour).toHaveLength(1);
    expect(afterFour[0].token).toBe(afterThree[0].token);
  });

  it("TEST 4: a different email is independent", async () => {
    const res = await forgot(other, "198.51.100.5");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe(GENERIC_FORGOT);
    expect(await prisma.passwordResetToken.count({ where: { userId: otherId, usedAt: null } })).toBe(1);
  });

  it("TEST 6: invalid email remains 400", async () => {
    const res = await forgot("not-an-email", "198.51.100.6");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid email");
  });

  it("TEST 7-8 + 10: existing and missing accounts share the generic success body", async () => {
    const missingRes = await forgot(missing, "198.51.100.7");
    expect(missingRes.status).toBe(200);
    expect(missingRes.body).toEqual({ ok: true, message: GENERIC_FORGOT });
  });

  it("TEST 5: existing IP limiter still fires after 5 valid emails from one IP", async () => {
    const ip = "198.51.100.80";
    for (let i = 0; i < 5; i++) {
      const res = await forgot(`fp-ip-${stamp}-${i}@example.com`, ip);
      expect(res.status).toBe(200);
    }
    const blocked = await forgot(`fp-ip-${stamp}-last@example.com`, ip);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe("Too many attempts");
  });
});

describe("signup unverified resend shares the verification email cooldown", () => {
  const unverified = `su-unverified-${stamp}@example.com`;
  const fresh = `su-fresh-${stamp}@example.com`;
  const verified = `su-verified-${stamp}@example.com`;
  const ids: string[] = [];

  beforeAll(async () => {
    const u = await prisma.user.create({ data: { email: unverified, passwordHash: await bcrypt.hash("SignupPass12345!", 12) } });
    ids.push(u.id);
    const v = await prisma.user.create({
      data: { email: verified, passwordHash: await bcrypt.hash("SignupPass12345!", 12), emailVerified: new Date() },
    });
    ids.push(v.id);
  });

  afterAll(async () => {
    await prisma.verificationToken.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.entitlement.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
  });

  it("TESTs 13-16: first three unverified signup resends send; IP rotation cannot send a 4th", async () => {
    const first = await signup(unverified, "203.0.113.1");
    expect(first.status).toBe(200);
    expect(first.body.message).toBe(GENERIC_SIGNUP);
    const t1 = await prisma.verificationToken.findMany({ where: { identifier: unverified } });
    expect(t1).toHaveLength(1);

    await signup(unverified, "203.0.113.2");
    await signup(unverified, "203.0.113.3");
    const afterThree = await prisma.verificationToken.findMany({ where: { identifier: unverified } });
    expect(afterThree).toHaveLength(1);

    const fourth = await signup(unverified, "203.0.113.4");
    expect(fourth.status).toBe(200);
    expect(fourth.body).toEqual({ ok: true, message: GENERIC_SIGNUP });
    const afterFour = await prisma.verificationToken.findMany({ where: { identifier: unverified } });
    expect(afterFour).toHaveLength(1);
    expect(afterFour[0].token).toBe(afterThree[0].token);
  });

  it("TEST 17: a new email still creates an account (resend limiter does not block unrelated signups)", async () => {
    const res = await signup(fresh, "203.0.113.10");
    expect(res.status).toBe(200);
    const user = await prisma.user.findUnique({ where: { email: fresh } });
    expect(user).not.toBeNull();
    ids.push(user!.id);
    expect(await prisma.entitlement.findUnique({ where: { userId: user!.id } })).toBeTruthy();
  });

  it("TEST 18: verified existing email stays generic and does not create a second user", async () => {
    const before = await prisma.user.count({ where: { email: verified } });
    const res = await signup(verified, "203.0.113.11");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe(GENERIC_SIGNUP);
    expect(await prisma.user.count({ where: { email: verified } })).toBe(before);
  });
});

describe("limitAuthEmailDelivery fail-closed inherits rateLimitAsync", () => {
  it("TEST 11-12: production without Upstash fails closed (same as Phase 6A-1)", async () => {
    const env = process.env as Record<string, string | undefined>;
    const prevNode = env.NODE_ENV;
    const prevVercel = env.VERCEL_ENV;
    const prevUrl = env.UPSTASH_REDIS_REST_URL;
    const prevToken = env.UPSTASH_REDIS_REST_TOKEN;
    env.NODE_ENV = "production";
    env.VERCEL_ENV = "production";
    delete env.UPSTASH_REDIS_REST_URL;
    delete env.UPSTASH_REDIS_REST_TOKEN;
    try {
      const { rateLimitAsync } = await import("@/lib/rate-limit");
      const ip = await rateLimitAsync("forgot:203.0.113.99", 5, 15 * 60 * 1000);
      expect(ip.ok).toBe(false);
      const email = await limitAuthEmailDelivery("forgot-password", `fp-closed-${stamp}@example.com`);
      expect(email.ok).toBe(false);
    } finally {
      env.NODE_ENV = prevNode;
      if (prevVercel === undefined) delete env.VERCEL_ENV;
      else env.VERCEL_ENV = prevVercel;
      if (prevUrl === undefined) delete env.UPSTASH_REDIS_REST_URL;
      else env.UPSTASH_REDIS_REST_URL = prevUrl;
      if (prevToken === undefined) delete env.UPSTASH_REDIS_REST_TOKEN;
      else env.UPSTASH_REDIS_REST_TOKEN = prevToken;
    }
  });
});

describe("AUTH_EMAIL_DELIVERY_LIMIT", () => {
  it("is 3 per hour to match resend-verification", () => {
    expect(AUTH_EMAIL_DELIVERY_LIMIT).toBe(3);
  });
});
