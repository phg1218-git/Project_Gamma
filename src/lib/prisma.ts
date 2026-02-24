import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 *
 * In development, Next.js hot-reloads and creates new PrismaClient instances.
 * This singleton pattern prevents connection pool exhaustion.
 * Critical for Neon free tier (limited connections).
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
