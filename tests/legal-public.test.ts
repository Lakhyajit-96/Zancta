import { describe, it, expect } from "vitest";
import { jsonLdSoftwareApp, jsonLdWebSite } from "@/lib/seo";
import { LEGAL_PUBLIC } from "@/lib/legal-public";
import { GET } from "@/app/llms.txt/route";

describe("public legal and AI-search facts", () => {
  it("does not publish invented operator identity or mailboxes", () => {
    expect(LEGAL_PUBLIC.operatorLegalNamePublished).toBe(true);
    expect(LEGAL_PUBLIC.operatorName).toBe("Lakhyajit Changmai");
    expect(LEGAL_PUBLIC.operatorAddressPublished).toBe(false);
    expect(LEGAL_PUBLIC.monitoredSupportPublished).toBe(false);
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

  it("llms.txt is factual and omits ranking claims", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toContain("ZANCTA");
    expect(body).toContain("https://zancta.tech/refund-and-cancellation");
    expect(body).toMatch(/11 available|11 working|11 available tools/i);
    expect(body).not.toMatch(/#1|most secure|guaranteed indexing|guaranteed ChatGPT/i);
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
