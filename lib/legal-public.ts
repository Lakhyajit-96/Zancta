/**
 * Public legal/support facts that may appear on indexed pages.
 * Only product behavior and provider names that exist in this codebase.
 * Do not add a legal entity, address, mailbox, jurisdiction, or lawyer-approval claim here
 * unless that fact is published by the operator.
 *
 * Public personal-name disclosure is limited to Terms (`operatorDisclosurePath`).
 * Contact, About, metadata, emails, and structured data must not repeat it.
 */
export const LEGAL_PUBLIC = {
  brand: "ZANCTA",
  siteUrl: "https://zancta.tech",
  operatorName: "Lakhyajit Changmai",
  operatorForm: "Unincorporated individual",
  productDescriptor: "Independently operated PDF and image software",
  identitySummary:
    "ZANCTA is independently operated privacy-first document software. Supported tools process selected files in the browser.",
  lastUpdated: "August 23, 2026",
  lawyerReviewed: false,
  operatorLegalNamePublished: true,
  operatorDisclosurePath: "/terms",
  operatorAddressPublished: false,
  jurisdictionPublished: false,
  monitoredSupportPublished: true,
  monitoredSecurityPublished: true,
  supportEmail: "support@zancta.tech",
  privacyEmail: "privacy@zancta.tech",
  securityEmail: "security@zancta.tech",
  billingEmail: "billing@zancta.tech",
  paymentProviderName: "Dodo Payments",
  paymentProviderRole: "Merchant of Record",
  monthlyDisplayINR: "₹199 / month",
  annualDisplayINR: "₹999 / year",
} as const;

export const LEGAL_PATHS = {
  terms: "/terms",
  privacy: "/privacy",
  refund: "/refund-and-cancellation",
  contact: "/contact",
  security: "/security",
  pricing: "/pricing",
  account: "/account",
  help: "/help",
} as const;
