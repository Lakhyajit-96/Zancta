import { describe, it, expect } from "vitest";
import { jsonLdSoftwareApp } from "@/lib/seo";
import { LEGAL_PUBLIC } from "@/lib/legal-public";
import { GET } from "@/app/llms.txt/route";

describe("public legal and AI-search facts", () => {
  it("does not publish invented operator identity or mailboxes", () => {
    expect(LEGAL_PUBLIC.operatorLegalNamePublished).toBe(false);
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
});
