import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeCompatibilityScore } from "@/lib/matching/scoring";
import { parseLocation } from "@/lib/utils";
import type { Profile } from "@prisma/client";

export interface FilterViolation {
  key: string;
  label: string;  // 사용자에게 보여줄 텍스트
}

/**
 * 하드 필터 위반 항목 계산 (딜브레이커 + 나이차)
 * 제외하지 않고 경고로만 표시하기 위해 별도 함수로 분리
 */
function computeViolations(
  userProfile: Profile,
  userAnswers: Record<string, number | string | string[]>,
  userAge: number,
  cProfile: Profile,
  cAnswers: Record<string, number | string | string[]>,
  cAge: number,
): FilterViolation[] {
  const violations: FilterViolation[] = [];

  // ── 내 딜브레이커 vs 상대 ──
  for (const cond of userProfile.dislikedConditions) {
    switch (cond) {
      case "흡연자":
        if (cProfile.smoking === "OFTEN" || cProfile.smoking === "SOMETIMES")
          violations.push({ key: "smoking", label: "흡연자에요" });
        break;
      case "과음자":
        if (cProfile.drinking === "OFTEN")
          violations.push({ key: "drinking", label: "음주를 즐겨해요" });
        break;
      case "종교차이":
        if (userProfile.religion !== "NONE" && cProfile.religion !== "NONE" && userProfile.religion !== cProfile.religion)
          violations.push({ key: "religion", label: "종교가 달라요" });
        break;
      case "장거리": {
        const ua = parseLocation(userProfile.residenceLocation);
        const ca = parseLocation(cProfile.residenceLocation);
        if (ua.province !== ca.province)
          violations.push({ key: "distance", label: "거주지 지역이 달라요" });
        break;
      }
    }
  }

  // ── 상대 딜브레이커 vs 나 ──
  for (const cond of cProfile.dislikedConditions) {
    switch (cond) {
      case "흡연자":
        if (userProfile.smoking === "OFTEN" || userProfile.smoking === "SOMETIMES")
          violations.push({ key: "smoking_me", label: "상대가 비흡연자를 선호해요" });
        break;
      case "과음자":
        if (userProfile.drinking === "OFTEN")
          violations.push({ key: "drinking_me", label: "상대가 음주를 꺼려요" });
        break;
      case "종교차이":
        if (cProfile.religion !== "NONE" && userProfile.religion !== "NONE" && cProfile.religion !== userProfile.religion)
          violations.push({ key: "religion_me", label: "상대가 같은 종교를 선호해요" });
        break;
      case "장거리": {
        const ua = parseLocation(userProfile.residenceLocation);
        const ca = parseLocation(cProfile.residenceLocation);
        if (ua.province !== ca.province)
          violations.push({ key: "distance_me", label: "상대가 같은 지역을 선호해요" });
        break;
      }
    }
  }

  // ── 나이차 (내 조건 vs 상대 나이) ──
  const ageDiff = cAge - userAge;
  const myOlder = (userAnswers.pf_age_gap_older as number) ?? 15;
  const myYounger = (userAnswers.pf_age_gap_younger as number) ?? 15;
  if (ageDiff > 0 && ageDiff > myOlder)
    violations.push({ key: "age_gap", label: `연상 나이차가 커요 (${ageDiff}살 차이)` });
  else if (ageDiff < 0 && Math.abs(ageDiff) > myYounger)
    violations.push({ key: "age_gap", label: `연하 나이차가 커요 (${Math.abs(ageDiff)}살 차이)` });

  // ── 나이차 (상대 조건 vs 내 나이) ──
  const cOlder = (cAnswers.pf_age_gap_older as number) ?? 15;
  const cYounger = (cAnswers.pf_age_gap_younger as number) ?? 15;
  const ageDiffReverse = userAge - cAge;
  if (ageDiffReverse > 0 && ageDiffReverse > cOlder)
    violations.push({ key: "age_gap_me", label: "상대의 연상 나이차 조건을 초과해요" });
  else if (ageDiffReverse < 0 && Math.abs(ageDiffReverse) > cYounger)
    violations.push({ key: "age_gap_me", label: "상대의 연하 나이차 조건을 초과해요" });

  // 중복 key 제거
  return violations.filter((v, i, arr) => arr.findIndex((x) => x.key === v.key) === i);
}

/**
 * 기준 점수 미만 추천 매칭 API
 *
 * GET  /api/matches/recommendation
 *   - 현재 사용자의 minMatchScore 미만 후보 중 최고 점수 1명 반환
 *   - 이미 SHOWN 상태이며 미만료된 추천이 있으면 그것을 반환
 *
 * POST /api/matches/recommendation
 *   - body: { recommendationId, action: "ACCEPT" | "DECLINE" }
 *   - ACCEPT:
 *     CASE 1: B.minScore <= matchScore → 즉시 채팅방 생성 + 양측 알림
 *     CASE 2: B.minScore > matchScore  → B에게 수락 요청 알림 전송
 *   - DECLINE: 상태를 DECLINED로 변경 (24h 쿨다운)
 */

function calcAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// ── GET: 추천 조회 ──────────────────────────────────────────
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 사용자 프로필 + 설문 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, surveyResponse: true },
    });

    if (!user?.profile || !user?.surveyResponse) {
      return NextResponse.json({ recommendation: null });
    }

    const minScore = user.profile.minMatchScore ?? 0;

    // minScore가 0이면 "기준 미만" 개념 없음
    if (minScore === 0) {
      return NextResponse.json({ recommendation: null });
    }

    // 이미 SHOWN 상태이며 미만료된 추천이 있으면 재사용
    // 단, 그 사이에 이미 매칭된 상대라면 DECLINED 처리 후 무시
    const existingRec = await prisma.subthresholdRecommendation.findFirst({
      where: {
        fromUserId: userId,
        status: "SHOWN",
        expiresAt: { gt: new Date() },
      },
      include: {
        toUser: { include: { profile: true, surveyResponse: true } },
      },
    });

    if (existingRec?.toUser.profile) {
      // 이미 ACCEPTED 매칭이 있으면 추천 무효화
      const alreadyMatched = await prisma.match.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: existingRec.toUserId, status: "ACCEPTED" },
            { senderId: existingRec.toUserId, receiverId: userId, status: "ACCEPTED" },
          ],
        },
      });

      if (alreadyMatched) {
        await prisma.subthresholdRecommendation.update({
          where: { id: existingRec.id },
          data: { status: "DECLINED" },
        });
        // 아래로 이어서 새 후보 탐색
      } else {
        const cProfile = existingRec.toUser.profile;
        const cAnswers = (existingRec.toUser.surveyResponse?.answers ?? {}) as Record<string, number | string | string[]>;
        const userAge = calcAge(user.profile!.dateOfBirth);
        const cAge = calcAge(cProfile.dateOfBirth);
        const violations = computeViolations(user.profile!, userAnswers, userAge, cProfile, cAnswers, cAge);
        return NextResponse.json({
          recommendation: buildRecResponse(existingRec, minScore, violations),
        });
      }
    }

    // 제외 대상 수집
    const [excludedMatches, cooldownRecs] = await Promise.all([
      // 내가 보냈거나 받은 ACCEPTED/REJECTED 매칭 모두 제외 (양방향)
      prisma.match.findMany({
        where: {
          OR: [
            { senderId: userId, status: { in: ["ACCEPTED", "REJECTED"] } },
            { receiverId: userId, status: "ACCEPTED" },
          ],
        },
        select: { senderId: true, receiverId: true },
      }),
      prisma.subthresholdRecommendation.findMany({
        where: {
          fromUserId: userId,
          expiresAt: { gt: new Date() },
        },
        select: { toUserId: true },
      }),
    ]);

    const excludedIds = new Set([
      userId,
      ...excludedMatches.map((m) => m.senderId === userId ? m.receiverId : m.senderId),
      ...cooldownRecs.map((r) => r.toUserId),
    ]);

    // 후보 조회
    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: [...excludedIds] },
        profileComplete: true,
        deletedAt: null,
        profile: { stopMatching: false },
        surveyResponse: { isNot: null },
      },
      include: { profile: true, surveyResponse: true },
    });

    const userAnswers = user.surveyResponse.answers as Record<
      string,
      number | string | string[]
    >;
    const userProfile = user.profile;

    // 점수 계산 — 딜브레이커·나이차는 제외하지 않고 violations로 반환
    // 성별 불일치(동성)는 여전히 기본 제외
    type ScoredCandidate = {
      candidate: (typeof candidates)[0];
      score: ReturnType<typeof computeCompatibilityScore>;
      violations: FilterViolation[];
    };

    const userAge = calcAge(userProfile.dateOfBirth);
    const scored: ScoredCandidate[] = [];
    for (const c of candidates) {
      if (!c.profile || !c.surveyResponse) continue;
      if (c.profile.gender === userProfile.gender) continue; // 동성 제외

      const cAnswers = c.surveyResponse.answers as Record<string, number | string | string[]>;
      const cAge = calcAge(c.profile.dateOfBirth);
      const score = computeCompatibilityScore(userAnswers, cAnswers);
      const violations = computeViolations(userProfile, userAnswers, userAge, c.profile, cAnswers, cAge);

      if (score.total < minScore) {
        scored.push({ candidate: c, score, violations });
      }
    }

    if (scored.length === 0) {
      return NextResponse.json({ recommendation: null });
    }

    // 최고 점수 1명 선택
    scored.sort((a, b) => b.score.total - a.score.total);
    const { candidate, score, violations } = scored[0];

    // 추천 레코드 생성 (24h 쿨다운)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const rec = await prisma.subthresholdRecommendation.create({
      data: {
        fromUserId: userId,
        toUserId: candidate.id,
        score: score.total,
        breakdown: score as unknown as Record<string, number>,
        status: "SHOWN",
        expiresAt,
      },
      include: {
        toUser: { include: { profile: true } },
      },
    });

    return NextResponse.json({
      recommendation: buildRecResponse(rec, minScore, violations),
    });
  } catch (error) {
    console.error("[Recommendation GET]", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// ── POST: 수락 또는 거절 ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { recommendationId, action } = await req.json();

    if (!recommendationId || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }

    // 추천 레코드 확인
    const rec = await prisma.subthresholdRecommendation.findFirst({
      where: {
        id: recommendationId,
        fromUserId: userId,
        status: "SHOWN",
      },
      include: {
        toUser: { include: { profile: true } },
      },
    });

    if (!rec) {
      return NextResponse.json(
        { error: "추천을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // DECLINE: 영구 비노출 (expiresAt을 100년 뒤로 설정)
    if (action === "DECLINE") {
      await prisma.subthresholdRecommendation.update({
        where: { id: recommendationId },
        data: {
          status: "DECLINED",
          expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        },
      });
      return NextResponse.json({ declined: true });
    }

    // ACCEPT: 분기 처리
    const targetProfile = rec.toUser.profile;
    if (!targetProfile) {
      return NextResponse.json({ error: "상대 프로필 없음" }, { status: 404 });
    }

    const matchScore = rec.score;
    const bMinScore = targetProfile.minMatchScore ?? 0;

    await prisma.subthresholdRecommendation.update({
      where: { id: recommendationId },
      data: { status: "ACCEPTED" },
    });

    // ── CASE 1: B 기준도 충족 → 즉시 채팅 생성 ──────────────
    if (bMinScore <= matchScore) {
      const chatThreadId = await createChatAndNotify(
        userId,
        rec.toUserId,
        matchScore,
        rec.breakdown as Record<string, number>
      );

      await prisma.subthresholdRecommendation.update({
        where: { id: recommendationId },
        data: { status: "CHAT_CREATED" },
      });

      return NextResponse.json({ case: 1, chatThreadId });
    }

    // ── CASE 2: B 기준 초과 → B에게 수락 요청 알림 ──────────
    await prisma.subthresholdRecommendation.update({
      where: { id: recommendationId },
      data: { status: "PENDING_B" },
    });

    // A의 닉네임 조회
    const senderProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { nickname: true },
    });
    const senderNickname = senderProfile?.nickname ?? "누군가";

    await prisma.notification.create({
      data: {
        userId: rec.toUserId,
        type: "SYSTEM",
        title: "매칭 요청이 도착했습니다",
        content: `${senderNickname}님이 대화를 희망합니다. 상대의 기준 점수보다는 낮지만(${matchScore.toFixed(1)}점), 대화를 원하고 있어요. 수락하시겠습니까?`,
        actionType: "MATCH_REQUEST",
        actionPayload: { recommendationId },
      },
    });

    return NextResponse.json({ case: 2, pending: true });
  } catch (error) {
    console.error("[Recommendation POST]", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// ── 헬퍼: 채팅방 생성 + 양측 알림 ─────────────────────────
async function createChatAndNotify(
  userAId: string,
  userBId: string,
  score: number,
  breakdown: Record<string, number>
): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    // Match 레코드 upsert (양방향)
    const matchA = await tx.match.upsert({
      where: { senderId_receiverId: { senderId: userAId, receiverId: userBId } },
      create: {
        senderId: userAId,
        receiverId: userBId,
        score,
        breakdown,
        status: "ACCEPTED",
      },
      update: { status: "ACCEPTED", score, breakdown },
    });

    await tx.match.upsert({
      where: { senderId_receiverId: { senderId: userBId, receiverId: userAId } },
      create: {
        senderId: userBId,
        receiverId: userAId,
        score,
        breakdown,
        status: "ACCEPTED",
      },
      update: { status: "ACCEPTED", score, breakdown },
    });

    // 채팅방 생성 (idempotent)
    const existing = await tx.chatThread.findUnique({
      where: { matchId: matchA.id },
    });
    const thread =
      existing ??
      (await tx.chatThread.create({
        data: { matchId: matchA.id, userAId, userBId },
      }));

    // 양측 알림
    const [profileA, profileB] = await Promise.all([
      tx.profile.findUnique({ where: { userId: userAId }, select: { nickname: true } }),
      tx.profile.findUnique({ where: { userId: userBId }, select: { nickname: true } }),
    ]);

    await tx.notification.createMany({
      data: [
        {
          userId: userAId,
          type: "SYSTEM",
          title: "매칭 성사!",
          content: `${profileB?.nickname ?? "상대방"}님과 채팅이 시작되었습니다. 지금 대화해보세요! 💬`,
        },
        {
          userId: userBId,
          type: "SYSTEM",
          title: "새로운 매칭!",
          content: `${profileA?.nickname ?? "상대방"}님이 매칭을 요청하여 채팅방이 생성되었습니다. 지금 대화해보세요! 💬`,
        },
      ],
    });

    return thread.id;
  });
}

// ── 헬퍼: 응답 포맷 ────────────────────────────────────────
function buildRecResponse(
  rec: {
    id: string;
    score: number;
    breakdown: unknown;
    expiresAt: Date;
    toUser: {
      id: string;
      profile: {
        nickname: string;
        dateOfBirth: Date;
        gender: string;
        jobCategory: string;
        residenceLocation: string;
        personality: string;
        hobbies: string[];
        preferences: string[];
        mbti: string;
        height: number | null;
        celebrity: string | null;
      } | null;
    };
  },
  myMinScore: number,
  violations: FilterViolation[] = [],
) {
  const p = rec.toUser.profile!;
  const [residenceProvince] = p.residenceLocation.split("|");

  return {
    id: rec.id,
    score: rec.score,
    breakdown: rec.breakdown,
    myMinScore,
    violations,
    expiresAt: rec.expiresAt.toISOString(),
    targetUser: {
      id: rec.toUser.id,
      nickname: p.nickname,
      age: calcAge(p.dateOfBirth),
      gender: p.gender,
      jobCategory: p.jobCategory,
      residenceProvince,
      personality: p.personality,
      hobbies: p.hobbies,
      preferences: p.preferences,
      mbti: p.mbti,
      height: p.height,
      celebrity: p.celebrity,
    },
  };
}
