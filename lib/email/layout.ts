import { getAppOrigin } from "@/lib/seo";
import { LEGAL_PUBLIC } from "@/lib/legal-public";
import { EMAIL_CONTACTS } from "./contacts";

export type EmailAction = {
  label: string;
  url: string;
};

export type EmailDocument = {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  paragraphs: string[];
  action?: EmailAction;
  notes?: string[];
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function safeHttpsUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("Email link must use HTTPS");
  if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
    throw new Error("Email link must not use localhost");
  }
  if (parsed.hostname.endsWith(".vercel.app")) {
    throw new Error("Email link must not use a Vercel deployment URL");
  }
  return parsed.toString();
}

export function publicOrigin(): string {
  const origin = getAppOrigin().replace(/\/$/, "");
  if (/localhost|127\.0\.0\.1|\.vercel\.app/i.test(origin)) return LEGAL_PUBLIC.siteUrl;
  return origin;
}

export function brandAssetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${publicOrigin()}${normalized}`;
}

export const EMAIL_LOGO_URL = "https://zancta.tech/assets/zancta-brand/email/zancta-email-mark.png";

function footerHtml(origin: string): string {
  return `<p style="margin:0 0 10px;letter-spacing:.24em;font-weight:700;color:#f7f2ec">ZANCTA</p>
          <p style="margin:0 0 14px;color:#aaa1a0">Browser-based PDF and image tools.</p>
          <p style="margin:0 0 6px">Support: <a href="mailto:${EMAIL_CONTACTS.support}" style="color:#d99a9a">${EMAIL_CONTACTS.support}</a></p>
          <p style="margin:0 0 6px">Privacy: <a href="mailto:${EMAIL_CONTACTS.privacy}" style="color:#d99a9a">${EMAIL_CONTACTS.privacy}</a></p>
          <p style="margin:0 0 6px">Security: <a href="mailto:${EMAIL_CONTACTS.security}" style="color:#d99a9a">${EMAIL_CONTACTS.security}</a></p>
          <p style="margin:0 0 14px">Billing: <a href="mailto:${EMAIL_CONTACTS.billing}" style="color:#d99a9a">${EMAIL_CONTACTS.billing}</a></p>
          <p style="margin:0"><a href="${origin}" style="color:#d99a9a">ZANCTA</a> · <a href="${origin}/help" style="color:#d99a9a">Help</a> · <a href="${origin}/privacy" style="color:#d99a9a">Privacy</a> · <a href="${origin}/terms" style="color:#d99a9a">Terms</a> · <a href="${origin}/refund-and-cancellation" style="color:#d99a9a">Refund &amp; Cancellation</a></p>
          <p style="margin:12px 0 0">Transactional message from ZANCTA — no marketing unsubscribe.</p>`;
}

export function renderEmailHtml(doc: EmailDocument): string {
  const origin = escapeHtml(publicOrigin());
  const paragraphs = doc.paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px;color:#d7d0ca;font-size:16px;line-height:1.6">${escapeHtml(paragraph)}</p>`)
    .join("");
  const notes = (doc.notes ?? [])
    .map((note) => `<p style="margin:0 0 10px;color:#aaa1a0;font-size:14px;line-height:1.55">${escapeHtml(note)}</p>`)
    .join("");
  const action = doc.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="background:#d99a9a;border-radius:4px">
        <a href="${escapeHtml(safeHttpsUrl(doc.action.url))}" style="display:inline-block;padding:14px 22px;color:#211b1d;font-weight:700;text-decoration:none;font-size:16px">${escapeHtml(doc.action.label)}</a>
      </td></tr></table>
      <p style="margin:0 0 8px;color:#d7d0ca;font-size:14px">If the button does not work, copy this URL into your browser:</p>
      <p style="margin:0 0 20px;word-break:break-all;color:#aaa1a0;font-size:14px">${escapeHtml(safeHttpsUrl(doc.action.url))}</p>`
    : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark">
    <title>${escapeHtml(doc.title)}</title>
  </head>
  <body style="margin:0;background:#100f11;color:#f7f2ec;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(doc.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#100f11">
      <tr><td style="padding:32px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:0 auto;border:1px solid #39343a;background:#171519">
          <tr><td style="padding:22px 28px;border-bottom:1px solid #39343a">
            <a href="${origin}" style="text-decoration:none;color:#f7f2ec">
              <img src="${EMAIL_LOGO_URL}" width="40" height="40" alt="ZANCTA" style="display:block;border:0;width:40px;height:40px">
              <span style="display:inline-block;margin-top:10px;letter-spacing:.24em;font-size:13px;font-weight:700">ZANCTA</span>
            </a>
          </td></tr>
          <tr><td style="padding:32px 28px">
            <p style="margin:0 0 12px;color:#d99a9a;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">${escapeHtml(doc.eyebrow)}</p>
            <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#f7f2ec">${escapeHtml(doc.title)}</h1>
            <p style="margin:0 0 16px;color:#d7d0ca;font-size:16px;line-height:1.6">${escapeHtml(doc.intro)}</p>
            ${paragraphs}
            ${action}
            ${notes}
          </td></tr>
          <tr><td style="padding:20px 28px;border-top:1px solid #39343a;color:#aaa1a0;font-size:12px;line-height:1.6">
            ${footerHtml(origin)}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function renderEmailText(doc: EmailDocument): string {
  const origin = publicOrigin();
  const action = doc.action
    ? `\n${doc.action.label}:\n${safeHttpsUrl(doc.action.url)}\n`
    : "";
  const notes = (doc.notes ?? []).map((note) => note).join("\n");
  return `${doc.title}

${doc.intro}

${doc.paragraphs.join("\n\n")}
${action}
${notes}

ZANCTA
Browser-based PDF and image tools.

Support: ${EMAIL_CONTACTS.support}
Privacy: ${EMAIL_CONTACTS.privacy}
Security: ${EMAIL_CONTACTS.security}
Billing: ${EMAIL_CONTACTS.billing}

${origin}
Help: ${origin}/help
Privacy: ${origin}/privacy
Terms: ${origin}/terms
Refund & Cancellation: ${origin}/refund-and-cancellation

Transactional message from ZANCTA.`;
}
