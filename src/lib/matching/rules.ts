import { prisma } from "@/lib/prisma";
import { GLOBAL_MIN_MATCH_SCORE, MAX_ACTIVE_CHATS_PER_USER } from "@/lib/constants";

export async function getUserMatchThreshold(userId: string): Promise<number> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { minMatchScore: true },
  });

  return Math.max(GLOBAL_MIN_MATCH_SCORE, profile?.minMatchScore ?? GLOBAL_MIN_MATCH_SCORE);
}

export function isMatchScoreGloballyBlocked(score: number): boolean {
  return score <= GLOBAL_MIN_MATCH_SCORE;
}

export async function getActiveChatCount(userId: string): Promise<number> {
  return prisma.chatThread.count({
    where: {
      status: "OPEN",
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });
}

export async function hasReachedActiveChatCapacity(userId: string): Promise<boolean> {
  const activeCount = await getActiveChatCount(userId);
  return activeCount >= MAX_ACTIVE_CHATS_PER_USER;
}
