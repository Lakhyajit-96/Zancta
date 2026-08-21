import { PREMIUM_CONTRACT } from "@/lib/payments/premium-contract";
import type { EmailDocument } from "./layout";
import { publicOrigin } from "./layout";
import { EMAIL_CONTACTS } from "./contacts";

const origin = () => publicOrigin();

export function welcomeEmail(): EmailDocument {
  return {
    preheader: "Your ZANCTA account is ready.",
    eyebrow: "Account",
    title: "Welcome to ZANCTA",
    intro: "Welcome to ZANCTA.",
    paragraphs: [
      "Your account is ready.",
      "ZANCTA provides browser-based PDF and image tools designed around local processing. Your account is used for account, authentication, and billing features; supported file-processing workflows run in your browser.",
    ],
    action: { label: "Open ZANCTA", url: `${origin()}/` },
  };
}

export function verificationEmail(url: string): EmailDocument {
  return {
    preheader: "Confirm your email address to finish setting up your account.",
    eyebrow: "Email verification",
    title: "Verify your ZANCTA email address",
    intro: "Confirm your email address to complete your ZANCTA account setup.",
    paragraphs: ["After you verify, you can sign in with this email. The link works once."],
    action: { label: "Verify email address", url },
    notes: [
      "This verification link expires after 24 hours.",
      "If you did not create this account, you can ignore this message.",
      "ZANCTA will never ask you to send your password by email.",
    ],
  };
}

export function passwordResetEmail(url: string): EmailDocument {
  return {
    preheader: "A password reset was requested for your account.",
    eyebrow: "Account security",
    title: "Reset your ZANCTA password",
    intro: "A password reset was requested for your ZANCTA account.",
    paragraphs: ["If you made this request, use the button below to choose a new password."],
    action: { label: "Reset password", url },
    notes: [
      "If you did not request this reset, you can safely ignore this email.",
      "The link expires after 60 minutes and can be used once.",
      "After a successful reset, existing signed-in sessions for that account are ended.",
      "ZANCTA will never ask you to send your password by email.",
    ],
  };
}

export function passwordChangedEmail(): EmailDocument {
  return {
    preheader: "Your password has been successfully updated.",
    eyebrow: "Account security",
    title: "Your ZANCTA password was changed",
    intro: "Your ZANCTA password was successfully changed.",
    paragraphs: [
      "For your protection, existing authenticated sessions were invalidated when the password was reset.",
      "If you made this change, no further action is required.",
      `If you did not make this change, secure your account immediately and contact ${EMAIL_CONTACTS.security}.`,
    ],
    action: { label: "Open ZANCTA", url: `${origin()}/signin` },
  };
}

export function accountDeletedEmail(): EmailDocument {
  return {
    preheader: "Your account deletion request has been completed.",
    eyebrow: "Account",
    title: "Your ZANCTA account has been deleted",
    intro: "Your ZANCTA account deletion request has been completed.",
    paragraphs: [
      "You will no longer be able to sign in to this deleted account unless you explicitly create a new account through the supported signup flow.",
      "Local tool files were not stored on ZANCTA servers for implemented local processing. Payment-provider records retained by Dodo Payments as Merchant of Record are outside this deletion.",
      `If you did not request this deletion, contact ${EMAIL_CONTACTS.security}.`,
    ],
  };
}

export function subscriptionActivatedEmail(input: {
  planLabel: string;
  amountLabel: string;
  periodEnd?: string;
}): EmailDocument {
  const paragraphs = [
    `Plan: ${input.planLabel}`,
    `Amount: ${input.amountLabel}`,
    "Status: Active",
    `Premium currently includes the same implemented local tools and the same limits as Free. It is optional financial support for the product, and it reserves an ad-free experience if ads are introduced later. Ads are not live. Higher limits, extra tools, and OCR Power are not part of Premium yet.`,
  ];
  if (input.periodEnd) {
    paragraphs.splice(3, 0, `Current period end (from the payment provider): ${input.periodEnd}`);
  }
  return {
    preheader: "Your ZANCTA subscription is now active.",
    eyebrow: "Billing",
    title: "Your ZANCTA Premium subscription is active",
    intro: "Your ZANCTA Premium subscription is now active.",
    paragraphs,
    action: { label: "View account", url: `${origin()}/account` },
    notes: [`Billing questions: ${EMAIL_CONTACTS.billing}`],
  };
}

export function subscriptionRenewedEmail(input: {
  planLabel: string;
  amountLabel?: string;
  periodEnd?: string;
}): EmailDocument {
  const paragraphs = [`Plan: ${input.planLabel}`, "Status: Active"];
  if (input.amountLabel) paragraphs.push(`Amount: ${input.amountLabel}`);
  if (input.periodEnd) paragraphs.push(`Current period end (from the payment provider): ${input.periodEnd}`);
  return {
    preheader: "Your ZANCTA subscription renewed.",
    eyebrow: "Billing",
    title: "Your ZANCTA Premium subscription renewed",
    intro: "The payment provider reported a renewal for your ZANCTA Premium subscription.",
    paragraphs,
    action: { label: "View account", url: `${origin()}/account` },
    notes: [`Billing questions: ${EMAIL_CONTACTS.billing}`],
  };
}

export function paymentFailedEmail(): EmailDocument {
  return {
    preheader: "We could not confirm the latest payment.",
    eyebrow: "Billing",
    title: "Action may be required for your ZANCTA subscription",
    intro: "We could not confirm the latest payment for your ZANCTA subscription.",
    paragraphs: [
      "Review your billing information through your ZANCTA account or the provider's secure checkout/billing flow.",
    ],
    action: { label: "Review billing", url: `${origin()}/account` },
    notes: [`Billing questions: ${EMAIL_CONTACTS.billing}`],
  };
}

export function cancellationEmail(input: { scheduled: boolean; periodEnd?: string }): EmailDocument {
  const paragraphs = input.scheduled
    ? [
        "Your cancellation request has been received.",
        "Your subscription is scheduled to end at the end of the current billing period.",
        ...(input.periodEnd ? [`Provider-confirmed period end: ${input.periodEnd}`] : []),
        "You keep the current Premium status until that period ends, then access returns to Free.",
      ]
    : [
        "Your cancellation request has been received.",
        "The payment provider reports this subscription as cancelled.",
      ];
  return {
    preheader: "Your cancellation request has been received.",
    eyebrow: "Billing",
    title: "Your ZANCTA subscription cancellation is confirmed",
    intro: input.scheduled
      ? "Your subscription is scheduled to end at the end of the current billing period."
      : "Your ZANCTA subscription cancellation is confirmed.",
    paragraphs,
    action: { label: "View account", url: `${origin()}/account` },
    notes: [`Billing questions: ${EMAIL_CONTACTS.billing}`],
  };
}

export function refundProcessedEmail(input: {
  amountLabel?: string;
  currency?: string;
  status: string;
  reference?: string;
}): EmailDocument {
  const paragraphs = [
    "Your refund request has been processed by the payment provider.",
    ...(input.amountLabel ? [`Refund amount: ${input.amountLabel}`] : []),
    ...(input.currency ? [`Currency: ${input.currency}`] : []),
    `Refund status: ${input.status}`,
    ...(input.reference ? [`Provider reference: ${input.reference}`] : []),
    "A bank settlement date is not promised here because it depends on the payment provider and your bank.",
  ];
  return {
    preheader: "Your refund request has been processed.",
    eyebrow: "Billing",
    title: "Your ZANCTA refund has been processed",
    intro: "Your ZANCTA refund has been processed.",
    paragraphs,
    notes: [`Billing questions: ${EMAIL_CONTACTS.billing}`],
  };
}

export function securityNotificationEmail(input: { happened: string; when?: string; next: string }): EmailDocument {
  return {
    preheader: "A security-related change was recorded on your ZANCTA account.",
    eyebrow: "Security",
    title: "ZANCTA security notification",
    intro: input.happened,
    paragraphs: [
      ...(input.when ? [`When: ${input.when}`] : []),
      input.next,
      `Security contact: ${EMAIL_CONTACTS.security}`,
    ],
  };
}

export function planLabelFromId(planId: string | null | undefined): string {
  const id = (planId || "").toUpperCase();
  if (id.includes("YEAR")) return "ZANCTA Premium Yearly";
  return "ZANCTA Premium Monthly";
}

export function amountLabelFromPlan(planId: string | null | undefined): string {
  const id = (planId || "").toUpperCase();
  if (id.includes("YEAR")) return PREMIUM_CONTRACT.annualDisplayINR.replace(" / ", "/");
  return PREMIUM_CONTRACT.monthlyDisplayINR.replace(" / ", "/");
}
