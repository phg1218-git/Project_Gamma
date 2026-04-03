import { prisma } from "@/lib/prisma";
import { passesHardFilters, DEFAULT_FILTER_CONFIG, type FilterConfig } from "./filters";
import { computeCompatibilityScore, type ScoreBreakdown } from "./scoring";

/**
 * 나이 계산 헬퍼 함수
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

/**
 * 나이차 필터 통과 여부 확인
 * @param answers - 설문 응답
 * @param myAge - 내 나이
 * @param partnerAge - 상대방 나이
 */
function passesAgeGapFilter(
  answers: Record<string, number | string | string[]>,
  myAge: number,
  partnerAge: number,
): boolean {
  const ageGapOlder = (answers.pf_age_gap_older as number) ?? 15; // 연상 허용 범위
  const ageGapYounger = (answers.pf_age_gap_younger as number) ?? 15; // 연하 허용 범위

  const ageDiff = partnerAge - myAge;

  // 상대방이 나보다 나이가 많은 경우
  if (ageDiff > 0) {
    return ageDiff <= ageGapOlder;
  }

  // 상대방이 나보다 나이가 적은 경우
  if (ageDiff < 0) {
    return Math.abs(ageDiff) <= ageGapYounger;
  }

  // 동갑인 경우 항상 통과
  return true;
}

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

  // 3. Apply hard filters (양방향: 내가 상대 조건도 통과 + 상대가 내 조건도 통과)
  const userAnswers = user.surveyResponse.answers as Record<string, number | string | string[]>;

  // 관리자 전역 필터 설정 로드
  const configRow = await prisma.matchingConfig.findUnique({ where: { id: 1 } });
  const filterConfig: FilterConfig = configRow ?? DEFAULT_FILTER_CONFIG;

  const filteredCandidates = candidates.filter((candidate) => {
    if (!candidate.profile || !candidate.surveyResponse) return false;

    // 기본 하드 필터 (관리자 config 적용)
    if (!passesHardFilters(user.profile!, candidate.profile, filterConfig)) return false;
    if (!passesHardFilters(candidate.profile, user.profile!, filterConfig)) return false;

    // 나이차 필터 (양방향)
    const userAge = calculateAge(user.profile!.dateOfBirth);
    const candidateAge = calculateAge(candidate.profile.dateOfBirth);

    // 내가 설정한 나이차 범위 내에 상대방이 있는지 확인
    if (!passesAgeGapFilter(userAnswers, userAge, candidateAge)) return false;

    // 상대방이 설정한 나이차 범위 내에 내가 있는지 확인
    const candidateAnswers = candidate.surveyResponse.answers as Record<string, number | string | string[]>;
    if (!passesAgeGapFilter(candidateAnswers, candidateAge, userAge)) return false;

    return true;
  });

  // 4. Score each candidate

  const rawScored = filteredCandidates.map((candidate) => {
    const candidateAnswers = candidate.surveyResponse!.answers as Record<
      string,
      number | string | string[]
    >;
    const score = computeCompatibilityScore(userAnswers, candidateAnswers);
    const profile = candidate.profile!;

    // Calculate age dynamically (만 나이, 생일 경과 여부 반영)
    const age = calculateAge(profile.dateOfBirth);

    // Extract province from location
    const [residenceProvince] = profile.residenceLocation.split("|");

    return {
      userId: candidate.id,
      nickname: profile.nickname,
      age,
      jobCategory: profile.jobCategory,
      residenceProvince,
      score,
      // 상대방의 최소 매칭 점수 — 상호 충족 여부 확인용 (반환값에 포함하지 않음)
      _candidateMinScore: profile.minMatchScore ?? 0,
    };
  });

  // 5. 상대방의 최소 점수 기준도 충족하는 경우만 남김 (상호 매칭 조건)
  const scoredCandidates: MatchResult[] = rawScored
    .filter((r) => r.score.total >= r._candidateMinScore)
    // 6. Sort by total score descending
    .sort((a, b) => b.score.total - a.score.total)
    .map(({ _candidateMinScore: _ignored, ...rest }) => rest);

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
