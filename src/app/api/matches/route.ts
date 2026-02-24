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

    // Fetch existing matches for this user
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

    // If no matches exist, compute them
    if (matches.length === 0) {
      try {
        const results = await findMatches(session.user.id, 10);
        if (results.length > 0) {
          await saveMatchResults(session.user.id, results);
        }

        // Re-fetch after saving
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

        return NextResponse.json(formatMatches(newMatches, session.user.id));
      } catch (matchError) {
        // If matching fails (e.g., no survey), return empty with message
        return NextResponse.json({
          matches: [],
          message: (matchError as Error).message,
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

    // If both users accepted, create a chat thread
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
        // Both accepted — create chat thread
        await prisma.chatThread.create({
          data: {
            matchId: match.id,
            userAId: match.senderId,
            userBId: match.receiverId,
          },
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
  _currentUserId: string,
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
