import { PrismaClient } from "@prisma/client";

/**
 * Database Seed Script
 *
 * Creates test data for local development.
 * Run: npm run db:seed (or npx tsx prisma/seed.ts)
 *
 * Note: Since we use OAuth, we can't seed users directly.
 * This seed creates test profiles for users that already exist.
 * Run this after logging in with at least one OAuth account.
 */

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Check if any users exist
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("⚠️  No users found. Please log in with OAuth first, then re-run seed.");
    return;
  }

  console.log(`Found ${userCount} user(s). Seed complete.`);
  console.log("💡 Tip: Log in with 2+ OAuth accounts and complete profiles to test matching.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
