import { describe, expect, it } from "vitest";
import { normalizeOperatorEmail, promoteAdminBlockedReason } from "@/lib/operator-admin";
import { operatorIntegrationsAllowed } from "@/lib/integrations/gate";
import { readFile } from "fs/promises";
import path from "path";

const API_ROUTES = [
  "app/api/admin/integrations/google/connect/route.ts",
  "app/api/admin/integrations/google/callback/route.ts",
  "app/api/admin/integrations/google/disconnect/route.ts",
  "app/api/admin/integrations/google/inspect/route.ts",
  "app/api/admin/integrations/google/sitemap/route.ts",
  "app/api/admin/integrations/bing/connect/route.ts",
  "app/api/admin/integrations/bing/callback/route.ts",
  "app/api/admin/integrations/bing/disconnect/route.ts",
  "app/api/admin/integrations/bing/submit-url/route.ts",
];

describe("operator ADMIN bootstrap", () => {
  it("does not treat Google login as ADMIN", () => {
    expect(promoteAdminBlockedReason({ confirm: true, production: true, email: "a@b.c", vercelEnv: "preview" })).toMatch(
      /Preview/,
    );
    expect(promoteAdminBlockedReason({ confirm: false, production: true, email: "a@b.c" })).toMatch(/--confirm/);
    expect(promoteAdminBlockedReason({ confirm: true, production: false, email: "a@b.c" })).toMatch(/--production/);
    expect(promoteAdminBlockedReason({ confirm: true, production: true, email: "" })).toMatch(/OPERATOR_ADMIN_EMAIL/);
    expect(promoteAdminBlockedReason({ confirm: true, production: true, email: "operator@example.com" })).toBeNull();
    expect(normalizeOperatorEmail("  Op@Ex.COM ")).toBe("op@ex.com");
  });

  it("admin UI and APIs still require Entitlement.plan ADMIN", async () => {
    const layout = await readFile(path.join(process.cwd(), "app/admin/layout.tsx"), "utf8");
    const gate = await readFile(path.join(process.cwd(), "lib/integrations/gate.ts"), "utf8");
    const auth = await readFile(path.join(process.cwd(), "lib/auth.ts"), "utf8");
    expect(layout).toMatch(/entitlement\?\.plan !== "ADMIN"/);
    expect(layout).toMatch(/redirect\("\/account"\)/);
    expect(layout).toMatch(/redirect\("\/signin"\)/);
    expect(layout).not.toMatch(/emailVerified/);
    expect(gate).toMatch(/entitlement\?\.plan !== "ADMIN"/);
    expect(gate).toMatch(/isVercelPreview/);
    expect(auth).toMatch(/plan: "FREE"/);
    expect(auth).toMatch(/source: "OAUTH"/);
    expect(auth).not.toMatch(/plan: "ADMIN"/);
    expect(auth).not.toMatch(/OPERATOR_ADMIN_EMAIL/);
    expect(layout).not.toMatch(/OPERATOR_ADMIN_EMAIL/);
    expect(gate).not.toMatch(/OPERATOR_ADMIN_EMAIL/);
  });

  it("every operator integration API requires ADMIN", async () => {
    for (const rel of API_ROUTES) {
      const src = await readFile(path.join(process.cwd(), rel), "utf8");
      expect(src, rel).toMatch(/requireAdminOperator/);
    }
  });

  it("Preview cannot use operator integrations", () => {
    const prev = process.env.VERCEL_ENV;
    try {
      process.env.VERCEL_ENV = "preview";
      expect(operatorIntegrationsAllowed()).toBe(false);
      process.env.VERCEL_ENV = "production";
      expect(operatorIntegrationsAllowed()).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = prev;
    }
  });

  it("CLI promote script stays explicit, reversible, and does not log emails", async () => {
    const src = await readFile(path.join(process.cwd(), "scripts/promote-operator-admin.mjs"), "utf8");
    expect(src).toMatch(/--production/);
    expect(src).toMatch(/--confirm/);
    expect(src).toMatch(/--revoke/);
    expect(src).toMatch(/OPERATOR_BOOTSTRAP/);
    expect(src).toMatch(/operator_admin_promoted/);
    expect(src).toMatch(/emailFingerprint/);
    expect(src).not.toMatch(/JSON\.stringify\(\{ email:/);
  });
});
