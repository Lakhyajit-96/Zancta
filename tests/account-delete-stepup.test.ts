import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { hashToken } from "@/lib/token";

type TokenRow = { userId: string; token: string; usedAt: Date | null; expires: Date };

const state = {
  userId: "user-a",
  tokens: [] as TokenRow[],
  users: {
    "user-a": { id: "user-a", email: "a@example.com" },
    "user-b": { id: "user-b", email: "b@example.com" },
  } as Record<string, { id: string; email: string }>,
  deletedUsers: new Set<string>(),
  deletedSessions: new Set<string>(),
  subscriptions: [] as { userId: string; providerSubscriptionId: string; status: string }[],
  entitlementSub: null as string | null,
  cancelShouldThrow: false,
  cancelAccepted: true,
  emailShouldThrow: false,
  sentCodes: [] as string[],
  rateLimitOk: true,
};

const cancel = vi.fn(async () => {
  if (state.cancelShouldThrow) throw new Error("provider down");
});
const getSub = vi.fn(async () =>
  state.cancelAccepted ? { cancelAtPeriodEnd: true, status: "cancelled" } : { cancelAtPeriodEnd: false, status: "active" }
);

vi.mock("@/lib/auth", () => ({
  auth: async () => (state.userId ? { user: { id: state.userId } } : null),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimitAsync: async () =>
    state.rateLimitOk ? { ok: true, remaining: 1, resetAt: Date.now() + 1000 } : { ok: false, remaining: 0, resetAt: Date.now() + 1000 },
  getClientIp: () => "10.0.0.1",
}));

vi.mock("@/lib/audit", () => ({
  auditEvent: async () => {},
}));

vi.mock("@/lib/payments", () => ({
  getPaymentProvider: () => ({
    cancelSubscription: cancel,
    getSubscription: getSub,
  }),
}));

vi.mock("@/lib/deleted-identity", () => ({
  recordDeletedProviderIdentities: async () => {},
}));

vi.mock("@/lib/email", () => ({
  getEmailAdapter: () => ({
    sendAccountDeletionCode: async (_to: string, code: string) => {
      if (state.emailShouldThrow) throw new Error("resend down");
      state.sentCodes.push(code);
    },
    sendAccountDeleted: async () => {},
  }),
  trySendEmail: async (_label: string, send: () => Promise<void>) => {
    await send();
  },
}));

function claimTokens(where: { userId?: string; token?: string; usedAt?: null; expires?: { gt: Date } }, data: { usedAt: Date | null }) {
  let count = 0;
  const now = where.expires?.gt ?? new Date(0);
  for (const row of state.tokens) {
    if (where.userId && row.userId !== where.userId) continue;
    if (where.token && row.token !== where.token) continue;
    if (where.usedAt === null && row.usedAt !== null) continue;
    if (where.expires && row.expires <= now) continue;
    row.usedAt = data.usedAt;
    count += 1;
  }
  return { count };
}

vi.mock("@/lib/db", () => ({
  default: {
    accountDeletionToken: {
      updateMany: async ({ where, data }: { where: { userId?: string; token?: string; usedAt?: null; expires?: { gt: Date } }; data: { usedAt: Date | null } }) =>
        claimTokens(where, data),
      create: async ({ data }: { data: { userId: string; token: string; expires: Date } }) => {
        state.tokens.push({ userId: data.userId, token: data.token, usedAt: null, expires: data.expires });
        return data;
      },
      deleteMany: async ({ where }: { where: { userId?: string; token?: string; OR?: unknown } }) => {
        const before = state.tokens.length;
        state.tokens = state.tokens.filter((row) => {
          if (where.token && row.token === where.token && (!where.userId || row.userId === where.userId)) return false;
          return true;
        });
        return { count: before - state.tokens.length };
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        accountDeletionToken: {
          deleteMany: async () => ({ count: 0 }),
          updateMany: async ({ where, data }: { where: { userId: string; usedAt: null }; data: { usedAt: Date } }) => {
            for (const row of state.tokens) {
              if (row.userId === where.userId && row.usedAt === null) row.usedAt = data.usedAt;
            }
            return { count: 1 };
          },
          create: async ({ data }: { data: { userId: string; token: string; expires: Date } }) => {
            state.tokens.push({ userId: data.userId, token: data.token, usedAt: null, expires: data.expires });
            return data;
          },
        },
      };
      return fn(tx);
    },
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (state.deletedUsers.has(where.id)) return null;
        return state.users[where.id] ?? null;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        state.deletedUsers.add(where.id);
        return { id: where.id };
      },
    },
    session: {
      deleteMany: async ({ where }: { where: { userId: string } }) => {
        state.deletedSessions.add(where.userId);
        return { count: 1 };
      },
    },
    paymentSubscription: {
      findMany: async ({ where }: { where: { userId: string } }) =>
        state.subscriptions.filter((s) => s.userId === where.userId),
      updateMany: async () => ({ count: 1 }),
    },
    entitlement: {
      findUnique: async ({ where }: { where: { userId: string } }) =>
        state.entitlementSub ? { userId: where.userId, providerSubscriptionId: state.entitlementSub } : null,
      updateMany: async () => ({ count: 1 }),
    },
    paymentCheckout: {
      updateMany: async () => ({ count: 0 }),
    },
    account: {
      findMany: async () => [],
    },
  },
}));

function deleteReq(body: unknown) {
  return new NextRequest("http://localhost:3000/api/account/delete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function seedCode(userId: string, plain: string, expiresInMs = 15 * 60 * 1000) {
  state.tokens.push({
    userId,
    token: hashToken(plain),
    usedAt: null,
    expires: new Date(Date.now() + expiresInMs),
  });
}

describe("Account deletion step-up (P0-2)", () => {
  beforeEach(() => {
    state.userId = "user-a";
    state.tokens = [];
    state.deletedUsers = new Set();
    state.deletedSessions = new Set();
    state.subscriptions = [];
    state.entitlementSub = null;
    state.cancelShouldThrow = false;
    state.cancelAccepted = true;
    state.emailShouldThrow = false;
    state.sentCodes = [];
    state.rateLimitOk = true;
    cancel.mockClear();
    getSub.mockClear();
    vi.resetModules();
  });

  it("1. authenticated session alone cannot delete", async () => {
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({}));
    expect(res.status).toBe(400);
    expect(state.deletedUsers.has("user-a")).toBe(false);
  });

  it("2. DELETE confirmation alone cannot delete", async () => {
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({ confirm: "DELETE" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Re-authentication required/);
    expect(state.deletedUsers.has("user-a")).toBe(false);
  });

  it("3 + 13 + 14. valid recent step-up + DELETE succeeds for a credentials session", async () => {
    seedCode("user-a", "plain-code-a");
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "plain-code-a" }));
    expect(res.status).toBe(200);
    expect(state.deletedUsers.has("user-a")).toBe(true);
    expect(state.deletedSessions.has("user-a")).toBe(true);
  });

  it("4. missing step-up fails", async () => {
    seedCode("user-a", "plain-code-a");
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "" }));
    expect(res.status).toBe(401);
    expect(state.deletedUsers.has("user-a")).toBe(false);
  });

  it("5. expired step-up fails", async () => {
    seedCode("user-a", "expired-code", -1000);
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "expired-code" }));
    expect(res.status).toBe(401);
    expect(state.deletedUsers.has("user-a")).toBe(false);
  });

  it("6. reused step-up fails", async () => {
    seedCode("user-a", "one-time");
    const { POST } = await import("@/app/api/account/delete/route");
    const first = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "one-time" }));
    expect(first.status).toBe(200);
    state.deletedUsers.delete("user-a");
    const { POST: POST2 } = await import("@/app/api/account/delete/route");
    const second = await POST2(deleteReq({ confirm: "DELETE", stepUpToken: "one-time" }));
    expect(second.status).toBe(401);
    expect(state.deletedUsers.has("user-a")).toBe(false);
  });

  it("7. wrong step-up fails", async () => {
    seedCode("user-a", "correct-code");
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "wrong-code" }));
    expect(res.status).toBe(401);
    expect(state.deletedUsers.has("user-a")).toBe(false);
  });

  it("8. step-up belonging to another account fails", async () => {
    seedCode("user-b", "b-code");
    state.userId = "user-a";
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "b-code" }));
    expect(res.status).toBe(401);
    expect(state.deletedUsers.has("user-a")).toBe(false);
    expect(state.deletedUsers.has("user-b")).toBe(false);
  });

  it("9. step-up cannot be replayed concurrently", async () => {
    seedCode("user-a", "race-code");
    const { POST } = await import("@/app/api/account/delete/route");
    const [a, b] = await Promise.all([
      POST(deleteReq({ confirm: "DELETE", stepUpToken: "race-code" })),
      POST(deleteReq({ confirm: "DELETE", stepUpToken: "race-code" })),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 401]);
    expect(state.deletedUsers.has("user-a")).toBe(true);
  });

  it("10. rate limiting remains active", async () => {
    seedCode("user-a", "plain-code-a");
    state.rateLimitOk = false;
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "plain-code-a" }));
    expect(res.status).toBe(429);
    expect(state.deletedUsers.has("user-a")).toBe(false);
  });

  it("11 + 12. unauthenticated and other-account sessions cannot delete the target", async () => {
    seedCode("user-a", "plain-code-a");
    state.userId = "";
    const { POST } = await import("@/app/api/account/delete/route");
    const anon = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "plain-code-a" }));
    expect(anon.status).toBe(401);

    state.userId = "user-b";
    const { POST: POST2 } = await import("@/app/api/account/delete/route");
    const other = await POST2(deleteReq({ confirm: "DELETE", stepUpToken: "plain-code-a" }));
    expect(other.status).toBe(401);
    expect(state.deletedUsers.has("user-a")).toBe(false);
  });

  it("15 + 16. Google-authenticated user uses the same email step-up (no password required)", async () => {
    // OAuth-only users have no passwordHash; deletion still requires the emailed code.
    seedCode("user-a", "google-code");
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "google-code" }));
    expect(res.status).toBe(200);
    expect(state.deletedUsers.has("user-a")).toBe(true);
  });

  it("17 + 19. provider cancellation still occurs before destructive deletion", async () => {
    seedCode("user-a", "prem-code");
    state.subscriptions = [{ userId: "user-a", providerSubscriptionId: "sub_1", status: "active" }];
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "prem-code" }));
    expect(res.status).toBe(200);
    expect(cancel).toHaveBeenCalledWith("sub_1", true);
    expect(getSub).toHaveBeenCalledWith("sub_1");
    expect(state.deletedUsers.has("user-a")).toBe(true);
  });

  it("18. provider unreachable still prevents deletion and restores the code", async () => {
    seedCode("user-a", "prem-code");
    state.subscriptions = [{ userId: "user-a", providerSubscriptionId: "sub_1", status: "active" }];
    state.cancelShouldThrow = true;
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "prem-code" }));
    expect(res.status).toBe(502);
    expect(state.deletedUsers.has("user-a")).toBe(false);
    expect(state.tokens[0].usedAt).toBeNull();
  });

  it("20 + 21. successful deletion removes the intended account and sessions", async () => {
    seedCode("user-a", "plain-code-a");
    const { POST } = await import("@/app/api/account/delete/route");
    const res = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "plain-code-a" }));
    expect(res.status).toBe(200);
    expect(state.deletedUsers.has("user-a")).toBe(true);
    expect(state.deletedSessions.has("user-a")).toBe(true);
    expect(state.deletedUsers.has("user-b")).toBe(false);
  });

  it("22. step-up failures are generic (no account-existence oracle)", async () => {
    const { POST } = await import("@/app/api/account/delete/route");
    const missing = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "no-such-code" }));
    seedCode("user-b", "other");
    const wrongUser = await POST(deleteReq({ confirm: "DELETE", stepUpToken: "other" }));
    expect(missing.status).toBe(401);
    expect(wrongUser.status).toBe(401);
    expect((await missing.json()).error).toBe((await wrongUser.json()).error);
  });
});

describe("Account deletion request-code", () => {
  beforeEach(() => {
    state.userId = "user-a";
    state.tokens = [];
    state.emailShouldThrow = false;
    state.sentCodes = [];
    state.rateLimitOk = true;
    vi.resetModules();
  });

  it("session is required (no unauthenticated enumeration)", async () => {
    state.userId = "";
    const { POST } = await import("@/app/api/account/delete/request-code/route");
    const res = await POST(new NextRequest("http://localhost:3000/api/account/delete/request-code", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(state.sentCodes).toHaveLength(0);
  });

  it("emails a code and never returns it in the JSON body", async () => {
    const { POST } = await import("@/app/api/account/delete/request-code/route");
    const res = await POST(new NextRequest("http://localhost:3000/api/account/delete/request-code", { method: "POST" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/stepUpToken|devToken|plainCode/);
    expect(state.sentCodes).toHaveLength(1);
    expect(state.sentCodes[0].length).toBeGreaterThan(32);
    expect(state.tokens).toHaveLength(1);
    expect(state.tokens[0].token).toBe(hashToken(state.sentCodes[0]));
  });

  it("rolls back the hash when email send fails", async () => {
    state.emailShouldThrow = true;
    const { POST } = await import("@/app/api/account/delete/request-code/route");
    const res = await POST(new NextRequest("http://localhost:3000/api/account/delete/request-code", { method: "POST" }));
    expect(res.status).toBe(502);
    expect(state.tokens).toHaveLength(0);
  });

  it("rate limits code requests", async () => {
    state.rateLimitOk = false;
    const { POST } = await import("@/app/api/account/delete/request-code/route");
    const res = await POST(new NextRequest("http://localhost:3000/api/account/delete/request-code", { method: "POST" }));
    expect(res.status).toBe(429);
  });
});
