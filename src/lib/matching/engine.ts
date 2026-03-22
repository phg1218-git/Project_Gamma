import { prisma } from "@/lib/prisma";
import { passesHardFilters } from "./filters";
import { computeCompatibilityScore, type ScoreBreakdown } from "./scoring";

/**
 * 이어줌 — Core Matching Engine
 *
 * Orchestrates the full matching pipeline:
 *   1. Fetch the requesting user's profile and survey
 *   2. Fetch all active candidate profiles + surveys
 *   3. Apply hard filters (eliminate incompatible candidates)
 *   4. Compute soft scores for remaining candidates
 *   5. Rank by total score descending
 *   6. Return top N matches with score breakdowns
 *
 * Performance Note (Neon free tier):
 *   - With a small user base, fetching all candidates and filtering
 *     in-memory is acceptable.
 *   - For scale (1000+ users), push hard filters into SQL queries
 *     and paginate candidates.
 */

export interface MatchResult {
  userId: string;
  nickname: string;
  age: number;
  jobCategory: string;
  residenceProvince: string;
  score: ScoreBreakdown;
}

/**
 * Find the best matches for a user.
 *
 * @param userId - The requesting user's ID
 * @param limit  - Max number of matches to return (default: 10)
 * @returns Ranked array of MatchResult
 */
export async function findMatches(
  userId: string,
  limit: number = 10,
): Promise<MatchResult[]> {
  // 1. Get requesting user's profile and survey
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      surveyResponse: true,
    },
  });

  if (!user?.profile || !user?.surveyResponse) {
    throw new Error("프로필과 설문을 모두 완료해야 매칭이 가능합니다.");
  }

  // 2-a. 이미 거부하거나 매칭 완료된 상대 ID 수집 (재노출 방지)
  const excludedMatches = await prisma.match.findMany({
    where: {
      OR: [
        // 내가 거부했거나 수락 완료된 상대 (MATCHED enum 없음 → ACCEPTED 사용)
        { senderId: userId, status: { in: ["REJECTED", "ACCEPTED"] } },
        // 나를 거부한 상대
        { receiverId: userId, status: "REJECTED" },
      ],
    },
    select: { senderId: true, receiverId: true },
  });

  const excludedUserIds = excludedMatches.map((m) =>
    m.senderId === userId ? m.receiverId : m.senderId,
  );

  // 2-b. Fetch all candidates with completed profiles and surveys
  //      Exclude self, stopped-matching users, and already-rejected/matched users
  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: [userId, ...excludedUserIds] },
      profileComplete: true,
      profile: {
        stopMatching: false,
      },
      surveyResponse: {
        isNot: null,
      },
    },
    include: {
      profile: true,
      surveyResponse: true,
    },
  });

  // 3. Apply hard filters
  const filteredCandidates = candidates.filter((candidate) => {
    if (!candidate.profile) return false;
    return passesHardFilters(user.profile!, candidate.profile);
  });

  // 4. Score each candidate
  const userAnswers = user.surveyResponse.answers as Record<string, number | string | string[]>;

  const scoredCandidates: MatchResult[] = filteredCandidates
    .map((candidate) => {
      const candidateAnswers = candidate.surveyResponse!.answers as Record<
        string,
        number | string | string[]
      >;
      const score = computeCompatibilityScore(userAnswers, candidateAnswers);
      const profile = candidate.profile!;

      // Calculate age dynamically (만 나이, 생일 경과 여부 반영)
      const today = new Date();
      const birth = profile.dateOfBirth; // already a Date from Prisma
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      // Extract province from location
      const [residenceProvince] = profile.residenceLocation.split("|");

      return {
        userId: candidate.id,
        nickname: profile.nickname,
        age,
        jobCategory: profile.jobCategory,
        residenceProvince,
        score,
      };
    })
    // 5. Sort by total score descending
    .sort((a, b) => b.score.total - a.score.total);

  // 6. Return top N
  return scoredCandidates.slice(0, limit);
}

/**
 * Save match results to the database.
 *
 * - minScore 이상인 결과만 저장한다.
 * - 새 top-N에 포함되지 않은 기존 PENDING 매칭은 EXPIRED로 처리한다.
 *   (REJECTED·ACCEPTED 는 건드리지 않는다.)
 */
export async function saveMatchResults(
  userId: string,
  results: MatchResult[],
  minScore: number = 0,
): Promise<void> {
  const filtered = results.filter((r) => r.score.total >= minScore);
  const newReceiverIds = filtered.map((r) => r.userId);

  await prisma.$transaction(async (tx) => {
    // 새 top-N upsert (status 는 기존 레코드가 있어도 변경하지 않음)
    for (const result of filtered) {
      await tx.match.upsert({
        where: {
          senderId_receiverId: {
            senderId: userId,
            receiverId: result.userId,
          },
        },
        create: {
          senderId: userId,
          receiverId: result.userId,
          score: result.score.total,
          breakdown: result.score as unknown as Record<string, number>,
          status: "PENDING",
        },
        update: {
          score: result.score.total,
          breakdown: result.score as unknown as Record<string, number>,
          updatedAt: new Date(),
        },
      });
    }

    // 새 top-N에 없는 기존 PENDING → EXPIRED (stale 정리)
    if (newReceiverIds.length > 0) {
      await tx.match.updateMany({
        where: {
          senderId: userId,
          status: "PENDING",
          receiverId: { notIn: newReceiverIds },
        },
        data: { status: "EXPIRED" },
      });
    } else {
      // 결과가 0개면 모든 PENDING을 EXPIRED 처리
      await tx.match.updateMany({
        where: { senderId: userId, status: "PENDING" },
        data: { status: "EXPIRED" },
      });
    }
  });
}
