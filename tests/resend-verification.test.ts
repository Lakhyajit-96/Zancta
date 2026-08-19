import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/lib/db";

// Force in-memory rate limiting and the test email adapter for this suite.
(process.env as Record<string, string | undefined>).NODE_ENV = "test";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const GENERIC = "If that email is registered and not verified yet, a new verification email is on its way.";

function makeReq(email: string, ip: string) {
  return new NextRequest("http://localhost:3000/api/auth/resend-verification", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ email }),
  });
}

async function call(email: string, ip: string) {
  const { POST } = await import("@/app/api/auth/resend-verification/route");
  const res = await POST(makeReq(email, ip));
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describe("resend-verification lifecycle", () => {
  const ts = Date.now();
  const unknownEmail = `rv-unknown-${ts}@proton.me`;
  const unverifiedEmail = `rv-unverified-${ts}@proton.me`;
  const verifiedEmail = `rv-verified-${ts}@proton.me`;
  let unverifiedUserId = "";
  let verifiedUserId = "";

  beforeAll(async () => {
    const u = await prisma.user.create({ data: { email: unverifiedEmail, passwordHash: "x" } });
    unverifiedUserId = u.id;
    const v = await prisma.user.create({ data: { email: verifiedEmail, passwordHash: "x", emailVerified: new Date() } });
    verifiedUserId = v.id;
  });

  afterAll(async () => {
    await prisma.verificationToken.deleteMany({ where: { identifier: { in: [unverifiedEmail, verifiedEmail] } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: [unverifiedUserId, verifiedUserId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [unverifiedUserId, verifiedUserId] } } }).catch(() => {});
  });

  it("unknown email: generic response, no token created (no enumeration)", async () => {
    const { status, body } = await call(unknownEmail, "10.1.0.1");
    expect(status).toBe(200);
    expect(body.message).toBe(GENERIC);
    expect(body.emailIssue).toBeUndefined();
    const tokens = await prisma.verificationToken.findMany({ where: { identifier: unknownEmail } });
    expect(tokens.length).toBe(0);
  });

  it("verified email: identical generic response, no token created", async () => {
    const { status, body } = await call(verifiedEmail, "10.1.0.2");
    expect(status).toBe(200);
    expect(body.message).toBe(GENERIC);
    const tokens = await prisma.verificationToken.findMany({ where: { identifier: verifiedEmail } });
    expect(tokens.length).toBe(0);
  });

  it("unverified email: stores exactly one hashed token (sha256, 64 hex), never the plain token", async () => {
    const { status, body } = await call(unverifiedEmail, "10.1.0.3");
    expect(status).toBe(200);
    expect(body.message).toBe(GENERIC);
    const tokens = await prisma.verificationToken.findMany({ where: { identifier: unverifiedEmail } });
    expect(tokens.length).toBe(1);
    expect(tokens[0].token).toMatch(/^[0-9a-f]{64}$/);
    expect(tokens[0].expires.getTime()).toBeGreaterThan(Date.now());
  });

  it("second request rotates the token — old one replaced, still exactly one row", async () => {
    const before = await prisma.verificationToken.findMany({ where: { identifier: unverifiedEmail } });
    const firstToken = before[0].token;
    const { status } = await call(unverifiedEmail, "10.1.0.4");
    expect(status).toBe(200);
    const after = await prisma.verificationToken.findMany({ where: { identifier: unverifiedEmail } });
    expect(after.length).toBe(1);
    expect(after[0].token).not.toBe(firstToken);
    expect(after[0].token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("per-email cooldown kicks in after 3 sends in an hour (no infinite resend loop)", async () => {
    const third = await call(unverifiedEmail, "10.1.0.5"); // 3rd send for this email
    expect(third.status).toBe(200);
    expect(third.body.cooldown).toBeUndefined();
    const fourth = await call(unverifiedEmail, "10.1.0.6"); // 4th — blocked
    expect(fourth.status).toBe(200);
    expect(fourth.body.cooldown).toBe(true);
  });

  it("invalid email input is rejected with 400", async () => {
    const { status, body } = await call("not-an-email", "10.1.0.7");
    expect(status).toBe(400);
    expect(body.error).toBeTruthy();
  });
});
