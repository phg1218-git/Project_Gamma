/**
 * inject-subthreshold.ts
 *
 * 하은(더미) → gmail 유저로 인연 제안을 보냈고,
 * gmail은 아직 수락하지 않은 PENDING 상태를 만든다.
 *
 * 결과:
 *   - SubthresholdRecommendation (PENDING_B)
 *   - Match haeun→gmail  (ACCEPTED — 하은이 제안을 보낸 것)
 *   - Match gmail→haeun  (PENDING  — gmail은 아직 결정 안 함)
 *   - ChatThread 없음
 *   - Notification → gmail: SUBTHRESHOLD_REQUEST (isRead: false)
 */

import { PrismaClient } from "@prisma/client";
import { computeCompatibilityScore } from "../src/lib/matching/scoring";

const prisma = new PrismaClient();

const haeunId = "cmni4dgfw0007ucygdnsv9kl1";
const gmailId = "cmmb9fd6l0000uc5ggpy4zpm1";

async function main() {
  // ── 기존 데이터 초기화 ─────────────────────────────────────
  await prisma.chatThread.deleteMany({
    where: {
      OR: [
        { userAId: haeunId, userBId: gmailId },
        { userAId: gmailId, userBId: haeunId },
      ],
    },
  });
  await prisma.match.deleteMany({
    where: {
      OR: [
        { senderId: haeunId, receiverId: gmailId },
        { senderId: gmailId, receiverId: haeunId },
      ],
    },
  });
  await prisma.subthresholdRecommendation.deleteMany({
    where: {
      OR: [
        { fromUserId: haeunId, toUserId: gmailId },
        { fromUserId: gmailId, toUserId: haeunId },
      ],
    },
  });
  await prisma.notification.deleteMany({
    where: {
      userId: gmailId,
      actionType: "SUBTHRESHOLD_REQUEST",
    },
  });

  // ── 점수 계산 ──────────────────────────────────────────────
  const [haeunSurvey, gmailSurvey] = await Promise.all([
    prisma.surveyResponse.findUnique({ where: { userId: haeunId } }),
    prisma.surveyResponse.findUnique({ where: { userId: gmailId } }),
  ]);

  let score = 57.9;
  let breakdown: Record<string, number> = {
    surveySimilarity: 22,
    lifestyle: 14,
    valueAlignment: 11,
    personality: 5,
    total: 57.9,
  };

  if (haeunSurvey && gmailSurvey) {
    const result = computeCompatibilityScore(
      haeunSurvey.answers as Record<string, number | string | string[]>,
      gmailSurvey.answers as Record<string, number | string | string[]>
    );
    score = result.total;
    breakdown = result as unknown as Record<string, number>;
  }

  const haeunProfile = await prisma.profile.findUnique({
    where: { userId: haeunId },
    select: { nickname: true },
  });
  const haeunNick = haeunProfile?.nickname ?? "하은";

  // ── PENDING 상태 생성 ──────────────────────────────────────
  const { rec, matchHaeun, matchGmail } = await prisma.$transaction(async (tx) => {
    // SubthresholdRecommendation (PENDING_B: B가 수락 여부 결정 대기)
    const rec = await tx.subthresholdRecommendation.create({
      data: {
        fromUserId: haeunId,
        toUserId: gmailId,
        score,
        breakdown,
        status: "PENDING_B",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Match: 하은→gmail ACCEPTED (하은은 이미 제안을 보낸 상태)
    const matchHaeun = await tx.match.create({
      data: {
        senderId: haeunId,
        receiverId: gmailId,
        score,
        breakdown,
        status: "ACCEPTED",
        matchType: "SUBTHRESHOLD",
      },
    });

    // Match: gmail→하은 PENDING (gmail은 아직 수락 안 함)
    const matchGmail = await tx.match.create({
      data: {
        senderId: gmailId,
        receiverId: haeunId,
        score,
        breakdown,
        status: "PENDING",
        matchType: "SUBTHRESHOLD",
      },
    });

    // Notification → gmail
    await tx.notification.create({
      data: {
        userId: gmailId,
        type: "SYSTEM",
        title: "인연 제안이 도착했어요",
        content: `${haeunNick}님이 직접 인연을 제안했어요.\n기준 점수(${score.toFixed(1)}점)에는 미치지 못하지만, 용기 내어 먼저 연락했답니다.\n대화를 나눠보시겠어요?`,
        actionType: "SUBTHRESHOLD_REQUEST",
        actionPayload: { recommendationId: rec.id },
        isRead: false,
      },
    });

    return { rec, matchHaeun, matchGmail };
  });

  console.log(`✅ PENDING 상태 생성 완료`);
  console.log(`  recommendation  : ${rec.id} (PENDING_B)`);
  console.log(`  match 하은→gmail : ${matchHaeun.id} (ACCEPTED)`);
  console.log(`  match gmail→하은 : ${matchGmail.id} (PENDING)`);
  console.log(`  score           : ${score.toFixed(1)}점`);
  console.log(`  chatThread      : 없음 (수락 후 생성)`);
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
