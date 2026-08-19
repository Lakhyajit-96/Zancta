import { SigninClient } from "./signin-client";

export default function SigninPage() {
  // Server-side env gate: buttons render only when the provider is configured.
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const github = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  return <SigninClient google={google} github={github} />;
}
