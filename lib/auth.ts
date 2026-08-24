import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies, headers } from "next/headers";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { signinSchema } from "@/lib/validators";
import { auditEvent } from "@/lib/audit";
import { oauthIntentCookieName, verifyOAuthIntent } from "@/lib/oauth-intent";
import { consumeDeletedProviderIdentity, hasDeletedProviderIdentity } from "@/lib/deleted-identity";
import { tokenMatchesAuthVersion } from "@/lib/auth-version";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { safeInternalPath } from "@/lib/safe-redirect";

export function hasGoogleOAuth(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
export function hasGitHubOAuth(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export async function verifyCredentialsUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || user.deletedAt) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified };
}

export async function ensureOAuthEntitlement(userId: string): Promise<void> {
  const existing = await prisma.entitlement.findUnique({ where: { userId } }).catch(() => null);
  if (!existing) {
    await prisma.entitlement.create({ data: { userId, plan: "FREE", status: "ACTIVE", source: "OAUTH" } }).catch(() => {});
  }
}

async function readOAuthIntentFromCookie(): Promise<"signin" | "signup" | null> {
  try {
    const jar = await cookies();
    return verifyOAuthIntent(jar.get(oauthIntentCookieName())?.value);
  } catch {
    return null;
  }
}

async function clearOAuthIntentCookie() {
  try {
    const jar = await cookies();
    jar.delete(oauthIntentCookieName());
  } catch {
    // Cookie store is unavailable outside a request (unit tests).
  }
}

export function gatedPrismaAdapter(
  base: Adapter = PrismaAdapter(prisma) as Adapter,
  resolveIntent: () => Promise<"signin" | "signup" | null> = readOAuthIntentFromCookie
): Adapter {
  return {
    ...base,
    async createUser(data) {
      const intent = await resolveIntent();
      if (intent !== "signup") {
        const err = new Error("OAuthAccountNotFound");
        err.name = "OAuthAccountNotFound";
        throw err;
      }
      return base.createUser!(data);
    },
    async linkAccount(account) {
      const provider = account.provider;
      const providerAccountId = account.providerAccountId;
      if (provider && providerAccountId) {
        const intent = await resolveIntent();
        const wasDeleted = await hasDeletedProviderIdentity(provider, providerAccountId);
        if (wasDeleted && intent !== "signup") {
          const err = new Error("OAuthAccountDeleted");
          err.name = "OAuthAccountDeleted";
          throw err;
        }
        if (wasDeleted && intent === "signup") {
          await consumeDeletedProviderIdentity(provider, providerAccountId);
        }
      }
      await base.linkAccount!(account);
    },
  };
}

function buildProviders(): Provider[] {
  const providers: Provider[] = [
    Credentials({
      name: "credentials",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const parsed = signinSchema.safeParse(credentials);
        if (!parsed.success) return null;
        try {
          const hdrs = await headers();
          const ip = getClientIp(hdrs);
          const rlEmail = await rateLimitAsync(`signin-email:${parsed.data.email}`, 10, 15 * 60 * 1000);
          const rlIp = await rateLimitAsync(`signin-ip:${ip}`, 60, 15 * 60 * 1000);
          if (!rlEmail.ok || !rlIp.ok) return null;
        } catch {
          // headers() is unavailable outside a request (unit tests).
        }
        return verifyCredentialsUser(parsed.data.email, parsed.data.password);
      },
    }),
  ];
  if (hasGoogleOAuth()) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    );
  }
  if (hasGitHubOAuth()) {
    providers.push(
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    );
  }
  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  useSecureCookies:
    process.env.VERCEL_ENV === "production"
      ? true
      : process.env.AUTH_USE_SECURE_COOKIES === "false"
        ? false
        : undefined,
  adapter: gatedPrismaAdapter(),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers: buildProviders(),
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await ensureOAuthEntitlement(user.id);
      await auditEvent({ userId: user.id, action: "signup", targetId: user.id, metadata: JSON.stringify({ method: "oauth" }) });
    },
    async signIn({ account, user, profile }) {
      await clearOAuthIntentCookie();
      if (account && account.provider !== "credentials" && user.id) {
        await auditEvent({ userId: user.id, action: "oauth_signin", targetId: user.id, metadata: JSON.stringify({ provider: account.provider }) });
        const googleAttested =
          account.provider === "google" && (profile as { email_verified?: boolean } | undefined)?.email_verified === true;
        if (googleAttested) {
          await prisma.user.updateMany({
            where: { id: user.id, emailVerified: null },
            data: { emailVerified: new Date() },
          });
        }
      }
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${safeInternalPath(url, "/")}`;
      try {
        const target = new URL(url);
        if (target.origin === baseUrl) return `${target.origin}${safeInternalPath(`${target.pathname}${target.search}`, "/")}`;
      } catch {
        // fall through
      }
      return baseUrl;
    },
    async signIn({ account }) {
      if (!account || account.provider === "credentials") return true;
      const existing = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } },
      });
      if (existing) return true;
      const intent = await readOAuthIntentFromCookie();
      if (intent === "signup") return true;
      const deleted = await hasDeletedProviderIdentity(account.provider, account.providerAccountId);
      return deleted ? "/signin?error=OAuthAccountDeleted" : "/signin?error=OAuthAccountNotFound";
    },
    async jwt({ token, user }) {
      try {
        const userId =
          (user as { id?: string } | undefined)?.id ||
          (token.id as string | undefined) ||
          (token.sub as string | undefined);
        if (!userId) return null;
        const live = await prisma.user.findUnique({
          where: { id: String(userId) },
          select: { id: true, deletedAt: true, authVersion: true, emailVerified: true },
        });
        if (!live || live.deletedAt) return null;
        const entitlement = await prisma.entitlement.findUnique({
          where: { userId: live.id },
          select: { plan: true },
        });
        token.emailVerified = live.emailVerified ?? (user as { emailVerified?: Date | null } | undefined)?.emailVerified ?? null;
        token.operator = entitlement?.plan === "ADMIN";
        if (user) {
          token.id = live.id;
          token.authVersion = live.authVersion;
          return token;
        }
        if (!tokenMatchesAuthVersion(token.authVersion, live.authVersion)) return null;
        token.id = live.id;
        token.authVersion = live.authVersion;
        return token;
      } catch {
        return null;
      }
    },
    async session({ session, token }) {
      if (!token?.id) {
        session.expires = new Date(0).toISOString() as typeof session.expires;
        if (session.user) {
          session.user.email = "";
          session.user.name = "";
          (session.user as unknown as { id?: string }).id = undefined;
          session.user.operator = false;
        }
        return session;
      }
      if (session.user) {
        (session.user as unknown as { id: string }).id = token.id as string;
        (session.user as unknown as { emailVerified?: Date | null }).emailVerified = token.emailVerified as Date | null;
        session.user.operator = token.operator === true;
      }
      return session;
    },
  },
});
