import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { signinSchema } from "@/lib/validators";
import { auditEvent } from "@/lib/audit";

// OAuth providers are registered only when both credentials exist, so a
// partially configured environment never exposes a broken sign-in method.
export function hasGoogleOAuth(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
export function hasGitHubOAuth(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

// OAuth-created users get the same default entitlement as credentials signup:
// FREE / ACTIVE. Never PREMIUM or ADMIN.
export async function ensureOAuthEntitlement(userId: string): Promise<void> {
  const existing = await prisma.entitlement.findUnique({ where: { userId } }).catch(() => null);
  if (!existing) {
    await prisma.entitlement.create({ data: { userId, plan: "FREE", status: "ACTIVE", source: "OAUTH" } }).catch(() => {});
  }
}

function buildProviders(): Provider[] {
  const providers: Provider[] = [
    Credentials({
      name: "credentials",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const parsed = signinSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash || user.deletedAt) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        // Allow login even if not verified, but flag
        return { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified };
      },
    }),
  ];
  if (hasGoogleOAuth()) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // allowDangerousEmailAccountLinking stays disabled (default): if a Google
        // email matches an existing credentials account, Auth.js refuses to merge
        // and the user must sign in with their password. Prevents takeover.
      })
    );
  }
  if (hasGitHubOAuth()) {
    providers.push(
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        // Default scopes only (read:user, user:email) — identity + email, nothing more.
      })
    );
  }
  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // Local e2e runs over http://localhost, where WebKit rejects Secure/__Host-
  // cookies (Chromium/Firefox accept them on localhost). Production keeps the
  // secure default because the variable is unset there.
  useSecureCookies: process.env.AUTH_USE_SECURE_COOKIES === "false" ? false : undefined,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers: buildProviders(),
  events: {
    // Fires only for adapter-created users (OAuth). Credentials signup creates
    // its own entitlement in the signup route.
    async createUser({ user }) {
      if (!user.id) return;
      await ensureOAuthEntitlement(user.id);
      await auditEvent({ userId: user.id, action: "signup", targetId: user.id, metadata: JSON.stringify({ method: "oauth" }) });
    },
    async signIn({ account, user }) {
      if (account && account.provider !== "credentials" && user.id) {
        await auditEvent({ userId: user.id, action: "oauth_signin", targetId: user.id, metadata: JSON.stringify({ provider: account.provider }) });
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        (session.user as unknown as { id: string }).id = token.id as string;
        (session.user as unknown as { emailVerified?: Date | null }).emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
  },
});
