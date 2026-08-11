import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient() {
  const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
  // Prisma 7 sqlite expects file: path without file: prefix for better-sqlite3
  const path = url.startsWith("file:") ? url.slice(5).replace(/^\.\//, "./") : url;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _dbPath = path.startsWith("/") ? path : `./${path.replace(/^\.\//, "")}`;
  const adapter = new PrismaBetterSqlite3({ url: url });
  return new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] } as unknown as never);
}

export const prisma = (globalForPrisma.prisma ?? createClient()) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma as unknown as PrismaClient;

export default prisma;
