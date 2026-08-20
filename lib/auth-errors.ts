// Safe, user-facing descriptions for Auth.js error codes. Never exposes
// provider internals, tokens, configuration details, or stack information.
export function describeAuthError(code: string | null | undefined, context: { page?: "signin" | "signup" } = {}): string | null {
  if (!code) return null;
  switch (code) {
    case "OAuthAccountNotLinked":
      return "That email is already registered with a password. Sign in with your email and password instead.";
    case "OAuthAccountNotFound":
      return "No ZANCTA account is linked to that sign-in method. Create an account first.";
    case "OAuthCreateAccount":
      return context.page === "signup"
        ? "We couldn't create that account. Please try again."
        : "No ZANCTA account is linked to that sign-in method. Create an account first.";
    case "OAuthAccountDeleted":
      return context.page === "signup"
        ? "We couldn't create that account. Please try again."
        : "Your ZANCTA account no longer exists. Create a new account to continue.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCallbackError":
    case "EmailCreateAccount":
    case "CallbackRouteError":
    case "SessionRequired":
      return "We couldn't complete that sign-in. Please try again, or use email and password.";
    case "Configuration":
      return "That sign-in method is temporarily unavailable. Please use email and password.";
    case "AccessDenied":
      return "Sign-in was cancelled. You can try again whenever you're ready.";
    case "Verification":
      return "That sign-in link is no longer valid. Please try again.";
    case "CredentialsSignin":
      return "Invalid email or password";
    default:
      return "We couldn't sign you in. Please try again.";
  }
}
