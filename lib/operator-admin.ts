/**
 * Operator ADMIN is an Entitlement.plan value, not Google login.
 * Promotion happens only via the explicit CLI in scripts/promote-operator-admin.mjs.
 */

export function normalizeOperatorEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function promoteAdminBlockedReason(opts: {
  vercelEnv?: string | null;
  confirm: boolean;
  production: boolean;
  email: string;
}): string | null {
  if (opts.vercelEnv === "preview") {
    return "Refusing to promote ADMIN on Vercel Preview.";
  }
  if (!opts.production) {
    return "Refusing without --production.";
  }
  if (!opts.confirm) {
    return "Refusing without --confirm.";
  }
  if (!normalizeOperatorEmail(opts.email) || !opts.email.includes("@")) {
    return "OPERATOR_ADMIN_EMAIL is missing or not an email.";
  }
  return null;
}
