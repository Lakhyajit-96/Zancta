import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { jsonLdOrganization } from "@/lib/seo";
import { renderEmailHtml, safeHttpsUrl } from "@/lib/email/layout";
import { welcomeEmail, verificationEmail } from "@/lib/email/templates";

describe("brand assets and search identity", () => {
  const root = process.cwd();
  const required = [
    "public/favicon.ico",
    "public/icon.svg",
    "public/icon-192.png",
    "public/icon-512.png",
    "public/apple-touch-icon.png",
    "public/icons/favicon-16.png",
    "public/icons/favicon-32.png",
    "public/icons/favicon-48.png",
    "public/icons/favicon-64.png",
    "public/icons/favicon-128.png",
    "public/icons/favicon-180.png",
    "public/icons/favicon-192.png",
    "public/icons/favicon-512.png",
    "public/assets/zancta-brand/email/zancta-email-mark.png",
    "public/assets/zancta-brand/bimi/zancta-bimi.svg",
    "public/assets/zancta-brand/og-images/zancta-og-hero.png",
  ];

  it("ships the canonical ZANCTA icon set", () => {
    for (const rel of required) {
      expect(existsSync(path.join(root, rel)), rel).toBe(true);
    }
  });

  it("BIMI SVG is Tiny PS without scripts or external references", () => {
    const svg = readFileSync(path.join(root, "public/assets/zancta-brand/bimi/zancta-bimi.svg"), "utf8");
    expect(svg).toMatch(/baseProfile="tiny-ps"/);
    expect(svg).toMatch(/version="1.2"/);
    expect(svg).toContain("<title>ZANCTA</title>");
    expect(svg).not.toMatch(/<script/i);
    expect(svg).not.toMatch(/xlink:href|href="https?:/i);
  });

  it("Organization logo points at a crawlable raster on zancta.tech", () => {
    const json = JSON.stringify(jsonLdOrganization());
    expect(json).toContain("https://zancta.tech/icons/favicon-512.png");
    expect(json).toContain("Lakhyajit Changmai");
    expect(json).not.toMatch(/legalName|telephone|address/i);
  });
});

describe("email design system", () => {
  it("rejects localhost and Vercel preview URLs", () => {
    expect(() => safeHttpsUrl("http://localhost:3000/verify")).toThrow();
    expect(() => safeHttpsUrl("https://toolsite-4q4w.vercel.app/verify")).toThrow();
    expect(safeHttpsUrl("https://zancta.tech/help")).toContain("https://zancta.tech/help");
  });

  it("welcome HTML includes logo, preheader, footer, and no secrets", () => {
    const html = renderEmailHtml(welcomeEmail());
    expect(html).toContain("display:none");
    expect(html).toContain("https://zancta.tech/assets/zancta-brand/email/zancta-email-mark.png");
    expect(html).toContain("privacy@zancta.tech");
    expect(html).toContain("security@zancta.tech");
    expect(html).not.toContain("AUTH_SECRET");
    expect(html).not.toContain("localhost");
  });

  it("verification copy matches the published verification subject intent", () => {
    const doc = verificationEmail("https://zancta.tech/verify-email?token=abc");
    expect(doc.title).toMatch(/Verify your ZANCTA email/i);
    expect(doc.action?.label).toBe("Verify email address");
  });
});
