// Safe, user-facing descriptions for Auth.js error codes. Never exposes
// provider internals, tokens, configuration details, or stack information.
export function describeAuthError(code: string | null | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "OAuthAccountNotLinked":
      return "That email is already registered with a password. Sign in with your email and password instead.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCallbackError":
    case "OAuthCreateAccount":
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
