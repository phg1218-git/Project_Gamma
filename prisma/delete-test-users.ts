import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Deleting matching test users...");

  const testUsers = await prisma.user.findMany({
    where: {
      email: {
        startsWith: "test_",
      },
    },
    select: { id: true, email: true },
  });

  if (testUsers.length === 0) {
    console.log("No test users found.");
    console.log("=== TEST MATCHING USERS DELETED ===");
    return;
  }

  const testUserIds = testUsers.map((u) => u.id);

  const relatedMatchIds = await prisma.match.findMany({
    where: {
      OR: [
        { senderId: { in: testUserIds } },
        { receiverId: { in: testUserIds } },
      ],
    },
    select: { id: true },
  });
  const matchIds = relatedMatchIds.map((m) => m.id);

  const relatedThreadIds = await prisma.chatThread.findMany({
    where: {
      OR: [
        { userAId: { in: testUserIds } },
        { userBId: { in: testUserIds } },
        { matchId: { in: matchIds } },
      ],
    },
    select: { id: true },
  });
  const threadIds = relatedThreadIds.map((t) => t.id);

  await prisma.$transaction(async (tx) => {
    if (threadIds.length > 0) {
      await tx.message.deleteMany({
        where: {
          OR: [
            { threadId: { in: threadIds } },
            { senderId: { in: testUserIds } },
          ],
        },
      });

      await tx.chatThread.deleteMany({
        where: {
          id: { in: threadIds },
        },
      });
    }

    if (matchIds.length > 0) {
      await tx.match.deleteMany({
        where: {
          id: { in: matchIds },
        },
      });
    }

    await tx.surveyResponse.deleteMany({
      where: {
        userId: { in: testUserIds },
      },
    });

    await tx.profile.deleteMany({
      where: {
        userId: { in: testUserIds },
      },
    });

    await tx.user.deleteMany({
      where: {
        id: { in: testUserIds },
      },
    });
  });

  console.log("=== TEST MATCHING USERS DELETED ===");
  for (const user of testUsers) {
    console.log(`- ${user.email}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Failed to delete test users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
