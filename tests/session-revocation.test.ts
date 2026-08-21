import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { hashToken, generateSecureToken } from "@/lib/token";
import { bumpAuthVersion, tokenMatchesAuthVersion } from "@/lib/auth-version";
import { verifyCredentialsUser } from "@/lib/auth";
import { readFile } from "fs/promises";
import path from "path";

(process.env as Record<string, string | undefined>).NODE_ENV = "test";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const ts = Date.now();
const ids: string[] = [];

describe("tokenMatchesAuthVersion", () => {
  it("treats missing JWT version as 0 so existing sessions keep working until reset", () => {
    expect(tokenMatchesAuthVersion(undefined, 0)).toBe(true);
    expect(tokenMatchesAuthVersion(undefined, 1)).toBe(false);
    expect(tokenMatchesAuthVersion(0, 0)).toBe(true);
    expect(tokenMatchesAuthVersion(0, 1)).toBe(false);
    expect(tokenMatchesAuthVersion(1, 1)).toBe(true);
  });
});

describe("Password reset JWT revocation", () => {
  const password = "OldPass12345!";
  const nextPassword = "NewPass12345!";
  const email = `revocation-${ts}@example.com`;
  let userId = "";

  beforeAll(async () => {
    const hash = await bcrypt.hash(password, 12);
    const u = await prisma.user.create({
      data: { email, passwordHash: hash, emailVerified: new Date(), authVersion: 0 },
    });
    userId = u.id;
    ids.push(u.id);
  });

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.session.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
  });

  it("old JWT version fails closed after bump; matching version still works", async () => {
    expect(tokenMatchesAuthVersion(0, 0)).toBe(true);
    const next = await bumpAuthVersion(userId);
    expect(next).toBe(1);
    expect(tokenMatchesAuthVersion(0, next)).toBe(false);
    expect(tokenMatchesAuthVersion(1, next)).toBe(true);
  });

  it("reset consumes every unused token, increments authVersion, and old password fails", async () => {
    const stalePlain = generateSecureToken();
    const livePlain = generateSecureToken();
    await prisma.passwordResetToken.create({
      data: { userId, token: hashToken(stalePlain), expires: new Date(Date.now() + 60 * 60 * 1000) },
    });
    await prisma.passwordResetToken.create({
      data: { userId, token: hashToken(livePlain), expires: new Date(Date.now() + 60 * 60 * 1000) },
    });

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.12.0.1" },
      body: JSON.stringify({ token: livePlain, password: nextPassword }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const live = await prisma.user.findUnique({ where: { id: userId } });
    expect(live?.authVersion).toBeGreaterThanOrEqual(1);
    expect(tokenMatchesAuthVersion(0, live?.authVersion)).toBe(false);

    const leftover = await prisma.passwordResetToken.count({ where: { userId, usedAt: null } });
    expect(leftover).toBe(0);

    const replay = await POST(
      new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "10.12.0.2" },
        body: JSON.stringify({ token: livePlain, password: "AnotherPass12345!" }),
      })
    );
    expect(replay.status).toBe(400);

    const staleReplay = await POST(
      new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "10.12.0.3" },
        body: JSON.stringify({ token: stalePlain, password: "AnotherPass12345!" }),
      })
    );
    expect(staleReplay.status).toBe(400);

    expect(await verifyCredentialsUser(email, password)).toBeNull();
    const signedIn = await verifyCredentialsUser(email, nextPassword);
    expect(signedIn?.id).toBe(userId);
  });

  it("jwt callback source verifies live authVersion and fails closed", async () => {
    const src = await readFile(path.join(process.cwd(), "lib/auth.ts"), "utf8");
    expect(src).toMatch(/tokenMatchesAuthVersion\(token\.authVersion, live\.authVersion\)/);
    expect(src).toMatch(/if \(user\) \{/);
    expect(src).toMatch(/token\.authVersion = live\.authVersion/);
    expect(src).toMatch(/session: \{ strategy: "jwt" \}/);
  });
});
