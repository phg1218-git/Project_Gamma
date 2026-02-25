import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { findMatches, saveMatchResults } from "@/lib/matching/engine";
import {
  getActiveChatCount,
  getUserMatchThreshold,
  hasReachedActiveChatCapacity,
  isMatchScoreGloballyBlocked,
} from "@/lib/matching/rules";
import { MAX_ACTIVE_CHATS_PER_USER } from "@/lib/constants";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const matches = await prisma.match.findMany({
      where: { senderId: session.user.id },
      include: {
        receiver: {
          include: { profile: true },
        },
      },
      orderBy: { score: "desc" },
      take: 20,
    });

    if (matches.length === 0) {
      try {
        const results = await findMatches(session.user.id, 10);
        if (results.length > 0) {
          await saveMatchResults(session.user.id, results);
        }

        const newMatches = await prisma.match.findMany({
          where: { senderId: session.user.id },
          include: {
            receiver: {
              include: { profile: true },
            },
          },
          orderBy: { score: "desc" },
          take: 20,
        });

        return NextResponse.json(formatMatches(newMatches));
      } catch (matchError) {
        return NextResponse.json({
          matches: [],
          message: (matchError as Error).message,
        });
      }
    }

    return NextResponse.json(formatMatches(matches));
  } catch (error) {
    console.error("[Matches GET]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const results = await findMatches(session.user.id, 10);
    if (results.length > 0) {
      await saveMatchResults(session.user.id, results);
    }

    return NextResponse.json({
      message: `${results.length}명의 매칭 결과가 업데이트되었습니다.`,
      count: results.length,
    });
  } catch (error) {
    console.error("[Matches POST]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { matchId, status } = await request.json();

    if (!matchId || !["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "올바른 matchId와 status를 제공해주세요." },
        { status: 400 },
      );
    }

    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      },
      include: {
        sender: { include: { profile: { select: { minMatchScore: true } } } },
        receiver: { include: { profile: { select: { minMatchScore: true } } } },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "매칭을 찾을 수 없습니다." }, { status: 404 });
    }

    if (status === "ACCEPTED") {
      const senderThreshold = await getUserMatchThreshold(match.senderId);
      const receiverThreshold = await getUserMatchThreshold(match.receiverId);
      const effectiveThreshold = Math.max(senderThreshold, receiverThreshold);

      if (isMatchScoreGloballyBlocked(match.score)) {
        return NextResponse.json(
          { error: "점수가 50점 이하인 매칭은 수락할 수 없습니다.", code: "MATCH_SCORE_BLOCKED_GLOBAL" },
          { status: 409 },
        );
      }

      if (match.score < effectiveThreshold) {
        return NextResponse.json(
          {
            error: `매칭 점수가 최소 기준(${effectiveThreshold}점)에 미달합니다.`,
            code: "MATCH_SCORE_BELOW_USER_THRESHOLD",
          },
          { status: 409 },
        );
      }

      const [senderAtCapacity, receiverAtCapacity] = await Promise.all([
        hasReachedActiveChatCapacity(match.senderId),
        hasReachedActiveChatCapacity(match.receiverId),
      ]);

      if (senderAtCapacity || receiverAtCapacity) {
        return NextResponse.json(
          {
            error: `활성 채팅은 최대 ${MAX_ACTIVE_CHATS_PER_USER}개까지 가능합니다.`,
            code: "ACTIVE_CHAT_CAPACITY_REACHED",
          },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status },
    });

    if (status === "ACCEPTED") {
      const reverseMatch = await prisma.match.findFirst({
        where: {
          senderId: match.receiverId,
          receiverId: match.senderId,
          status: "ACCEPTED",
        },
      });

      if (reverseMatch) {
        const existingThread = await prisma.chatThread.findFirst({
          where: {
            OR: [
              { userAId: match.senderId, userBId: match.receiverId },
              { userAId: match.receiverId, userBId: match.senderId },
            ],
          },
        });

        if (!existingThread) {
          await prisma.chatThread.create({
            data: {
              matchId: match.id,
              userAId: match.senderId,
              userBId: match.receiverId,
              status: "OPEN",
              isActive: true,
            },
          });
        }
      }
    }

    const activeCount = await getActiveChatCount(session.user.id);
    return NextResponse.json({ ...updated, activeChatCount: activeCount });
  } catch (error) {
    console.error("[Matches PATCH]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

function formatMatches(
  matches: Array<{
    id: string;
    score: number;
    breakdown: unknown;
    status: string;
    createdAt: Date;
    receiver: {
      id: string;
      profile: {
        nickname: string;
        dateOfBirth: Date;
        jobCategory: string;
        residenceLocation: string;
      } | null;
    };
  }>,
) {
  return {
    matches: matches.map((m) => {
      const profile = m.receiver.profile;
      const age = profile
        ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()
        : null;
      const [residenceProvince] = profile?.residenceLocation?.split("|") || [""];

      return {
        matchId: m.id,
        userId: m.receiver.id,
        nickname: profile?.nickname || "익명",
        age,
        jobCategory: profile?.jobCategory || "",
        residenceProvince,
        score: m.breakdown,
        totalScore: m.score,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
      };
    }),
  };
}
