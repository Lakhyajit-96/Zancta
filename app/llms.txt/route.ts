import { LEGAL_PUBLIC } from "@/lib/legal-public";
import { PREMIUM_CONTRACT, FREE_BENEFITS, PREMIUM_BENEFITS } from "@/lib/payments/premium-contract";
import { isLivePaymentsEnabled } from "@/lib/payments/live";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-static";

function llmsTxt(): string {
  const available = TOOLS.filter((t) => t.available);
  const deferred = TOOLS.filter((t) => !t.available);
  const checkoutLive = isLivePaymentsEnabled();
  const toolLines = available.map((t) => `- ${t.name} (${LEGAL_PUBLIC.siteUrl}/tools/${t.slug}): ${t.description}`).join("\n");
  const deferredLines = deferred.map((t) => `- ${t.name} (${LEGAL_PUBLIC.siteUrl}/tools/${t.slug}): deferred, noindex, no processing`).join("\n");

  return `# ZANCTA

> ${LEGAL_PUBLIC.brand} is a website of browser-local PDF and image tools at ${LEGAL_PUBLIC.siteUrl}, operated by ${LEGAL_PUBLIC.operatorName} as an individual operator.
> This file is a concise, factual description for language-model crawlers. It is not a ranking claim.

## What it is

ZANCTA provides ${available.length} available tools that process supported files in the visitor's browser after the page and engine assets load. For those implemented local workflows, selected file bytes are not uploaded to ZANCTA for processing. Tools work without an account.

## What it is not

- Not a cloud converter, e-sign platform, or Office (Word/Excel/PPT) conversion service.
- Not a certified privacy, security, or legal-compliance program.
- Not guaranteed private against browser extensions, malware, device backups, or future optional cloud features.
- Background removal is deferred: no model and no cloud fallback.

## Available tools

${toolLines}

## Deferred

${deferredLines}

## Formats and limits (current)

- Image tools: JPG, PNG, WebP. HEIC and SVG are not supported. AVIF is not accepted on Convert.
- PDF tools: PDF. Typical per-file cap 50 MB; OCR images 20 MB. Merge up to 50 PDFs / 200 total pages.
- Image OCR: English only, local Tesseract assets. PDF Text Extractor reads embedded text; it does not OCR scanned PDFs.
- PDF Compress: object-stream rewrite. Embedded images are not recompressed; size may not shrink.

## Accounts and Premium

Accounts are for sign-in and paid-plan status, not to unlock the local tools.
Premium is ${LEGAL_PUBLIC.monthlyDisplayINR} or ${LEGAL_PUBLIC.annualDisplayINR} via ${LEGAL_PUBLIC.paymentProviderName} (${LEGAL_PUBLIC.paymentProviderRole}).
Free: ${FREE_BENEFITS.join("; ")}.
Premium: ${PREMIUM_BENEFITS.join("; ")}.
Ads shipped: ${String(PREMIUM_CONTRACT.adsShipped)}. Checkout status: ${checkoutLive ? "live" : "paused pending verified support and commercial launch prerequisites"}.

## Canonical pages

- Home: ${LEGAL_PUBLIC.siteUrl}/
- Tools: ${LEGAL_PUBLIC.siteUrl}/tools
- Pricing: ${LEGAL_PUBLIC.siteUrl}/pricing
- Help: ${LEGAL_PUBLIC.siteUrl}/help
- FAQ: ${LEGAL_PUBLIC.siteUrl}/faq
- Local processing: ${LEGAL_PUBLIC.siteUrl}/guides/local-processing
- Privacy: ${LEGAL_PUBLIC.siteUrl}/privacy
- Terms: ${LEGAL_PUBLIC.siteUrl}/terms
- Refunds and cancellation: ${LEGAL_PUBLIC.siteUrl}/refund-and-cancellation
- Security: ${LEGAL_PUBLIC.siteUrl}/security
- Contact (no monitored inbox; noindex): ${LEGAL_PUBLIC.siteUrl}/contact
`;
}

export function GET() {
  return new Response(llmsTxt(), {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
