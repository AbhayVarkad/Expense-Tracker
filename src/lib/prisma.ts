import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Next.js dev mode reloads modules on every request; caching the client (and
 * its connection pool) on `globalThis` stops that from opening a fresh
 * Postgres connection pool on every request and exhausting Neon's connection
 * limit.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString === undefined || connectionString === "") {
    throw new Error("DATABASE_URL is not set. Add it to .env before starting the server.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
