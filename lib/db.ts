import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient() {
  const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
  // Handle both SQLite (dev) and PostgreSQL (production) — provider selection via DATABASE_URL
  const isPostgres = url.startsWith("postgresql://") || url.startsWith("postgres://");
  if (isPostgres) {
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] } as unknown as never);
  }
  // Development: SQLite via BetterSqlite3
  const path = url.startsWith("file:") ? url.slice(5).replace(/^\.\//, "./") : url;
  const _dbPath = path.startsWith("/") ? path : `./${path.replace(/^\.\//, "")}`;
  void _dbPath; // keep for future debug, silence unused
  const adapter = new PrismaBetterSqlite3({ url: url });
  return new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] } as unknown as never);
}

export const prisma = (globalForPrisma.prisma ?? createClient()) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma as unknown as PrismaClient;

export default prisma;
