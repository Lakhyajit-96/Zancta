import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import path from "path";

async function source(rel: string) {
  return readFile(path.join(process.cwd(), rel), "utf8");
}

describe("API authorization binds to the session, not client IDs", () => {
  it("checkout uses session.user.id and ignores a body userId field", async () => {
    const src = await source("app/api/payments/checkout/route.ts");
    expect(src).toMatch(/session\.user\.id/);
    expect(src).not.toMatch(/body\?\.userId|body\.userId/);
    expect(src).toMatch(/userId: session\.user\.id/);
  });

  it("status, cancel, and account delete never take a user id from the request body", async () => {
    const status = await source("app/api/payments/status/route.ts");
    const cancel = await source("app/api/payments/cancel/route.ts");
    const del = await source("app/api/account/delete/route.ts");
    for (const src of [status, cancel, del]) {
      expect(src).toMatch(/session/);
      expect(src).not.toMatch(/body\?\.userId|body\.userId|searchParams\.get\(["']userId/);
    }
    expect(cancel).toMatch(/const userId = session\.user\.id/);
    expect(del).toMatch(/userId/);
  });

  it("unauthenticated billing and account mutations are rejected in source", async () => {
    const checkout = await source("app/api/payments/checkout/route.ts");
    const cancel = await source("app/api/payments/cancel/route.ts");
    const status = await source("app/api/payments/status/route.ts");
    const del = await source("app/api/account/delete/route.ts");
    expect(checkout).toMatch(/if \(!session\?\.user\?\.id \|\| !session\?\.user\?\.email\)/);
    expect(checkout).toMatch(/status: 401/);
    expect(cancel).toMatch(/if \(!session\?\.user\?\.id\)/);
    expect(status).toMatch(/if \(!session\?\.user\?\.id\)/);
    expect(del).toMatch(/if \(!session\?\.user \|\| !userId\)/);
    expect(del).toMatch(/status: 401/);
  });
});
