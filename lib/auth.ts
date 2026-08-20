import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { signinSchema } from "@/lib/validators";
import { auditEvent } from "@/lib/audit";
import { oauthIntentCookieName, verifyOAuthIntent } from "@/lib/oauth-intent";
import { consumeDeletedProviderIdentity, hasDeletedProviderIdentity } from "@/lib/deleted-identity";

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
    async signIn({ account, user }) {
      await clearOAuthIntentCookie();
      if (account && account.provider !== "credentials" && user.id) {
        await auditEvent({ userId: user.id, action: "oauth_signin", targetId: user.id, metadata: JSON.stringify({ provider: account.provider }) });
      }
    },
  },
  callbacks: {
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
      if (user) {
        token.id = (user as { id: string }).id;
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }
      const userId = (token.id as string | undefined) || (token.sub as string | undefined);
      if (userId) {
        const live = await prisma.user.findUnique({
          where: { id: String(userId) },
          select: { id: true, deletedAt: true },
        });
        if (!live || live.deletedAt) {
          return null;
        }
        token.id = live.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token?.id) {
        session.expires = new Date(0).toISOString() as typeof session.expires;
        if (session.user) {
          session.user.email = "";
          session.user.name = "";
          (session.user as unknown as { id?: string }).id = undefined;
        }
        return session;
      }
      if (session.user) {
        (session.user as unknown as { id: string }).id = token.id as string;
        (session.user as unknown as { emailVerified?: Date | null }).emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
  },
});
