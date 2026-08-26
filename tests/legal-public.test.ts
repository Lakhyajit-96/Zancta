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

  it("privacy policy discloses confirmed production data flows without overclaiming deletion", async () => {
    const src = await readFile(path.join(process.cwd(), "app/privacy/page.tsx"), "utf8");
    expect(src).toContain("Bing Webmaster — Site Operator Integrations");
    expect(src).toContain("webmaster.manage");
    expect(src).toContain("zancta_op_oauth_bing");
    expect(src).toMatch(/does not currently send a Bing-side token revocation/);
    expect(src).toMatch(/name, email, topic, subject, message/);
    expect(src).toMatch(/not stored as a ZANCTA application database record/);
    expect(src).toMatch(/Resend/);
    expect(src).toMatch(/not currently invoked/);
    expect(src).toMatch(/Upstash Redis/);
    expect(src).toMatch(/Vercel/);
    expect(src).toMatch(/Supabase/);
    expect(src).toMatch(/profile image/);
    expect(src).toMatch(/OAuth account records/);
    expect(src).toMatch(/does not erase every related record/);
    expect(src).toMatch(/deleting a ZANCTA account does not, by itself, disconnect the operator Bing integration/);
    expect(src).toMatch(/selected file bytes are read and processed in the browser/);
    expect(src).toMatch(/When live checkout is enabled, ZANCTA first attempts to cancel any known Dodo subscription at period end/);
    expect(src).toMatch(/if that provider cancel cannot be confirmed, the account is not deleted/);
    expect(src).toMatch(/Live checkout is not currently enabled, so account deletion does not send a cancel request to Dodo/);
    expect(src).toMatch(/local deletion still proceeds/);
    expect(src).not.toMatch(/after attempting to cancel any known Dodo subscription at period end/);
    expect(src).not.toMatch(/always cancels your provider subscription/i);
    expect(src).not.toMatch(/PAYMENTS_LIVE_ENABLED|skip_provider_cancel_live_disabled/);
    expect(src).not.toMatch(/Nothing is stored on ZANCTA/);
    expect(src).not.toMatch(/everything is permanently deleted/i);
    expect(src).not.toMatch(/HMAC|sha256|contact-email:|signin-email:|rl:/);
    expect(src).not.toMatch(/SENTRY_DSN|GOCSPX/);

    const account = await readFile(path.join(process.cwd(), "app/account/page.tsx"), "utf8");
    expect(account).toMatch(/When live checkout is enabled, ZANCTA first attempts to cancel any known Dodo subscription at period end/);
    expect(account).toMatch(/if that cannot be confirmed, the account is not deleted/);
    expect(account).toMatch(/Live checkout is not currently enabled, so deleting your ZANCTA account does not send a cancellation to Dodo/);
    expect(account).not.toMatch(/always cancels your provider subscription/i);
    expect(account).not.toMatch(/after attempting to cancel any known Dodo subscription/);
  });

  it("does not change public or operator OAuth scopes for this privacy documentation phase", async () => {
    const googleAuth = await readFile(path.join(process.cwd(), "lib/auth.ts"), "utf8");
    const googleOperator = await readFile(path.join(process.cwd(), "lib/integrations/google/oauth.ts"), "utf8");
    const bingOauth = await readFile(path.join(process.cwd(), "lib/integrations/bing/oauth.ts"), "utf8");
    expect(googleAuth).toMatch(/Google\(\{\s*clientId: process\.env\.GOOGLE_CLIENT_ID/);
    expect(googleAuth).not.toMatch(/scope:/);
    expect(googleOperator).toContain("https://www.googleapis.com/auth/webmasters");
    expect(googleOperator).toContain("https://www.googleapis.com/auth/analytics.readonly");
    expect(bingOauth).toContain('const BING_SCOPE = "webmaster.manage"');
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

  it("ships RFC 9116 security.txt at the well-known path", async () => {
    const rel = path.join("public", ".well-known", "security.txt");
    const body = await readFile(path.join(process.cwd(), rel), "utf8");
    expect(rel.replace(/\\/g, "/")).toBe("public/.well-known/security.txt");
    expect(body).toMatch(/^Contact:\s*mailto:security@zancta\.tech$/m);
    expect(body).toMatch(/^Canonical:\s*https:\/\/zancta\.tech\/\.well-known\/security\.txt$/m);
    expect(body).toMatch(/^Policy:\s*https:\/\/zancta\.tech\/security$/m);
    expect(body).not.toMatch(/^(Encryption|Acknowledgments|Hiring|Preferred-Languages):/im);
    const expiresLine = body.match(/^Expires:\s*(.+)$/m);
    expect(expiresLine?.[1]).toBeTruthy();
    const expires = Date.parse(expiresLine![1].trim());
    expect(Number.isNaN(expires)).toBe(false);
    expect(expiresLine![1].trim()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/);
    const yearMs = 365 * 24 * 60 * 60 * 1000;
    expect(expires).toBeGreaterThan(Date.now());
    expect(expires - Date.now()).toBeLessThanOrEqual(yearMs);
    expect(body).toContain(LEGAL_PUBLIC.securityEmail);
  });
});
