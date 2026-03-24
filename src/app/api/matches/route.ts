import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { findMatches, saveMatchResults } from "@/lib/matching/engine";

/**
 * Matches API Routes
 *
 * GET  /api/matches — Get match results (triggers computation if stale)
 * POST /api/matches — Force re-computation of matches
 * PATCH /api/matches — Update match status (accept/reject)
 */

// ── GET: Fetch match results ──
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // Get user's minimum match score preference
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { minMatchScore: true },
    });
    const minScore = userProfile?.minMatchScore ?? 0;

    // Fetch existing matches — REJECTED·EXPIRED 제외, 최소 점수 이상만
    const matches = await prisma.match.findMany({
      where: {
        senderId: session.user.id,
        status: { notIn: ["REJECTED", "EXPIRED"] },
        score: { gte: minScore },
      },
      include: {
        receiver: {
          include: { profile: true },
        },
        chatThread: { select: { id: true } },
      },
      orderBy: { score: "desc" },
      take: 20,
    });

    // If no matches exist, compute them
    if (matches.length === 0) {
      try {
        const results = await findMatches(session.user.id, 10);
        await saveMatchResults(session.user.id, results, minScore);

        // Re-fetch after saving (REJECTED·EXPIRED 제외, minScore 이상만)
        const newMatches = await prisma.match.findMany({
          where: {
            senderId: session.user.id,
            status: { notIn: ["REJECTED", "EXPIRED"] },
            score: { gte: minScore },
          },
          include: {
            receiver: {
              include: {
                profile: {
                  select: {
                    nickname: true,
                    dateOfBirth: true,
                    jobCategory: true,
                    residenceLocation: true,
                    profileImage: true,
                  },
                },
              },
            },
            chatThread: { select: { id: true } },
          },
          orderBy: { score: "desc" },
          take: 20,
        });

        if (newMatches.length === 0) {
          // Profile + survey complete, but no candidates yet
          return NextResponse.json({
            matches: [],
            message: "현재 매칭 가능한 상대가 없습니다. 잠시 후 새로고침해보세요.",
            needsSetup: false,
          });
        }

        return NextResponse.json(formatMatches(newMatches, session.user.id));
      } catch (matchError) {
        // Profile or survey not complete
        return NextResponse.json({
          matches: [],
          message: (matchError as Error).message,
          needsSetup: true,
        });
      }
    }

    return NextResponse.json(formatMatches(matches, session.user.id));
  } catch (error) {
    console.error("[Matches GET]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// ── POST: Force re-compute matches ──
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { minMatchScore: true },
    });
    const minScore = userProfile?.minMatchScore ?? 0;

    const results = await findMatches(session.user.id, 10);
    await saveMatchResults(session.user.id, results, minScore);

    const saved = results.filter((r) => r.score.total >= minScore).length;
    return NextResponse.json({
      message: `${saved}명의 매칭 결과가 업데이트되었습니다.`,
      count: saved,
    });
  } catch (error) {
    console.error("[Matches POST]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// ── PATCH: Update match status (accept/reject) ──
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

    // Verify the match belongs to this user
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      },
    });

    if (!match) {
      return NextResponse.json({ error: "매칭을 찾을 수 없습니다." }, { status: 404 });
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status },
    });

    // If both users accepted, create a chat thread (idempotent)
    if (status === "ACCEPTED") {
      // Check if the reverse match is also accepted
      const reverseMatch = await prisma.match.findFirst({
        where: {
          senderId: match.receiverId,
          receiverId: match.senderId,
          status: "ACCEPTED",
        },
      });

      if (reverseMatch) {
        // Both accepted — create chat thread inside a transaction to prevent duplicates
        await prisma.$transaction(async (tx) => {
          const existingThread = await tx.chatThread.findUnique({
            where: { matchId: match.id },
          });
          if (!existingThread) {
            await tx.chatThread.create({
              data: {
                matchId: match.id,
                userAId: match.senderId,
                userBId: match.receiverId,
              },
            });
          }
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Matches PATCH]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// ── Helper: Format match records for API response ──
function formatMatches(
  matches: Array<{
    id: string;
    score: number;
    breakdown: unknown;
    status: string;
    createdAt: Date;
    chatThread: { id: string } | null;
    receiver: {
      id: string;
      profile: {
        nickname: string;
        dateOfBirth: Date;
        jobCategory: string;
        residenceLocation: string;
        profileImage: string | null;
      } | null;
    };
  }>,
  _currentUserId: string,
) {
  return {
    matches: matches.map((m) => {
      const profile = m.receiver.profile;
      // 만 나이 계산 (생일 경과 여부 반영, Prisma dateOfBirth는 이미 Date 객체)
      let age: number | null = null;
      if (profile) {
        const today = new Date();
        const birth = profile.dateOfBirth;
        age = today.getFullYear() - birth.getFullYear();
        const md = today.getMonth() - birth.getMonth();
        if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
      }
      const [residenceProvince] = profile?.residenceLocation?.split("|") || [""];

      return {
        matchId: m.id,
        userId: m.receiver.id,
        nickname: profile?.nickname || "익명",
        age,
        jobCategory: profile?.jobCategory || "",
        residenceProvince,
        profileImage: profile?.profileImage || null,
        score: m.breakdown,
        totalScore: m.score,
        status: m.status,
        chatThreadId: m.chatThread?.id || null,
        createdAt: m.createdAt.toISOString(),
      };
    }),
  };
}
