import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { hashToken, generateSecureToken } from "@/lib/token";

(process.env as Record<string, string | undefined>).NODE_ENV = "test";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const ts = Date.now();
const email = `forgot-rotate-${ts}@example.com`;
let userId = "";

describe("Forgot-password token rotation", () => {
  beforeAll(async () => {
    const u = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash("ForgotPass12345!", 12),
        emailVerified: new Date(),
      },
    });
    userId = u.id;
  });

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("invalidates previously unused reset tokens when a new reset is requested", async () => {
    const oldPlain = generateSecureToken();
    await prisma.passwordResetToken.create({
      data: { userId, token: hashToken(oldPlain), expires: new Date(Date.now() + 60 * 60 * 1000) },
    });

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const res = await POST(
      new NextRequest("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "10.13.0.1" },
        body: JSON.stringify({ email }),
      })
    );
    expect(res.status).toBe(200);

    const unused = await prisma.passwordResetToken.findMany({ where: { userId, usedAt: null } });
    expect(unused).toHaveLength(1);
    expect(unused[0].token).not.toBe(hashToken(oldPlain));

    const { POST: reset } = await import("@/app/api/auth/reset-password/route");
    const oldReset = await reset(
      new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "10.13.0.2" },
        body: JSON.stringify({ token: oldPlain, password: "ShouldFail12345!" }),
      })
    );
    expect(oldReset.status).toBe(400);
  });
});
