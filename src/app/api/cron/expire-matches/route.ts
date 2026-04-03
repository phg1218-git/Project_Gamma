import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findMatches, saveMatchResults } from "@/lib/matching/engine";

/**
 * GET /api/cron/expire-matches
 *
 * Vercel Cron Job — 매일 새벽 3시 실행
 * 3일 이상 응답 없는 PENDING 매칭을 EXPIRED 처리 후 재매칭 수행.
 *
 * 방금 만료된 상대는 engine.ts의 exclusion 로직에 의해
 * 즉시 재노출되지 않고 다음 사이클(3일 후) 이후에 다시 매칭 가능.
 */
export async function GET(req: Request) {
  // Vercel Cron 인증 검증
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const THREE_DAYS_AGO = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  // 1. 3일 이상 PENDING 상태인 매칭 발송자 수집
  const staleMatches = await prisma.match.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: THREE_DAYS_AGO },
    },
    select: { senderId: true },
  });

  if (staleMatches.length === 0) {
    return NextResponse.json({ expired: 0, rematched: 0 });
  }

  // 2. 해당 매칭을 EXPIRED로 일괄 처리
  const expireResult = await prisma.match.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: THREE_DAYS_AGO },
    },
    data: { status: "EXPIRED" },
  });

  // 3. 영향받은 발송자 중복 제거
  const senderIds = [...new Set(staleMatches.map((m) => m.senderId))];

  let rematched = 0;
  const notifyUserIds: string[] = [];

  // 4. 각 발송자에 대해 재매칭 수행
  //    방금 EXPIRED된 상대는 engine.ts exclusion 로직에 의해 3일간 재노출되지 않음
  for (const userId of senderIds) {
    try {
      const results = await findMatches(userId, 10);
      await saveMatchResults(userId, results);
      notifyUserIds.push(userId);
      rematched++;
    } catch {
      // 프로필·설문 미완료 유저 등 — 조용히 건너뜀
    }
  }

  // 5. 알림 발송
  if (notifyUserIds.length > 0) {
    await prisma.notification.createMany({
      data: notifyUserIds.map((userId) => ({
        userId,
        type: "SYSTEM" as const,
        title: "새로운 매칭이 도착했어요",
        content:
          "이전 매칭이 3일 동안 응답이 없어 만료되었습니다. 새로운 인연을 확인해보세요!",
      })),
    });
  }

  return NextResponse.json({
    expired: expireResult.count,
    rematched,
  });
}
