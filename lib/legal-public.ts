/**
 * Public legal/support facts that may appear on indexed pages.
 * Only product behavior and provider names that exist in this codebase.
 * Do not add a legal entity, address, mailbox, jurisdiction, or lawyer-approval claim here
 * unless that fact is published by the operator.
 */
export const LEGAL_PUBLIC = {
  brand: "ZANCTA",
  siteUrl: "https://zancta.tech",
  lastUpdated: "August 21, 2026",
  lawyerReviewed: false,
  operatorLegalNamePublished: false,
  operatorAddressPublished: false,
  jurisdictionPublished: false,
  monitoredSupportPublished: false,
  monitoredSecurityPublished: false,
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
