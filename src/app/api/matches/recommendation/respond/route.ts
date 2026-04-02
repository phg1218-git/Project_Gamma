import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/matches/recommendation/respond
 *
 * CASE 2: B가 매칭 요청에 응답 (수락 또는 거절)
 *
 * body: { recommendationId: string, accept: boolean }
 *
 * 수락 시: Match 레코드 생성 → ChatThread 생성 → A에게 알림
 * 거절 시: 상태를 B_REJECTED로 변경 → A에게 거절 알림
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id; // B

    const { recommendationId, accept } = await req.json();

    if (!recommendationId || typeof accept !== "boolean") {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }

    // B의 추천 레코드 확인 (PENDING_B 상태여야 함)
    const rec = await prisma.subthresholdRecommendation.findFirst({
      where: {
        id: recommendationId,
        toUserId: userId,
        status: "PENDING_B",
      },
    });

    if (!rec) {
      return NextResponse.json(
        { error: "요청을 찾을 수 없거나 이미 처리되었습니다." },
        { status: 404 }
      );
    }

    const userAId = rec.fromUserId;
    const userBId = userId;
    const score = rec.score;
    const breakdown = rec.breakdown as Record<string, number>;

    // 관련 알림 읽음 처리 (actionPayload.recommendationId 기준)
    await prisma.notification.updateMany({
      where: {
        userId: userBId,
        actionType: "MATCH_REQUEST",
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    // ── 거절 ─────────────────────────────────────────────────
    if (!accept) {
      await prisma.subthresholdRecommendation.update({
        where: { id: recommendationId },
        data: { status: "B_REJECTED" },
      });

      const profileB = await prisma.profile.findUnique({
        where: { userId: userBId },
        select: { nickname: true },
      });

      await prisma.notification.create({
        data: {
          userId: userAId,
          type: "SYSTEM",
          title: "매칭 요청 결과",
          content: `${profileB?.nickname ?? "상대방"}님이 매칭 요청을 거절했습니다.`,
        },
      });

      return NextResponse.json({ accepted: false });
    }

    // ── 수락: 채팅방 생성 + 양측 알림 ───────────────────────
    const chatThreadId = await prisma.$transaction(async (tx) => {
      const matchA = await tx.match.upsert({
        where: {
          senderId_receiverId: { senderId: userAId, receiverId: userBId },
        },
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
        where: {
          senderId_receiverId: { senderId: userBId, receiverId: userAId },
        },
        create: {
          senderId: userBId,
          receiverId: userAId,
          score,
          breakdown,
          status: "ACCEPTED",
        },
        update: { status: "ACCEPTED", score, breakdown },
      });

      const existing = await tx.chatThread.findUnique({
        where: { matchId: matchA.id },
      });
      const thread =
        existing ??
        (await tx.chatThread.create({
          data: { matchId: matchA.id, userAId, userBId },
        }));

      const [profileA, profileB] = await Promise.all([
        tx.profile.findUnique({
          where: { userId: userAId },
          select: { nickname: true },
        }),
        tx.profile.findUnique({
          where: { userId: userBId },
          select: { nickname: true },
        }),
      ]);

      await tx.notification.createMany({
        data: [
          {
            userId: userAId,
            type: "SYSTEM",
            title: "매칭 성사! 🎉",
            content: `${profileB?.nickname ?? "상대방"}님이 수락했습니다! 채팅을 시작해보세요. 💬`,
          },
          {
            userId: userBId,
            type: "SYSTEM",
            title: "매칭 성사! 🎉",
            content: `${profileA?.nickname ?? "상대방"}님과 채팅방이 생성되었습니다. 지금 대화해보세요! 💬`,
          },
        ],
      });

      return thread.id;
    });

    await prisma.subthresholdRecommendation.update({
      where: { id: recommendationId },
      data: { status: "CHAT_CREATED" },
    });

    return NextResponse.json({ accepted: true, chatThreadId });
  } catch (error) {
    console.error("[Recommendation Respond POST]", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
