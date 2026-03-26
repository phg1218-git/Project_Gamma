import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

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

  // ── 관리자 계정 생성 ──────────────────────────────────────
  const adminUsername = process.env.ADMIN_ID || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  // 이미 존재하는지 확인
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: adminUsername },
  });

  if (existingAdmin) {
    console.log(`✅ Admin account already exists: ${adminUsername}`);
  } else {
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 관리자 계정 생성
    await prisma.admin.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        email: process.env.ADMIN_EMAIL || null,
        role: "admin",
        isActive: true,
      },
    });

    console.log(`✅ Admin account created: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
  }

  // ── 일반 사용자 확인 ────────────────────────────────────────
  // Check if any users exist
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("⚠️  No users found. Please log in with OAuth first, then re-run seed.");
    return;
  }

  console.log(`\nFound ${userCount} user(s). Seed complete.`);
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
