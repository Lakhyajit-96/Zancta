import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import path from "path";
import { jsonLdOrganization, jsonLdSoftwareApp, jsonLdWebSite } from "@/lib/seo";
import { LEGAL_PUBLIC } from "@/lib/legal-public";
import { GET } from "@/app/llms.txt/route";

const PERSONAL_NAME = "Lakhyajit Changmai";

describe("public legal and AI-search facts", () => {
  it("does not publish invented operator identity or mailboxes", () => {
    expect(LEGAL_PUBLIC.operatorLegalNamePublished).toBe(true);
    expect(LEGAL_PUBLIC.operatorName).toBe(PERSONAL_NAME);
    expect(LEGAL_PUBLIC.operatorForm).toBe("Unincorporated individual");
    expect(LEGAL_PUBLIC.operatorDisclosurePath).toBe("/terms");
    expect(LEGAL_PUBLIC.productDescriptor).toBe("Independently operated PDF and image software");
    expect(LEGAL_PUBLIC.identitySummary).toMatch(/independently operated privacy-first document software/i);
    expect(LEGAL_PUBLIC.identitySummary).not.toMatch(/Pvt Ltd|LLP|Inc\.|corporation|trusted by millions|bank-level/i);
    expect(LEGAL_PUBLIC.operatorAddressPublished).toBe(false);
    expect(LEGAL_PUBLIC.monitoredSupportPublished).toBe(true);
    expect(LEGAL_PUBLIC.monitoredSecurityPublished).toBe(true);
    expect(LEGAL_PUBLIC.supportEmail).toBe("support@zancta.tech");
    expect(LEGAL_PUBLIC.privacyEmail).toBe("privacy@zancta.tech");
    expect(LEGAL_PUBLIC.securityEmail).toBe("security@zancta.tech");
    expect(LEGAL_PUBLIC.billingEmail).toBe("billing@zancta.tech");
    expect(LEGAL_PUBLIC.lawyerReviewed).toBe(false);
    expect(LEGAL_PUBLIC.monthlyDisplayINR).toBe("₹199 / month");
    expect(LEGAL_PUBLIC.annualDisplayINR).toBe("₹999 / year");
  });

  it("SoftwareApplication offers are free INR, not USD", () => {
    const json = jsonLdSoftwareApp({
      name: "Merge PDF",
      description: "Merge PDFs locally.",
      slug: "pdf-merge",
    });
    expect(JSON.stringify(json)).toMatch(/"priceCurrency":"INR"/);
    expect(JSON.stringify(json)).not.toMatch(/USD/);
  });

  it("publishes one consistent ZANCTA WebSite entity", () => {
    expect(jsonLdWebSite()).toMatchObject({
      "@type": "WebSite",
      name: "ZANCTA",
      alternateName: "ZANCTA",
    });
    expect(String((jsonLdWebSite() as { url: string }).url)).toMatch(/\/$/);
  });

  it("Organization structured data is the ZANCTA brand without founder or address", () => {
    const json = JSON.stringify(jsonLdOrganization());
    expect(json).toContain('"@type":"Organization"');
    expect(json).toContain("ZANCTA");
    expect(json).toContain("support@zancta.tech");
    expect(json).not.toContain(PERSONAL_NAME);
    expect(json).not.toMatch(/"founder"/);
    expect(json).not.toMatch(/legalName/i);
    expect(json).not.toMatch(/Pvt Ltd|LLP|registered office|Inc\./i);
    expect(json).not.toMatch(/streetAddress|postalCode|addressCountry/i);
  });

  it("llms.txt is factual, ZANCTA-first, and omits ranking claims", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toContain("ZANCTA");
    expect(body).not.toContain(PERSONAL_NAME);
    expect(body).toContain("independently operated privacy-first document software");
    expect(body).toContain("https://zancta.tech/contact");
    expect(body).toContain("https://zancta.tech/terms");
    expect(body).toContain("support@zancta.tech");
    expect(body).toMatch(/11 available|11 working|11 available tools/i);
    expect(body).not.toMatch(/#1|most secure|guaranteed indexing|guaranteed ChatGPT/i);
    expect(body).not.toMatch(/Pvt Ltd|GSTIN|registered office/i);
  });

  it("Contact is ZANCTA-first and does not display the operator name", async () => {
    const src = await readFile(path.join(process.cwd(), "app/contact/page.tsx"), "utf8");
    expect(src).toContain("Independently operated");
    expect(src).toContain("Customer support");
    expect(src).not.toContain("LEGAL_PUBLIC.operatorName");
    expect(src).not.toContain(PERSONAL_NAME);
    expect(src).not.toMatch(/Legal identity/);
    expect(src).not.toMatch(/not legal advice/i);
    expect(src).not.toMatch(/lawyer-reviewed/i);
    expect(src).not.toMatch(/Grievance Officer/i);
    expect(src).not.toMatch(/No company, registered office/i);
    expect(src).not.toMatch(/Pvt Ltd|GSTIN|CIN|virtual office/i);
  });

  it("keeps the operator legal name only on Terms among public app pages", async () => {
    const publicPages = [
      "app/page.tsx",
      "app/about/page.tsx",
      "app/contact/page.tsx",
      "app/privacy/page.tsx",
      "app/refund-and-cancellation/page.tsx",
      "app/security/page.tsx",
      "app/pricing/page.tsx",
      "app/faq/page.tsx",
      "app/help/page.tsx",
      "app/how-it-works/page.tsx",
      "app/tools/page.tsx",
      "app/llms.txt/route.ts",
      "lib/seo.ts",
      "lib/email/layout.ts",
      "components/marketing/nav.tsx",
    ];
    for (const rel of publicPages) {
      const src = await readFile(path.join(process.cwd(), rel), "utf8");
      expect(src, rel).not.toContain(PERSONAL_NAME);
      expect(src, rel).not.toContain("LEGAL_PUBLIC.operatorName");
    }
    const terms = await readFile(path.join(process.cwd(), "app/terms/page.tsx"), "utf8");
    expect(terms).toContain("LEGAL_PUBLIC.operatorName");
  });

  it("privacy policy describes operator Google API data separately from public Google sign-in", async () => {
    const src = await readFile(path.join(process.cwd(), "app/privacy/page.tsx"), "utf8");
    expect(src).toContain("Google API Data — Site Operator Integrations");
    expect(src).toMatch(/Sign in with Google/);
    expect(src).toMatch(/ordinary Free or Premium/);
    expect(src).toMatch(/Google Analytics 4/);
    expect(src).toMatch(/Google Search Console/);
    expect(src).toMatch(/URL inspection/);
    expect(src).toMatch(/encrypted at rest/i);
    expect(src).toMatch(/does not sell this Google API data/i);
    expect(src).toMatch(/revoke the current Google access token/i);
    expect(src).toMatch(/cached Google dashboard snapshots/i);
    expect(src).toMatch(/audit/i);
    expect(src).toMatch(/Google(?:'|\&apos;)s account permissions/);
    expect(src).not.toMatch(/GOOGLE_CLIENT_SECRET|GOOGLE_OPERATOR_CLIENT_SECRET|INTEGRATION_ENCRYPTION_KEY|GOCSPX|ya29\./);
    expect(src).not.toMatch(/Limited Use|CASA|restricted scope/i);
    expect(src).not.toMatch(/AES-256|GCM|INTEGRATION_ENCRYPTION/);
  });

  it("marketing page titles are unique and not one-word stubs", async () => {
    const files = [
      "app/tools/page.tsx",
      "app/pricing/page.tsx",
      "app/faq/page.tsx",
      "app/help/page.tsx",
      "app/about/page.tsx",
      "app/privacy/page.tsx",
      "app/terms/page.tsx",
      "app/security/page.tsx",
      "app/contact/page.tsx",
      "app/how-it-works/page.tsx",
      "app/refund-and-cancellation/page.tsx",
    ];
    const titles: string[] = [];
    for (const rel of files) {
      const src = await readFile(path.join(process.cwd(), rel), "utf8");
      const match = src.match(/title:\s*"([^"]+)"/);
      expect(match?.[1], rel).toBeTruthy();
      expect(match![1].split(/\s+/).length, rel).toBeGreaterThan(1);
      titles.push(match![1]);
    }
    expect(new Set(titles).size).toBe(titles.length);
  });
});
