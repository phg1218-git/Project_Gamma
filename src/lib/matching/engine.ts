import { prisma } from "@/lib/prisma";
import { passesHardFilters } from "./filters";
import { computeCompatibilityScore, type ScoreBreakdown } from "./scoring";
import { getUserMatchThreshold, isMatchScoreGloballyBlocked } from "./rules";

export interface MatchResult {
  userId: string;
  nickname: string;
  age: number;
  jobCategory: string;
  residenceProvince: string;
  score: ScoreBreakdown;
}

export async function findMatches(
  userId: string,
  limit: number = 10,
): Promise<MatchResult[]> {
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

  const userThreshold = await getUserMatchThreshold(userId);

  const candidates = await prisma.user.findMany({
    where: {
      id: { not: userId },
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

  const filteredCandidates = candidates.filter((candidate) => {
    if (!candidate.profile) return false;
    return passesHardFilters(user.profile!, candidate.profile);
  });

  const userAnswers = user.surveyResponse.answers as Record<string, number | string | string[]>;

  const scoredCandidates: MatchResult[] = filteredCandidates
    .map((candidate) => {
      const candidateAnswers = candidate.surveyResponse!.answers as Record<
        string,
        number | string | string[]
      >;
      const score = computeCompatibilityScore(userAnswers, candidateAnswers);
      const profile = candidate.profile!;

      const today = new Date();
      const birth = new Date(profile.dateOfBirth);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

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
    .filter((candidate) => {
      if (isMatchScoreGloballyBlocked(candidate.score.total)) return false;
      return candidate.score.total >= userThreshold;
    })
    .sort((a, b) => b.score.total - a.score.total);

  return scoredCandidates.slice(0, limit);
}

export async function saveMatchResults(
  userId: string,
  results: MatchResult[],
): Promise<void> {
  const userThreshold = await getUserMatchThreshold(userId);
  const eligibleResults = results.filter((result) => {
    if (isMatchScoreGloballyBlocked(result.score.total)) return false;
    return result.score.total >= userThreshold;
  });

  await prisma.$transaction(
    eligibleResults.map((result) =>
      prisma.match.upsert({
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
      }),
    ),
  );
}
