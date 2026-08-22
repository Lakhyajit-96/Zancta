import { describe, it, expect } from "vitest";
import { jsonLdOrganization, jsonLdSoftwareApp, jsonLdWebSite } from "@/lib/seo";
import { LEGAL_PUBLIC } from "@/lib/legal-public";
import { GET } from "@/app/llms.txt/route";

describe("public legal and AI-search facts", () => {
  it("does not publish invented operator identity or mailboxes", () => {
    expect(LEGAL_PUBLIC.operatorLegalNamePublished).toBe(true);
    expect(LEGAL_PUBLIC.operatorName).toBe("Lakhyajit Changmai");
    expect(LEGAL_PUBLIC.operatorForm).toBe("Unincorporated individual");
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

  it("names the individual operator in Organization structured data without an address", () => {
    const json = JSON.stringify(jsonLdOrganization());
    expect(json).toContain("Lakhyajit Changmai");
    expect(json).toContain('"@type":"Person"');
    expect(json).toContain("support@zancta.tech");
    expect(json).not.toMatch(/Pvt Ltd|LLP|registered office|Inc\./i);
    expect(json).not.toMatch(/streetAddress|postalCode|addressCountry/i);
  });

  it("llms.txt is factual and omits ranking claims", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toContain("ZANCTA");
    expect(body).toContain("Lakhyajit Changmai");
    expect(body).toContain("independently operated privacy-first document software");
    expect(body).toContain("https://zancta.tech/contact");
    expect(body).toContain("support@zancta.tech");
    expect(body).toMatch(/11 available|11 working|11 available tools/i);
    expect(body).not.toMatch(/#1|most secure|guaranteed indexing|guaranteed ChatGPT/i);
    expect(body).not.toMatch(/Pvt Ltd|GSTIN|registered office/i);
  });

  it("Contact brand UI is ZANCTA-first without fake corporate identity", async () => {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const src = await readFile(path.join(process.cwd(), "app/contact/page.tsx"), "utf8");
    expect(src).toContain("Legal identity");
    expect(src).toContain("LEGAL_PUBLIC.operatorName");
    expect(src).toContain("Customer support");
    expect(src).not.toMatch(/not legal advice/i);
    expect(src).not.toMatch(/lawyer-reviewed/i);
    expect(src).not.toMatch(/Grievance Officer/i);
    expect(src).not.toMatch(/No company, registered office/i);
    expect(src).not.toMatch(/Pvt Ltd|GSTIN|CIN|virtual office/i);
  });

  it("marketing page titles are unique and not one-word stubs", async () => {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
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
