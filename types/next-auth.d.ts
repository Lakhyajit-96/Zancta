import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      emailVerified?: Date | null;
      operator?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    authVersion?: number;
    emailVerified?: Date | null;
    operator?: boolean;
  }
}
