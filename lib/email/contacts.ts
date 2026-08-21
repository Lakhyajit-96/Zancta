import { LEGAL_PUBLIC } from "@/lib/legal-public";

export const EMAIL_CONTACTS = {
  support: LEGAL_PUBLIC.supportEmail,
  privacy: LEGAL_PUBLIC.privacyEmail,
  security: LEGAL_PUBLIC.securityEmail,
  billing: LEGAL_PUBLIC.billingEmail,
} as const;

export type EmailRole = keyof typeof EMAIL_CONTACTS;

export function replyToForRole(role: EmailRole = "support"): string {
  const override = (process.env.EMAIL_REPLY_TO || "").trim();
  if (role === "support" && override.includes("@")) return override;
  return EMAIL_CONTACTS[role];
}
