import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const defaults = [
    { key: "daily_like_limit", value: "30" },
    { key: "min_match_score", value: "50" },
  ];

  for (const item of defaults) {
    await prisma.setting.upsert({
      where: { key: item.key },
      create: item,
      update: { value: item.value },
    });
  }

  console.log("✅ Default admin settings seeded.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
