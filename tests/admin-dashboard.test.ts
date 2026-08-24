import { describe, expect, it } from "vitest";
import { readFile } from "fs/promises";
import path from "path";

async function source(rel: string) {
  return readFile(path.join(process.cwd(), rel), "utf8");
}

describe("operator dashboard hub", () => {
  it("keeps the public logo on the homepage and exposes Admin only as a nav item", async () => {
    const nav = await source("components/marketing/nav.tsx");
    const logos = [...nav.matchAll(/<Link href="([^"]+)"[^>]*aria-label="ZANCTA home">/g)];
    expect(logos.length).toBeGreaterThan(0);
    for (const match of logos) {
      expect(match[1]).toBe("/");
    }
    expect(nav).not.toMatch(/aria-label="ZANCTA home"[^>]*href="\/admin"/);
    expect(nav).not.toMatch(/href="\/admin"[^>]*aria-label="ZANCTA home"/);
    expect(nav).toMatch(/href="\/admin"/);
    expect(nav).toMatch(/\{operator \?/);
  });

  it("admin layout still authorizes on Entitlement.plan ADMIN", async () => {
    const layout = await source("app/admin/layout.tsx");
    const operatorNav = await source("components/admin/operator-nav.tsx");
    expect(layout).toMatch(/entitlement\?\.plan !== "ADMIN"/);
    expect(layout).toMatch(/redirect\("\/signin"\)/);
    expect(layout).toMatch(/redirect\("\/account"\)/);
    expect(layout).not.toMatch(/OPERATOR_ADMIN_EMAIL/);
    expect(operatorNav).toMatch(/ZANCTA ADMIN/);
    expect(operatorNav).toMatch(/Overview/);
    expect(operatorNav).toMatch(/\/admin\/growth/);
    expect(operatorNav).toMatch(/\/admin\/integrations/);
  });

  it("admin hub exists and does not invent traffic numbers", async () => {
    const page = await source("app/admin/page.tsx");
    expect(page).toMatch(/Operator Dashboard/);
    expect(page).toMatch(/Google Analytics 4/);
    expect(page).toMatch(/Google Search Console/);
    expect(page).toMatch(/Bing Webmaster/);
    expect(page).toMatch(/Not connected|Connection required/);
    expect(page).toMatch(/getPublicConnection/);
    expect(page).not.toMatch(/sessions:\s*\d+|users:\s*\d+|pageviews:\s*\d+/i);
  });

  it("account points ADMIN users at the dashboard hub", async () => {
    const account = await source("app/account/page.tsx");
    expect(account).toMatch(/Open Admin Dashboard/);
    expect(account).toMatch(/href="\/admin"/);
    expect(account).toMatch(/ent\.plan === "ADMIN"/);
  });
});
