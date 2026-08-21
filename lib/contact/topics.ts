import { EMAIL_CONTACTS, type EmailRole } from "@/lib/email/contacts";

export const CONTACT_TOPIC_IDS = [
  "general",
  "technical",
  "account",
  "billing",
  "refund",
  "privacy",
  "security",
  "partnership",
  "other",
] as const;

export type ContactTopicId = (typeof CONTACT_TOPIC_IDS)[number];

export type ContactTopic = {
  id: ContactTopicId;
  label: string;
  belongs: string;
  destinationRole: EmailRole;
  notFor: string;
};

export const CONTACT_TOPICS: readonly ContactTopic[] = [
  {
    id: "general",
    label: "General enquiry",
    belongs: "Product questions, how a tool works, and anything that does not fit a more specific route.",
    destinationRole: "support",
    notFor: "Passwords, session tokens, payment-card data, or copies of private files.",
  },
  {
    id: "technical",
    label: "Technical support",
    belongs: "A tool failing on a supported file, browser errors, or unexpected local-processing behaviour.",
    destinationRole: "support",
    notFor: "Passwords, uploaded files, or crash dumps that contain document contents.",
  },
  {
    id: "account",
    label: "Account & access",
    belongs: "Sign-in, email verification, password reset, and account deletion questions.",
    destinationRole: "support",
    notFor: "Passwords, one-time codes, or session cookies. Use the in-product reset flow for credentials.",
  },
  {
    id: "billing",
    label: "Billing & subscription",
    belongs: "Premium status, invoices, charges, and Dodo Payments checkout questions.",
    destinationRole: "billing",
    notFor: "Payment-card numbers, CVV, or bank account details. Card data is handled by Dodo Payments.",
  },
  {
    id: "refund",
    label: "Refund / cancellation",
    belongs: "Cancellation at period end, refund status, and related billing disputes.",
    destinationRole: "billing",
    notFor: "Payment-card numbers or screenshots that expose full card PAN.",
  },
  {
    id: "privacy",
    label: "Privacy & personal data",
    belongs: "Questions about personal-data processing described on this site, and privacy requests.",
    destinationRole: "privacy",
    notFor: "Passwords, identity documents, or files that are not needed to identify the request.",
  },
  {
    id: "security",
    label: "Security report",
    belongs: "A suspected vulnerability, account-security incident, or abuse of the application.",
    destinationRole: "security",
    notFor: "Passwords, session tokens, payment-card data, or uploaded exploit files.",
  },
  {
    id: "partnership",
    label: "Partnership / business",
    belongs: "Press, integration, or other business enquiries. There is no separate business mailbox.",
    destinationRole: "support",
    notFor: "Unsolicited attachments, credentials, or payment details.",
  },
  {
    id: "other",
    label: "Other",
    belongs: "Anything that does not match the routes above.",
    destinationRole: "support",
    notFor: "Passwords, session tokens, payment-card data, or uploaded files.",
  },
] as const;

export function contactTopicById(id: string): ContactTopic | undefined {
  return CONTACT_TOPICS.find((topic) => topic.id === id);
}

export function mailboxForTopic(id: ContactTopicId): string {
  const topic = contactTopicById(id);
  if (!topic) return EMAIL_CONTACTS.support;
  return EMAIL_CONTACTS[topic.destinationRole];
}
